"""
Quick debug script — runs each function and prints results.
Run: .\venv\Scripts\python debug_test.py
"""
import asyncio
import sys
import os

# Make sure main.py's env is loaded
env_path = os.path.join(os.path.dirname(__file__), "..", ".env.local")
from dotenv import load_dotenv
load_dotenv(dotenv_path=env_path)

from main import (
    fetch_pagespeed_data,
    fetch_domain_age,
    fetch_seo_keywords,
    fetch_social_links,
    fetch_website_info,
)

TEST_URL = "https://example.com"
TEST_DOMAIN = "example.com"

async def run_tests():
    print("=" * 60)
    print(f"Testing against: {TEST_URL}")
    print("=" * 60)

    # 1. PageSpeed (LCP, mobile score, CWV)
    print("\n[1] fetch_pagespeed_data ...")
    try:
        ps = await asyncio.wait_for(fetch_pagespeed_data(TEST_URL), timeout=90)
        if ps:
            print(f"   mobile_score  : {ps.get('mobile_score')}")
            print(f"   desktop_score : {ps.get('desktop_score')}")
            print(f"   LCP           : {ps.get('lcp')}")
            print(f"   CLS           : {ps.get('cls')}")
            print(f"   INP           : {ps.get('inp')}")
            print(f"   unused_js_kb  : {ps.get('unused_js_kb')}")
            print(f"   total_page_kb : {ps.get('total_page_kb')}")
            print(f"   img issues    : {ps.get('image_optimization_issues')}")
        else:
            print("   RESULT: None/empty — PageSpeed returned nothing!")
    except Exception as e:
        print(f"   ERROR: {e}")

    # 2. Domain age (WHOIS)
    print("\n[2] fetch_domain_age ...")
    try:
        da = await asyncio.wait_for(fetch_domain_age(TEST_DOMAIN), timeout=20)
        if da:
            print(f"   years={da.get('years')} months={da.get('months')} created={da.get('created')} source={da.get('source')}")
        else:
            print("   RESULT: empty dict — WHOIS failed!")
    except Exception as e:
        print(f"   ERROR: {e}")

    # 3. SEO keywords (TF-IDF)
    print("\n[3] fetch_seo_keywords ...")
    try:
        kw = await asyncio.wait_for(fetch_seo_keywords(TEST_URL), timeout=20)
        if kw:
            print(f"   source={kw.get('source')} total={kw.get('total')}")
            for k in (kw.get('keywords') or [])[:3]:
                print(f"     - {k.get('keyword')}")
        else:
            print("   RESULT: empty — TF-IDF failed!")
    except Exception as e:
        print(f"   ERROR: {e}")

    # 4. Social links
    print("\n[4] fetch_social_links ...")
    try:
        sl = await asyncio.wait_for(fetch_social_links(TEST_URL), timeout=20)
        print(f"   found: {list(sl.keys()) if sl else 'empty'}")
    except Exception as e:
        print(f"   ERROR: {e}")

    # 5. Website info
    print("\n[5] fetch_website_info ...")
    try:
        wi = await asyncio.wait_for(fetch_website_info(TEST_URL), timeout=20)
        if wi:
            print(f"   title={wi.get('title')} source={wi.get('source')}")
        else:
            print("   RESULT: empty")
    except Exception as e:
        print(f"   ERROR: {e}")

    print("\n" + "=" * 60)
    print("Test complete.")

asyncio.run(run_tests())
