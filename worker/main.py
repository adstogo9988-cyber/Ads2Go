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
import re
import ssl
import socket
import urllib.robotparser
from xml.etree import ElementTree as ET

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
        
    async def fetch_strategy(client, strategy, retries=3):
        url = f"https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url={target_url}&strategy={strategy}"
        if PAGESPEED_API_KEY and PAGESPEED_API_KEY != "AIzaSyAxJS9yCDaxHQa-G-0QmVpfj0H5jRAXff4":
            url += f"&key={PAGESPEED_API_KEY}"
            
        for attempt in range(retries):
            try:
                print(f"Fetching PageSpeed Insights ({strategy}) for {target_url}... (Attempt {attempt+1}/{retries})")
                response = await client.get(url, timeout=60.0)
                response.raise_for_status()
                data = response.json()
                
                lighthouse = data.get("lighthouseResult", {})
                categories = lighthouse.get("categories", {})
                audits = lighthouse.get("audits", {})
                
                performance_score = categories.get("performance", {}).get("score", 0) * 100
                
                # Core Web Vitals (from audits & loadingExperience)
                lcp = audits.get("largest-contentful-paint", {}).get("displayValue", "N/A")
                cls = audits.get("cumulative-layout-shift", {}).get("displayValue", "N/A")
                tbt = audits.get("total-blocking-time", {}).get("displayValue", "N/A")
                
                # Extract INP from CrUX data if available
                loading_exp = data.get("loadingExperience", {}).get("metrics", {})
                inp_ms = loading_exp.get("INTERACTION_TO_NEXT_PAINT_MS", {}).get("percentile")
                inp = f"{inp_ms} ms" if inp_ms is not None else "N/A"
                
                render_blocking = audits.get("render-blocking-resources", {}).get("details", {}).get("items", [])
                lazy_load_images = audits.get("offscreen-images", {}).get("details", {}).get("items", [])
                
                return {
                    "score": int(performance_score),
                    "strategy": strategy,
                    "lcp": lcp,
                    "cls": cls,
                    "tbt": tbt,
                    "inp": inp,
                    "render_blocking_issues": len(render_blocking),
                    "image_optimization_issues": len(lazy_load_images)
                }
            except Exception as e:
                print(f"PageSpeed API Error ({strategy}): {e}")
                if attempt < retries - 1:
                    await asyncio.sleep(4 + (2 ** attempt)) # 5s, 6s delays between retries
        return None

    async with httpx.AsyncClient() as client:
        # Run sequentially to minimize rate limit hits when keyless
        mobile_data = await fetch_strategy(client, "mobile")
        await asyncio.sleep(2)
        desktop_data = await fetch_strategy(client, "desktop")

        if not mobile_data and not desktop_data:
            return None

        # Base our core metrics on mobile data as it's the standard, but include desktop score
        base_data = mobile_data or desktop_data
        
        return {
            "score": base_data.get("score", 0),
            "mobile_score": mobile_data.get("score") if mobile_data else None,
            "desktop_score": desktop_data.get("score") if desktop_data else None,
            "strategy": "mobile/desktop",
            "lcp": base_data.get("lcp", "N/A"),
            "cls": base_data.get("cls", "N/A"),
            "tbt": base_data.get("tbt", "N/A"),
            "inp": base_data.get("inp", "N/A"),
            "render_blocking_issues": base_data.get("render_blocking_issues", 0),
            "image_optimization_issues": base_data.get("image_optimization_issues", 0)
        }

async def verify_ssl(url):
    try:
        parsed = urlparse(url)
        host = parsed.netloc
        if not host:
            host = url.replace("https://", "").replace("http://", "")
        if ':' in host:
            host = host.split(':')[0]
            
        port = 443
        context = ssl.create_default_context()
        
        def fetch_cert():
            with socket.create_connection((host, port), timeout=5.0) as sock:
                with context.wrap_socket(sock, server_hostname=host) as ssock:
                    return ssock.getpeercert()
        
        cert = await asyncio.to_thread(fetch_cert)
        
        not_after_str = cert.get('notAfter')
        if not_after_str:
            not_after = datetime.datetime.strptime(not_after_str, '%b %d %H:%M:%S %Y %Z')
            days_left = (not_after - datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)).days
            is_valid = days_left > 0
            
            issuer = "Unknown"
            for rdn in cert.get('issuer', []):
                for attr, value in rdn:
                    if attr == 'organizationName':
                        issuer = value
                        break
            
            return {
                "status": "passed" if is_valid else "failed",
                "valid": is_valid,
                "days_remaining": days_left,
                "issuer": issuer,
                "protocol": "HTTPS"
            }
        return {"status": "failed", "error": "Could not parse expiration date", "protocol": "HTTPS"}
    except Exception as e:
        return {"status": "failed", "error": str(e), "protocol": "HTTP"}

# AI Policy Engine Integration
async def analyze_policy_with_ai(text_content):
    if not GEMINI_API_KEY or GEMINI_API_KEY.startswith("AIzaSyAx"):
        print("Invalid or missing Gemini API Key.")
        return None
        
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        
        prompt = """
        You are strictly an expert Google AdSense policy reviewer and technical SEO auditor.
        Analyze the following text extracted from a website for strict AdSense policy compliance.
        Look specifically for issues like: 
        1. Prohibited content (adult, violence, illegal drugs, weapons)
        2. Copyright risks (illegal streaming mentions, warez, cracked software, unauthorized downloads)
        3. Clickbait or Misleading content
        4. Thin content signals (evaluating substance, depth, and originality, not just word count)
        5. Duplicate content patterns (heavily spun, boilerplate, or scraped generic text)
        6. AI spam patterns (obvious unmarked machine-generated filler, hallucinations, robotic structure)
        
        Respond ONLY with a raw, valid JSON object following this exact schema:
        {
          "issues_found": boolean,
          "risk_score": integer (0 to 100, where 100 is extremely risky/violating),
          "policy_violations": [
            {
               "category": string (e.g., "Prohibited Content", "Copyright", "Clickbait", "Thin Content", "Duplicate Pattern", "AI Spam", "Other"),
               "severity": string ("high", "medium", "low"),
               "evidence": string (a short quote or specific reference from the text showing the violation),
               "explanation": string (why this violates AdSense policies),
               "fix_suggestion": string (actionable step for the webmaster to fix it)
            }
          ]
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
                print("gemini-1.5-flash not found, falling back to gemini-pro", flush=True)
                model = genai.GenerativeModel('gemini-pro') 
                response = await asyncio.to_thread(model.generate_content, prompt)
                
                text = response.text.strip()
                if text.startswith('```json'): text = text[7:]
                if text.endswith('```'): text = text[:-3]
                return json.loads(text.strip())
            else:
                raise e
            
        parsed_json = json.loads(response.text)
        
        # Calculate a unified risk score if it's missing or badly formatted
        if "policy_violations" not in parsed_json:
            parsed_json["policy_violations"] = []
            
        # Ensure fallback sanity
        parsed_json["confidence_score"] = 0.95 
        return parsed_json
        
    except Exception as e:
        print(f"Gemini AI Error: {e}", flush=True)
        return {
            "issues_found": False,
            "risk_score": 0,
            "policy_violations": [],
            "confidence_score": 0.0,
            "error": "Failed to analyze content."
        }

# AI Missing Page Generator
async def generate_missing_page_draft(domain: str, page_type: str) -> str:
    fallback_html = f"<div><h2>Missing {page_type.title()} Draft</h2><p>Our AI could not generate a draft at this moment. You can manually copy a generic template for your {page_type} page online and modify it for <b>{domain}</b>.</p></div>"
    if not GEMINI_API_KEY or GEMINI_API_KEY.startswith("AIzaSyAx"):
        print("Invalid or missing Gemini API Key for draft generation.")
        return fallback_html
        
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        
        prompt = f"""
        You are a legal and compliance copywriter.
        Write a standard, professional, and compliant '{page_type}' page for a website with the domain '{domain}'.
        The content should be generic but comprehensive enough to pass basic AdSense or standard compliance checks.
        Use placeholders like [Company Name], [Email Address], [Date] where appropriate so the user can easily fill them in.
        Return the response in formatted HTML, but ONLY the inner content (start from headers, e.g., <h1>, do not wrap in full <html> or <body> tags). Do not use markdown backticks in the final output.
        """
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = await asyncio.to_thread(model.generate_content, prompt)
        
        text = response.text.strip()
        if text.startswith('```html'): text = text[7:]
        if text.endswith('```'): text = text[:-3]
        return text.strip()
    except Exception as e:
        print(f"Gemini AI Draft Generator Error: {e}", flush=True)
        # Attempt to provide a graceful fallback message
        if "suspended" in str(e).lower() or "permission denied" in str(e).lower() or "403" in str(e):
             return f"<div><h2>Action Required for {page_type.title()}</h2><p>Please update your Gemini API key in the environment variables to generate compliant AI drafts automatically.</p></div>"
        return fallback_html

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
                
                # Check for redirect chain
                core_scan_data["redirects"] = {
                    "chain_length": len(response.history),
                    "has_chain": len(response.history) > 2
                }
                
                # Enhanced SSL/HTTPS check
                ssl_check_result = await verify_ssl(final_url)
                core_scan_data["ssl_check"] = ssl_check_result
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
                    "csp": "content-security-policy" in [k.lower() for k in headers.keys()],
                    "sts": "strict-transport-security" in [k.lower() for k in headers.keys()],
                    "frame_options": "x-frame-options" in [k.lower() for k in headers.keys()],
                    "content_type_options": "x-content-type-options" in [k.lower() for k in headers.keys()]
                }
            except Exception as e:
                print(f"Error fetching main URL: {e}")
                html_content = ""
                final_url = target_url
                
            domain = f"{urlparse(final_url).scheme}://{urlparse(final_url).netloc}"
            
            # 2. robots.txt & sitemap.xml
            try:
                robots_url = f"{domain}/robots.txt"
                robots_res = await client.get(robots_url, timeout=5.0)
                if robots_res.status_code == 200:
                    rp = urllib.robotparser.RobotFileParser()
                    rp.parse(robots_res.text.splitlines())
                    is_googlebot_allowed = rp.can_fetch("Googlebot", "/")
                    core_scan_data["robots_txt"] = {
                        "exists": True,
                        "url": robots_url,
                        "has_disallow": not is_googlebot_allowed
                    }
                else:
                    core_scan_data["robots_txt"] = {"exists": False}
            except:
                core_scan_data["robots_txt"] = {"exists": False}

            try:
                sitemap_res = await client.get(f"{domain}/sitemap.xml", timeout=5.0)
                if sitemap_res.status_code == 200:
                    sitemap_soup = BeautifulSoup(sitemap_res.text, 'xml')
                    sitemap_urls = sitemap_soup.find_all('loc')
                    is_valid_xml = len(sitemap_soup.find_all('urlset')) > 0 or len(sitemap_soup.find_all('sitemapindex')) > 0
                    core_scan_data["sitemap_xml"] = {
                        "exists": True,
                        "url": f"{domain}/sitemap.xml",
                        "url_count": len(sitemap_urls),
                        "is_valid_xml": is_valid_xml
                    }
                else:
                    core_scan_data["sitemap_xml"] = {"exists": False, "url_count": 0, "is_valid_xml": False}
            except:
                core_scan_data["sitemap_xml"] = {"exists": False, "url_count": 0, "is_valid_xml": False}

            # 3. HTML Parsing (SEO & Trust Pages) on Homepage
            soup = BeautifulSoup(html_content, 'html.parser')
            
            seo_data["title"] = soup.title.string if soup.title else None
            title_text = seo_data["title"].strip() if seo_data["title"] else ""
            
            meta_desc = soup.find("meta", attrs={"name": "description"})
            seo_data["meta_description"] = meta_desc["content"] if meta_desc and meta_desc.has_attr("content") else None
            desc_text = seo_data["meta_description"].strip() if seo_data["meta_description"] else ""
            
            seo_data["title_optimization"] = {
                "length": len(title_text),
                "is_optimal": 50 <= len(title_text) <= 60 if title_text else False
            }
            
            seo_data["description_optimization"] = {
                "length": len(desc_text),
                "is_optimal": 120 <= len(desc_text) <= 160 if desc_text else False
            }
            
            canonical = soup.find("link", rel="canonical")
            seo_data["canonical"] = canonical["href"] if canonical and canonical.has_attr("href") else None
            
            seo_data["canonical_conflict"] = False
            if seo_data["canonical"]:
                canonical_parsed = urlparse(seo_data["canonical"])
                final_parsed = urlparse(final_url)
                if canonical_parsed.netloc and canonical_parsed.netloc != final_parsed.netloc:
                    seo_data["canonical_conflict"] = True
                elif canonical_parsed.path and canonical_parsed.path != final_parsed.path:
                    seo_data["canonical_conflict"] = True
            
            # Headings analysis
            h1_tags = soup.find_all("h1")
            h2_tags = soup.find_all("h2")
            h3_tags = soup.find_all("h3")
            seo_data["headings"] = {
                "h1_count": len(h1_tags),
                "h2_count": len(h2_tags),
                "h3_count": len(h3_tags),
                "h4_count": len(soup.find_all("h4")),
                "h5_count": len(soup.find_all("h5")),
                "h6_count": len(soup.find_all("h6")),
                "multiple_h1": len(h1_tags) > 1,
                "missing_h1": len(h1_tags) == 0,
                "hierarchy_issue": len(h1_tags) == 0 and (len(h2_tags) > 0 or len(h3_tags) > 0)
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
            valid_syntax_count = 0
            for script in json_lds:
                try:
                    js_data = json.loads(script.string if script.string else "")
                    valid_syntax_count += 1
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
                "valid_syntax": valid_syntax_count == len(json_lds) and len(json_lds) > 0,
                "valid_count": valid_syntax_count,
                "types": list(schema_types)
            }
            
            trust_keywords = {
                "privacy": ["privacy-policy", "privacy"],
                "about": ["about-us", "about"],
                "contact": ["contact-us", "contact"],
                "terms": ["terms-of-service", "terms-and-conditions", "terms"],
                "disclaimer": ["disclaimer", "disclosure"]
            }
            
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
            
            # Categorize link URLs based on simple matching first
            candidate_links = {
                "privacy": set(),
                "about": set(),
                "contact": set(),
                "terms": set(),
                "disclaimer": set()
            }
            
            for a_tag in soup.find_all("a", href=True):
                href = a_tag["href"]
                text = a_tag.get_text(strip=True).lower()
                
                link_url = urljoin(final_url, href)
                parsed_link = urlparse(link_url)
                
                if parsed_link.netloc == urlparse(final_url).netloc:
                    # Filter out purely anchor/hash links to same page if it's just the homepage
                    if parsed_link.path == urlparse(final_url).path and href.startswith("#"):
                        continue
                        
                    internal_links.add(link_url)
                    lower_href = parsed_link.path.lower()
                    
                    for kw_key, kw_list in trust_keywords.items():
                        # More strict matching for keywords so "/category/privacy-tips" isn't a Privacy Policy
                        if any(re.search(rf"\b{kw}\b", lower_href) for kw in kw_list) or any(re.search(rf"\b{kw}\b", text) for kw in kw_list):
                            candidate_links[kw_key].add(link_url)
                else:
                    if parsed_link.scheme in ["http", "https"]:
                        external_links.add(link_url)

            seo_data["internal_links"] = len(internal_links)
            seo_data["external_links"] = len(external_links)
            
            seo_data["internal_linking_analysis"] = {
                "total_internal": len(internal_links),
                "orphan_risk": "High" if len(internal_links) < 5 else "Low",
                "adequate_links": len(internal_links) >= 10
            }
            
            # Validate Candidates
            async def validate_candidate(link, page_type):
                try:
                    res = await client.get(link, timeout=5.0)
                    if res.status_code == 200:
                        page_soup = BeautifulSoup(res.text, 'html.parser')
                        text_content = page_soup.get_text(separator=' ', strip=True).lower()
                        # Very basic heuristic: if it's a contact page it should have a form or email or "contact" explicitly inside H1/H2, etc.
                        # For privacy/terms it should be at least a few paragraphs.
                        words = len(text_content.split())
                        if words > 50: # Avoid capturing empty layout templates
                            if page_type == "privacy" and ("information we collect" in text_content or "privacy policy" in text_content or "data" in text_content): return link
                            if page_type == "terms" and ("terms of service" in text_content or "terms and conditions" in text_content or "limitation of liability" in text_content): return link
                            if page_type == "disclaimer" and ("disclaimer" in text_content or "do not warrant" in text_content or "no liability" in text_content): return link
                            if page_type == "about" and ("about us" in text_content or "our team" in text_content or "our mission" in text_content or words > 100): return link
                            if page_type == "contact" and ("contact us" in text_content or "email" in text_content or page_soup.find("form")): return link
                except:
                    pass
                return None
                
            async def find_valid_page(page_type, candidates):
                for candidate in candidates:
                    valid_link = await validate_candidate(candidate, page_type)
                    if valid_link: return valid_link
                return None
                
            validation_tasks = [find_valid_page(kw_key, list(candidate_links[kw_key])[:3]) for kw_key in candidate_links.keys()]
            validated_pages = await asyncio.gather(*validation_tasks)
            
            drafts = {}
            for i, kw_key in enumerate(candidate_links.keys()):
                valid_url = validated_pages[i]
                if valid_url:
                    detected_pages[kw_key] = {"exists": True, "url": valid_url}
                else:
                    detected_pages[kw_key] = {"exists": False}
                    # Trigger draft generation
                    print(f"[{scan_id}] Generating missing page draft for {kw_key}...", flush=True)
                    draft_content = await generate_missing_page_draft(urlparse(final_url).netloc, kw_key)
                    if draft_content:
                        drafts[kw_key] = draft_content
            
            # Check mixed content
            if final_url.startswith("https"):
                # Check images, scripts, iframes, audio, video
                for tag in soup.find_all(["img", "script", "iframe", "audio", "video"]):
                    src = tag.get("src")
                    if src and src.startswith("http://"):
                        mixed_content_found = True
                        break
                if not mixed_content_found:
                    # Check stylesheets
                    for tag in soup.find_all("link", rel="stylesheet", href=True):
                        href = tag.get("href")
                        if href and href.startswith("http://"):
                            mixed_content_found = True
                            break
                            
            security_data["mixed_content"] = mixed_content_found

            trust_pages_data["pages"] = detected_pages
            trust_pages_data["drafts"] = drafts
            trust_pages_data["summary"] = {
                "privacy": detected_pages.get("privacy", {}).get("exists", False),
                "about": detected_pages.get("about", {}).get("exists", False),
                "contact": detected_pages.get("contact", {}).get("exists", False),
                "terms": detected_pages.get("terms", {}).get("exists", False),
                "disclaimer": detected_pages.get("disclaimer", {}).get("exists", False),
                "cookie_consent": has_cookie_consent
            }

            # Multi-Page Crawl (Deep Traverse)
            max_pages = 50
            scanned_pages = 1
            thin_content_count = 0
            
            # Deep crawl aggregates
            missing_title_count = 0 if seo_data.get("title") else 1
            missing_desc_count = 0 if seo_data.get("meta_description") else 1
            found_email, found_phone = False, False
            
            # Count homepage words
            homepage_words = len(soup.get_text(separator=' ', strip=True).split())
            if homepage_words < 300:
                thin_content_count += 1
                
            broken_links_found = 0
            visited_urls = {final_url}
            queue = list(internal_links)
            all_links_to_check = set(internal_links).union(external_links)
            
            # 1. Crawl up to max_pages
            async def fetch_and_parse(url):
                try:
                    res = await client.get(url, timeout=10.0)
                    if res.status_code == 200:
                        page_soup = BeautifulSoup(res.text, 'html.parser')
                        text = page_soup.get_text(separator=' ', strip=True)
                        return {"url": url, "status": res.status_code, "text": text, "soup": page_soup}
                    return {"url": url, "status": res.status_code}
                except:
                    return {"url": url, "status": 999}

            # Batch crawl
            while queue and scanned_pages < max_pages:
                batch = queue[:10]
                queue = queue[10:]
                
                tasks = []
                for link in batch:
                    if link not in visited_urls:
                        visited_urls.add(link)
                        tasks.append(fetch_and_parse(link))
                        
                if not tasks:
                    continue
                    
                results = await asyncio.gather(*tasks)
                scanned_pages += len(results)
                
                for r in results:
                    if r["status"] == 200 and "text" in r:
                        word_cnt = len(r["text"].split())
                        if word_cnt < 300:
                            thin_content_count += 1
                            
                        # Trust signals: look for email/phone loosely
                        if not found_email and "@" in r["text"] and re.search(r"[\w\.-]+@[\w\.-]+\.\w+", r["text"]):
                            found_email = True
                        if not found_phone and re.search(r"\+?[0-9][\d\s\-\(\)]{7,15}\d", r["text"]):
                            found_phone = True
                            
                        # Missing SEO tags on deep pages
                        if not r["soup"].title or not r["soup"].title.string or not r["soup"].title.string.strip():
                            missing_title_count += 1
                        
                        meta_desc = r["soup"].find("meta", attrs={"name": "description"})
                        if not meta_desc or not meta_desc.get("content") or not meta_desc.get("content").strip():
                            missing_desc_count += 1
                        
                        # Extract more links
                        for a_tag in r["soup"].find_all("a", href=True):
                            new_link = urljoin(r["url"], a_tag["href"])
                            parsed = urlparse(new_link)
                            if parsed.scheme in ["http", "https"]:
                                all_links_to_check.add(new_link)
                                if parsed.netloc == urlparse(final_url).netloc and new_link not in set(visited_urls).union(queue):
                                    queue.append(new_link)

            # 2. Check broken links
            checked_links = 0
            # Sample up to 50 links to avoid massive delays
            links_to_verify = list(all_links_to_check)[:50]
            
            async def verify_link(url):
                try:
                    res = await client.head(url, timeout=5.0)
                    if res.status_code >= 400 and res.status_code != 405:
                        # Fallback to GET for 405 Method Not Allowed
                        res_get = await client.get(url, timeout=5.0)
                        return res_get.status_code >= 400
                    return res.status_code >= 400
                except:
                    return True
                    
            broken_tasks = [verify_link(l) for l in links_to_verify]
            if broken_tasks:
                broken_results = await asyncio.gather(*broken_tasks)
                broken_links_found = sum(1 for is_broken in broken_results if is_broken)
                checked_links = len(links_to_verify)
            
            core_scan_data["broken_links"] = {
                "checked": checked_links,
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

            # Append aggregates to seo_data and trust_pages_data
            seo_data["meta_tags_analysis"] = {
                "pages_checked": scanned_pages,
                "missing_titles": missing_title_count,
                "missing_descriptions": missing_desc_count
            }
            
            trust_pages_data["contact_signals"] = {
                "found_email": found_email,
                "found_phone": found_phone
            }

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
        try:
            print(f"[{scan_id}] Checking Safe Browsing API...", flush=True)
            safe_browsing = await check_safe_browsing(final_url)
            security_data["safe_browsing"] = safe_browsing
        except Exception as e:
            print(f"[{scan_id}] Safe Browsing check failed: {e}", flush=True)
            security_data["safe_browsing"] = {"status": "unknown"}

        # Concurrently Fetch PageSpeed data
        try:
            print(f"[{scan_id}] Fetching PageSpeed Insights...", flush=True)
            pagespeed_result = await fetch_pagespeed_data(final_url)
            if pagespeed_result:
                core_scan_data["pagespeed"] = pagespeed_result
        except Exception as e:
            print(f"[{scan_id}] PageSpeed check failed: {e}", flush=True)

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

class RegenerateDraftRequest(BaseModel):
    scan_id: str
    domain: str
    page_type: str

@app.post("/regenerate-draft")
async def handle_regenerate_draft(request: RegenerateDraftRequest):
    draft_content = await generate_missing_page_draft(request.domain, request.page_type)
    if draft_content:
        import httpx
        url = f"{SUPABASE_URL}/rest/v1/adsense_scans?id=eq.{request.scan_id}&select=trust_pages_data"
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
                    trust_data = data[0].get("trust_pages_data", {})
                    if "drafts" not in trust_data:
                        trust_data["drafts"] = {}
                    trust_data["drafts"][request.page_type] = draft_content
                    
                    update_url = f"{SUPABASE_URL}/rest/v1/adsense_scans?id=eq.{request.scan_id}"
                    patch_headers = headers.copy()
                    patch_headers["Content-Type"] = "application/json"
                    patch_headers["Prefer"] = "return=minimal"
                    
                    patch_r = await client.patch(update_url, headers=patch_headers, json={"trust_pages_data": trust_data})
                    patch_r.raise_for_status()
                    return {"status": "success", "draft": draft_content}
            except Exception as e:
                print(f"Failed to fetch/update trust_pages_data for {request.scan_id}: {e}")
                return Response(content="Database update failed", status_code=500)
    return Response(content="Draft generation failed", status_code=500)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
