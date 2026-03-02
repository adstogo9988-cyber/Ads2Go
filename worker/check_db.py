import asyncio
import os
import httpx
from dotenv import load_dotenv
import json

load_dotenv('.env.local')

SUPABASE_URL = os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

async def get_scans():
    url = f'{SUPABASE_URL}/rest/v1/adsense_scans?select=id,status,core_scan_data&order=created_at.desc&limit=1'
    headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}'
    }
    async with httpx.AsyncClient() as client:
        r = await client.get(url, headers=headers)
        if r.status_code == 200:
            for s in r.json():
                print(f"ID: {s['id']} | Status: {s['status']}")
                core = s.get('core_scan_data', {})
                print(f"Keys in core_scan_data: {list(core.keys())}")
                if 'pagespeed' in core:
                    print(f"PageSpeed Data: {json.dumps(core['pagespeed'], indent=2)}")
                else:
                    print("No pagespeed key found in core_scan_data.")
        else:
            print(f'Error: {r.status_code} {r.text}')

if __name__ == "__main__":
    asyncio.run(get_scans())
