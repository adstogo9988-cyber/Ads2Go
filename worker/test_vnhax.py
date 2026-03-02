import asyncio
import os
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env.local"))
import main
import httpx

async def run():
    print("starting test for vnhax.site...")
    scan_record = {
        "id": "test-id-123",
        "site_id": "test-site-id",
        "user_id": None
    }
    # Mock fetch_site_url
    async def mock_fetch_site_url(site_id):
        return "https://vnhax.site"
    main.fetch_site_url = mock_fetch_site_url
    
    async def mock_update_scan_record(scan_id, payload):
        print(f"Mock update scan called with payload status: {payload.get('status')}")
    main.update_scan_record = mock_update_scan_record

    try:
        await asyncio.wait_for(main.process_scan(scan_record), timeout=180.0)
        print("Done process_scan")
    except asyncio.TimeoutError:
        print("process_scan TIMED OUT!")
    except Exception as e:
        print(f"Error test: {e}")

if __name__ == "__main__":
    asyncio.run(run())
