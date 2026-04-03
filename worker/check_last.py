import asyncio, os, httpx, json
from dotenv import load_dotenv

load_dotenv('.env.local')
URL = os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
if not KEY:
    load_dotenv('../.env.local')
    URL = os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
    KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

async def main():
    async with httpx.AsyncClient() as client:
        r = await client.get(f"{URL}/rest/v1/adsense_scans?order=created_at.desc&limit=1", headers={'apikey': KEY, 'Authorization': f'Bearer {KEY}'})
        if r.status_code == 200:
            for s in r.json():
                print(f"ID: {s.get('id', 'N/A')}")
                target = s.get('target_url') or s.get('domain')
                print(f"Target: {target}")
                print(f"Status: {s.get('status', 'N/A')}")
                core = s.get('core_scan_data', {})
                err = s.get('error_message') or (core.get('error') if isinstance(core, dict) else None)
                print(f"Error: {err}")
                print("-" * 20)
        else: print(f"Error: {r.status_code} {r.text}")

if __name__ == "__main__": asyncio.run(main())
