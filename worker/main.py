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
from contextlib import asynccontextmanager
import uvicorn
from pydantic import BaseModel

# Load from .env.local in parent dir
env_path = os.path.join(os.path.dirname(__file__), "..", ".env.local")
load_dotenv(dotenv_path=env_path)

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
PAGESPEED_API_KEY = os.getenv("NEXT_PUBLIC_GOOGLE_PAGESPEED_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
SAFE_BROWSING_API_KEY = os.getenv("NEXT_PUBLIC_GOOGLE_SAFE_BROWSING_API_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase credentials in environment variables.")

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
        # Use gemini-1.5-flash for speed and cost efficiency on standard text processing
        model = genai.GenerativeModel('gemini-1.5-flash', generation_config={"response_mime_type": "application/json"})
        
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
        
        # Run synchronous call in thread to avoid blocking asyncio
        response = await asyncio.to_thread(model.generate_content, prompt)
        
        # Parse the JSON response
        return json.loads(response.text)
    except Exception as e:
        # Parse the JSON response
        return json.loads(response.text)
    except Exception as e:
        print(f"Gemini AI Error: {e}")
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
            return None
        except:
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
    
    try:
        target_url = await fetch_site_url(site_id)
        if not target_url:
            print(f"Site ID {site_id} not found.")
            return
            
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
                core_scan_data["sitemap_xml"] = {
                    "exists": sitemap_res.status_code == 200,
                    "url": f"{domain}/sitemap.xml"
                }
            except:
                core_scan_data["sitemap_xml"] = {"exists": False}

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
                "h2_count": len(soup.find_all("h2"))
            }
            
            # Structured Data Analysis
            json_lds = soup.find_all("script", type="application/ld+json")
            seo_data["structured_data"] = {
                "detected": len(json_lds) > 0,
                "count": len(json_lds)
            }
            
            trust_keywords = ["privacy", "about", "contact", "terms", "disclaimer"]
            detected_pages = {}
            internal_links = set()
            external_links = set()
            
            mixed_content_found = False
            
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
                "disclaimer": "disclaimer" in detected_pages
            }

            # Multi-Page Crawl (Thin Content & Image analysis on 5 internal links)
            links_to_crawl = list(internal_links)[:5]
            scanned_pages = 1
            thin_content_count = 0
            
            # Count homepage words
            homepage_words = len(soup.get_text(strip=True).split())
            if homepage_words < 300:
                thin_content_count += 1
                
            broken_links_found = 0
            
            async def crawl_page(link):
                try:
                    res = await client.get(link, timeout=10.0)
                    if res.status_code >= 400:
                        return "broken"
                    page_soup = BeautifulSoup(res.text, 'html.parser')
                    word_cnt = len(page_soup.get_text(strip=True).split())
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
            
            core_scan_data["content_analysis"] = {
                "pages_scanned": scanned_pages,
                "thin_content_pages": thin_content_count,
                "has_thin_content": thin_content_count > 0
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
            "overall_score": min(score, 99),
            "approval_probability": min(score, 99),
            "core_scan_data": core_scan_data,
            "trust_pages_data": trust_pages_data,
            "seo_indexing_data": seo_data,
            "security_data": security_data,
            "completed_at": now
        }
        
        await update_scan_record(scan_id, update_payload)
        print(f"[{scan_id}] Scan completed successfully.")
        
    except Exception as e:
        print(f"[{scan_id}] Critical Error: {e}")
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
            print(f"Polling error: {e}")
            await asyncio.sleep(5)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start the polling worker in the background
    worker_task = asyncio.create_task(poll_jobs())
    yield
    # Cancel the worker gracefully when the server shuts down
    worker_task.cancel()

app = FastAPI(lifespan=lifespan)

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
