import httpx
import asyncio
import sys

SUPABASE_URL = "https://ycrjboqzzcgolotfieuz.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inljcmpib3F6emNnb2xvdGZpZXV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk1NjM1MywiZXhwIjoyMDg3NTMyMzUzfQ.qyxgpRAZhGmOmIO1A_02R9WPlrzHmBoEQUvwu6DifaY"
WORKER_URL = "http://localhost:8080"

async def trigger(scan_id, site_id=""):
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(f"{WORKER_URL}/scan", json={"id": scan_id, "site_id": site_id})
        print(f"Trigger response: {resp.status_code} - {resp.text}")

async def get_pending():
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}"
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.get(
            f"{SUPABASE_URL}/rest/v1/adsense_scans?select=id,status,site_id,created_at&status=eq.pending&order=created_at.desc&limit=3",
            headers=headers
        )
        scans = r.json()
        print(f"Latest pending scans: {scans}")
        return scans

async def main():
    scans = await get_pending()
    if scans:
        latest = scans[0]
        scan_id = latest["id"]
        site_id = latest.get("site_id") or ""
        print(f"\nTriggering: scan_id={scan_id}, site_id={site_id}")
        await trigger(scan_id, site_id)
    else:
        print("No pending scans found.")

asyncio.run(main())
