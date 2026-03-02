import asyncio
import sys
import os
import json
import uuid
from unittest.mock import patch

# Add the parent directory to the path so we can import from main
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from main import process_scan

async def run_full_scan_test():
    # Accept URL from command line or default to example.com
    test_url = sys.argv[1] if len(sys.argv) > 1 else "https://example.com"
    print(f"\n--- TESTING URL: {test_url} ---")
    
    scan_record = {
        "id": f"test_scan_{uuid.uuid4().hex[:8]}",
        "site_id": "test_site_123"
    }

    # Mock DB and external calls
    async def mock_fetch_site_url(site_id):
        return test_url
        
    async def mock_update_scan_record(scan_id, payload):
        print("\n=== FINAL PAYLOAD RECEIVED ===")
        # Save to domain-specific file
        domain_clean = test_url.split("//")[-1].replace("/", "_").replace(".", "_")
        filename = f"test_result_{domain_clean}.json"
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2)
        print(f"Results saved to: {filename}")
        return True
        
    async def mock_fetch_pending_scans():
        return []
        
    async def mock_fetch_pagespeed_data(url):
        # Return mock data to avoid external dependency for logic verification
        return {
            "score": 85,
            "mobile_score": 90,
            "metrics": {"lcp": 1200, "fid": 20, "cls": 0.05}
        }

    async def mock_fetch_user_integrations(user_id):
        return []

    async def mock_fetch_gsc_data(site_url, site_id):
        return {}

    async def mock_fetch_adsense_data(user_id):
        return {}

    async def mock_check_safe_browsing(url):
        return {"status": "safe", "issues": 0, "fallback_used": True}

    # Patch all network/DB methods
    with patch('main.fetch_site_url', new=mock_fetch_site_url), \
         patch('main.update_scan_record', new=mock_update_scan_record), \
         patch('main.fetch_pending_scans', new=mock_fetch_pending_scans), \
         patch('main.fetch_pagespeed_data', new=mock_fetch_pagespeed_data), \
         patch('main.fetch_user_integrations', new=mock_fetch_user_integrations), \
         patch('main.fetch_gsc_data', new=mock_fetch_gsc_data), \
         patch('main.fetch_adsense_data', new=mock_fetch_adsense_data), \
         patch('main.check_safe_browsing', new=mock_check_safe_browsing):
        
        try:
            await process_scan(scan_record)
            print(f"Scan completed for {test_url}")
        except Exception as e:
            print(f"CRITICAL ERROR during scan for {test_url}: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(run_full_scan_test())
