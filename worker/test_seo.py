import asyncio
import os
from unittest.mock import patch, MagicMock

# Mock env vars before importing main
os.environ["SUPABASE_URL"] = "http://mock.url"
os.environ["SUPABASE_SERVICE_ROLE_KEY"] = "mock_key"
os.environ["NEXT_PUBLIC_GOOGLE_PAGESPEED_API_KEY"] = ""
os.environ["NEXT_PUBLIC_GOOGLE_SAFE_BROWSING_API_KEY"] = ""
os.environ["GEMINI_API_KEY"] = ""

import main

async def mock_fetch_site_url(site_id):
    return "example.com"

async def mock_update_scan_record(scan_id, payload):
    print("\n--- FINAL PAYLOAD SENT TO DB ---")
    print("\nCore Scan Data:")
    import pprint
    pprint.pprint(payload.get("core_scan_data", {}).get("redirects", {}))
    pprint.pprint(payload.get("core_scan_data", {}).get("sitemap_xml", {}))
    print("\nSEO & Indexing Data:")
    pprint.pprint(payload.get("seo_indexing_data", {}))
    print("\n--------------------------------")

async def test_run():
    main.fetch_site_url = mock_fetch_site_url
    main.update_scan_record = mock_update_scan_record
    
    scan_record = {
        "id": "test_scan_123",
        "site_id": "test_site_123"
    }
    
    print("Running process_scan on example.com to verify no exceptions are thrown...")
    await main.process_scan(scan_record)
    print("Test finished.")

if __name__ == "__main__":
    asyncio.run(test_run())
