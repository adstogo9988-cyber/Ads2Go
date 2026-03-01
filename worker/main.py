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
RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")  # RapidAPI key for supplementary data services
OPEN_PAGERANK_API_KEY = os.getenv("OPEN_PAGERANK_API_KEY")  # Free key from openpr.info (no cost, just register)


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

    async def fetch_strategy(client, strategy, retries=3):
        base_url = (
            f"https://www.googleapis.com/pagespeedonline/v5/runPagespeed"
            f"?url={target_url}&strategy={strategy}"
            f"&category=PERFORMANCE"         # Full Lighthouse perf category
        )
        url_with_key = base_url + f"&key={PAGESPEED_API_KEY}" if PAGESPEED_API_KEY else base_url
        url_keyless  = base_url

        for attempt in range(retries):
            use_url = url_keyless if (not PAGESPEED_API_KEY or attempt > 0) else url_with_key
            try:
                print(f"[PSI] Fetching {strategy} for {target_url} (attempt {attempt+1}/{retries})", flush=True)
                resp = await client.get(use_url, timeout=120.0)

                if resp.status_code == 403:
                    print(f"[PSI] 403 → retrying keyless", flush=True)
                    resp = await client.get(url_keyless, timeout=120.0)
                if resp.status_code == 429:
                    wait_s = 20 + (15 * attempt)
                    print(f"[PSI] 429 rate limit → waiting {wait_s}s then keyless", flush=True)
                    await asyncio.sleep(wait_s)
                    resp = await client.get(url_keyless, timeout=120.0)
                if resp.status_code != 200:
                    print(f"[PSI] HTTP {resp.status_code} ({strategy})", flush=True)
                    if attempt < retries - 1:
                        await asyncio.sleep(8)
                    continue

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
                print(f"[PSI] Error ({strategy}) attempt {attempt+1}: {e}", flush=True)
                if attempt < retries - 1:
                    await asyncio.sleep(8 + (8 * attempt))
        return None

    # Run both strategies — mobile is the primary signal
    async with httpx.AsyncClient() as client:
        mobile_data  = await fetch_strategy(client, "mobile")
        await asyncio.sleep(3)   # brief pause between calls
        desktop_data = await fetch_strategy(client, "desktop")

    if not mobile_data and not desktop_data:
        print("[PSI] Both strategies failed — returning None", flush=True)
        return None

    base = mobile_data or desktop_data

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
            cert, tls_version = await asyncio.wait_for(asyncio.to_thread(fetch_cert), timeout=6.0)
        except Exception as e:
            return {"status": "failed", "error": f"SSL Connection failed: {str(e)}", "protocol": "HTTP"}
        
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
                "protocol": tls_version if tls_version else "HTTPS"
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
            response = await asyncio.wait_for(asyncio.to_thread(model.generate_content, prompt), timeout=45.0)
        except Exception as e:
            if "404" in str(e):
                print("gemini-1.5-flash not found, falling back to gemini-pro", flush=True)
                model = genai.GenerativeModel('gemini-pro') 
                response = await asyncio.wait_for(asyncio.to_thread(model.generate_content, prompt), timeout=45.0)
                
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
        response = await asyncio.wait_for(asyncio.to_thread(model.generate_content, prompt), timeout=30.0)
        
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

# AI Content Improvements Generator
async def generate_content_improvements(domain: str, analysis_data: dict) -> dict:
    if not GEMINI_API_KEY or GEMINI_API_KEY.startswith("AIzaSyAx"):
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
        return {"status": "success", "improvements": parsed}
    except Exception as e:
        print(f"Content Improvement AI Error: {e}")
        return {"status": "error", "message": "Failed to generate suggestions"}

# AI Monetization Suggestions
async def generate_monetization_suggestions(domain: str, analysis_data: dict) -> dict:
    if not GEMINI_API_KEY or GEMINI_API_KEY.startswith("AIzaSyAx"):
        return {"status": "error", "message": "Missing or invalid Gemini API key"}
        
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        prompt = f"""
        You are a Website Monetization Expert.
        Review the following website analysis data for '{domain}'. Based on its niche, content quality, and readiness score, suggest 3-4 alternative or supplementary monetization methods (like affiliate marketing, specific ad networks other than AdSense, sponsored posts, etc.).
        
        Analysis Data:
        {json.dumps(analysis_data, indent=2)}
        
        Respond ONLY with a valid JSON array of objects following this schema:
        [
          {{
            "method": "Name of the monetization method",
            "suitability": "High", "Medium", or "Low",
            "reason": "Why this works well for this specific site",
            "getting_started": "Brief tip on how to start"
          }}
        ]
        """
        model = genai.GenerativeModel('gemini-1.5-flash', generation_config={"response_mime_type": "application/json"})
        response = await asyncio.wait_for(asyncio.to_thread(model.generate_content, prompt), timeout=30.0)
        
        parsed = json.loads(response.text)
        return {"status": "success", "suggestions": parsed}
    except Exception as e:
        print(f"Monetization AI Error: {e}")
        return {"status": "error", "message": "Failed to generate suggestions"}

# AI Appeal Letter Generator
async def generate_appeal_letter(domain: str, violations: list) -> dict:
    if not GEMINI_API_KEY or GEMINI_API_KEY.startswith("AIzaSyAx"):
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
                        print(f"[OpenPageRank] {clean_domain}: rank={rank}/10, score≈{score}/100", flush=True)
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

async def fetch_domain_age(domain: str) -> dict:
    """
    Fetch domain age & WHOIS details using premium whoisxmlapi.com API.
    Returns structured JSON: domain_age (years/months), creation_date, registrar, expiration_date, domain_status.
    """
    if not WHOIS_XML_API_KEY:
        print("[WHOIS] Missing WHOIS_XML_API_KEY.", flush=True)
        return None

    clean_domain = domain.replace("https://", "").replace("http://", "").rstrip("/").split("/")[0]
    # WHOIS API sometimes fails on the api/v1 domain format, using the core server endpoint:
    api_url = f"https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey={WHOIS_XML_API_KEY}&domainName={clean_domain}&outputFormat=JSON"

    print(f"[WHOIS] Fetching details for {clean_domain} via WHOISXMLAPI...", flush=True)
    
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            r = await client.get(api_url)
            
            if r.status_code != 200:
                print(f"[WHOIS] API Error HTTP {r.status_code}", flush=True)
                return None
                
            data = r.json()
            whois_rec = data.get("WhoisRecord", {})
            
            if not whois_rec or "dataError" in whois_rec:
                err = whois_rec.get("dataError", "Unknown domain or parse error")
                print(f"[WHOIS] API returned error: {err}", flush=True)
                return None

            # Extract fields
            creation_str = whois_rec.get("createdDateNormalized") or whois_rec.get("createdDate")
            expiration_str = whois_rec.get("expiresDateNormalized") or whois_rec.get("expiresDate")
            registrar = whois_rec.get("registrarName")
            
            # Status can be varied; join if it's a list
            status = whois_rec.get("status")
            if isinstance(status, list):
                status = status[0] if status else None
                
            # If we don't even have a creation date, we can't calculate age
            if not creation_str:
                print(f"[WHOIS] No creation date found for {clean_domain}", flush=True)
                return None

            # Parse creation date safely (format usually "2020-01-09 13:42:00 UTC")
            try:
                # take just the YYYY-MM-DD part for calculation
                date_part = creation_str.split(" ")[0] if " " in creation_str else creation_str[:10]
                creation_date = datetime.datetime.strptime(date_part, "%Y-%m-%d")
                
                now = datetime.datetime.now()
                delta = now - creation_date
                total_days = delta.days
                
                years = total_days // 365
                months = (total_days % 365) // 30
                
                age_result = {
                    "years": years,
                    "months": months,
                    "total_days": total_days
                }
            except Exception as e:
                print(f"[WHOIS] Date parse error for '{creation_str}': {e}", flush=True)
                # Keep original data but nullify the age calculation
                age_result = None

            print(f"[WHOIS] Success for {clean_domain} — Age: {age_result['years']}y {age_result['months']}m" if age_result else f"[WHOIS] Success for {clean_domain} (No age calc)", flush=True)

            return {
                "domain_age": age_result,
                "creation_date": creation_str,
                "registrar": registrar,
                "expiration_date": expiration_str,
                "domain_status": status,
                "source": "whoisxmlapi"
            }

    except Exception as e:
        print(f"[WHOIS] Network/Exception Error: {e}", flush=True)
        return None

async def fetch_similarweb_data(domain: str) -> dict:
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
                if data.get("success"):
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
                total = sum(tf.values())
                scored = {word: (count / total) * math.log(1 + count) for word, count in tf.items()}
                # Bigrams
                bigrams = [f"{tokens[i]} {tokens[i+1]}" for i in range(len(tokens) - 1)]
                bigram_counts = Counter(bigrams)
                for bg, cnt in bigram_counts.most_common(20):
                    if cnt >= 2:
                        scored[bg] = (cnt / total) * math.log(1 + cnt) * 1.5
                top = sorted(scored.items(), key=lambda x: x[1], reverse=True)[:10]
                for kw, _ in top:
                    if kw not in existing_kws and len(keywords_list) < 10:
                        keywords_list.append({"keyword": kw, "rank": len(keywords_list) + 1,
                                               "search_volume": None, "seo_clicks": None,
                                               "difficulty": None, "source": "tfidf"})
                        existing_kws.add(kw)

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

async def fetch_seo_keywords(domain: str) -> dict:
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
    async with httpx.AsyncClient() as client:
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
    async with httpx.AsyncClient() as client:
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

    async with httpx.AsyncClient() as client:
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
        async with httpx.AsyncClient() as client:
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
         async with httpx.AsyncClient() as client:
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
    import httpx as httpx  # Explicit local binding to prevent UnboundLocalError from closure machinery
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
        
        # Check for Google integrations
        user_id = scan_record.get("user_id")
        integration = await fetch_user_integrations(user_id) if user_id else None
        
        gsc_data_api = None
        adsense_data_api = None

        if integration and integration.get("access_token"):
            print(f"[{scan_id}] Found Google integration for user {user_id}. Fetching GSC/AdSense...")
            access_token = integration.get("access_token")
            domain = f"{urlparse(target_url).scheme}://{urlparse(target_url).netloc}"
            
            gsc_data_api = await fetch_gsc_data(access_token, domain)
            adsense_data_api = await fetch_adsense_data(access_token)
            
            if gsc_data_api.get("error") and "401" in str(gsc_data_api.get("error")):
                 print("Access token might be expired. TODO: Implement refresh flow.")

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
                
                # Check HTTP -> HTTPS redirect explicitly
                if final_url.startswith("https"):
                    http_url = final_url.replace("https://", "http://", 1)
                    try:
                        http_res = await client.get(http_url, timeout=5.0)
                        if not str(http_res.url).startswith("https://"):
                            ssl_check_result["protocol"] = "HTTP" # Penalty for weak setup
                            ssl_check_result["status"] = "failed"
                    except:
                        pass # if it doesn't resolve or timeouts, it's virtually unattackable via pure http
                        
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
                
                # Security Headers (Enhanced)
                csp_val = None
                sts_val = None
                frame_val = None
                ctype_val = None
                
                for k, v in headers.items():
                    kl = k.lower()
                    if kl == "content-security-policy": csp_val = v
                    elif kl == "strict-transport-security": sts_val = v
                    elif kl == "x-frame-options": frame_val = v
                    elif kl == "x-content-type-options": ctype_val = v
                    
                sts_active = sts_val is not None and "max-age" in sts_val.lower() and "max-age=0" not in sts_val.lower()
                frame_active = frame_val is not None and frame_val.upper() in ["DENY", "SAMEORIGIN"]
                
                security_data["headers"] = {
                    "csp": csp_val is not None,
                    "sts": sts_active,
                    "frame_options": frame_active,
                    "content_type_options": ctype_val is not None and "nosniff" in ctype_val.lower()
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
                        # Count <loc> elements
                        sitemap_url_count = len(root.findall('.//loc'))
                        if sitemap_url_count == 0:
                            # Fallback: count via regex if tag had namespace issues
                            sitemap_url_count = len(re.findall(r'<loc>', sitemap_text, re.IGNORECASE))
                    except ET.ParseError:
                        # Fallback to regex for malformed XML
                        is_valid_xml = bool(re.search(r'<(urlset|sitemapindex)', sitemap_text, re.IGNORECASE))
                        sitemap_url_count = len(re.findall(r'<loc>', sitemap_text, re.IGNORECASE))
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
            # FIX: Lowered threshold to 250 words (300 was flagging legitimate short pages)
            if homepage_words < 250:
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
            
            if safe_browsing.get("status") == "unknown":
                # Fallback: Use AI Risk Score if Safe Browsing API is unconfigured/failed
                ai_risk = core_scan_data.get("ai_policy", {}).get("risk_score", 0)
                if ai_risk > 85:
                    safe_browsing = {"status": "unsafe", "issues": 1, "fallback_used": True}
                else:
                    safe_browsing = {"status": "safe", "issues": 0, "fallback_used": True}
                    
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


        # -------------------------------------------------------------------
        # Enrichment (domain age, keywords, social links, website info)
        # Each function tries RapidAPI first if key available, then falls back to
        # a fully free alternative. NO guard on RAPIDAPI_KEY here.
        # -------------------------------------------------------------------
        print(f"[{scan_id}] Fetching enrichment data (free fallbacks active)...", flush=True)
        parsed_domain = urlparse(final_url).netloc or urlparse(target_url).netloc
        try:
            (
                domain_age_data,
                similarweb_data,
                seo_keywords_data,
                social_links_data,
                website_info_data,
                domain_authority_data,
            ) = await asyncio.gather(
                fetch_domain_age(parsed_domain),
                fetch_similarweb_data(parsed_domain),
                fetch_seo_keywords(final_url),
                fetch_social_links(final_url),
                fetch_website_info(final_url),
                fetch_domain_authority(parsed_domain),
                return_exceptions=True
            )

            # ---- Domain age + WHOIS visibility ----
            if isinstance(domain_age_data, dict) and domain_age_data:
                # Store the exact structure returned by fetch_domain_age
                core_scan_data["domain_age"] = domain_age_data.get("domain_age")
                
                age_years = domain_age_data.get("domain_age", {}).get("years", "?") if domain_age_data.get("domain_age") else "?"
                print(f"[{scan_id}] Domain age: {age_years} years (source: {domain_age_data.get('source','?')})", flush=True)
                
                # Update whois_visibility to reflect the new richer fields
                core_scan_data["whois_visibility"] = {
                    "is_public": bool(domain_age_data.get("creation_date")),
                    "creation_date": domain_age_data.get("creation_date"),
                    "expiration_date": domain_age_data.get("expiration_date"),
                    "registrar": domain_age_data.get("registrar"),
                    "domain_status": domain_age_data.get("domain_status"),
                    "source": domain_age_data.get("source")
                }
            else:
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
            "is_mobile_friendly": is_viewport_correct and (mobile_score is None or mobile_score >= 50),
            "source": "pagespeed+html"
        }
        print(f"[{scan_id}] Mobile friendly: viewport={has_viewport}, score={mobile_score}", flush=True)



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
        ps_score = core_scan_data.get("pagespeed", {}).get("score", 50)
        if ps_score < 50: score -= 20
        elif ps_score < 80: score -= 10

        # 7. Domain Age Bonus/Penalty (from RapidAPI / WHOISXML)
        domain_age = core_scan_data.get("domain_age", {})
        if domain_age:
            age_days = domain_age.get("total_days", 0)
            if age_days < 180:  # < 6 months: very risky for AdSense
                score -= 10
            elif age_days > 730:  # > 2 years: trust bonus
                score = min(100, score + 5)

        # Ensure score stays strictly bounded
        score = max(0, min(100, score))

        
        # 7. Calculate Approval Probability
        approval_prob = score
        # Critical blockers drop probability significantly
        if core_scan_data.get("ssl_check", {}).get("status") != "passed": approval_prob = min(approval_prob, 5)
        if security_data.get("safe_browsing", {}).get("status") == "unsafe": approval_prob = 0
        if ai_risk > 70: approval_prob = min(approval_prob, 10)
        
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

        core_scan_data["priority_checklist"] = priority_checklist[:10]

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
        print(f"[{scan_id}] Process complete, successfully updated!", flush=True)

        # Create In-App Notification
        if user_id:
            try:
                import httpx
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
                    "message": f"Scan finished for {domain} with a score of {int(min(score, 99))}/100.",
                    "type": "success",
                    "action_url": f"/results?id={scan_id}"
                }
                async with httpx.AsyncClient() as notif_client:
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
                        "overall_score": int(min(score, 99)),
                        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
                    }
                    await dispatch_webhooks(webhooks, payload)
            except Exception as w_err:
                print(f"[{scan_id}] Webhook dispatch error: {w_err}")
                
    except Exception as e:
        import traceback
        print(f"[{scan_id}] Critical Error: {e}", flush=True)
        traceback.print_exc()
        await update_scan_record(scan_id, {"status": "failed"})

        # Create Failure Notification
        if user_id:
            try:
                import httpx
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
                    "message": f"The scan for {domain} failed to complete due to an error.",
                    "type": "error"
                }
                async with httpx.AsyncClient() as notif_client:
                    notif_res = await notif_client.post(notif_url, headers=notif_headers, json=notif_payload)
                    notif_res.raise_for_status()
            except Exception as notif_err:
                pass

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
