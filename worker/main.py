import asyncio
import os
import datetime
import json
from urllib.parse import urlparse, urljoin
import httpx
from bs4 import BeautifulSoup
from dotenv import load_dotenv
import google.generativeai as genai

from fastapi import FastAPI, Response, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
from pydantic import BaseModel

# Load from .env.local in parent dir
env_path = os.path.join(os.path.dirname(__file__), "..", ".env.local")
load_dotenv(dotenv_path=env_path)

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
PAGESPEED_API_KEY = os.getenv("NEXT_PUBLIC_GOOGLE_PAGESPEED_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
SAFE_BROWSING_API_KEY = os.getenv("NEXT_PUBLIC_GOOGLE_SAFE_BROWSING_API_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("CRITICAL: Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL in your environment variables. Please add the service_role secret appropriately.")

# Google PageSpeed Function
async def fetch_pagespeed_data(target_url):
    if not PAGESPEED_API_KEY or PAGESPEED_API_KEY == "AIzaSyAxJS9yCDaxHQa-G-0QmVpfj0H5jRAXff4":
        # The key we put in .env is the one from the prompt: "AIzaSyAxJS9yCDaxHQa-G-0QmVpfj0H5jRAXff4"
        # We will use it if it functions properly.
        pass
    
    # We will use it regardless, but checking is good.
    if not PAGESPEED_API_KEY:
        print("No PageSpeed API key configured.")
        return None
        
    url = f"https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url={target_url}&key={PAGESPEED_API_KEY}&strategy=mobile"
    async with httpx.AsyncClient() as client:
        try:
            print(f"Fetching PageSpeed Insights for {target_url}... (This may take up to 30s)")
            response = await client.get(url, timeout=60.0)
            response.raise_for_status()
            data = response.json()
            
            lighthouse = data.get("lighthouseResult", {})
            categories = lighthouse.get("categories", {})
            audits = lighthouse.get("audits", {})
            
            performance_score = categories.get("performance", {}).get("score", 0) * 100
            
            # Core Web Vitals (from audits)
            lcp = audits.get("largest-contentful-paint", {}).get("displayValue", "N/A")
            cls = audits.get("cumulative-layout-shift", {}).get("displayValue", "N/A")
            tbt = audits.get("total-blocking-time", {}).get("displayValue", "N/A")
            render_blocking = audits.get("render-blocking-resources", {}).get("details", {}).get("items", [])
            lazy_load_images = audits.get("offscreen-images", {}).get("details", {}).get("items", [])
            
            return {
                "score": int(performance_score),
                "strategy": "mobile",
                "lcp": lcp,
                "cls": cls,
                "tbt": tbt,
                "render_blocking_issues": len(render_blocking),
                "image_optimization_issues": len(lazy_load_images)
            }
        except Exception as e:
            print(f"PageSpeed API Error: {e}")
            return None

# AI Policy Engine Integration
async def analyze_policy_with_ai(text_content):
    if not GEMINI_API_KEY or GEMINI_API_KEY.startswith("AIzaSyAx"):
        print("Invalid or missing Gemini API Key.")
        return None
        
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        
        prompt = """
        You are strictly an expert Google AdSense policy reviewer.
        Analyze the following text extracted from a website for AdSense policy compliance.
        Look for issues like: prohibited content (adult, violence), copyright risks, clickbait, thin content signals, and AI spam patterns.
        
        Respond ONLY with a raw, valid JSON object following this exact schema:
        {
          "issues_found": boolean,
          "risk_score": integer (0 to 100, where 100 is extremely risky/violating),
          "flags": [array of string descriptions of policy violations found],
          "recommendations": [array of string actionable steps to fix compliance issues]
        }
        
        Extracted Website Text:
        ---
        """ + text_content + """
        ---
        """
        
        try:
            model = genai.GenerativeModel('gemini-1.5-flash', generation_config={"response_mime_type": "application/json"})
            response = await asyncio.to_thread(model.generate_content, prompt)
        except Exception as e:
            if "404" in str(e):
                # Fallback to older or different models if the API key environment doesn't support gemini-1.5-flash
                print("gemini-1.5-flash not found, falling back to gemini-pro", flush=True)
                model = genai.GenerativeModel('gemini-pro') 
                # Note: gemini-pro might not strictly support response_mime_type everywhere so we omit it
                response = await asyncio.to_thread(model.generate_content, prompt)
                
                # Try to clean the output if it has markdown formatting
                text = response.text.strip()
                if text.startswith('```json'): text = text[7:]
                if text.endswith('```'): text = text[:-3]
                return json.loads(text.strip())
            else:
                raise e
            
        return json.loads(response.text)
    except Exception as e:
        print(f"Gemini AI Error: {e}", flush=True)
        return None

# Google Safe Browsing API
async def check_safe_browsing(url):
    if not SAFE_BROWSING_API_KEY or SAFE_BROWSING_API_KEY.startswith("AIzaSyAx"):
        print("Invalid or missing Safe Browsing API Key.")
        return {"status": "unknown"}
    api_url = f"https://safebrowsing.googleapis.com/v4/threatMatches:find?key={SAFE_BROWSING_API_KEY}"
    payload = {
        "client": { "clientId": "ad2go", "clientVersion": "1.0" },
        "threatInfo": {
            "threatTypes": ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
            "platformTypes": ["ANY_PLATFORM"],
            "threatEntryTypes": ["URL"],
            "threatEntries": [{"url": url}]
        }
    }
    async with httpx.AsyncClient() as client:
        try:
            r = await client.post(api_url, json=payload, timeout=5.0)
            if r.status_code == 200:
                data = r.json()
                if "matches" in data:
                    return {"status": "unsafe", "issues": len(data["matches"])}
                return {"status": "safe", "issues": 0}
            return {"status": "unknown"}
        except Exception as e:
            print(f"Safe Browsing API Error: {e}")
            return {"status": "unknown"}

# Provide simple methods for Supabase data fetching
async def fetch_pending_scans():
    url = f"{SUPABASE_URL}/rest/v1/adsense_scans?status=eq.pending&select=*&limit=5"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}"
    }
    async with httpx.AsyncClient() as client:
        try:
            r = await client.get(url, headers=headers)
            r.raise_for_status()
            return r.json()
        except:
            return []

async def fetch_site_url(site_id):
    url = f"{SUPABASE_URL}/rest/v1/sites?id=eq.{site_id}&select=url"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}"
    }
    async with httpx.AsyncClient() as client:
        try:
            r = await client.get(url, headers=headers)
            r.raise_for_status()
            data = r.json()
            if data:
                return data[0]["url"]
            print(f"Zero rows returned when finding url for site {site_id}. Supabase says: {r.text}", flush=True)
            return None
        except httpx.HTTPError as e:
            print(f"HTTP Exception while fetching site URL: {e}", flush=True)
            if 'r' in locals() and r is not None:
                print(f"Supabase Response Body: {r.text}", flush=True)
            return None
        except Exception as e:
            print(f"Generic Python exception when fetching site URL: {e}", flush=True)
            return None

async def update_scan_record(scan_id, payload):
    url = f"{SUPABASE_URL}/rest/v1/adsense_scans?id=eq.{scan_id}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }
    async with httpx.AsyncClient() as client:
        try:
            r = await client.patch(url, headers=headers, json=payload)
            r.raise_for_status()
        except Exception as e:
            print(f"Failed to update scan {scan_id} in DB:", e)

async def check_url_status(client, url):
    try:
        response = await client.head(url, timeout=5.0)
        return response.status_code < 400
    except Exception:
        return False

async def process_scan(scan_record):
    scan_id = scan_record["id"]
    site_id = scan_record["site_id"]
    print(f"[{scan_id}] Starting process_scan... Received site_id: {site_id}", flush=True)
    
    try:
        target_url = await fetch_site_url(site_id)
        if not target_url:
            print(f"[{scan_id}] FATAL: Site ID {site_id} not found in sites table. Cannot proceed.", flush=True)
            await update_scan_record(scan_id, {"status": "failed"})
            return
            
        print(f"[{scan_id}] Target URL extracted: {target_url}", flush=True)
        if not target_url.startswith("http"):
            target_url = "https://" + target_url

        print(f"[{scan_id}] Starting scan for {target_url}...")
        
        # Mark as running
        await update_scan_record(scan_id, {"status": "running"})
        
        core_scan_data = {}
        trust_pages_data = {}
        seo_data = {}
        security_data = {}
        
        async with httpx.AsyncClient(verify=False, follow_redirects=True) as client:
            try:
                response = await client.get(target_url, timeout=15.0)
                final_url = str(response.url)
                core_scan_data["ssl_check"] = {
                    "status": "passed" if final_url.startswith("https") else "failed",
                    "protocol": "HTTPS" if final_url.startswith("https") else "HTTP",
                    "url_reached": final_url
                }
                html_content = response.text
                headers = response.headers

                # Caching headers check
                cache_control = headers.get("cache-control", "")
                expires = headers.get("expires", "")
                has_caching = bool(cache_control or expires)
                cache_policy = cache_control if cache_control else ("expires: " + expires if expires else "None")
                core_scan_data["caching"] = {
                    "has_caching": has_caching,
                    "cache_control": cache_control or None,
                    "expires": expires or None,
                    "policy_summary": cache_policy
                }
                
                # Security Headers (Basic)
                security_data["headers"] = {
                    "csp": "content-security-policy" in headers.keys(),
                    "sts": "strict-transport-security" in headers.keys(),
                    "frame_options": "x-frame-options" in headers.keys(),
                    "content_type_options": "x-content-type-options" in headers.keys()
                }
            except Exception as e:
                print(f"Error fetching main URL: {e}")
                html_content = ""
                final_url = target_url
                
            domain = f"{urlparse(final_url).scheme}://{urlparse(final_url).netloc}"
            
            # 2. robots.txt & sitemap.xml
            try:
                robots_res = await client.get(f"{domain}/robots.txt", timeout=5.0)
                core_scan_data["robots_txt"] = {
                    "exists": robots_res.status_code == 200,
                    "url": f"{domain}/robots.txt",
                    "has_disallow": "Disallow: /" in robots_res.text if robots_res.status_code == 200 else False
                }
            except:
                core_scan_data["robots_txt"] = {"exists": False}

            try:
                sitemap_res = await client.get(f"{domain}/sitemap.xml", timeout=5.0)
                if sitemap_res.status_code == 200:
                    sitemap_soup = BeautifulSoup(sitemap_res.text, 'xml')
                    sitemap_urls = sitemap_soup.find_all('loc')
                    core_scan_data["sitemap_xml"] = {
                        "exists": True,
                        "url": f"{domain}/sitemap.xml",
                        "url_count": len(sitemap_urls)
                    }
                else:
                    core_scan_data["sitemap_xml"] = {"exists": False, "url_count": 0}
            except:
                core_scan_data["sitemap_xml"] = {"exists": False, "url_count": 0}

            # 3. HTML Parsing (SEO & Trust Pages) on Homepage
            soup = BeautifulSoup(html_content, 'html.parser')
            
            seo_data["title"] = soup.title.string if soup.title else None
            meta_desc = soup.find("meta", attrs={"name": "description"})
            seo_data["meta_description"] = meta_desc["content"] if meta_desc and meta_desc.has_attr("content") else None
            
            canonical = soup.find("link", rel="canonical")
            seo_data["canonical"] = canonical["href"] if canonical and canonical.has_attr("href") else None
            
            # Headings analysis
            seo_data["headings"] = {
                "h1_count": len(soup.find_all("h1")),
                "h2_count": len(soup.find_all("h2")),
                "h3_count": len(soup.find_all("h3")),
                "h4_count": len(soup.find_all("h4")),
                "h5_count": len(soup.find_all("h5")),
                "h6_count": len(soup.find_all("h6"))
            }

            # Meta Robots analysis
            meta_robots = soup.find("meta", attrs={"name": "robots"})
            robots_content = meta_robots["content"].lower() if meta_robots and meta_robots.has_attr("content") else ""
            seo_data["meta_robots"] = {
                "noindex": "noindex" in robots_content,
                "nofollow": "nofollow" in robots_content
            }

            # Image checks — lazy loading and alt text
            all_imgs = soup.find_all("img")
            lazy_load_count = sum(1 for img in all_imgs if img.get("loading", "").lower() == "lazy")
            no_alt_count = sum(1 for img in all_imgs if not img.get("alt", "").strip())
            core_scan_data["image_checks"] = {
                "total_images": len(all_imgs),
                "lazy_loaded": lazy_load_count,
                "lazy_load_ratio": round(lazy_load_count / len(all_imgs), 2) if all_imgs else 0,
                "no_alt_count": no_alt_count,
                "no_alt_ratio": round(no_alt_count / len(all_imgs), 2) if all_imgs else 0
            }
            
            # Structured Data Analysis
            json_lds = soup.find_all("script", type="application/ld+json")
            
            # Simple Schema Type Detection
            schema_types = set()
            for script in json_lds:
                try:
                    js_data = json.loads(script.string)
                    # Handle both single objects and arrays of JSON-LD
                    items = js_data if isinstance(js_data, list) else [js_data]
                    for item in items:
                        if isinstance(item, dict) and "@type" in item:
                            t = item["@type"]
                            if isinstance(t, list):
                                for sub_t in t:
                                    schema_types.add(sub_t)
                            else:
                                schema_types.add(t)
                except Exception as e:
                    pass
                    
            seo_data["structured_data"] = {
                "detected": len(json_lds) > 0,
                "count": len(json_lds),
                "types": list(schema_types)
            }
            
            trust_keywords = ["privacy", "about", "contact", "terms", "disclaimer"]
            detected_pages = {}
            internal_links = set()
            external_links = set()
            
            mixed_content_found = False
            
            # Extract Cookie Consent keywords
            has_cookie_consent = False
            for text_elem in soup.find_all(string=True):
                lower_text = text_elem.lower()
                if "cookie" in lower_text and ("accept" in lower_text or "consent" in lower_text):
                    has_cookie_consent = True
                    break
            
            for a_tag in soup.find_all("a", href=True):
                href = a_tag["href"]
                text = a_tag.get_text(strip=True).lower()
                
                link_url = urljoin(final_url, href)
                parsed_link = urlparse(link_url)
                
                if parsed_link.netloc == urlparse(final_url).netloc:
                    internal_links.add(link_url)
                    lower_href = parsed_link.path.lower()
                    
                    for kw in trust_keywords:
                        if kw in lower_href or kw in text:
                            detected_pages[kw] = {"exists": True, "url": link_url}
                else:
                    if parsed_link.scheme in ["http", "https"]:
                        external_links.add(link_url)

            seo_data["internal_links"] = len(internal_links)
            seo_data["external_links"] = len(external_links)
            
            # Check mixed content
            if final_url.startswith("https"):
                for tag in soup.find_all(["img", "script"]):
                    src = tag.get("src")
                    if src and src.startswith("http://"):
                        mixed_content_found = True
                        break
                if not mixed_content_found:
                    for tag in soup.find_all("link", href=True):
                        href = tag.get("href")
                        if href and href.startswith("http://"):
                            mixed_content_found = True
                            break
                            
            security_data["mixed_content"] = mixed_content_found

            trust_pages_data["pages"] = detected_pages
            trust_pages_data["summary"] = {
                "privacy": "privacy" in detected_pages,
                "about": "about" in detected_pages,
                "contact": "contact" in detected_pages,
                "terms": "terms" in detected_pages,
                "disclaimer": "disclaimer" in detected_pages,
                "cookie_consent": has_cookie_consent
            }

            # Multi-Page Crawl (Thin Content & Image analysis on 5 internal links)
            links_to_crawl = list(internal_links)[:5]
            scanned_pages = 1
            thin_content_count = 0
            
            # Count homepage words
            homepage_words = len(soup.get_text(separator=' ', strip=True).split())
            if homepage_words < 300:
                thin_content_count += 1
                
            broken_links_found = 0
            
            async def crawl_page(link):
                try:
                    res = await client.get(link, timeout=10.0)
                    if res.status_code >= 400:
                        return "broken"
                    page_soup = BeautifulSoup(res.text, 'html.parser')
                    word_cnt = len(page_soup.get_text(separator=' ', strip=True).split())
                    return word_cnt
                except:
                    return "broken"

            crawl_tasks = [crawl_page(l) for l in links_to_crawl]
            crawl_results = await asyncio.gather(*crawl_tasks)
            
            for r in crawl_results:
                if r == "broken":
                    broken_links_found += 1
                else:
                    scanned_pages += 1
                    if isinstance(r, int) and r < 300:
                        thin_content_count += 1
            
            core_scan_data["broken_links"] = {
                "checked": len(links_to_crawl),
                "broken": broken_links_found,
                "status": "failed" if broken_links_found > 0 else "passed"
            }
            
            # Keyword density — find top 3 words (4+ chars), compute density
            all_words = [w.lower() for w in soup.get_text(separator=' ', strip=True).split() if len(w) >= 4 and w.isalpha()]
            word_freq: dict = {}
            for w in all_words:
                word_freq[w] = word_freq.get(w, 0) + 1
            top_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:3]
            top_keyword = top_words[0][0] if top_words else None
            keyword_density = round((top_words[0][1] / len(all_words)) * 100, 2) if top_words and all_words else 0
            keyword_stuffed = keyword_density > 5  # over 5% is considered over-optimization

            # Readability approximation — average words per sentence (lower is more readable)
            raw_text = soup.get_text(separator=' ', strip=True)
            sentences = [s.strip() for s in raw_text.replace('!', '.').replace('?', '.').split('.') if len(s.strip()) > 10]
            avg_sentence_length = round(len(all_words) / len(sentences), 1) if sentences else 0
            readability_grade = "Easy" if avg_sentence_length <= 15 else ("Moderate" if avg_sentence_length <= 25 else "Difficult")

            core_scan_data["content_analysis"] = {
                "pages_scanned": scanned_pages,
                "thin_content_pages": thin_content_count,
                "has_thin_content": thin_content_count > 0,
                "word_count": homepage_words,
                "keyword_density": keyword_density,
                "top_keyword": top_keyword,
                "keyword_stuffed": keyword_stuffed,
                "avg_sentence_length": avg_sentence_length,
                "readability_grade": readability_grade,
                "sentence_count": len(sentences)
            }

        # AI Policy Engine Analysis
        extracted_text = soup.get_text(separator=' ', strip=True)
        # Pass up to 4000 chars to avoid massive token limits if text is huge
        ai_policy_result = await analyze_policy_with_ai(extracted_text[:4000])
        if ai_policy_result:
            core_scan_data["ai_policy"] = ai_policy_result

        # Safe Browsing API Analysis
        safe_browsing = await check_safe_browsing(final_url)
        security_data["safe_browsing"] = safe_browsing

        # Concurrently Fetch PageSpeed data
        pagespeed_result = await fetch_pagespeed_data(final_url)
        if pagespeed_result:
            core_scan_data["pagespeed"] = pagespeed_result

        # Calculate Unified Engine Score (Max 100)
        # 1. Base Score starts at 100
        score = 100
        
        # 2. Security Penalties
        if core_scan_data.get("ssl_check", {}).get("status") != "passed": score -= 20
        if security_data.get("mixed_content"): score -= 10
        if security_data.get("safe_browsing", {}).get("status") == "unsafe": score -= 50
        
        # 3. Trust Pages Penalties
        if not trust_pages_data.get("summary", {}).get("privacy"): score -= 15
        if not trust_pages_data.get("summary", {}).get("contact"): score -= 10
        if not trust_pages_data.get("summary", {}).get("about"): score -= 5
        
        # 4. SEO & Indexing Penalties
        if not core_scan_data.get("sitemap_xml", {}).get("exists"): score -= 10
        if core_scan_data.get("broken_links", {}).get("broken", 0) > 0: score -= 5
        if not seo_data.get("structured_data", {}).get("detected"): score -= 5
        
        # 5. Content Quality Penalties
        ai_risk = core_scan_data.get("ai_policy", {}).get("risk_score", 0)
        if ai_risk > 70: score -= 30
        elif ai_risk > 30: score -= 15
        
        if core_scan_data.get("content_analysis", {}).get("has_thin_content"): score -= 15
        
        # 6. Performance Penalties
        ps_score = core_scan_data.get("pagespeed", {}).get("score", 50) # Fallback to 50 if none to prevent massive penalization loop initially, but we assume we have it.
        if ps_score < 50: score -= 20
        elif ps_score < 80: score -= 10

        # Ensure score stays strictly bounded
        score = max(0, min(100, score))

        # Update row in supabase
        now = datetime.datetime.utcnow().isoformat()
        update_payload = {
            "status": "completed",
            "overall_score": int(min(score, 99)),
            "core_scan_data": core_scan_data,
            "trust_pages_data": trust_pages_data,
            "seo_indexing_data": seo_data,
            "security_data": security_data
        }
        
        
        await update_scan_record(scan_id, update_payload)
        print(f"[{scan_id}] Scan completed successfully.", flush=True)
        
    except Exception as e:
        import traceback
        print(f"[{scan_id}] Critical Error: {e}", flush=True)
        traceback.print_exc()
        await update_scan_record(scan_id, {"status": "failed"})

async def poll_jobs():
    print("Background worker started. Polling for pending scans...")
    while True:
        try:
            # Fetch pending scans
            pending_scans = await fetch_pending_scans()
            
            if pending_scans:
                print(f"Found {len(pending_scans)} pending scans. Processing...")
                for scan in pending_scans:
                    await process_scan(scan)
            else:
                await asyncio.sleep(5)
        except Exception as e:
            print(f"Polling error: {e}", flush=True)
            await asyncio.sleep(5)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start the polling worker in the background
    worker_task = asyncio.create_task(poll_jobs())
    yield
    # Cancel the worker gracefully when the server shuts down
    worker_task.cancel()

app = FastAPI(lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

class ScanRequest(BaseModel):
    id: str
    site_id: str

@app.get("/health")
def health_check():
    return Response(content="OK", status_code=200)

@app.post("/scan")
async def trigger_scan(request: ScanRequest, background_tasks: BackgroundTasks):
    scan_record = {
        "id": request.id,
        "site_id": request.site_id
    }
    # Run the scan in the background to avoid frontend/gateway timeouts
    background_tasks.add_task(process_scan, scan_record)
    return {"status": "success", "message": "Scan triggered and running in the background", "scan_id": request.id}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
