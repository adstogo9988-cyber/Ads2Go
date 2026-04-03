import asyncio, os, httpx, json
from dotenv import load_dotenv

# Load env from .env.local in the current folder or a parent
load_dotenv('.env.local')
URL = os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

if not KEY:
    load_dotenv('../.env.local')
    URL = os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
    KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

async def main():
    if not URL or not KEY:
        print("Missing SUPABASE config.")
        return
    headers = {'apikey': KEY, 'Authorization': f'Bearer {KEY}'}
    params = {'status': 'eq.measuring_performance', 'limit': 1, 'order': 'updated_at.desc'}
    async with httpx.AsyncClient() as client:
        r = await client.get(f"{URL}/rest/v1/adsense_scans", params=params, headers=headers)
        if r.status_code == 200:
            scans = r.json()
            if scans:
                s = scans[0]
                print(f"ID: {s.get('id')}")
                print(f"Domain: {s.get('domain')}")
                print(f"Status: {s.get('status')}")
                updated_at = s.get('updated_at')
                print(f"Last updated: {updated_at}")
            else:
                print("No scans with status 'measuring_performance' found.")
        else:
            print(f"DB Error {r.status_code}: {r.text}")

if __name__ == "__main__":
    asyncio.run(main())
