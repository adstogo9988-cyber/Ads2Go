import asyncio, os, httpx
from dotenv import load_dotenv

load_dotenv('.env.local')
URL = os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

async def force_complete():
    if not URL or not KEY:
        print("Missing credentials.")
        return

    headers = {'apikey': KEY, 'Authorization': f'Bearer {KEY}', 'Content-Type': 'application/json'}
    async with httpx.AsyncClient() as client:
        # Finding any non-completed scan
        r = await client.get(f"{URL}/rest/v1/adsense_scans?status=neq.completed&status=neq.failed&order=created_at.desc&limit=3", headers=headers)
        if r.status_code == 200 and r.json():
            scan = r.json()[0]
            target = scan.get('domain') or scan.get('target_url') or "Unknown"
            print(f"Fixing scan: {target}")
            # Update to completed
            await client.patch(f"{URL}/rest/v1/adsense_scans?id=eq.{scan['id']}", headers=headers, json={"status": "completed"})
            print("Done! Check website.")
        else:
            print("No stuck scans found.")

if __name__ == "__main__":
    asyncio.run(force_complete())
