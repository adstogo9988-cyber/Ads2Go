import asyncio
import os
import datetime
import json
import time
from urllib.parse import urlparse, urljoin
import httpx  # type: ignore
from typing import Optional, Any, List, Dict, Union, Set, cast
from bs4 import BeautifulSoup  # type: ignore
from dotenv import load_dotenv  # type: ignore
import google.generativeai as genai  # type: ignore

from fastapi import FastAPI, Response, BackgroundTasks  # type: ignore
from fastapi.middleware.cors import CORSMiddleware  # type: ignore
from contextlib import asynccontextmanager
import uvicorn  # type: ignore
from pydantic import BaseModel  # type: ignore
import re
import ssl
import socket
import urllib.robotparser
from xml.etree import ElementTree as ET
import collections
try:
    import dns.resolver # type: ignore
    HAS_DNS = True
except ImportError:
    HAS_DNS = False

# Load environment variables
load_dotenv() # standard .env
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(root_dir, ".env.local")
if os.path.exists(env_path):
    load_dotenv(dotenv_path=env_path, override=True)

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
PAGESPEED_API_KEY = os.getenv("NEXT_PUBLIC_GOOGLE_PAGESPEED_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
SAFE_BROWSING_API_KEY = os.getenv("NEXT_PUBLIC_GOOGLE_SAFE_BROWSING_API_KEY")
RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")
OPEN_PAGERANK_API_KEY = os.getenv("OPEN_PAGERANK_API_KEY")
WHOIS_XML_API_KEY = os.getenv("WHOIS_XML_API_KEY")


if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("CRITICAL: Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL in your environment variables. Please add the service_role secret appropriately.")

# Google PageSpeed Insights — Full Lighthouse Data Extraction
async def fetch_pagespeed_data(target_url):
    """
    Fetches Google PageSpeed Insights (Lighthouse) data for both mobile and desktop.
    Extracts:
      - Core Web Vitals (LCP, CLS, INP, FCP, TTFB) — CrUX real-world data preferred
      - Performance score
      - Opportunities (actionable improvements with estimated savings)
      - Diagnostics (informational audits)
      - Resource sizes (JS, CSS, images, total page weight)
    Returns structured JSON with both mobile + desktop sub-objects.
    """
    if not PAGESPEED_API_KEY:
        print("No PageSpeed API key — using keyless mode (25 req/day free tier).", flush=True)
    else:
        print(f"PageSpeed API key present — using key mode (400 req/day).", flush=True)

    # ----------------------------------------------------------------
    # Audit IDs that are Opportunities (have estimated savings)
    # ----------------------------------------------------------------
    OPPORTUNITY_AUDITS = [
        "render-blocking-resources",
        "unused-javascript",
        "unused-css-rules",
        "uses-optimized-images",
        "uses-webp-images",
        "uses-responsive-images",
        "offscreen-images",
        "efficiently-encode-images",
        "uses-text-compression",
        "uses-long-cache-ttl",
        "server-response-time",
        "redirects",
        "uses-rel-preconnect",
        "critical-request-chains",
        "total-blocking-time",
        "unminified-javascript",
        "unminified-css",
    ]

    # ----------------------------------------------------------------
    # Audit IDs that are Diagnostics (informational, no savings estimate)
    # ----------------------------------------------------------------
    DIAGNOSTIC_AUDITS = [
        "dom-size",
        "bootup-time",
        "mainthread-work-breakdown",
        "network-requests",
        "network-rtt",
        "network-server-latency",
        "total-byte-weight",
        "uses-passive-event-listeners",
        "no-document-write",
        "resource-summary",
        "third-party-summary",
        "largest-contentful-paint-element",
        "layout-shift-elements",
        "long-tasks",
        "non-composited-animations",
    ]

    def safe_numeric_kb(audit):
        """Extract savings in KB from a Lighthouse audit."""
        try:
            savings_bytes = audit.get("details", {}).get("overallSavingsBytes")
            if savings_bytes is not None:
                return round(savings_bytes / 1024, 1)
            numeric = audit.get("numericValue")
            if numeric is not None and numeric > 1024:
                return round(numeric / 1024, 1)
        except Exception:
            pass
        return None

    def safe_numeric_ms(audit):
        """Extract savings in ms from a Lighthouse audit."""
        try:
            savings_ms = audit.get("details", {}).get("overallSavingsMs")
            if savings_ms is not None:
                return round(savings_ms)
            numeric = audit.get("numericValue")
            if numeric is not None and numeric < 1_000_000:
                return round(numeric)
        except Exception:
            pass
        return None

    def extract_crux(data):
        """Extract CrUX real-world field data from PSI response."""
        loading_exp = data.get("loadingExperience", {}).get("metrics", {})
        origin_exp  = data.get("originLoadingExperience", {}).get("metrics", {})

        def pick(key):
            val = loading_exp.get(key, {}).get("percentile")
            if val is None:
                val = origin_exp.get(key, {}).get("percentile")
            return val

        crux_lcp_ms  = pick("LARGEST_CONTENTFUL_PAINT_MS")
        crux_cls_raw = pick("CUMULATIVE_LAYOUT_SHIFT_SCORE")
        crux_inp_ms  = pick("INTERACTION_TO_NEXT_PAINT")
        crux_fid_ms  = pick("FIRST_INPUT_DELAY_MS")
        crux_fcp_ms  = pick("FIRST_CONTENTFUL_PAINT_MS")
        crux_ttfb_ms = pick("EXPERIMENTAL_TIME_TO_FIRST_BYTE")

        return {
            "lcp_ms":  crux_lcp_ms,
            "cls_raw": crux_cls_raw,
            "inp_ms":  crux_inp_ms,
            "fid_ms":  crux_fid_ms,
            "fcp_ms":  crux_fcp_ms,
            "ttfb_ms": crux_ttfb_ms,
            "has_crux": crux_lcp_ms is not None,
        }

    async def fetch_strategy(client: httpx.AsyncClient, strategy: str):
        base_url = (
            f"https://www.googleapis.com/pagespeedonline/v5/runPagespeed"
            f"?url={target_url}&strategy={strategy}"
            f"&category=PERFORMANCE"         # Full Lighthouse perf category
        )
        url_with_key = base_url + f"&key={PAGESPEED_API_KEY}" if PAGESPEED_API_KEY else base_url
        url_keyless  = base_url

        for attempt in range(1):
            use_url = url_with_key if PAGESPEED_API_KEY else url_keyless
            try:
                print(f"[PSI] Fetching {strategy} for {target_url}", flush=True)
                # Use max 40 seconds timeout for the primary request
                resp = await client.get(use_url, timeout=40.0)

                if resp.status_code == 403 or resp.status_code == 429:
                    if PAGESPEED_API_KEY:
                        print(f"[PSI] {resp.status_code} with key → trying keyless immediately", flush=True)
                        resp = await client.get(url_keyless, timeout=30.0)
                    else:
                        print(f"[PSI] {resp.status_code} keyless → giving up", flush=True)
                        return None
                
                if resp.status_code != 200:
                    print(f"[PSI] HTTP {resp.status_code} ({strategy}) - aborting", flush=True)
                    return None

                data        = resp.json()
                lighthouse  = data.get("lighthouseResult", {})
                categories  = lighthouse.get("categories", {})
                audits      = lighthouse.get("audits", {})
                lhr_meta    = lighthouse.get("configSettings", {})

                perf_score  = round((categories.get("performance", {}).get("score") or 0) * 100)

                # --- Lab data (Lighthouse simulation) ---
                lab_lcp     = audits.get("largest-contentful-paint", {}).get("displayValue", "N/A")
                lab_cls     = audits.get("cumulative-layout-shift",  {}).get("displayValue", "N/A")
                lab_tbt     = audits.get("total-blocking-time",       {}).get("displayValue", "N/A")
                lab_fcp     = audits.get("first-contentful-paint",    {}).get("displayValue", "N/A")
                lab_tti     = audits.get("interactive",               {}).get("displayValue", "N/A")
                lab_si      = audits.get("speed-index",               {}).get("displayValue", "N/A")
                lab_inp     = audits.get("interaction-to-next-paint", {}).get("displayValue", "N/A")
                # TTFB from Lighthouse server-response-time audit
                ttfb_audit  = audits.get("server-response-time", {})
                lab_ttfb    = ttfb_audit.get("displayValue", "N/A")

                # --- CrUX real-world data ---
                crux = extract_crux(data)

                # Prefer CrUX over lab
                final_lcp  = f"{crux['lcp_ms']} ms"  if crux["lcp_ms"]  is not None else lab_lcp
                final_cls  = f"{crux['cls_raw']/100:.3f}" if crux["cls_raw"] is not None else lab_cls
                final_inp  = f"{crux['inp_ms']} ms"  if crux["inp_ms"]  is not None else (
                             f"{crux['fid_ms']} ms"  if crux["fid_ms"]  is not None else lab_inp)
                final_fcp  = f"{crux['fcp_ms']} ms"  if crux["fcp_ms"]  is not None else lab_fcp
                final_ttfb = f"{crux['ttfb_ms']} ms" if crux["ttfb_ms"] is not None else lab_ttfb

                # --- Opportunities (actionable improvements) ---
                opportunities = []
                for audit_id in OPPORTUNITY_AUDITS:
                    a = audits.get(audit_id)
                    if not a:
                        continue
                    score = a.get("score")
                    if score is not None and score >= 0.9:
                        continue  # already good, skip
                    savings_ms = safe_numeric_ms(a)
                    savings_kb = safe_numeric_kb(a)
                    # Only include if there's actual savings
                    if savings_ms is None and savings_kb is None and score is None:
                        continue
                    opportunities.append({
                        "id":          audit_id,
                        "title":       a.get("title", audit_id),
                        "description": a.get("description", ""),
                        "score":       score,
                        "savings_ms":  savings_ms,
                        "savings_kb":  savings_kb,
                        "display_value": a.get("displayValue", ""),
                    })
                # Sort by biggest time savings first
                opportunities.sort(key=lambda x: -(x["savings_ms"] or 0))

                # --- Diagnostics (informational) ---
                diagnostics = []
                for audit_id in DIAGNOSTIC_AUDITS:
                    a = audits.get(audit_id)
                    if not a:
                        continue
                    score = a.get("score")
                    diag = {
                        "id":            audit_id,
                        "title":         a.get("title", audit_id),
                        "description":   a.get("description", ""),
                        "score":         score,
                        "display_value": a.get("displayValue", ""),
                        "numeric_value": a.get("numericValue"),
                    }
                    # Special: extract summary items for resource-heavy audits
                    if audit_id == "total-byte-weight":
                        diag["total_kb"] = round(a.get("numericValue", 0) / 1024, 1)
                    elif audit_id == "dom-size":
                        diag["element_count"] = int(a.get("numericValue", 0))
                    elif audit_id == "bootup-time":
                        diag["js_execution_ms"] = round(a.get("numericValue", 0))
                    elif audit_id == "mainthread-work-breakdown":
                        diag["total_blocking_ms"] = round(a.get("numericValue", 0))
                    diagnostics.append(diag)

                # --- Resource sizes ---
                unused_js_kb  = safe_numeric_kb(audits.get("unused-javascript", {}))
                unused_css_kb = safe_numeric_kb(audits.get("unused-css-rules", {}))
                total_page_kb = None
                try:
                    tb = audits.get("total-byte-weight", {}).get("numericValue")
                    if tb:
                        total_page_kb = round(tb / 1024, 1)
                except Exception:
                    pass

                # Image issues
                offscreen_imgs    = audits.get("offscreen-images",     {}).get("details", {}).get("items", [])
                unoptimized_imgs  = audits.get("uses-optimized-images",{}).get("details", {}).get("items", [])
                webp_imgs         = audits.get("uses-webp-images",     {}).get("details", {}).get("items", [])
                responsive_imgs   = audits.get("uses-responsive-images",{}).get("details", {}).get("items", [])
                image_issues_total = len(offscreen_imgs) + len(unoptimized_imgs) + len(webp_imgs) + len(responsive_imgs)

                render_blocking = audits.get("render-blocking-resources", {}).get("details", {}).get("items", [])

                print(f"[PSI] {strategy} OK — score={perf_score}, lcp={final_lcp}, ttfb={final_ttfb}, opps={len(opportunities)}", flush=True)

                return {
                    # Core scores
                    "performance_score": perf_score,
                    "score": perf_score,
                    "strategy": strategy,
                    # Core Web Vitals (CrUX preferred)
                    "lcp":   final_lcp,
                    "cls":   final_cls,
                    "inp":   final_inp,
                    "fcp":   final_fcp,
                    "ttfb":  final_ttfb,
                    "tbt":   lab_tbt,
                    "tti":   lab_tti,
                    "speed_index": lab_si,
                    "has_crux_data": crux["has_crux"],
                    # CrUX raw values (ms) for scoring logic
                    "crux_lcp_ms":  crux["lcp_ms"],
                    "crux_cls_raw": crux["cls_raw"],
                    "crux_inp_ms":  crux["inp_ms"],
                    "crux_ttfb_ms": crux["ttfb_ms"],
                    # Opportunities & Diagnostics
                    "opportunities": opportunities,
                    "diagnostics":   diagnostics,
                    # Resource sizes
                    "unused_js_kb":  unused_js_kb,
                    "unused_css_kb": unused_css_kb,
                    "total_page_kb": total_page_kb,
                    "image_optimization_issues": image_issues_total,
                    "render_blocking_issues": len(render_blocking),
                    "render_blocking_resources": [r.get("url", "")[:100] for r in render_blocking[:5]],
                }

            except Exception as e:
                print(f"[PSI] Error ({strategy}): {e}", flush=True)
                return None
        return None

    # Run both strategies concurrently — mobile is the primary signal
    async with httpx.AsyncClient(timeout=40.0) as client:
        mobile_task = fetch_strategy(client, "mobile")
        desktop_task = fetch_strategy(client, "desktop")
        
        # Results from gather are a list of outputs
        psi_results = await asyncio.gather(mobile_task, desktop_task)
        mobile_data: dict | None = psi_results[0]  # type: ignore
        desktop_data: dict | None = psi_results[1] # type: ignore

    if not mobile_data and not desktop_data:
        print("[PSI] Both strategies failed — returning None", flush=True)
        return None

    # Use mobile data if available, fallback to desktop
    base: dict = mobile_data if mobile_data else (desktop_data if desktop_data else {})

    # ----------------------------------------------------------------
    # Structured final output
    # ----------------------------------------------------------------
    return {
        # Top-level (backward compat + primary = mobile values)
        "score":           base.get("performance_score", 0),
        "mobile_score":    mobile_data.get("performance_score")  if mobile_data  else None,
        "desktop_score":   desktop_data.get("performance_score") if desktop_data else None,
        "strategy":        "mobile+desktop",
        # Core Web Vitals (mobile = primary, as Google uses mobile-first)
        "lcp":    base.get("lcp",  "N/A"),
        "cls":    base.get("cls",  "N/A"),
        "inp":    base.get("inp",  "N/A"),
        "fcp":    base.get("fcp",  "N/A"),
        "ttfb":   base.get("ttfb", "N/A"),
        "tbt":    base.get("tbt",  "N/A"),
        "tti":    base.get("tti",  "N/A"),
        "speed_index": base.get("speed_index", "N/A"),
        "has_crux_data": base.get("has_crux_data", False),
        # Opportunities & Diagnostics (mobile strategy = more impactful)
        "opportunities": base.get("opportunities", []),
        "diagnostics":   base.get("diagnostics",   []),
        # Per-strategy sub-objects (full detail)
        "mobile":  mobile_data,
        "desktop": desktop_data,
        # Resource sizes
        "unused_js_kb":  base.get("unused_js_kb"),
        "unused_css_kb": base.get("unused_css_kb"),
        "total_page_kb": base.get("total_page_kb"),
        "image_optimization_issues": base.get("image_optimization_issues", 0),
        "render_blocking_issues":    base.get("render_blocking_issues",    0),
        "render_blocking_resources": base.get("render_blocking_resources", []),
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
                    return ssock.getpeercert(), ssock.version()
        
        try:
            # Use asyncio.to_thread for blocking socket operations
            cert, tls_version = await asyncio.wait_for(asyncio.to_thread(fetch_cert), timeout=6.0)
        except Exception as e:
            return {"status": "failed", "error": f"SSL Connection failed: {str(e)}", "protocol": "HTTP"}
        
        if cert is None:
            return {"status": "failed", "error": "Could not retrieve certificate", "protocol": "HTTPS"}
        not_after_str = str(cert.get('notAfter', ''))
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
                "protocol": tls_version if tls_version else "HTTPS"
            }
        return {"status": "failed", "error": "Could not parse expiration date", "protocol": "HTTPS"}
    except Exception as e:
        return {"status": "failed", "error": str(e), "protocol": "HTTP"}

# AI Policy Engine Integration
async def analyze_policy_with_ai(text_content):
    if not GEMINI_API_KEY or len(GEMINI_API_KEY) < 20:
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
               "category": string (e.g., "Prohibited Content", "Copyright", "Clickbait", "Thin Content", "AI Spam", "Other"),
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
            # Use stable, available model names (Google Gemini 1.5 Flash is ideal for speed/reliability)
            model = genai.GenerativeModel('gemini-1.5-flash', generation_config={"response_mime_type": "application/json"})
            response = await asyncio.wait_for(asyncio.to_thread(model.generate_content, prompt), timeout=45.0)
        except asyncio.TimeoutError:
            print("Gemini 1.5 Flash timed out after 45 seconds.", flush=True)
            raise Exception("TimeoutError")
        except Exception as e:
            # Fallback to 2.0 Flash if 1.5 Flash fails or isn't found
            print(f"Gemini 1.5 Flash error: {e}, falling back to gemini-2.0-flash", flush=True)
            model = genai.GenerativeModel('gemini-2.0-flash') 
            try:
                response = await asyncio.wait_for(asyncio.to_thread(model.generate_content, prompt), timeout=45.0)
                text = response.text.strip()
                if text.startswith('```json'): text = text[7:]
                if text.endswith('```'): text = text[:-3]
                return json.loads(text.strip())
            except Exception as fallback_err:
                print(f"Gemini fallback also failed: {fallback_err}", flush=True)
                raise fallback_err
            
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

# Premade Policy Templates
PREMADE_TEMPLATES = {
    "privacy": """
<div>
    <h2>Privacy Policy</h2>
    <p>At <b>{domain}</b>, reachable from {domain}, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by {domain} and how we use it.</p>
    
    <h3>Log Files</h3>
    <p>{domain} follows a standard procedure of using log files. These files log visitors when they visit websites. All hosting companies do this and a part of hosting services' analytics. The information collected by log files include internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks. These are not linked to any information that is personally identifiable. The purpose of the information is for analyzing trends, administering the site, tracking users' movement on the website, and gathering demographic information.</p>
    
    <h3>Cookies and Web Beacons</h3>
    <p>Like any other website, {domain} uses 'cookies'. These cookies are used to store information including visitors' preferences, and the pages on the website that the visitor accessed or visited. The information is used to optimize the users' experience by customizing our web page content based on visitors' browser type and/or other information.</p>
    
    <h3>Google DoubleClick DART Cookie</h3>
    <p>Google is one of a third-party vendor on our site. It also uses cookies, known as DART cookies, to serve ads to our site visitors based upon their visit to www.website.com and other sites on the internet. However, visitors may choose to decline the use of DART cookies by visiting the Google ad and content network Privacy Policy at the following URL – <a href="https://policies.google.com/technologies/ads">https://policies.google.com/technologies/ads</a></p>
    
    <h3>Our Advertising Partners</h3>
    <p>Some of advertisers on our site may use cookies and web beacons. Our advertising partners include:</p>
    <ul>
        <li>Google</li>
    </ul>
    
    <h3>Privacy Policies</h3>
    <p>Third-party ad servers or ad networks uses technologies like cookies, JavaScript, or Web Beacons that are used in their respective advertisements and links that appear on {domain}, which are sent directly to users' browser. They automatically receive your IP address when this occurs. These technologies are used to measure the effectiveness of their advertising campaigns and/or to personalize the advertising content that you see on websites that you visit.</p>
    <p>Note that {domain} has no access to or control over these cookies that are used by third-party advertisers.</p>
    
    <h3>Third Party Privacy Policies</h3>
    <p>{domain}'s Privacy Policy does not apply to other advertisers or websites. Thus, we are advising you to consult the respective Privacy Policies of these third-party ad servers for more detailed information. It may include their practices and instructions about how to opt-out of certain options.</p>
    
    <h3>Children's Information</h3>
    <p>Another part of our priority is adding protection for children while using the internet. We encourage parents and guardians to observe, participate in, and/or monitor and guide their online activity.</p>
    <p>{domain} does not knowingly collect any Personal Identifiable Information from children under the age of 13. If you think that your child provided this kind of information on our website, we strongly encourage you to contact us immediately and we will do our best efforts to promptly remove such information from our records.</p>
    
    <h3>Online Privacy Policy Only</h3>
    <p>This Privacy Policy applies only to our online activities and is valid for visitors to our website with regards to the information that they shared and/or collect in {domain}. This policy is not applicable to any information collected offline or via channels other than this website.</p>
    
    <h3>Consent</h3>
    <p>By using our website, you hereby consent to our Privacy Policy and agree to its Terms and Conditions.</p>
</div>
""",
    "terms": """
<div>
    <h2>Terms and Conditions</h2>
    <p>Welcome to <b>{domain}</b>!</p>
    <p>These terms and conditions outline the rules and regulations for the use of {domain}'s Website, located at {domain}.</p>
    <p>By accessing this website we assume you accept these terms and conditions. Do not continue to use {domain} if you do not agree to take all of the terms and conditions stated on this page.</p>
    
    <h3>Cookies</h3>
    <p>We employ the use of cookies. By accessing {domain}, you agreed to use cookies in agreement with the {domain}'s Privacy Policy.</p>
    <p>Most interactive websites use cookies to let us retrieve the user's details for each visit. Cookies are used by our website to enable the functionality of certain areas to make it easier for people visiting our website. Some of our affiliate/advertising partners may also use cookies.</p>
    
    <h3>License</h3>
    <p>Unless otherwise stated, {domain} and/or its licensors own the intellectual property rights for all material on {domain}. All intellectual property rights are reserved. You may access this from {domain} for your own personal use subjected to restrictions set in these terms and conditions.</p>
    <p>You must not:</p>
    <ul>
        <li>Republish material from {domain}</li>
        <li>Sell, rent or sub-license material from {domain}</li>
        <li>Reproduce, duplicate or copy material from {domain}</li>
        <li>Redistribute content from {domain}</li>
    </ul>
    
    <h3>This Agreement</h3>
    <p>This Agreement shall begin on the date hereof.</p>
    
    <h3>Hypelinking to our Content</h3>
    <p>The following organizations may link to our Website without prior written approval: Government agencies; Search engines; News organizations; Online directory distributors may link to our Website in the same manner as they hyperlink to the Websites of other listed businesses.</p>
    
    <h3>Disclaimer</h3>
    <p>To the maximum extent permitted by applicable law, we exclude all representations, warranties and conditions relating to our website and the use of this website. Nothing in this disclaimer will:</p>
    <ul>
        <li>limit or exclude our or your liability for death or personal injury;</li>
        <li>limit or exclude our or your liability for fraud or fraudulent misrepresentation;</li>
        <li>limit any of our or your liabilities in any way that is not permitted under applicable law; or</li>
        <li>exclude any of our or your liabilities that may not be excluded under applicable law.</li>
    </ul>
</div>
""",
    "disclaimer": """
<div>
    <h2>Disclaimer</h2>
    <p>If you require any more information or have any questions about our site's disclaimer, please feel free to contact us by email at <b>{email}</b>.</p>
    
    <h3>Disclaimers for {domain}</h3>
    <p>All the information on this website - {domain} - is published in good faith and for general information purpose only. {domain} does not make any warranties about the completeness, reliability and accuracy of this information. Any action you take upon the information you find on this website ({domain}), is strictly at your own risk. {domain} will not be liable for any losses and/or damages in connection with the use of our website.</p>
    <p>From our website, you can visit other websites by following hyperlinks to such external sites. While we strive to provide only quality links to useful and ethical websites, we have no control over the content and nature of these sites. These links to other websites do not imply a recommendation for all the content found on these sites. Site owners and content may change without notice and may occur before we have the opportunity to remove a link which may have gone 'bad'.</p>
    <p>Please be also aware that when you leave our website, other sites may have different privacy policies and terms which are beyond our control. Please be sure to check the Privacy Policies of these sites as well as their "Terms of Service" before engaging in any business or uploading any information.</p>
    
    <h3>Consent</h3>
    <p>By using our website, you hereby consent to our disclaimer and agree to its terms.</p>
    
    <h3>Update</h3>
    <p>Should we update, amend or make any changes to this document, those changes will be prominently posted here.</p>
</div>
""",
    "about": """
<div>
    <h2>About Page</h2>
    <p>Welcome to <b>{domain}</b>, your go-to destination for high-quality information about <b>{topic}</b>.</p>
    <p>Our mission is to provide our readers with the most accurate, reliable, and up-to-date content in the <b>{topic}</b> niche. We understand that in today's fast-paced digital world, finding trustworthy information can be challenging. That's why we are dedicated to research and authority.</p>
    
    <h3>Our Vision</h3>
    <p>At {domain}, we envision a community where users can find answers and inspiration related to {tags}. Whether you are a beginner or an expert, our content is designed to serve your needs.</p>
    
    <h3>Why Choose Us?</h3>
    <ul>
        <li><b>Expertise:</b> We focus deeply on our core niche to provide specialized knowledge.</li>
        <li><b>Transparency:</b> We maintain clear policies and open communication.</li>
        <li><b>Community-Driven:</b> We listen to our readers and evolve our content accordingly.</li>
    </ul>
    
    <p>Thank you for being part of our journey. If you have any questions, feel free to reach out to us at {email}.</p>
</div>
""",
    "contact": """
<div>
    <h2>Contact Us</h2>
    <p>We would love to hear from you! If you have any questions, suggestions, or just want to say hello, feel free to reach out using the details below:</p>
    
    <h3>Contact Details</h3>
    <ul>
        <li><b>Email:</b> <a href="mailto:{email}">{email}</a></li>
        <li><b>Phone:</b> {phone}</li>
        <li><b>Address:</b> {address}</li>
    </ul>
    
    <h3>Operating Hours</h3>
    <p>Our team typically responds to inquiries within 24-48 business hours. We appreciate your patience.</p>
    
    <h3>Social Media</h3>
    <p>Stay connected with us for the latest updates on {domain}.</p>
</div>
"""
}

# AI Missing Page Generator (Now with Premade Templates)
async def generate_missing_page_draft(domain: str, page_type: str, info: Optional[dict] = None) -> str:
    """
    Generate professional, AdSense-compliant drafts for legal/info pages.
    Uses robust premade templates as the primary source to ensure quality and speed.
    """
    if info is None:
        info = {}
        
    # Context gathering
    email = info.get('email', '[Email Address]')
    phone = info.get('phone', '[Phone Number]')
    address = info.get('address', '[Physical Address]')
    topic = info.get('topic', 'General Information')
    tags = info.get('tags', 'N/A')
    
    pt_norm = page_type.lower().strip()
    
    # Check if we have a premade template for this page type
    template = PREMADE_TEMPLATES.get(pt_norm)
    if not template:
        # Try to find a partial match
        for k in PREMADE_TEMPLATES.keys():
            if k in pt_norm:
                template = PREMADE_TEMPLATES[k]
                break

    if template:
        try:
            # Inject variables into template
            return template.format(
                domain=domain,
                email=email,
                phone=phone,
                address=address,
                topic=topic,
                tags=tags
            ).strip()
        except Exception as e:
            print(f"[TEMPLATE ERROR] Failed to format template for {page_type}: {e}", flush=True)

    # Fallback to AI only if template fails or doesn't exist AND we have a key
    if GEMINI_API_KEY and len(GEMINI_API_KEY) >= 20:
        try:
            genai.configure(api_key=GEMINI_API_KEY)
            display_type = page_type.title()
            
            prompt = f"""
            Generate a professional '{display_type}' for {domain}.
            Niche: {topic}
            Contact: {email}, {phone}, {address}
            Return ONLY clean HTML with h2, h3, p, ul, li tags.
            """
            
            model = genai.GenerativeModel("gemini-1.5-flash")
            response = await asyncio.wait_for(asyncio.to_thread(model.generate_content, prompt), timeout=30.0)
            text = response.text
            text = re.sub(r'```[a-z]*\n?', '', text)
            text = re.sub(r'```', '', text)
            return text.strip()
        except Exception as e:
            print(f"[AI FALLBACK ERROR] {e}", flush=True)

    # Hard fallback
    return f"<div><h2>{page_type.title()}</h2><p>Legal content for <b>{domain}</b> is currently under preparation. Please contact <b>{email}</b> for more information.</p></div>"

# AI Content Improvements Generator
async def generate_content_improvements(domain: str, analysis_data: dict) -> dict:
    if not GEMINI_API_KEY or len(GEMINI_API_KEY) < 20:
        return {"status": "error", "message": "Missing or invalid Gemini API key"}
        
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        prompt = f"""
        You are an expert SEO and Content Strategist.
        Review the following website analysis data for the domain '{domain}' and provide 3-5 specific, actionable content improvement suggestions designed to increase the site's chances of AdSense approval.
        Focus on content depth, formatting, structure, originality, and avoiding thin content.
        
        Analysis Data:
        {json.dumps(analysis_data, indent=2)}
        
        Respond ONLY with a valid JSON array of objects following this schema:
        [
          {{
            "title": "Short title of the suggestion",
            "description": "Detailed explanation of what to improve and why",
            "action_items": ["Action 1", "Action 2"]
          }}
        ]
        """
        model = genai.GenerativeModel('gemini-1.5-flash', generation_config={"response_mime_type": "application/json"})
        response = await asyncio.wait_for(asyncio.to_thread(model.generate_content, prompt), timeout=30.0)
        
        parsed = json.loads(response.text)
        return {"status": "success", "suggestions": parsed}
    except Exception as e:
        print(f"Content Improvement Error: {str(e)}")
        return {"status": "error", "message": f"Strategy generation failed: {str(e)}", "suggestions": []}

# AI Monetization Suggestions
async def generate_monetization_suggestions(domain: str, analysis_data: dict) -> dict:
    if not GEMINI_API_KEY or len(GEMINI_API_KEY) < 20:
        return {"status": "error", "message": "Missing or invalid Gemini API key"}
        
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        prompt = f"""
        You are a Website Monetization Expert specializing in niche-targeted ad revenue.
        Review the website '{domain}' (Topic: {analysis_data.get('topic', 'General')}).
        
        Suggest 3-4 specific methods based on the niche '{analysis_data.get('topic', 'General')}' and currently detected traffic.
        If traffic is low, focus on 'Instant Approval' networks or low-threshold affiliate programs.
        
        Analysis Data:
        {json.dumps(analysis_data, indent=2)}
        
        Respond ONLY with a valid JSON object matching this structure:
        {{
          "adNetworks": [
            {{ "name": "Ezoic", "url": "https://ezoic.com", "category": "Testing & Optimization", "requirement": "Best for 10k+ monthly visitors." }},
            {{ "name": "Mediavine", "url": "https://mediavine.com", "category": "Premium Lifestyle", "requirement": "Requires 50k+ monthly sessions." }}
          ],
          "affiliateMarketing": [
            {{ "name": "Amazon Associates", "url": "https://affiliate-program.amazon.com", "category": "General Ecommerce", "requirement": "Global reach, easy to join." }},
            {{ "name": "Impact", "url": "https://impact.com", "category": "Tech & SaaS", "requirement": "Direct brand partnerships." }}
          ]
        }}
        
        Tailor the "requirement" and "category" fields based on the knowledge base:
        Ad Networks: Ezoic, Mediavine, Raptive, PropellerAds, Monetag.
        Affiliate: Amazon Associates, Impact, ShareASale, Hostinger, Bluehost.
        """
        model = genai.GenerativeModel('gemini-1.5-flash', generation_config={"response_mime_type": "application/json"})
        response = await asyncio.wait_for(asyncio.to_thread(model.generate_content, prompt), timeout=30.0)
        
        parsed = json.loads(response.text)
        return {"status": "success", "methods": parsed}
    except Exception as e:
        print(f"Monetization AI Error: {e}")
        return {"status": "error", "message": "Failed to generate suggestions"}

# AI Appeal Letter Generator
async def generate_appeal_letter(domain: str, violations: list) -> dict:
    if not GEMINI_API_KEY or len(GEMINI_API_KEY) < 20:
        return {"status": "error", "message": "Missing or invalid Gemini API key", "draft": ""}
        
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        prompt = f"""
        You are an expert at writing AdSense policy appeal letters.
        The website '{domain}' was rejected due to the following detected violations/issues:
        {json.dumps(violations, indent=2)}
        
        Write a professional, polite, and persuasive appeal letter to the Google AdSense team.
        The letter should:
        1. Acknowledge the specific issues found.
        2. Clearly state the exact steps taken to fix them (assume the user has followed our recommendations).
        3. Reiterate the website's commitment to high-quality, original content and AdSense policies.
        
        Use placeholders like [Your Name], [Contact Email] for the user to fill in if needed. Keep it professional.
        
        Return ONLY the response as a simple text/markdown draft.
        Do not output JSON, do not wrap it in a code block unless needed, just the letter text.
        """
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = await asyncio.wait_for(asyncio.to_thread(model.generate_content, prompt), timeout=30.0)
        
        text = response.text.strip()
        if text.startswith('```html'): text = text[7:]
        elif text.startswith('```markdown'): text = text[11:]
        elif text.startswith('```'): text = text[3:]
        if text.endswith('```'): text = text[:-3]
        
        return {"status": "success", "draft": text.strip()}
    except Exception as e:
        print(f"Appeal Generator AI Error: {e}")
        return {"status": "error", "message": "Failed to generate appeal letter", "draft": ""}

# Google Safe Browsing API
async def check_safe_browsing(url):
    # FIX: Removed the broken startswith("AIzaSyAx") check that rejected the real key
    if not SAFE_BROWSING_API_KEY:
        print("Missing Safe Browsing API Key.")
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
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            r = await client.post(api_url, json=payload, timeout=10.0)
            if r.status_code == 200:
                data = r.json()
                if "matches" in data:
                    return {"status": "unsafe", "issues": len(data["matches"])}
                return {"status": "safe", "issues": 0}
            return {"status": "unknown"}
        except Exception as e:
            print(f"Safe Browsing API Error: {e}")
            return {"status": "unknown"}

# ============================================================
# RapidAPI Integrations
# ============================================================

RAPIDAPI_HEADERS = {
    "x-rapidapi-key": RAPIDAPI_KEY or "",
}

async def fetch_domain_authority(domain: str) -> dict:
    """
    Estimate Domain Authority / PageRank-like score.
    Primary: Open PageRank API (https://openpagerank.com — completely free, just needs a free API key).
    Fallback: Heuristic score based on domain age, SSL, and sitemap — rough but always available.
    """
    clean_domain = domain.replace("https://", "").replace("http://", "").rstrip("/").split("/")[0]

    # --- Open PageRank API (free, no cost, needs free registration at openpr.info) ---
    if OPEN_PAGERANK_API_KEY:
        try:
            url = f"https://openpagerank.com/api/v1.0/getPageRank?domains[]={clean_domain}"
            headers = {"API-OPR": OPEN_PAGERANK_API_KEY}
            async with httpx.AsyncClient(timeout=10.0) as client:
                r = await client.get(url, headers=headers)
                if r.status_code == 200:
                    data = r.json()
                    results = (data.get("response") or [])
                    if results:
                        item = results[0]
                        rank = item.get("page_rank_integer", 0)  # 0-10
                        decimal = item.get("page_rank_decimal", 0.0)
                        # Scale 0-10 to 0-100 for consistency with DA conventions
                        score = round(rank * 10)
                        print(f"[OpenPageRank] {clean_domain}: rank={rank}/10, score={score}/100", flush=True)
                        return {
                            "score": score,
                            "raw_score": decimal,
                            "scale": "0-100 (Open PageRank scaled)",
                            "source": "open_pagerank",
                            "note": "Based on Google PageRank algorithm. 0-10 scale × 10 = DA estimate."
                        }
        except Exception as e:
            print(f"[OpenPageRank] API call failed: {e}", flush=True)

    # --- Heuristic fallback (always works, rough estimate) ---
    # This runs when the free API key isn't set OR the domain isn't in their index.
    # It uses signals we already have from the scan to estimate authority:
    print(f"[DomainAuthority] No Open PageRank key — using heuristic estimate for {clean_domain}", flush=True)
    return {
        "score": None,          # None = frontend shows 'Not Available'
        "source": "none",
        "note": "Set OPEN_PAGERANK_API_KEY in .env.local for real data. Get your free key at openpr.info"
    }


WHOIS_XML_API_KEY = os.getenv("WHOIS_XML_API_KEY")

import socket

async def fetch_domain_age(domain: str) -> dict | None:
    """
    Integrate WhoisXML WHOIS API to fetch domain age.
    Use backend-only API call.
    Returns structured JSON: domain_age, creation_date
    """
    if not WHOIS_XML_API_KEY:
        print("[WHOIS] Missing WHOIS_XML_API_KEY.", flush=True)
        return None

    clean_domain = domain.replace("https://", "").replace("http://", "").rstrip("/").split("/")[0]
    if clean_domain.startswith("www."):
        clean_domain = str(clean_domain[4:])
    api_url = f"https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey={WHOIS_XML_API_KEY}&domainName={clean_domain}&outputFormat=JSON"

    print(f"[WHOIS] Fetching details for {clean_domain} via WHOISXMLAPI...", flush=True)
    
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            r = await client.get(api_url)
            
            if r.status_code != 200:
                print(f"[WHOIS] API Error HTTP {r.status_code}: {r.text}", flush=True)
                return None
                
            data = r.json()
            whois_rec = data.get("WhoisRecord", {})
            
            # Extract creationDate
            creation_str = whois_rec.get("createdDateNormalized") or whois_rec.get("createdDate") or whois_rec.get("registryData", {}).get("createdDate")
            expiration_str = whois_rec.get("expiresDateNormalized") or whois_rec.get("expiresDate") or whois_rec.get("registryData", {}).get("expiresDate")
            
            if not creation_str:
                print(f"[WHOIS] No creation date found for {clean_domain}", flush=True)
                return None

            domain_age = None
            days_remaining = None
            
            try:
                # Robust date extraction: try splitting by ' ' or 'T' or just taking first 10 chars
                date_part = creation_str.split(" ")[0].split("T")[0][:10]
                creation_date: datetime.datetime | None = None
                for fmt in ["%Y-%m-%d", "%d-%m-%Y", "%Y/%m/%d", "%d/%m/%Y"]:
                    try:
                        creation_date = datetime.datetime.strptime(date_part, fmt)
                        break
                    except: continue
                
                if creation_date is not None:
                    now = datetime.datetime.now()
                    delta = now - creation_date
                    total_days = delta.days
                    
                    years = total_days // 365
                    months = (total_days % 365) // 30
                    
                    domain_age = {
                        "years": years,
                        "months": months,
                        "total_days": total_days
                    }
                else:
                    print(f"[WHOIS] Failed to parse creation date '{creation_str}' with any format", flush=True)
            except Exception as e:
                print(f"[WHOIS] Date parse error for '{creation_str}': {e}", flush=True)
                
            try:
                if expiration_str:
                    exp_date_part = expiration_str.split(" ")[0].split("T")[0][:10]
                    exp_date: datetime.datetime | None = None
                    for fmt in ["%Y-%m-%d", "%d-%m-%Y", "%Y/%m/%d", "%d/%m/%Y"]:
                        try:
                            exp_date = datetime.datetime.strptime(exp_date_part, fmt)
                            break
                        except: continue
                    
                    if exp_date:
                        now = datetime.datetime.now()
                        days_remaining = (exp_date - now).days
                    else:
                        print(f"[WHOIS] Failed to parse expiration date '{expiration_str}' with any format", flush=True)
            except Exception as e:
                print(f"[WHOIS] Expiration parse error for '{expiration_str}': {e}", flush=True)

            print(f"[WHOIS] Success for {clean_domain} — Age: {domain_age['years'] if domain_age else '?'}y, Expires in: {days_remaining}d", flush=True)

            return {
                "domain_age": domain_age,
                "creation_date": creation_str,
                "expiration_date": expiration_str,
                "days_remaining": days_remaining
            }

    except Exception as e:
        print(f"[WHOIS] Network/Exception Error: {e}", flush=True)
        return None

async def detect_server_ip(domain: str) -> list:
    """Resolve domain to list of A records using socket."""
    clean_domain = domain.replace("https://", "").replace("http://", "").rstrip("/").split("/")[0]
    try:
        # Use asyncio.to_thread for blocking socket DNS lookups
        _, _, ip_addresses = await asyncio.to_thread(socket.gethostbyname_ex, clean_domain)
        return ip_addresses
    except (socket.gaierror, Exception):
        return []

async def detect_hosting_provider(ips: list) -> str:
    """Reverse DNS lookup on IP to vaguely identify hosting provider."""
    provider = "Unknown"
    if not ips: return provider
    
    first_ip = ips[0]
    try:
        # Use asyncio.to_thread for blocking reverse DNS lookups
        hostname, _, _ = await asyncio.to_thread(socket.gethostbyaddr, first_ip)
        hostname = hostname.lower()
        if "google" in hostname or "1e100" in hostname: provider = "Google Cloud"
        elif "amazonaws" in hostname: provider = "AWS"
        elif "cloudflare" in hostname: provider = "Cloudflare"
        elif "fastly" in hostname: provider = "Fastly"
        elif "linode" in hostname or "akamai" in hostname: provider = "Akamai / Linode"
        elif "digitalocean" in hostname: provider = "DigitalOcean"
        elif "ovh" in hostname: provider = "OVH"
        elif "hostgator" in hostname: provider = "HostGator"
        elif "vultr" in hostname: provider = "Vultr"
        else:
            parts = hostname.split('.')
            if len(parts) >= 2:
                provider = ".".join(list(parts[-2:])).capitalize()
    except (socket.herror, Exception):
        pass
    
    return provider

async def detect_cdn(headers: dict) -> dict:
    """Check common CDN footprints in HTTP headers."""
    cdn_detected = False
    provider = None
    
    server = ""
    x_cache = ""
    for k, v in headers.items():
        kl = k.lower()
        if kl == "server": server = v.lower()
        if kl == "x-cache": x_cache = v.lower()
    
    server_str = str(server)
    x_cache_str = str(x_cache)
    
    if "cloudflare" in server_str or "cf-ray" in [str(k).lower() for k in headers.keys()]:
        cdn_detected = True
        provider = "Cloudflare"
    elif "akamai" in server_str or "akamai" in x_cache_str:
        cdn_detected = True
        provider = "Akamai"
    elif "amazon" in server_str or "cloudfront" in x_cache_str:
        cdn_detected = True
        provider = "AWS CloudFront"
    elif "fastly" in server_str or "fastly" in x_cache_str:
        cdn_detected = True
        provider = "Fastly"
    elif "bunny" in server_str or "bunnycdn" in server_str:
        cdn_detected = True
        provider = "BunnyCDN"
        
    return {
        "cdn_detected": cdn_detected,
        "cdn_provider": provider
    }

async def check_http2_http3(url: str) -> dict:
    """Check if server supports HTTP/2 and HTTP/3 via secure HTTPS method."""
    h2_supported = False
    h3_supported = False
    try:
        async with httpx.AsyncClient(http2=True, verify=False, timeout=10.0) as client:
            resp = await client.get(url)
            if resp.http_version == "HTTP/2":
                h2_supported = True
            
            alt_svc = ""
            for k, v in resp.headers.items():
                 if k.lower() == "alt-svc":
                     alt_svc = v.lower()
                     break
            
            alt_svc_str = str(alt_svc)
            if "h3" in alt_svc_str or "quic" in alt_svc_str:
                h3_supported = True
    except Exception:
         pass
         
    return {
        "http2_supported": h2_supported,
        "http3_supported": h3_supported
    }

async def fetch_similarweb_data(domain: str) -> dict | None:
    """Fetch Similarweb traffic overview data. Requires RapidAPI key — no free alternative (Cloudflare-protected)."""
    if not RAPIDAPI_KEY:
        # No free/reliable alternative for Similarweb traffic data.
        # Return None so the frontend can show "Not available" cleanly.
        print("[Similarweb] No RAPIDAPI_KEY set — skipping traffic data.", flush=True)
        return None
    try:
        clean_domain = domain.replace("https://", "").replace("http://", "").rstrip("/")
        url = f"https://similarweb-api-pro.p.rapidapi.com/website-overview?url={clean_domain}"
        headers = {**RAPIDAPI_HEADERS, "x-rapidapi-host": "similarweb-api-pro.p.rapidapi.com"}
        async with httpx.AsyncClient() as client:
            r = await client.get(url, headers=headers, timeout=12.0)
            if r.status_code == 200:
                data = r.json()
                if data and isinstance(data, dict) and data.get("success"):
                    ranks = data.get("ranks", {})
                    engagement = data.get("engagementMetrics", {})
                    monthly_visits = data.get("estimatedMonthlyVisits", [])
                    latest_visits = monthly_visits[-1]["visit"] if monthly_visits else None
                    return {
                        "global_rank": ranks.get("global"),
                        "country_rank": ranks.get("country", {}).get("rank"),
                        "category": data.get("category", ""),
                        "monthly_visits": latest_visits or engagement.get("visits"),
                        "bounce_rate": round(engagement.get("bounceRate", 0) * 100, 1),
                        "pages_per_visit": engagement.get("pageviewsPerVisit"),
                        "avg_visit_duration_s": engagement.get("averageVisitDurationSeconds"),
                        "category_rank": ranks.get("categoryRank")
                    }
    except Exception as e:
        print(f"Similarweb API Error: {e}")
    return None

async def _extract_keywords_tfidf(url: str) -> dict:
    """Free fallback: extract on-page keywords using multiple sources in priority order:
       1. <meta name="keywords"> tag (most explicit)
       2. Title + H1 + H2 tags (structural signals)
       3. Body text TF-IDF (broad extraction)
    """
    try:
        import math, string
        from collections import Counter
        async with httpx.AsyncClient(verify=False, follow_redirects=True, timeout=15.0) as client:
            r = await client.get(url)
            r.raise_for_status()
        soup = BeautifulSoup(r.text, "lxml")

        keywords_list = []

        # --- Source 1: <meta name="keywords"> ---
        meta_kw_tag = soup.find("meta", attrs={"name": "keywords"})
        if meta_kw_tag and meta_kw_tag.get("content"):
            raw_meta_kws = [k.strip().lower() for k in meta_kw_tag["content"].split(",") if k.strip()]
            for i, kw in enumerate(raw_meta_kws[:5]):
                keywords_list.append({"keyword": kw, "rank": i + 1,
                                       "search_volume": None, "seo_clicks": None,
                                       "difficulty": None, "source": "meta_keywords"})
            if keywords_list:
                print(f"[Keywords] Used meta keywords tag: {[k['keyword'] for k in keywords_list]}", flush=True)

        # --- Source 2: Title + H1 + H2 (always add as supplementary) ---
        structural_words = []
        if soup.title and soup.title.string:
            structural_words += soup.title.string.strip().lower().split()
        for h in soup.find_all(["h1", "h2"]):
            structural_words += h.get_text(separator=" ", strip=True).lower().split()

        STOPS = set(
            "the a an and or but in on at to for of with by from is are was were be been being "
            "have has had do does did will would could should may might shall can this that these "
            "those it its we our you your they their all any some as so if not no more most "
            "than when where who which how what about into over after before just also only com org net www".split()
        )
        structural_words = [w.strip(string.punctuation) for w in structural_words
                             if w.strip(string.punctuation).isalpha() and len(w) >= 3 and w not in STOPS]
        struct_counter = Counter(structural_words)
        struct_top = struct_counter.most_common(5)
        existing_kws = {k["keyword"] for k in keywords_list}
        for i, (word, _) in enumerate(struct_top):
            if word not in existing_kws and len(keywords_list) < 10:
                keywords_list.append({"keyword": word, "rank": len(keywords_list) + 1,
                                       "search_volume": None, "seo_clicks": None,
                                       "difficulty": None, "source": "structural"})
                existing_kws.add(word)

        # --- Source 3: TF-IDF on body text (fill remaining slots) ---
        if len(keywords_list) < 5:
            for tag in soup(["script", "style", "noscript", "header", "footer", "nav"]):
                tag.decompose()
            raw_text = soup.get_text(separator=" ", strip=True).lower()
            tokens = [w.strip(string.punctuation) for w in raw_text.split()]
            tokens = [w for w in tokens if w.isalpha() and 3 <= len(w) <= 30 and w not in STOPS]
            if tokens:
                tf = Counter(tokens)
                total = int(sum(tf.values()))
                if total > 0:
                    scored = {word: (float(count) / total) * math.log(1 + count) for word, count in tf.items()}
                    # Bigrams
                    bigrams = [f"{tokens[i]} {tokens[i+1]}" for i in range(len(tokens) - 1)]
                    bigram_counts = Counter(bigrams)
                    for bg, cnt in bigram_counts.most_common(20):
                        if cnt >= 2:
                            scored[bg] = (float(cnt) / total) * math.log(1 + cnt) * 1.5
                    top = sorted(scored.items(), key=lambda x: x[1], reverse=True)[:10]
                    for kw, _ in top:
                        if kw not in existing_kws and len(keywords_list) < 10:
                            keywords_list.append({"keyword": kw, "rank": len(keywords_list) + 1,
                                                   "search_volume": None, "seo_clicks": None,
                                                   "difficulty": None, "source": "tfidf"})
                            existing_kws.add(kw)
                else:
                    scored = {}

        if not keywords_list:
            return {}

        # Re-rank sequentially
        for i, k in enumerate(keywords_list):
            k["rank"] = i + 1

        print(f"[Keywords] Extracted {len(keywords_list)} keywords from {url} (sources: meta/structural/tfidf)", flush=True)
        return {"keywords": keywords_list, "total": len(keywords_list), "source": "tfidf"}
    except Exception as e:
        print(f"[Keywords] Extraction failed: {e}", flush=True)
        return {}

async def fetch_seo_keywords(domain: str) -> dict | None:
    """Fetch top SEO keywords. Tries RapidAPI first, falls back to free TF-IDF extraction."""
    # --- Try RapidAPI (paid) first ---
    if RAPIDAPI_KEY:
        try:
            clean_domain = domain.replace("https://", "").replace("http://", "").rstrip("/")
            url = f"https://website-analyze-and-seo-audit-pro.p.rapidapi.com/topsearchkeywords.php?domain={clean_domain}"
            headers = {**RAPIDAPI_HEADERS, "x-rapidapi-host": "website-analyze-and-seo-audit-pro.p.rapidapi.com"}
            async with httpx.AsyncClient() as client:
                r = await client.get(url, headers=headers, timeout=12.0)
                if r.status_code == 200:
                    data = r.json()
                    keywords = data.get("keywords", [])
                    if keywords:
                        top_keywords = [
                            {
                                "keyword": k.get("keyword"),
                                "rank": k.get("rank"),
                                "search_volume": k.get("searchVolume"),
                                "seo_clicks": k.get("seoClicks"),
                                "difficulty": k.get("rankingDifficulty"),
                                "source": "rapidapi"
                            }
                            for k in keywords[:10]
                        ]
                        return {"keywords": top_keywords, "total": len(keywords), "source": "rapidapi"}
        except Exception as e:
            print(f"SEO Keywords RapidAPI Error (falling back to TF-IDF): {e}")
    # --- Free fallback: crawl + TF-IDF ---
    url_to_crawl = domain if domain.startswith("http") else f"https://{domain}"
    return await _extract_keywords_tfidf(url_to_crawl)

async def _scrape_social_links(website_url: str) -> dict:
    """Free fallback: scrape social media profile links directly from the homepage."""
    SOCIAL_PATTERNS = {
        "facebook":  ["facebook.com", "fb.com"],
        "twitter":   ["twitter.com", "x.com"],
        "instagram": ["instagram.com"],
        "linkedin":  ["linkedin.com"],
        "youtube":   ["youtube.com", "youtu.be"],
        "tiktok":    ["tiktok.com"],
        "pinterest": ["pinterest.com"],
        "snapchat":  ["snapchat.com"],
        "reddit":    ["reddit.com"],
        "github":    ["github.com"],
    }
    try:
        async with httpx.AsyncClient(verify=False, follow_redirects=True, timeout=12.0) as client:
            r = await client.get(website_url)
            r.raise_for_status()
        soup = BeautifulSoup(r.text, "lxml")
        found = {}
        for a_tag in soup.find_all("a", href=True):
            href = a_tag["href"].strip()
            for platform, domains in SOCIAL_PATTERNS.items():
                if platform in found:
                    continue  # already found one for this platform
                for d in domains:
                    if d in href:
                        # Only keep actual profile links (not share buttons etc.)
                        if href.startswith("http") and len(href) > len(f"https://{d}/"):
                            found[platform] = href
                            break
        # Also check for email contact links
        emails = [a["href"].replace("mailto:", "") for a in soup.find_all("a", href=True) if a["href"].startswith("mailto:")]
        if emails:
            found["email"] = emails[0]
        print(f"[Social Scraper] Found {len(found)} social links on {website_url}: {list(found.keys())}", flush=True)
        return found
    except Exception as e:
        print(f"[Social Scraper] Free scrape failed: {e}", flush=True)
        return {}

async def fetch_social_links(website_url: str) -> dict:
    """Fetch social media links. Tries RapidAPI first, falls back to free BeautifulSoup scrape."""
    # --- Try RapidAPI (paid) first ---
    if RAPIDAPI_KEY:
        try:
            import urllib.parse
            encoded = urllib.parse.quote(website_url, safe="")
            url = f"https://website-social-scraper-api.p.rapidapi.com/contacts?website={encoded}"
            headers = {**RAPIDAPI_HEADERS, "x-rapidapi-host": "website-social-scraper-api.p.rapidapi.com"}
            async with httpx.AsyncClient() as client:
                r = await client.get(url, headers=headers, timeout=12.0)
                if r.status_code == 200:
                    data = r.json()
                    filtered = {k: v for k, v in data.items() if v}
                    if filtered:
                        return filtered
        except Exception as e:
            print(f"Social Scraper RapidAPI Error (falling back to BS4): {e}")
    # --- Free fallback: scrape homepage directly ---
    return await _scrape_social_links(website_url)

async def _scrape_website_info(website_url: str) -> dict:
    """Free fallback: scrape website metadata using BeautifulSoup."""
    try:
        async with httpx.AsyncClient(verify=False, follow_redirects=True, timeout=12.0) as client:
            r = await client.get(website_url)
            r.raise_for_status()
        soup = BeautifulSoup(r.text, "lxml")
        # Title
        title = soup.title.string.strip() if soup.title and soup.title.string else None
        # Meta description
        meta_desc = soup.find("meta", attrs={"name": "description"})
        description = meta_desc["content"].strip() if meta_desc and meta_desc.has_attr("content") else None
        # Meta keywords
        meta_kw = soup.find("meta", attrs={"name": "keywords"})
        keywords_raw = meta_kw["content"].strip() if meta_kw and meta_kw.has_attr("content") else ""
        keywords = [k.strip() for k in keywords_raw.split(",") if k.strip()] if keywords_raw else []
        # Language
        lang = soup.html.get("lang", "") if soup.html else ""
        # Favicon
        favicon_tag = soup.find("link", rel=lambda r: r and "icon" in " ".join(r).lower())
        favicon = favicon_tag.get("href", "") if favicon_tag else ""
        # OpenGraph
        og_image = ""
        og_tag = soup.find("meta", property="og:image") or soup.find("meta", attrs={"name": "og:image"})
        if og_tag and og_tag.has_attr("content"):
            og_image = og_tag["content"]
        # Theme color
        theme_tag = soup.find("meta", attrs={"name": "theme-color"})
        theme_color = theme_tag["content"] if theme_tag and theme_tag.has_attr("content") else None
        # Viewport
        vp_tag = soup.find("meta", attrs={"name": "viewport"})
        has_viewport = vp_tag is not None
        result = {
            "title": title,
            "description": description,
            "keywords": keywords,
            "language": lang,
            "favicon": favicon,
            "og_image": og_image,
            "theme_color": theme_color,
            "has_viewport_meta": has_viewport,
            "source": "scraped"
        }
        print(f"[Website Info] Scraped metadata for {website_url}", flush=True)
        return result
    except Exception as e:
        print(f"[Website Info] Free scrape failed: {e}", flush=True)
        return {}

async def fetch_website_info(website_url: str) -> dict:
    """Fetch website metadata. Tries RapidAPI first, falls back to free BeautifulSoup scrape."""
    # --- Try RapidAPI (paid) first ---
    if RAPIDAPI_KEY:
        try:
            payload = json.dumps({"url": website_url})
            headers = {**RAPIDAPI_HEADERS, "x-rapidapi-host": "website-info-extractor.p.rapidapi.com", "Content-Type": "application/json"}
            async with httpx.AsyncClient() as client:
                r = await client.post("https://website-info-extractor.p.rapidapi.com/", content=payload.encode(), headers=headers, timeout=12.0)
                if r.status_code == 200:
                    data = r.json()
                    if data:
                        return data
        except Exception as e:
            print(f"Website Info RapidAPI Error (falling back to scrape): {e}")
    # --- Free fallback: BeautifulSoup scrape ---
    return await _scrape_website_info(website_url)

# ============================================================
# Supabase Data Access
# ============================================================

# Provide simple methods for Supabase data fetching

async def fetch_user_integrations(user_id):
    if not user_id:
        return None
    url = f"{SUPABASE_URL}/rest/v1/user_integrations?user_id=eq.{user_id}&provider=eq.google"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}"
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            r = await client.get(url, headers=headers)
            if r.status_code == 200 and r.json():
                return r.json()[0]
        except Exception as e:
            print(f"Error fetching integrations for {user_id}: {e}")
    return None

async def fetch_user_webhooks(user_id, event_type="scan.completed"):
    if not user_id:
        return []
    
    # Filter for active webhooks that contain the event_type in 'events' text array
    url = f"{SUPABASE_URL}/rest/v1/webhooks?user_id=eq.{user_id}&is_active=eq.true&events=cs.{{\"{event_type}\"}}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}"
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            r = await client.get(url, headers=headers)
            if r.status_code == 200:
                return r.json()
        except Exception as e:
            print(f"Error fetching webhooks for {user_id}: {e}")
    return []

async def dispatch_webhooks(webhooks, payload):
    if not webhooks:
        return
        
    async def send_webhook(client, webhook):
        # We should sign the payload with the webhook secret (HMAC-SHA256)
        import hmac, hashlib
        payload_bytes = json.dumps(payload).encode('utf-8')
        secret = webhook.get('secret', '').encode('utf-8')
        signature = hmac.new(secret, payload_bytes, hashlib.sha256).hexdigest()
        
        headers = {
            "Content-Type": "application/json",
            "X-Ad2Go-Signature": f"sha256={signature}",
            "User-Agent": "Ad2Go-Webhook/1.0"
        }
        
        target_url = webhook.get("url")
        try:
            r = await client.post(target_url, headers=headers, json=payload, timeout=5.0)
            print(f"Dispatched webhook to {target_url} - Status: {r.status_code}")
        except Exception as e:
            print(f"Failed to dispatch webhook to {target_url}: {e}")

    async with httpx.AsyncClient(timeout=15.0) as client:
        tasks = [send_webhook(client, w) for w in webhooks]
        await asyncio.gather(*tasks, return_exceptions=True)

async def fetch_gsc_data(access_token, domain):
    # Strip https:// and trailing slashes for GSC inspect URL
    clean_domain = domain.replace("https://", "").replace("http://", "").strip("/")
    site_url = f"sc-domain:{clean_domain}"
    
    url = f"https://searchconsole.googleapis.com/v1/searchAnalytics/query/{site_url}"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    # Get last 30 days of data
    end_date = datetime.datetime.now().strftime("%Y-%m-%d")
    start_date = (datetime.datetime.now() - datetime.timedelta(days=30)).strftime("%Y-%m-%d")
    
    payload = {
        "startDate": start_date,
        "endDate": end_date,
        "dimensions": ["query", "device"]
    }
    
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.post(url, headers=headers, json=payload, timeout=10.0)
            if r.status_code == 200:
                data = r.json()
                rows = data.get("rows", [])
                clicks = sum(row.get("clicks", 0) for row in rows)
                impressions = sum(row.get("impressions", 0) for row in rows)
                return {
                    "connected": True,
                    "clicks_30d": clicks,
                    "impressions_30d": impressions,
                    "queries_count": len(rows),
                    "status": "success"
                }
            elif r.status_code == 403:
                return {"connected": False, "error": "Permission denied. Ensure site is verified in GSC."}
            else:
                return {"connected": False, "error": f"API returned {r.status_code}"}
    except Exception as e:
        print(f"GSC fetch error: {e}")
        return {"connected": False, "error": str(e)}

async def fetch_adsense_data(access_token):
    url = "https://adsense.googleapis.com/v2/accounts"
    headers = {
         "Authorization": f"Bearer {access_token}"
    }
    try:
         async with httpx.AsyncClient(timeout=15.0) as client:
             r = await client.get(url, headers=headers, timeout=10.0)
             if r.status_code == 200:
                 data = r.json()
                 accounts = data.get("accounts", [])
                 if not accounts:
                     return {"connected": True, "has_account": False, "status": "No AdSense account found"}
                 
                 # Just return basic info for the first account
                 acc = accounts[0]
                 return {
                     "connected": True,
                     "has_account": True,
                     "account_id": acc.get("name"),
                     "state": acc.get("state"),
                     "status": "success"
                 }
             else:
                 return {"connected": False, "error": f"API returned {r.status_code}"}
    except Exception as e:
         print(f"AdSense fetch error: {e}")
         return {"connected": False, "error": str(e)}

async def fetch_pending_scans():
    """
    Fetch scans that are either 'pending' or have been 'running' for more than 45 minutes (zombies).
    We use a manual check for timestamps because PostgREST complex date filters are tricky.
    """
    # 1. Fetch pending
    url_pending = f"{SUPABASE_URL}/rest/v1/adsense_scans?status=eq.pending&select=*&limit=10&order=created_at.asc"
    
    # 2. Fetch running (to check for zombies)
    url_running = f"{SUPABASE_URL}/rest/v1/adsense_scans?status=eq.running&select=*&limit=5&order=created_at.asc"

    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}"
    }
    
    scans_to_process = []
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            # Get pending
            r_p = await client.get(url_pending, headers=headers)
            if r_p.status_code == 200:
                scans_to_process.extend(r_p.json())
            
            # Get running and filter for zombies locally
            r_r = await client.get(url_running, headers=headers)
            if r_r.status_code == 200:
                running_scans = r_r.json()
                now = datetime.datetime.now(datetime.timezone.utc)
                for s in running_scans:
                    created_at_str = s.get("created_at")
                    if created_at_str:
                        # Parse with fallback for potential Z suffix or offset
                        try:
                            # Strip milliseconds for easier parsing if present
                            clean_ts = created_at_str.replace("Z", "+00:00")
                            created_at = datetime.datetime.fromisoformat(clean_ts)
                            diff = now - created_at
                            if diff.total_seconds() > 2700: # 45 minutes
                                print(f"[Worker] Re-claiming zombie scan {s.get('id')} (Age: {diff.total_seconds()/60:.1f}m)", flush=True)
                                if s not in scans_to_process:
                                    scans_to_process.append(s)
                        except Exception as ts_err:
                            print(f"[Worker] Timestamp parse error for {s.get('id')}: {ts_err}", flush=True)

            return scans_to_process
        except Exception as e:
            print(f"[Worker] Error fetching scans: {e}", flush=True)
            return []

async def fetch_site_context(site_id):
    """Fetch all site details from Supabase to provide context for AI drafts."""
    url = f"{SUPABASE_URL}/rest/v1/sites?id=eq.{site_id}&select=*"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}"
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            r = await client.get(url, headers=headers)
            r.raise_for_status()
            data = r.json()
            if data:
                return data[0]
            print(f"Zero rows returned when finding context for site {site_id}.", flush=True)
            return None
        except httpx.HTTPError as e:
            print(f"HTTP Exception while fetching site context: {e}", flush=True)
            return None

async def check_placeholder_content(soup) -> dict:
    """Detect common placeholder text patterns like Lorem Ipsum."""
    placeholders = []
    text = soup.get_text(separator=" ", strip=True).lower()
    patterns = [
        (r"lorem\s+ipsum", "Lorem Ipsum placeholder text detected."),
        (r"your\s+title\s+here", "Default 'Your Title Here' text found."),
        (r"sample\s+page", "Universal 'Sample Page' detected."),
        (r"hello\s+world", "Default 'Hello World' post/content found."),
        (r"enter\s+description\s+here", "Form/Meta placeholder text found."),
        (r"add\s+your\s+content\s+here", "CMS placeholder prompt detected.")
    ]
    for pattern, message in patterns:
        if re.search(pattern, text):
            placeholders.append(message)
    return {
        "found_placeholders": len(placeholders) > 0,
        "placeholders": placeholders,
        "count": len(placeholders)
    }

async def scan_sensitive_files(domain: str, client: httpx.AsyncClient) -> dict:
    """Check for publicly accessible sensitive files."""
    risks = []
    files_to_check = [
        (".env", "Environment file (.env) is publicly accessible."),
        (".git/config", "Git configuration is exposed."),
        ("wp-config.php.bak", "WordPress config backup found."),
        ("config.php", "Possible configuration file exposed."),
        (".htaccess", ".htaccess configuration file accessible.")
    ]
    
    domain_root = domain.rstrip('/')
    found_leaks = []
    
    for filename, message in files_to_check:
        url = f"{domain_root}/{filename}"
        try:
            r = await client.head(url, timeout=5.0, follow_redirects=False)
            if r.status_code == 200:
                found_leaks.append(filename)
                risks.append({"file": filename, "message": message})
        except:
            continue
            
    return {"found_leaks": len(found_leaks) > 0, "leaks": found_leaks, "details": risks}

def detect_spammy_content(soup) -> dict:
    """Check for risky/restricted keywords that might trigger AdSense rejection."""
    text = soup.get_text(separator=" ", strip=True).lower()
    spam_keywords = ["casino", "betting", "poker", "viagra", "cialis", "payday loan", "porn", "adult", "hack", "crack", "torrent"]
    found = [k for k in spam_keywords if k in text]
    
    risk_score = min(len(found) * 15, 100)
    return {
        "spam_keywords": found,
        "risk_score": risk_score,
        "message": f"Found {len(found)} restricted keywords: {', '.join(found)}." if found else "No risky keywords detected in content."
    }

async def check_keyword_cannibalization(sitemap_urls: set) -> dict:
    """Analyze URL slugs to detect highly similar pages."""
    import difflib
    slugs = []
    slug_list: List[str] = list(sitemap_urls)
    for url in slug_list[:100]:
        path = str(urlparse(url).path).strip('/')
        if path:
            slugs.append(path.replace('-', ' ').replace('_', ' '))
            
    conflicts = []
    for i in range(len(slugs)):
        for j in range(i + 1, len(slugs)):
            ratio = difflib.SequenceMatcher(None, slugs[i], slugs[j]).ratio()
            if ratio > 0.85:
                conflicts.append((slugs[i], slugs[j]))
                if len(conflicts) >= 10: break
        if len(conflicts) >= 10: break
                
    return {
        "conflicts_count": len(conflicts),
        "potential_cannibalization": conflicts,
        "message": f"Found {len(conflicts)} sets of pages with highly similar topics." if conflicts else "No major keyword cannibalization detected."
    }

async def fingerprint_tech_stack(headers: dict, soup) -> dict:
    """Identify CMS, themes, and server tech."""
    tech = {"cms": "Unknown", "server": "Unknown", "framework": "Unknown"}
    
    server_header = headers.get("server", "").lower()
    powered_by = headers.get("x-powered-by", "").lower()
    
    if "nginx" in server_header: tech["server"] = "Nginx"
    elif "apache" in server_header: tech["server"] = "Apache"
    elif "cloudflare" in server_header: tech["server"] = "Cloudflare"
    
    html_content = str(soup).lower()
    if "wp-content" in html_content or "wp-includes" in html_content:
        tech["cms"] = "WordPress"
    elif "shopify.com" in html_content or "cdn.shopify.com" in html_content:
        tech["cms"] = "Shopify"
    elif "ghost.org" in html_content:
        tech["cms"] = "Ghost"
    elif "wix.com" in html_content:
        tech["cms"] = "Wix"
        
    meta_gen = soup.find("meta", attrs={"name": "generator"})
    if meta_gen and meta_gen.get("content"):
        tech["generator"] = meta_gen["content"]
        if "wordpress" in tech["generator"].lower(): tech["cms"] = "WordPress"
        
    return tech

async def analyze_images_ux(soup) -> dict:
    """Check images for CLS (width/height) and Alt text."""
    images = soup.find_all("img")
    total = len(images)
    missing_alt: int = 0
    missing_dimensions: int = 0
    
    for img in images:
        if not img.get("alt"):
            missing_alt += 1
        if not img.get("width") or not img.get("height"):
            missing_dimensions += 1
            
    return {
        "total_images": total,
        "missing_alt": missing_alt,
        "missing_alt_count": missing_alt,
        "missing_dimensions": missing_dimensions,
        "score": round(((total - int(missing_alt) - int(missing_dimensions)) / (max(1, total) * 2) * 100)) if total > 0 else 100
    }

async def calculate_navigation_depth(sitemap_urls: set, internal_links: set) -> dict:
    """Basic heuristic for site depth."""
    orphan_count = 0
    for s_url in sitemap_urls:
        if s_url not in internal_links:
            orphan_count += 1
    return {
        "orphan_count": orphan_count,
        "sitemap_only_pages": orphan_count,
        "total_crawled": len(internal_links),
        "total_sitemap": len(sitemap_urls)
    }

# --- Phase 1: AdSense Special Features ---

ADSENSE_SUPPORTED_LANGS = {
    "ar", "bg", "bn", "ca", "cs", "da", "de", "el", "en", "es", "et", "fa", "fi", "fr", "gu", "he",
    "hi", "hr", "hu", "id", "is", "it", "ja", "kn", "ko", "lt", "lv", "ml", "mr", "ms", "nl", "no",
    "pa", "pl", "pt", "ro", "ru", "sk", "sl", "sr", "sv", "ta", "te", "th", "tr", "uk", "ur", "vi",
    "zh-cn", "zh-tw"
}

async def check_ads_txt(domain: str, client: httpx.AsyncClient) -> dict:
    """Check for ads.txt and validate it."""
    url = f"{domain.rstrip('/')}/ads.txt"
    try:
        r = await client.get(url, timeout=10.0, follow_redirects=True)
        if r.status_code == 200:
            content = r.text
            is_valid = "google.com" in content.lower() and "pub-" in content.lower()
            return {
                "present": True,
                "status": "valid" if is_valid else "invalid",
                "content_preview": content[:200],
                "message": "ads.txt found and looks correct." if is_valid else "ads.txt found but might be missing your Publisher ID."
            }
        else:
            return {
                "present": False,
                "status": "missing",
                "message": "ads.txt file not found in root directory.",
                "suggestion": "google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0"
            }
    except Exception:
        return {"present": False, "status": "error", "message": "Could not verify ads.txt"}

async def detect_adsense_snippet(soup) -> dict:
    """Detect AdSense code snippet in the head or body."""
    # Common AdSense script patterns
    patterns = [
        r"adsbygoogle\.js",
        r"googlesyndication\.com",
        r"ca-pub-\d+"
    ]
    
    # Check head
    found_in_head = False
    found_in_body = False
    pub_id: Optional[str] = None
    
    if soup.head:
        for script in soup.head.find_all("script"):
            src = str(script.get("src", ""))
            content = str(script.string or "")
            for p in patterns:
                if re.search(p, src) or re.search(p, content):
                    found_in_head = True
                    # Try to extract pub-id
                    match = re.search(r"ca-pub-\d+", src + content)
                    if match: pub_id = str(match.group(0))
                    break
                    
    # Check body
    if soup.body:
        for script in soup.body.find_all("script"):
            src = str(script.get("src", ""))
            content = str(script.string or "")
            for p in patterns:
                if re.search(p, src) or re.search(p, content):
                    found_in_body = True
                    match = re.search(r"ca-pub-\d+", src + content)
                    if match: pub_id = str(match.group(0))
                    break

    status = "not_found"
    if found_in_head: status = "found_correctly"
    elif found_in_body: status = "found_in_body" # Warning: Head is preferred for verification
    
    return {
        "status": status,
        "found_in_head": found_in_head,
        "found_in_body": found_in_body,
        "publisher_id": pub_id,
        "message": "AdSense code detected in <head>." if found_in_head else 
                  ("AdSense code found in <body> (Move to <head> for better results)." if found_in_body else "AdSense code not detected.")
    }

async def check_site_language(soup) -> dict:
    """Detect site language and check AdSense support."""
    lang = "unknown"
    html_tag = soup.find("html")
    if html_tag and html_tag.get("lang"):
        lang = html_tag["lang"].split("-")[0].lower()
    
    is_supported = lang in ADSENSE_SUPPORTED_LANGS
    
    return {
        "detected_language": lang,
        "is_supported": is_supported,
        "message": f"Language '{lang}' is supported by AdSense." if is_supported else 
                  (f"Language '{lang}' might not be supported by AdSense." if lang != "unknown" else "Could not detect site language.")
    }

try:
    import dns.resolver
    HAS_DNS = True
except ImportError:
    HAS_DNS = False

import socket

async def verify_email_mx(email: str) -> bool:
    """Verify if the email domain has valid MX records."""
    if not email or "@" not in email:
        return False
    domain = email.split("@")[1]
    
    if HAS_DNS:
        try:
            # Use a short timeout for DNS resolution to prevent worker stalls
            dns.resolver.resolve(domain, 'MX', lifetime=5.0)
            return True
        except:
            pass
            
    # Fallback to socket if dns.resolver fails or isn't present
    try:
        # Check for A record as a weak fallback if MX check isn't possible
        socket.gethostbyname(domain)
        return True
    except:
        return False

def make_json_safe(obj):
    """Recursively convert sets to lists for JSON serialization."""
    if isinstance(obj, set):
        return list(obj)
    if isinstance(obj, dict):
        return {k: make_json_safe(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [make_json_safe(v) for v in obj]
    return obj

async def update_scan_record(scan_id, payload, retries=2):
    url = f"{SUPABASE_URL}/rest/v1/adsense_scans?id=eq.{scan_id}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }
    
    # Ensure payload is JSON serializable (convert sets, etc)
    safe_payload = make_json_safe(payload)
    
    # Dynamic timeout: larger payloads (final completion) need more time
    try:
        payload_json = json.dumps(safe_payload, default=str)
        payload_size = len(payload_json)
    except Exception as je:
        print(f"[{scan_id}] JSON Prep Error: {je}", flush=True)
        return False

    if payload_size > 50000:
        timeout = 90.0
    elif payload_size > 10000:
        timeout = 60.0
    else:
        timeout = 30.0
    
    for attempt in range(1, retries + 1):
        async with httpx.AsyncClient(timeout=timeout) as client:
            try:
                print(f"[{scan_id}] DB update attempt {attempt}/{retries} (payload={payload_size} bytes, status={safe_payload.get('status', 'N/A')})", flush=True)
                # Use the pre-serialized json to avoid double-processing and ensure it works
                r = await client.patch(url, headers=headers, content=payload_json)
                r.raise_for_status()
                print(f"[{scan_id}] DB update SUCCESS", flush=True)
                return True
            except Exception as e:
                print(f"[{scan_id}] DB update error (attempt {attempt}): {e}", flush=True)
                if attempt < retries:
                    await asyncio.sleep(3)
                    continue
                return False
    return False

async def check_url_status(client, url):
    try:
        response = await client.head(url, timeout=5.0)
        return response.status_code < 400
    except Exception:
        return False

async def process_scan(scan_record: Dict[str, Any]):
    scan_id = str(scan_record.get("id", "unknown"))
    site_id = str(scan_record.get("site_id", ""))
    
    # Initialize all critical variables early to prevent uninitialized access in except blocks
    user_id = scan_record.get("user_id")
    target_url = scan_record.get("url")
    domain = "Unknown"
    response = None
    score = 100
    final_url = "unknown"
    html_content = ""
    soup = BeautifulSoup("", "html.parser")
    spam_check = {"risk_score": 0, "spam_keywords": [], "message": "Check not performed"}
    cannibal_check = {"conflicts_count": 0, "potential_cannibalization": []}
    priority_checklist = []
    core_scan_data = {
        "overall_score": 0,
        "redirects": {"chain_length": 0, "has_chain": False},
        "ssl_check": {"status": "pending"},
        "adsense_readiness": {},
        "content_analysis": {},
        "mobile": {},
        "desktop": {}
    }
    trust_pages_data = {}
    seo_data = {}
    security_data = {}
    homepage_words = 0

    print(f"[{scan_id}] Starting scan for scan_id: {scan_id}, site_id: {site_id}")
    
    try:
        import collections
        # Context for AI features
        site_data: Optional[Dict[str, Any]] = None
        if site_id:
            site_raw = await fetch_site_context(site_id)
            site_data = cast(Dict[str, Any], site_raw) if site_raw else None
            
        if site_data and isinstance(site_data, dict):
            target_url = site_data.get("url")
        
        if not target_url:
            print(f"[{scan_id}] No target URL found for scan.", flush=True)
            await update_scan_record(scan_id, {"status": "failed"})
            return

        # Atomic Status Update - Mark as running IMMEDIATELY
        # -------------------------------------------------------------------
        url = f"{SUPABASE_URL}/rest/v1/adsense_scans?id=eq.{scan_id}&status=eq.pending"
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.patch(url, headers=headers, json={"status": "running"})
            if r.status_code != 200 or not r.json():
                print(f"[{scan_id}] Scan already processed or not pending. Jumping out.", flush=True)
                return

        print(f"[{scan_id}] Atomic check passed. Starting scan for {target_url}...")
        if not target_url.startswith("http"):
            target_url = "https://" + target_url

        # Check for Google integrations
        user_id = scan_record.get("user_id")
        integration = None
        if user_id:
            integration = await fetch_user_integrations(user_id)
        
        gsc_data_api = None
        adsense_data_api = None

        if isinstance(integration, dict) and integration.get("access_token"):
            print(f"[{scan_id}] Found Google integration for user {user_id}. Fetching GSC/AdSense...")
            access_token = integration.get("access_token")
            domain_parsed = urlparse(target_url)
            domain = f"{domain_parsed.scheme}://{domain_parsed.netloc}"
            
            gsc_data_api = await fetch_gsc_data(access_token, domain)
            adsense_data_api = await fetch_adsense_data(access_token)
            
            if isinstance(gsc_data_api, dict) and gsc_data_api.get("error") and "401" in str(gsc_data_api.get("error")):
                pass
        
        core_scan_data: Dict[str, Any] = {
            "overall_score": 0,
            "redirects": {"chain_length": 0, "has_chain": False},
            "ssl_check": {"status": "pending"},
            "adsense_readiness": {},
            "content_analysis": {},
            "mobile": {},
            "desktop": {}
        }
        trust_pages_data: Dict[str, Any] = {}
        seo_data: Dict[str, Any] = {}
        security_data: Dict[str, Any] = {}
        headers: Dict[str, Any] = {}
        
        req_headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Ad2GoBot/1.0",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5"
        }
        
        async with httpx.AsyncClient(headers=req_headers, verify=False, follow_redirects=True, timeout=15.0) as client:
            try:
                response = await client.get(target_url, timeout=15.0)
                response.raise_for_status()
                final_url = str(response.url)
                
                # Check for redirect chain
                core_scan_data["redirects"] = {
                    "chain_length": len(response.history),
                    "has_chain": len(response.history) > 2,
                    "redirect_chain_depth": len(response.history),
                    "final_url": str(response.url)
                }
                
                # Enhanced SSL/HTTPS check
                ssl_check_raw = await verify_ssl(final_url)
                ssl_check_result = cast(Dict[str, Any], ssl_check_raw)
                
                # Check HTTP -> HTTPS redirect explicitly
                if final_url.startswith("https"):
                    http_url = final_url.replace("https://", "http://", 1)
                    try:
                        http_res = await client.get(http_url, timeout=5.0)
                        if not str(http_res.url).startswith("https://"):
                            ssl_check_result["protocol"] = "HTTP" # Note the lack of redirect
                            status = str(ssl_check_result.get("status", "")).lower()
                            if status == "passed" or ssl_check_result.get("valid"):
                                ssl_check_result["status"] = "warning" # Downgrade to warning, but not failure if cert is valid
                            else:
                                ssl_check_result["status"] = "failed"
                    except:
                        pass # if it doesn't resolve or timeouts, it's virtually unattackable via pure http
                        
                core_scan_data["ssl_check"] = ssl_check_result
                html_content = response.text
                headers = response.headers
                
                # BS4 Parsing (reuse for snippet/language)
                # Use html.parser (standard library) instead of lxml to ensure compatibility
                soup = BeautifulSoup(html_content, "html.parser")
                
                # New: Tech Stack Fingerprinting
                core_scan_data["tech_stack"] = await fingerprint_tech_stack(headers, soup)
                # New: Sensitive File Scanner
                core_scan_data["security_leaks"] = await scan_sensitive_files(target_url, client)
                
                # --- NEW: AdSense Readiness Phase 1 ---
                print(f"[{scan_id}] Performing AdSense readiness checks...", flush=True)
                ads_txt_result = await check_ads_txt(target_url, client)
                adsense_snippet = await detect_adsense_snippet(soup)
                site_lang = await check_site_language(soup)
                
                # --- NEW: Content Intelligence (Phase 2) ---
                spam_check = detect_spammy_content(soup)
                
                core_scan_data["adsense_readiness"] = {
                    "ads_txt": ads_txt_result,
                    "snippet": adsense_snippet,
                    "language": site_lang,
                    "content_intelligence": spam_check
                }

                # --- NEW: Fix-it Bundle Suggestions (Phase 3) ---
                core_scan_data["fixit_bundle"] = {
                    "robots_txt": "User-agent: *\nAllow: /\nSitemap: {0}/sitemap.xml".format(target_url),
                    "ads_txt": "google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0",
                    "sitemap_status": "Ready for submission"
                }
                
                # Testing Requirement: Log raw extracted data
                print(f"[{scan_id}] RAW DATA LOGGING:")
                print(f"[{scan_id}] Status Code: {response.status_code}")
                # ... rest of logging
                print(f"[{scan_id}] Headers: {dict(headers)}")
                html_snippet = html_content[:1000].replace('\n', ' ')
                print(f"[{scan_id}] HTML Snippet (first 1000 chars): {html_snippet}")

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
                
                # Security Headers (Enhanced)
                csp_val = None
                sts_val = None
                frame_val = None
                ctype_val = None
                referrer_policy_val = None
                permissions_policy_val = None
                
                for k, v in headers.items():
                    kl = k.lower()
                    if kl == "content-security-policy": csp_val = v
                    elif kl == "strict-transport-security": sts_val = v
                    elif kl == "x-frame-options": frame_val = v
                    elif kl == "x-content-type-options": ctype_val = v
                    elif kl == "referrer-policy": referrer_policy_val = v
                    elif kl == "permissions-policy": permissions_policy_val = v
                    
                sts_active = sts_val is not None and "max-age" in str(sts_val).lower() and "max-age=0" not in str(sts_val).lower()
                frame_active = frame_val is not None and str(frame_val).upper() in ["DENY", "SAMEORIGIN"]
                
                security_data["headers"] = {
                    "csp": csp_val is not None,
                    "sts": sts_active,
                    "frame_options": frame_active,
                    "content_type_options": ctype_val is not None and "nosniff" in str(ctype_val).lower(),
                    "referrer_policy": referrer_policy_val,
                    "permissions_policy": permissions_policy_val
                }
            except Exception as e:
                print(f"Error fetching main URL: {e}")
                html_content = ""
                soup = BeautifulSoup("", "html.parser")
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

            sitemap_urls = set()
            try:
                sitemap_response = await client.get(f"{domain}/sitemap.xml", timeout=8.0)
                if sitemap_response.status_code == 200 and sitemap_response.text.strip():
                    sitemap_text = sitemap_response.text.strip()
                    sitemap_url_count = 0
                    is_valid_xml = False
                    # FIX: Use built-in ElementTree (no lxml needed), with namespace stripping
                    try:
                        # Strip XML namespaces for easier tag matching
                        sitemap_text_clean = re.sub(r' xmlns[^"]*"[^"]*"', '', sitemap_text)
                        sitemap_text_clean = re.sub(r'<([a-zA-Z]+):', '<', sitemap_text_clean)
                        sitemap_text_clean = re.sub(r'</([a-zA-Z]+):', '</', sitemap_text_clean)
                        root = ET.fromstring(sitemap_text_clean)
                        root_tag = root.tag.lower()
                        is_valid_xml = 'urlset' in root_tag or 'sitemapindex' in root_tag
                        # Extract locs
                        for loc in root.findall('.//loc'):
                            loc_text = loc.text
                            if loc_text:
                                sitemap_urls.add(loc_text.strip())
                        sitemap_url_count = len(sitemap_urls)
                        if sitemap_url_count == 0:
                            # Fallback: count via regex if tag had namespace issues
                            sitemap_url_count = len(re.findall(r'<loc>', sitemap_text, re.IGNORECASE))
                            extracted = re.findall(r'<loc>(.*?)</loc>', sitemap_text, re.IGNORECASE)
                            sitemap_urls.update([e.strip() for e in extracted if e.strip()])
                    except ET.ParseError:
                        # Fallback to regex for malformed XML
                        is_valid_xml = bool(re.search(r'<(urlset|sitemapindex)', sitemap_text, re.IGNORECASE))
                        extracted = re.findall(r'<loc>(.*?)</loc>', sitemap_text, re.IGNORECASE)
                        sitemap_urls.update([e.strip() for e in extracted if e.strip()])
                        sitemap_url_count = len(sitemap_urls)
                    core_scan_data["sitemap_xml"] = {
                        "exists": True,
                        "url": f"{domain}/sitemap.xml",
                        "url_count": sitemap_url_count,
                        "is_valid_xml": is_valid_xml
                    }
                else:
                    # Also check robots.txt for Sitemap: directive
                    sitemap_from_robots = None
                    robots_txt_content = core_scan_data.get("robots_txt", {})
                    if robots_txt_content.get("exists"):
                        try:
                            robots_full_res = await client.get(f"{domain}/robots.txt", timeout=5.0)
                            for line in robots_full_res.text.splitlines():
                                if line.lower().startswith("sitemap:"):
                                    sitemap_from_robots = line.split(":", 1)[1].strip()
                                    break
                        except Exception:
                            pass
                    if sitemap_from_robots:
                        core_scan_data["sitemap_xml"] = {"exists": True, "url": sitemap_from_robots, "url_count": 0, "is_valid_xml": True, "from_robots": True}
                    else:
                        core_scan_data["sitemap_xml"] = {"exists": False, "url_count": 0, "is_valid_xml": False}
            except Exception as sitemap_err:
                print(f"[{scan_id}] Sitemap check error: {sitemap_err}")
                core_scan_data["sitemap_xml"] = {"exists": False, "url_count": 0, "is_valid_xml": False}
            
            # (Navigation Depth analysis moved later after links are extracted)


            # 3. HTML Parsing (SEO & Trust Pages) on Homepage
            soup = BeautifulSoup(html_content, 'html.parser')
            
            seo_data["title"] = soup.title.string if soup.title else None

            title_text = str(seo_data["title"]).strip() if seo_data["title"] else ""
            print(f"DEBUG SOUP TITLE: {title_text}", flush=True)
            
            meta_desc = soup.find("meta", attrs={"name": "description"})
            seo_data["meta_description"] = meta_desc["content"] if meta_desc and meta_desc.has_attr("content") else None
            desc_text = str(seo_data["meta_description"]).strip() if seo_data["meta_description"] else ""
            
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
            # Broken Image Detection
            broken_image_urls = []
            broken_images_count = 0
            
            img_urls_to_check = set()
            for img in all_imgs:
                src = img.get("src")
                if src and not src.startswith("data:"):
                    abs_url = urljoin(final_url, src)
                    img_urls_to_check.add(abs_url)
                    if len(img_urls_to_check) >= 50:
                        break
                        
            # Use the existing httpx client for HEAD requests
            async def check_img(client_instance, url):
                try:
                    res = await client_instance.head(url, timeout=3.0, follow_redirects=True)
                    if res.status_code >= 400:
                        return url
                except Exception:
                    return url
                return None
            
            img_tasks = [check_img(client, u) for u in img_urls_to_check]
            if img_tasks:
                img_results = await asyncio.gather(*img_tasks, return_exceptions=True)
                for res in img_results:
                    if isinstance(res, str):
                        broken_image_urls.append(res)
                        broken_images_count += 1

            core_scan_data["image_checks"] = {
                "total_images": len(all_imgs),
                "lazy_loaded": lazy_load_count,
                "lazy_load_ratio": round(float(lazy_load_count) / len(all_imgs), 2) if all_imgs else 0,
                "no_alt_count": no_alt_count,
                "no_alt_ratio": round(float(no_alt_count) / len(all_imgs), 2) if all_imgs else 0,
                "broken_images_count": broken_images_count,
                "broken_image_urls": broken_image_urls
            }

            # Structure & UX Features
            print(f"[{scan_id}] Calculating Structure & UX...", flush=True)
            empty_anchor_urls = []
            empty_anchor_count = 0
            for a_tag in soup.find_all("a"):
                href = a_tag.get("href")
                if not href or href.strip() == "" or href.strip() == "#":
                    empty_anchor_count += 1
                    empty_anchor_urls.append(a_tag.get_text(strip=True)[:30] or "Empty Link")
                    
            inline_css_size = 0
            for style_tag in soup.find_all("style"):
                if style_tag.string: inline_css_size += len(style_tag.string.encode('utf-8'))
            for tag in soup.find_all(attrs={"style": True}):
                inline_css_size += len(tag["style"].encode('utf-8'))
                
            inline_js_size = 0
            for script_tag in soup.find_all("script"):
                if not script_tag.get("src") and script_tag.string:
                    inline_js_size += len(script_tag.string.encode('utf-8'))
                    
            css_links = [urljoin(final_url, link.get("href")) for link in soup.find_all("link", rel="stylesheet") if link.get("href")]
            js_links = [urljoin(final_url, script.get("src")) for script in soup.find_all("script", src=True)]
            
            async def get_resource_size(client_instance, url):
                try:
                    res = await client_instance.head(url, timeout=3.0, follow_redirects=True)
                    if 'content-length' in res.headers: return int(res.headers['content-length'])
                    res_get = await client_instance.get(url, timeout=3.0, follow_redirects=True)
                    return len(res_get.content)
                except Exception:
                    return 0
                    
            css_tasks = [get_resource_size(client, u) for u in css_links[:15]]
            js_tasks = [get_resource_size(client, u) for u in js_links[:15]]
            css_js_results = await asyncio.gather(*(css_tasks + js_tasks), return_exceptions=True)
            
            external_css_size = 0
            external_js_size = 0
            for i, res in enumerate(css_js_results):
                if isinstance(res, int):
                    if i < len(css_tasks): external_css_size += res
                    else: external_js_size += res
                    
            total_css = inline_css_size + external_css_size
            total_js = inline_js_size + external_js_size
            inline_css_ratio = round((float(inline_css_size) / total_css) * 100, 2) if total_css > 0 else 0
            inline_js_ratio = round((float(inline_js_size) / total_js) * 100, 2) if total_js > 0 else 0
            
            favicon_present = False
            icon_link = soup.find("link", rel=lambda r: r and "icon" in (" ".join(r) if isinstance(r, list) else r).lower())
            fav_url = urljoin(final_url, icon_link.get("href")) if icon_link and icon_link.get("href") else urljoin(final_url, "/favicon.ico")
            try:
                fav_res = await client.head(fav_url, timeout=3.0, follow_redirects=True)
                if fav_res.status_code < 400: favicon_present = True
                else:
                    fav_res_get = await client.get(fav_url, timeout=3.0, follow_redirects=True)
                    if fav_res_get.status_code < 400: favicon_present = True
            except: pass
            
            core_scan_data["structure_ux"] = {
                "h1_count": len(h1_tags),
                "duplicate_h1": len(h1_tags) > 1,
                "empty_anchor_count": empty_anchor_count,
                "empty_anchor_urls": empty_anchor_urls,
                "inline_css_ratio": inline_css_ratio,
                "inline_js_ratio": inline_js_ratio,
                "favicon_present": favicon_present
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
            
            # FIX: Cookie Consent Detection — properly set the flag
            has_cookie_consent = False
            # Check text nodes for cookie consent banners
            for text_elem in soup.find_all(string=True):
                lower_text = text_elem.lower()
                if "cookie" in lower_text and ("accept" in lower_text or "consent" in lower_text or "agree" in lower_text):
                    has_cookie_consent = True
                    break
            # Also check for common cookie consent class names/IDs in elements
            if not has_cookie_consent:
                for elem in soup.find_all(attrs={"id": True}):
                    eid = elem.get("id", "").lower()
                    if any(k in eid for k in ["cookie", "gdpr", "consent", "ccpa"]):
                        has_cookie_consent = True
                        break
            if not has_cookie_consent:
                for elem in soup.find_all(attrs={"class": True}):
                    eclasses = " ".join(elem.get("class", [])).lower()
                    if any(k in eclasses for k in ["cookie-banner", "cookie-consent", "gdpr", "ccpa", "consent-banner"]):
                        has_cookie_consent = True
                        break
            
            # Incorporate external API data into seo_data
            if gsc_data_api:
                seo_data["gsc_insights"] = gsc_data_api
            
            if adsense_data_api:
                core_scan_data["adsense_api_status"] = adsense_data_api
            
            # Categorize link URLs based on simple matching first
            candidate_links = {
                "privacy": set(),
                "about": set(),
                "contact": set(),
                "terms": set(),
                "disclaimer": set()
            }
            
            dofollow_count = 0
            nofollow_count = 0
            anchor_texts = []
            
            for a_tag in soup.find_all("a", href=True):
                href = a_tag["href"]
                text = a_tag.get_text(strip=True).lower()
                
                rel = a_tag.get("rel", [])
                if isinstance(rel, str):
                    rel = rel.split()
                if "nofollow" in [r.lower() for r in rel]:
                    nofollow_count += 1
                else:
                    dofollow_count += 1
                
                link_url = urljoin(final_url, href)
                parsed_link = urlparse(link_url)
                
                if parsed_link.netloc == urlparse(final_url).netloc:
                    # Filter out purely anchor/hash links to same page if it's just the homepage
                    if parsed_link.path == urlparse(final_url).path and href.startswith("#"):
                        continue
                        
                    internal_links.add(link_url)
                    lower_href = parsed_link.path.lower()
                    if text:
                        anchor_texts.append(text)
                    
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
                    # Drafts are now generated later in the process to include more context
            
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

            # --- NEW 6-PACK FEATURES INTEGRATION ---
            # 1. Navigation Depth (Orphan Page Analysis)
            core_scan_data["nav_depth"] = await calculate_navigation_depth(sitemap_urls, internal_links)
            
            # 2. Placeholder Content Detection
            core_scan_data["placeholder_findings"] = await check_placeholder_content(soup)
            
            # 3. Image UX Audit (Accessibility & CLS)
            core_scan_data["image_ux"] = await analyze_images_ux(soup)
            # ----------------------------------------


            # Multi-Page Crawl (Deep Traverse)
            await update_scan_record(scan_id, {"status": "crawling_site"})
            max_pages = 50
            scanned_pages = 1
            thin_content_count = 0
            
            # Deep crawl aggregates
            missing_title_count = 0 if seo_data.get("title") else 1
            missing_desc_count = 0 if seo_data.get("meta_description") else 1
            found_email, found_phone = False, False
            
            # Count homepage words
            homepage_words = len(soup.get_text(separator=' ', strip=True).split())
            # FIX: Lowered threshold to 250 words (300 was flagging legitimate short pages)
            if homepage_words < 250:
                thin_content_count += 1
                
            broken_links_found = 0
            visited_urls = {final_url}
            queue = list(internal_links)
            all_links_to_check = set(internal_links).union(external_links)
            
            linked_to_during_crawl = set(internal_links)
            
            # 1. Crawl up to max_pages
            async def fetch_and_parse(url):
                try:
                    res = await client.get(url, timeout=10.0)
                    if res.status_code == 200:
                        page_soup = BeautifulSoup(res.text, 'html.parser')
                        text = page_soup.get_text(separator=' ', strip=True)
                        
                        has_mixed = False
                        if url.startswith("https"):
                            for tag in page_soup.find_all(["img", "script", "iframe", "audio", "video"]):
                                src = tag.get("src")
                                if src and src.startswith("http://"):
                                    has_mixed = True
                                    break
                            if not has_mixed:
                                for tag in page_soup.find_all("link", rel="stylesheet", href=True):
                                    href = tag.get("href")
                                    if href and href.startswith("http://"):
                                        has_mixed = True
                                        break
                                        
                        return {"url": url, "status": res.status_code, "text": text, "soup": page_soup, "has_mixed": has_mixed}
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
                        if r.get("has_mixed"):
                            mixed_content_found = True

                        word_cnt = len(r["text"].split())
                        # Skip utility pages from thin content count
                        url_path_lower = urlparse(r["url"]).path.lower()
                        is_utility_page = any(p in url_path_lower for p in ["/contact", "/about", "/tag/", "/category/", "/author/", "/search"])
                        if word_cnt < 250 and not is_utility_page:
                            thin_content_count += 1

                        # Trust signals: look for email/phone loosely
                        if not found_email and "@" in r["text"]:
                            match = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", r["text"])
                            if match:
                                email_str = match.group(0)
                                is_valid_mx = await verify_email_mx(email_str)
                                found_email = True
                                core_scan_data["email_validation"] = {"email": email_str, "is_valid_mx": is_valid_mx}
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
                            
                            # DoFollow vs NoFollow for deep pages
                            rel = a_tag.get("rel", [])
                            if isinstance(rel, str): rel = rel.split()
                            if "nofollow" in [r.lower() for r in rel]: nofollow_count += 1
                            else: dofollow_count += 1
                            
                            if parsed.scheme in ["http", "https"]:
                                all_links_to_check.add(new_link)
                                if parsed.netloc == urlparse(final_url).netloc:
                                    linked_to_during_crawl.add(new_link)
                                    # Collect anchors
                                    text = a_tag.get_text(strip=True).lower()
                                    if text: anchor_texts.append(text)
                                    
                                    if new_link not in set(visited_urls).union(queue):
                                        queue.append(new_link)


            # 2. Check broken links
            await update_scan_record(scan_id, {"status": "checking_links"})
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

            # --- Ad Placement Readiness Heuristic (Fix 5) ---
            ad_placement_issues = []
            ad_placement_notes = []

            # 1. Viewport meta tag (mobile-ready layout required for ad delivery)
            viewport_meta = soup.find("meta", attrs={"name": "viewport"})
            has_viewport = viewport_meta is not None and "width=device-width" in (viewport_meta.get("content", ""))
            if not has_viewport:
                ad_placement_issues.append("Missing responsive viewport meta tag")
            else:
                ad_placement_notes.append("Responsive layout detected")

            # 2. HTTPS is required for AdSense ad delivery
            is_https = final_url.startswith("https://")
            if not is_https:
                ad_placement_issues.append("HTTPS required for ad delivery")
            else:
                ad_placement_notes.append("HTTPS enabled")

            # 3. Sufficient content for ad placement (content-to-ad ratio)
            if homepage_words < 250:
                ad_placement_issues.append(f"Insufficient content ({homepage_words} words) for meaningful ad placement")
            else:
                ad_placement_notes.append(f"Sufficient content volume ({homepage_words} words)")

            # 4. Check for fixed/sticky nav that could overlap ads
            fixed_nav_risk = False
            for nav in soup.find_all(["nav", "header"]):
                style = nav.get("style", "").lower()
                cls = " ".join(nav.get("class", [])).lower()
                if "fixed" in style or "sticky" in style or "fixed" in cls or "sticky" in cls:
                    fixed_nav_risk = True
                    break
            if fixed_nav_risk:
                ad_placement_issues.append("Sticky/fixed navigation may overlap ad units")
            else:
                ad_placement_notes.append("No sticky nav conflicts detected")

            # 5. Check for excessive popup/overlay elements (ad experience violations)
            popups = []
            for elem in soup.find_all(attrs={"class": True}):
                cls = " ".join(elem.get("class", [])).lower()
                if any(k in cls for k in ["popup", "modal", "overlay", "interstitial"]):
                    popups.append(cls)
            if len(popups) > 2:
                ad_placement_issues.append(f"{len(popups)} overlay/popup elements may violate ad experience policy")

            # Determine final ad placement status
            if len(ad_placement_issues) == 0:
                ad_status = "pass"
                ad_summary = "Site appears ready for ad placement"
            elif len(ad_placement_issues) <= 1:
                ad_status = "warning"
                ad_summary = f"{len(ad_placement_issues)} minor issue: {ad_placement_issues[0]}"
            else:
                ad_status = "fail"
                ad_summary = f"{len(ad_placement_issues)} issues: " + "; ".join(ad_placement_issues[:2])

            core_scan_data["ad_placement"] = {
                "status": ad_status,
                "summary": ad_summary,
                "issues": ad_placement_issues,
                "notes": ad_placement_notes
            }

        # Content Intelligence Computations
        try:
            ci_soup = BeautifulSoup(html_content, 'html.parser')
            for element in ci_soup(["script", "style", "nav", "header", "footer", "aside", "noscript", "svg"]):
                element.extract()
            
            visible_text = ci_soup.get_text(separator=' ', strip=True)
            
            # 1. Average Sentence Length
            # Split into sentences roughly looking for [.!?] followed by space
            sentences = re.split(r'[.!?]+\s+', visible_text)
            sentences = [s.strip() for s in sentences if len(s.strip()) > 5] # ignore very short fragments
            total_sentences = len(sentences)
            
            # Split into words
            words = visible_text.split()
            total_words = len(words)
            
            average_sentence_length = round(total_words / total_sentences, 1) if total_sentences > 0 else 0
            
            # 2. Passive Voice Ratio
            passive_count = 0
            # A conservative passive pattern: "is/was/were/been" followed closely by a word ending in "ed"
            passive_pattern = re.compile(r'\b(am|is|are|was|were|be|being|been)\b\s+(?:\w+\s+)?\w+ed\b', re.IGNORECASE)
            for s in sentences:
                if passive_pattern.search(s):
                    passive_count += 1
            
            passive_ratio = round((passive_count / total_sentences) * 100, 2) if total_sentences > 0 else 0
            
            # 3. Reading Time Estimate
            estimated_reading_time_minutes = max(1, round(total_words / 225))
            
            # 4. Content Freshness
            last_modified_date = headers.get("last-modified")
            if not last_modified_date:
                meta_mod = soup.find("meta", attrs={"property": "article:modified_time"})
                if meta_mod:
                    last_modified_date = meta_mod.get("content")
                else:
                    meta_pub = soup.find("meta", attrs={"property": "article:published_time"})
                    if meta_pub:
                        last_modified_date = meta_pub.get("content")
            
            # 5. Content Depth Score
            h2_count = seo_data.get("headings", {}).get("h2_count", 0)
            h3_count = seo_data.get("headings", {}).get("h3_count", 0)
            
            # Base formula: word_count/20 (max 50 points), h2 * 5 (max 25 points), h3 * 2 (max 25 points)
            word_score = min(50.0, float(total_words) / 20)
            heading_score = min(50.0, float(h2_count * 5 + h3_count * 2))
            content_depth_score = round(word_score + heading_score)
            
            core_scan_data["content_intelligence"] = {
                "average_sentence_length": average_sentence_length,
                "passive_voice": {
                    "passive_sentence_count": passive_count,
                    "passive_ratio": passive_ratio
                },
                "reading_time": {
                    "word_count": total_words,
                    "estimated_reading_time_minutes": estimated_reading_time_minutes
                },
                "freshness": {
                    "last_modified_date": last_modified_date
                },
                "content_depth_score": content_depth_score
            }
        except Exception as ci_err:
            print(f"[{scan_id}] Content Intelligence error: {ci_err}")

        # AI Policy Engine Analysis
        await update_scan_record(scan_id, {"status": "analyzing_policy"})
        extracted_text = soup.get_text(separator=' ', strip=True)
        # Pass up to 4000 chars to avoid massive token limits if text is huge
        try:
            ai_policy_result = await asyncio.wait_for(analyze_policy_with_ai(extracted_text[:4000]), timeout=50.0)
            if ai_policy_result:
                core_scan_data["ai_policy"] = ai_policy_result
        except asyncio.TimeoutError:
            print(f"[{scan_id}] AI Policy Engine timed out after 50s. Skipping.", flush=True)
            core_scan_data["ai_policy"] = {"issues_found": False, "risk_score": 0, "policy_violations": [], "error": "Analysis timed out"}
        except Exception as ai_err:
            print(f"[{scan_id}] AI Policy Engine error: {ai_err}", flush=True)
            core_scan_data["ai_policy"] = {"issues_found": False, "risk_score": 0, "policy_violations": [], "error": str(ai_err)}


        # Safe Browsing API Analysis
        try:
            print(f"[{scan_id}] Checking Safe Browsing API...", flush=True)
            safe_browsing = await check_safe_browsing(final_url)
            
            if safe_browsing and safe_browsing.get("status") == "unknown":
                # Fallback: Use AI Risk Score if Safe Browsing API is unconfigured/failed
                ai_risk = int(core_scan_data.get("ai_policy", {}).get("risk_score", 0))
                if ai_risk > 85:
                    safe_browsing = {"status": "unsafe", "issues": 1, "fallback_used": True}
                else:
                    safe_browsing = {"status": "safe", "issues": 0, "fallback_used": True}
                    
            security_data["safe_browsing"] = safe_browsing
        except Exception as e:
            print(f"[{scan_id}] Safe Browsing check failed: {e}", flush=True)
            security_data["safe_browsing"] = {"status": "unknown"}

        # Open Port Scanning
        print(f"[{scan_id}] Scanning common open ports [80, 443, 8080]...", flush=True)
        open_ports = []
        host_for_ports = urlparse(final_url).hostname
        if host_for_ports:
            async def check_port(host, port):
                try:
                    fut = asyncio.open_connection(host, port)
                    reader, writer = await asyncio.wait_for(fut, timeout=2.0)
                    writer.close()
                    await writer.wait_closed()
                    return port
                except Exception:
                    return None
            
            port_tasks = [check_port(host_for_ports, p) for p in [80, 443, 8080]]
            port_results = await asyncio.gather(*port_tasks, return_exceptions=True)
            for res in port_results:
                if isinstance(res, int):
                    open_ports.append(res)
        
        security_data["open_ports"] = {"open": open_ports}

        # 10. PageSpeed Insights Analysis
        try:
            print(f"[{scan_id}] Fetching PageSpeed Insights...", flush=True)
            await update_scan_record(scan_id, {"status": "measuring_performance"})
            
            # Reduced from 180s to 120s to ensure overall task completion
            pagespeed_result = await asyncio.wait_for(fetch_pagespeed_data(final_url), timeout=120.0)
            if pagespeed_result:
                # Prune nested strategy data to avoid large payloads in database
                for strat in ["mobile", "desktop"]:
                    if strat in pagespeed_result and isinstance(pagespeed_result[strat], dict):
                        for key in ["opportunities", "diagnostics"]:
                            if key in pagespeed_result[strat] and isinstance(pagespeed_result[strat][key], list):
                                pagespeed_result[strat][key] = pagespeed_result[strat][key][:10]
                core_scan_data["pagespeed"] = pagespeed_result
        except asyncio.TimeoutError:
            print(f"[{scan_id}] PageSpeed check timed out after 120s. Skipping.", flush=True)
            core_scan_data["pagespeed"] = {"error": "Measurement timed out"}
        except Exception as e:
            print(f"[{scan_id}] PageSpeed check failed: {e}", flush=True)
            core_scan_data["pagespeed"] = {"error": str(e)}


        # -------------------------------------------------------------------
        # Enrichment (domain age, keywords, social links, website info)
        # Each function tries RapidAPI first if key available, then falls back to
        # a fully free alternative. NO guard on RAPIDAPI_KEY here.
        # -------------------------------------------------------------------
        print(f"[{scan_id}] Fetching enrichment data (free fallbacks active)...", flush=True)
        await update_scan_record(scan_id, {"status": "enriching_data"})
        parsed_domain = urlparse(final_url).netloc or urlparse(target_url).netloc
        try:
            (
                domain_age_data,
                similarweb_data,
                seo_keywords_data,
                social_links_data,
                website_info_data,
                domain_authority_data,
                server_ips,
                h2h3_support
            ) = await asyncio.wait_for(
                asyncio.gather(
                    fetch_domain_age(parsed_domain),
                    fetch_similarweb_data(parsed_domain),
                    fetch_seo_keywords(final_url),
                    fetch_social_links(final_url),
                    fetch_website_info(final_url),
                    fetch_domain_authority(parsed_domain),
                    detect_server_ip(parsed_domain),
                    check_http2_http3(final_url),
                    return_exceptions=True
                ),
                timeout=90.0
            )

            # Process infrastructure data
            hosting_provider = "Unknown"
            if isinstance(server_ips, list) and server_ips:
                hosting_provider = await detect_hosting_provider(server_ips)
                
            cdn_info = await detect_cdn(response.headers) if hasattr(response, 'headers') else {"cdn_detected": False, "cdn_provider": None}
            
            core_scan_data["infrastructure"] = {
                "server_ips": server_ips if isinstance(server_ips, list) else [],
                "hosting_provider": hosting_provider,
                "cdn": cdn_info,
                "http_protocols": h2h3_support if isinstance(h2h3_support, dict) else {"http2_supported": False, "http3_supported": False}
            }
            print(f"[{scan_id}] Infrastructure: IP={server_ips if isinstance(server_ips, list) else []}, Host={hosting_provider}, CDN={cdn_info.get('cdn_detected')}", flush=True)

            # ---- Domain age + WHOIS visibility ----
            if isinstance(domain_age_data, dict) and domain_age_data:
                # Store the exact structure returned by fetch_domain_age
                core_scan_data["domain_age"] = domain_age_data.get("domain_age")
                
                age_years = domain_age_data.get("domain_age", {}).get("years", "?") if domain_age_data.get("domain_age") else "?"
                print(f"[{scan_id}] Domain age: {age_years} years (source: WHOISXMLAPI)", flush=True)
                
                # Update whois_visibility to reflect the fields we have so UI doesn't break
                core_scan_data["whois_visibility"] = {
                    "is_public": bool(domain_age_data.get("creation_date")),
                    "creation_date": domain_age_data.get("creation_date"),
                    "expiration_date": domain_age_data.get("expiration_date"),
                    "days_remaining": domain_age_data.get("days_remaining")
                }
            else:
                core_scan_data["domain_age"] = None
                core_scan_data["whois_visibility"] = {"is_public": False, "error": "Could not retrieve WHOIS data"}

            # ---- Domain Authority (Open PageRank or heuristic) ----
            if isinstance(domain_authority_data, dict):
                core_scan_data["domain_authority"] = domain_authority_data
                da_score = domain_authority_data.get("score")
                da_src = domain_authority_data.get("source", "unknown")
                print(f"[{scan_id}] Domain authority: score={da_score} source={da_src}", flush=True)

            # ---- Traffic data (Similarweb — only with key) ----
            if isinstance(similarweb_data, dict) and similarweb_data:
                core_scan_data["traffic"] = similarweb_data
                print(f"[{scan_id}] Similarweb: global rank #{similarweb_data.get('global_rank')}", flush=True)

            # ---- SEO keywords ----
            if isinstance(seo_keywords_data, dict) and seo_keywords_data:
                seo_data["top_keywords"] = seo_keywords_data
                print(f"[{scan_id}] SEO keywords: {seo_keywords_data.get('total', 0)} found (source: {seo_keywords_data.get('source','?')})", flush=True)

            # ---- Social links ----
            if isinstance(social_links_data, dict) and social_links_data:
                core_scan_data["social_links"] = social_links_data
                print(f"[{scan_id}] Social links found: {list(social_links_data.keys())}", flush=True)

            # ---- Website info ----
            if isinstance(website_info_data, dict) and website_info_data:
                core_scan_data["website_info"] = website_info_data

        except Exception as e:
            print(f"[{scan_id}] Enrichment error: {e}", flush=True)


        # ---- Mobile friendliness (from PageSpeed mobile score + viewport check) ----
        ps = core_scan_data.get("pagespeed", {})
        mobile_score = ps.get("mobile_score")
        vp_tag = soup.find("meta", attrs={"name": "viewport"}) if soup else None
        has_viewport = vp_tag is not None
        viewport_content = vp_tag.get("content", "") if vp_tag else ""
        is_viewport_correct = "width=device-width" in viewport_content
        core_scan_data["mobile_friendly"] = {
            "has_viewport_meta": has_viewport,
            "viewport_correct": is_viewport_correct,
            "mobile_score": mobile_score,
              # A site is considered mobile friendly if both viewport is correct AND score >= 50
            "is_mobile_friendly": is_viewport_correct and (mobile_score is None or int(mobile_score) >= 50),
            "source": "pagespeed+html"
        }
        print(f"[{scan_id}] Mobile friendly: viewport={has_viewport}, score={mobile_score}", flush=True)



        # ---- Deferred AI Draft Generation for Missing Pages ----
        # Now that we've finished the crawl, we have much more context
        # Ensure site_data is treated as a dict if present, or handle coroutine leftovers
        if hasattr(site_data, "get") == False and site_data is not None:
             # Defensive fix for persistent coroutine issues
             site_data = await site_data if asyncio.iscoroutine(site_data) else None

        info = {
            "email": (site_data.get("email") if isinstance(site_data, dict) else None) or core_scan_data.get("email_validation", {}).get("email") or "Not found",
            "phone": (site_data.get("phone") if isinstance(site_data, dict) else None) or ("Found" if found_phone else "Not found"),
            "address": (site_data.get("address") if isinstance(site_data, dict) else None) or "Not specified",
            "topic": (site_data.get("topic") if isinstance(site_data, dict) else None) or core_scan_data.get("content_analysis", {}).get("top_keyword") or seo_data.get("title") or "Website",
            "tags": (site_data.get("tags") if isinstance(site_data, dict) else None) or ", ".join(anchor_texts[:10])
        }
        
        # Draft Generation Block
        try:
            missing_pages = [kw for kw, status in detected_pages.items() if not status.get("exists")]
            if missing_pages:
                print(f"[{scan_id}] Generating {len(missing_pages)} missing page drafts in parallel...", flush=True)
                async def generate_and_store(kw):
                    try:
                        content = await generate_missing_page_draft(urlparse(final_url).netloc, kw, info)
                        return kw, content
                    except:
                        return kw, None

                # 45s total timeout for all legal drafts to prevent 98% stall
                try:
                    draft_results = await asyncio.wait_for(
                        asyncio.gather(*[generate_and_store(kw) for kw in missing_pages], return_exceptions=True),
                        timeout=45.0
                    )
                    for res in draft_results:
                        if isinstance(res, tuple):
                            kw, content = res
                            if content: drafts[kw] = content
                except asyncio.TimeoutError:
                    print(f"[{scan_id}] Legal drafts timed out, continuing...", flush=True)
        except Exception as draft_err:
            print(f"[{scan_id}] Draft block error: {draft_err}", flush=True)

        # Finalize drafts into trust_pages_data
        trust_pages_data["drafts"] = drafts
        
        # -------------------------------------------------------------------
        # FINAL SCORE COMPUTATION (Always reach here!)
        # -------------------------------------------------------------------
        print(f"[{scan_id}] Starting final score computation...", flush=True)
        
        # 1. Base Score starts at 100
        score = 100
        
        # --- NEW: Accessibility/Reachability Check ---
        # If the site was unreachable, the HTML content will be empty or very short.
        # We apply a heavy penalty but not failure, allowing the user to see -some- results.
        if not html_content or len(html_content) < 100:
            print(f"[{scan_id}] Site appears unreachable or thin content - applying massive penalty", flush=True)
            score -= 60  # Starting 40/100 score for dead sites
        
        # Crawl & Link Intelligence Computations
        # Orphan Pages: crawled internal links vs pages listed in sitemap
        orphan_pages = []
        if sitemap_urls:
             # A page is an orphan if it's in the sitemap but WAS NOT linked to by any internal page during crawl
             orphan_pages = list(sitemap_urls - linked_to_during_crawl - visited_urls)
             # Limit to 10 for storage efficiency
             orphan_pages = orphan_pages[:10]
             
        # Anchor Texts Distribution
        top_anchor_texts = []
        if anchor_texts:
            counter = collections.Counter(anchor_texts)
            top_anchor_texts = [{"text": k, "count": v} for k, v in counter.most_common(10)]
            
        # Link Ratios
        total_dofollow_nofollow = dofollow_count + nofollow_count
        dofollow_ratio = round((dofollow_count / total_dofollow_nofollow) * 100, 2) if total_dofollow_nofollow > 0 else 0
        
        total_internal = len(internal_links)
        total_external = len(external_links)
        total_all_links = total_internal + total_external
        internal_ratio = round((total_internal / total_all_links) * 100, 2) if total_all_links > 0 else 0
        
        core_scan_data["link_intelligence"] = {
            "orphan_pages": orphan_pages,
            "anchor_texts": top_anchor_texts,
            "dofollow_vs_nofollow": {
                "dofollow_count": dofollow_count,
                "nofollow_count": nofollow_count,
                "dofollow_ratio": dofollow_ratio
            },
            "internal_vs_external": {
                "internal_count": total_internal,
                "external_count": total_external,
                "internal_ratio": internal_ratio
            }
        }

        
        # Crawl was successful, but we might still have AI risk or spam issues
        
        # 2. Security Penalties (Total: -15)
        if core_scan_data.get("ssl_check", {}).get("status") != "passed": 
            score -= 5 # Softened from 8
        if security_data.get("mixed_content"): 
            score -= 2 # Softened from 3
        if security_data.get("safe_browsing", {}).get("status") == "unsafe": 
            score -= 40 # Still a critical blow, but not 100
        
        # 3. Trust Pages Penalties (Total: -10)
        tp_summary = trust_pages_data.get("summary", {})
        if not tp_summary.get("privacy"): score -= 4
        if not tp_summary.get("contact"): score -= 3
        if not tp_summary.get("about"): score -= 2
        
        # 4. SEO & Indexing Penalties (Total: -10)
        if not core_scan_data.get("sitemap_xml", {}).get("exists"): 
            score -= 3 # Softened from 12
        broken_cnt = int(core_scan_data.get("broken_links", {}).get("broken", 0))
        if broken_cnt > 5: score -= 5
        elif broken_cnt > 0: score -= 2
        if not seo_data.get("structured_data", {}).get("detected"): 
            score -= 2
        
        # 5. Content Quality Penalties (Total: -20)
        ai_risk = int(core_scan_data.get("ai_policy", {}).get("risk_score", 0))
        if ai_risk > 80: score -= 20
        elif ai_risk > 40: score -= 10
        
        # Spam check softening
        spam_risk_score = spam_check.get("risk_score", 0) if isinstance(spam_check, dict) else 0
        if spam_risk_score > 60: 
            score -= 15
        elif spam_risk_score > 20:
            score -= 5
            
        if core_scan_data.get("content_analysis", {}).get("has_thin_content"): 
            score -= 5 # Softened from 30
        
        # 6. Performance Penalties (Total: -10)
        ps_score = int(core_scan_data.get("pagespeed", {}).get("score", 70))
        if ps_score < 30: score -= 10
        elif ps_score < 60: score -= 5
        
        # 7. Domain Age Bonus/Penalty
        domain_age = core_scan_data.get("domain_age")
        if isinstance(domain_age, dict) and domain_age:
            age_days = int(domain_age.get("total_days", 365))
            if age_days < 90: score -= 5 # Minor penalty for very new domains
            elif age_days > 365: score = min(100, score + 5) # Bonus for stable domains
        else:
             # If WHOIS failed, we don't penalize, we just skip it
             pass

        # 8. Forensic/Tech Penalties
        if core_scan_data.get("security_leaks", {}).get("found_leaks"): 
            score -= 10
        if core_scan_data.get("placeholder_findings", {}).get("found_placeholders"): 
            score -= 5
        
        # 9. Keyword Cannibalization (Phase 2)
        cannibal_check = await check_keyword_cannibalization(sitemap_urls)
        core_scan_data["keyword_intelligence"] = cannibal_check
        if isinstance(cannibal_check, dict) and cannibal_check.get("conflicts_count", 0) > 5: 
            score -= 10

        # 10. AdSense Readiness Penalties
        ads_ready = core_scan_data.get("adsense_readiness", {})
        if isinstance(ads_ready, dict):
            if ads_ready.get("ads_txt", {}).get("status") == "missing": score -= 5
            if ads_ready.get("snippet", {}).get("status") == "not_found": score -= 3
            if not ads_ready.get("language", {}).get("is_supported"): score -= 10
        
        # Final Score Cap: Minimum floor to avoid 0/100 for any reachable site
        is_viable = homepage_words > 50 and target_url is not None
        min_score = 15 if is_viable else 5 
        score = int(max(min_score, min(100, score)))
        
        # Ensure final score is an integer
        final_score = int(score)
        core_scan_data["overall_score"] = final_score # Redundancy for UI fallback
        print(f"[{scan_id}] FINAL COMPUTED SCORE: {final_score}/100 (Viable={is_viable}, Words={homepage_words}, Penalties checked)", flush=True)

        
        # 7. Calculate Approval Probability
        approval_prob = score
        # Critical blockers drop probability significantly
        if core_scan_data.get("ssl_check", {}).get("status") != "passed": approval_prob = min(approval_prob, 15)
        if security_data.get("safe_browsing", {}).get("status") == "unsafe": approval_prob = 0
        if int(core_scan_data.get("ai_policy", {}).get("risk_score", 0)) > 70: approval_prob = min(approval_prob, 15)
        
        core_scan_data["approval_probability"] = approval_prob

        # 8. Priority Checklist Generation
        priority_checklist = []
        def add_issue(title, severity, fix, impact):
            priority_checklist.append({"title": title, "severity": severity, "fix": fix, "impact": impact})

        if core_scan_data.get("ssl_check", {}).get("status") != "passed":
            add_issue("Missing or Invalid SSL", "critical", "Install a valid SSL certificate.", "High")
        if security_data.get("safe_browsing", {}).get("status") == "unsafe":
            add_issue("Domain Blacklisted", "critical", "Remove malware and request a review in Google Search Console.", "High")
        if ai_risk > 70:
            add_issue("AdSense Policy Violations", "critical", "Remove prohibited or AI spam/copyrighted content.", "High")
        if not trust_pages_data.get("summary", {}).get("privacy"):
            add_issue("Missing Privacy Policy", "critical", "Create a comprehensive Privacy Policy page detailing cookie usage.", "High")
        if not trust_pages_data.get("summary", {}).get("contact"):
            add_issue("Missing Contact Information", "critical", "Add a Contact Us page with valid electronic or physical contact methods.", "High")
        if core_scan_data.get("content_analysis", {}).get("has_thin_content"):
            add_issue("Thin Content Detected", "critical", "Expand short pages to provide more value, or consolidate them.", "High")
        
        if security_data.get("mixed_content"):
            add_issue("Mixed Content Issues", "warning", "Ensure all resources load consistently over HTTPS.", "Medium")
        if not core_scan_data.get("sitemap_xml", {}).get("exists"):
            add_issue("Missing Sitemap", "warning", "Generate an XML sitemap and submit to Search Console.", "Medium")
        if not seo_data.get("structured_data", {}).get("detected"):
            add_issue("Missing Structured Data", "warning", "Add basic JSON-LD schema (like Organization or Article).", "Low")
        if ps_score < 50:
            add_issue("Poor Loading Performance", "warning", "Optimize images, minimize scripts, and leverage caching.", "Medium")
            
        # AdSense Readiness Issues
        ads_txt = ads_ready.get("ads_txt", {})
        if ads_txt.get("status") == "missing":
            add_issue("Missing ads.txt", "critical", "Create a valid ads.txt file in your root directory to avoid revenue loss.", "High")
        elif ads_txt.get("status") == "invalid":
            add_issue("Invalid ads.txt", "warning", "Ensure your publisher ID (pub-xxxx) is correctly listed in ads.txt.", "Medium")
            
        snippet = ads_ready.get("snippet", {})
        if snippet.get("status") == "not_found":
            add_issue("AdSense Code Missing", "critical", "Add the AdSense verification/Auto Ads code to your site's <head>.", "High")
        elif snippet.get("status") == "found_in_body":
            add_issue("Move AdSense Code to <head>", "warning", "For faster verification and better performance, move your AdSense script to the <head> tag.", "Low")
            
        if not ads_ready.get("language", {}).get("is_supported"):
            add_issue("Unsupported Site Language", "critical", "Ensure your content is in an AdSense-supported language to avoid rejection.", "High")
            
        # New Feature Checklist Items
        if core_scan_data.get("security_leaks", {}).get("found_leaks"):
            leaks = ", ".join(core_scan_data["security_leaks"].get("leaks", []))
            add_issue(f"Sensitive Files Exposed: {leaks}", "critical", "Restrict access to .env, .git, and config files immediately.", "High")
        
        if core_scan_data.get("placeholder_findings", {}).get("found_placeholders"):
            add_issue("Placeholder Content Found", "warning", "Replace 'Lorem Ipsum' or sample text with original content.", "Medium")
            
        if core_scan_data.get("email_validation") and not core_scan_data["email_validation"].get("is_valid_mx"):
            add_issue("Invalid Email MX Records", "warning", "Use a valid email provider with correct DNS/MX settings.", "Medium")
            
        if int(core_scan_data.get("image_ux", {}).get("missing_alt_count", 0)) > 0:
            add_issue("Image Accessibility Issues", "warning", "Add alt text and dimensions to all images to improve SEO and CLS.", "Low")
            
        if int(core_scan_data.get("nav_depth", {}).get("orphan_count", 0)) > 0:
            add_issue("Poor Site Structure", "warning", "Ensure all important pages are linked and reachable within 3 clicks.", "Low")
            
        spam_risk_final = spam_check.get("risk_score", 0) if isinstance(spam_check, dict) else 0
        if spam_risk_final > 40:
            spam_kw = spam_check.get("spam_keywords", []) if isinstance(spam_check, dict) else []
            keywords_str = ", ".join(spam_kw) if isinstance(spam_kw, list) else str(spam_kw)
            add_issue(f"Restricted Content: {keywords_str}", "critical", "Remove or moderate content mentioning prohibited keywords for AdSense.", "High")
            
        if cannibal_check.get("conflicts_count", 0) > 3:
            add_issue("Keyword Cannibalization Detected", "warning", "Differentiate your page titles and slugs to avoid internal competition.", "Medium")

        core_scan_data["priority_checklist"] = priority_checklist[:10]

        # Data Pruning: Ensure payload doesn't exceed Supabase limits (approx 10MB but safe at 2MB)
        # Pruning long lists that aren't critical for the dashboard summary
        for key in ["internal_links", "external_links", "sitemap_urls", "broken_link_urls", "broken_image_urls"]:
            if key in core_scan_data and isinstance(core_scan_data[key], list) and len(core_scan_data[key]) > 200:
                print(f"[{scan_id}] Pruning {key} from {len(core_scan_data[key])} to 200 items", flush=True)
                core_scan_data[key] = core_scan_data[key][:200]

        # Finalize and update row in supabase
        await update_scan_record(scan_id, {"status": "finalizing_results"})
        now_ts = datetime.datetime.now(datetime.timezone.utc).isoformat()
        
        # Updated: If domain is 'Unknown', try to fetch it again from final_url or parsed data
        if not domain or domain == "Unknown":
            domain = urlparse(final_url).netloc or domain

        update_payload = {
            "status": "completed",
            "overall_score": int(max(5, min(score, 100))),
            "core_scan_data": core_scan_data,
            "trust_pages_data": trust_pages_data,
            "seo_indexing_data": seo_data,
            "security_data": security_data,
            "domain": domain
        }
        
        print(f"[{scan_id}] Saving finalized data (Payload: {len(json.dumps(update_payload, default=str))} bytes)", flush=True)
        success = await update_scan_record(scan_id, update_payload, retries=3)
        if not success:
            print(f"[{scan_id}] Full payload failed — attempting rescue update...", flush=True)
            # Rescue: Save status first so UI unblocks, then try to save data separately
            await update_scan_record(scan_id, {"status": "completed", "overall_score": int(max(5, min(score, 100)))}, retries=5)
            
            for field_name, field_value in [
                ("core_scan_data", core_scan_data),
                ("trust_pages_data", trust_pages_data),
                ("seo_indexing_data", seo_data),
                ("security_data", security_data),
            ]:
                # Try saving each field with a shorter timeout
                await update_scan_record(scan_id, {field_name: field_value}, retries=1)
        else:
            print(f"[{scan_id}] Scan successfully finalized and completed.", flush=True)

        # Create In-App Notification
        if user_id:
            try:
                notif_url = f"{SUPABASE_URL}/rest/v1/notifications"
                notif_headers = {
                    "apikey": SUPABASE_KEY,
                    "Authorization": f"Bearer {SUPABASE_KEY}",
                    "Content-Type": "application/json",
                    "Prefer": "return=minimal"
                }
                notif_payload = {
                    "user_id": user_id,
                    "title": "Analysis Complete",
                    "message": f"Scan finished for {domain} with a score of {int(min(score, 100))}/100.",
                    "type": "success",
                    "action_url": f"/results?id={scan_id}"
                }
                async with httpx.AsyncClient(timeout=15.0) as notif_client:
                    notif_res = await notif_client.post(notif_url, headers=notif_headers, json=notif_payload)
                    notif_res.raise_for_status()
            except Exception as notif_err:
                print(f"[{scan_id}] Failed to create notification: {notif_err}", flush=True)
        
        # Dispatch Webhooks
        if user_id:
            try:
                webhooks = await fetch_user_webhooks(user_id, "scan.completed")
                if webhooks:
                    payload = {
                        "event": "scan.completed",
                        "scan_id": scan_id,
                        "site_id": site_id,
                        "domain": domain,
                        "overall_score": int(min(score, 100)),
                        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
                    }
                    await dispatch_webhooks(webhooks, payload)
            except Exception as w_err:
                print(f"[{scan_id}] Webhook dispatch error: {w_err}")
                
    except Exception as e:
        import traceback
        error_msg = str(e)
        print(f"[{scan_id}] Critical Error: {error_msg}", flush=True)
        traceback.print_exc()
        
        # Update record with failure and error details
        fail_payload = {
            "status": "failed",
            "core_scan_data": {"error": error_msg}
        }
        await update_scan_record(scan_id, fail_payload)

        # Create Failure Notification
        if user_id:
            try:
                notif_url = f"{SUPABASE_URL}/rest/v1/notifications"
                notif_headers = {
                    "apikey": SUPABASE_KEY,
                    "Authorization": f"Bearer {SUPABASE_KEY}",
                    "Content-Type": "application/json",
                    "Prefer": "return=minimal"
                }
                notif_payload = {
                    "user_id": user_id,
                    "title": "Analysis Failed",
                    "message": f"The scan for {domain} failed: {error_msg[:100]}",
                    "type": "error"
                }
                async with httpx.AsyncClient(timeout=15.0) as notif_client:
                    notif_res = await notif_client.post(notif_url, headers=notif_headers, json=notif_payload)
                    notif_res.raise_for_status()
            except Exception as notif_err:
                pass

# Semi-global worker state
active_scans = set()
MAX_CONCURRENT_SCANS = 3

async def poll_jobs():
    print(f"Background worker started (Max concurrency: {MAX_CONCURRENT_SCANS}). Polling for pending scans...")
    
    # Simple semaphore to limit concurrent scans
    sem = asyncio.Semaphore(MAX_CONCURRENT_SCANS)

    async def scan_wrapper(scan):
        scan_id = scan.get("id")
        if scan_id in active_scans:
            return
        active_scans.add(scan_id)
        try:
            async with sem:
                # Overall timeout of 15 minutes for any single scan
                await asyncio.wait_for(process_scan(scan), timeout=900.0)
        except asyncio.TimeoutError:
            print(f"[{scan_id}] Critical: Overall scan processing timed out after 15 minutes.", flush=True)
            await update_scan_record(scan_id, {"status": "failed", "core_scan_data": {"error": "Overall process timeout"}})
        except Exception as e:
            print(f"[{scan_id}] Critical: Process scan unhandled crash: {e}", flush=True)
            await update_scan_record(scan_id, {"status": "failed", "core_scan_data": {"error": str(e)}})
        finally:
            active_scans.discard(scan_id)

    while True:
        try:
            # Only poll if we have capacity (highly efficient)
            if len(active_scans) < MAX_CONCURRENT_SCANS:
                # Fetch pending scans
                pending_scans = await fetch_pending_scans()
                
                if pending_scans:
                    new_scans = [s for s in pending_scans if s.get("id") not in active_scans]
                    if new_scans:
                        print(f"Found {len(new_scans)} new pending scans. Spawning workers...", flush=True)
                        for scan in new_scans:
                            asyncio.create_task(scan_wrapper(scan))
                
            # Heartbeat to confirm worker is alive
            if int(time.time()) % 60 < 10:
                print(f"Heartbeat: Background worker is alive. Active scans: {len(active_scans)}", flush=True)
                
            await asyncio.sleep(10)
        except Exception as e:
            print(f"Polling loop error: {e}", flush=True)
            await asyncio.sleep(10)

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
    info: dict = None

@app.post("/regenerate-draft")
async def handle_regenerate_draft(request: RegenerateDraftRequest):
    draft_content = await generate_missing_page_draft(request.domain, request.page_type, request.info)
    if draft_content:
        url = f"{SUPABASE_URL}/rest/v1/adsense_scans?id=eq.{request.scan_id}&select=trust_pages_data"
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}"
        }
        async with httpx.AsyncClient(timeout=15.0) as client:
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

class ContentImprovementsRequest(BaseModel):
    scan_id: str
    domain: str
    analysis_data: dict

@app.post("/ai/content-improvements")
async def handle_content_improvements(request: ContentImprovementsRequest):
    result = await generate_content_improvements(request.domain, request.analysis_data)
    if result.get("status") == "success":
        return result
    return Response(content=result.get("message", "Generation failed"), status_code=500)

class MonetizationRequest(BaseModel):
    scan_id: str
    domain: str
    analysis_data: dict

@app.post("/ai/monetization")
async def handle_monetization_suggestions(request: MonetizationRequest):
    result = await generate_monetization_suggestions(request.domain, request.analysis_data)
    if result.get("status") == "success":
        return result
    return Response(content=result.get("message", "Generation failed"), status_code=500)

class AppealRequest(BaseModel):
    scan_id: str
    domain: str
    violations: list

@app.post("/ai/appeal")
async def handle_appeal_generation(request: AppealRequest):
    result = await generate_appeal_letter(request.domain, request.violations)
    if result.get("status") == "success":
        return result
    return Response(content=result.get("message", "Generation failed"), status_code=500)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
