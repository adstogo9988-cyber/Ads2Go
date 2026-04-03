import asyncio
import os
import httpx
from dotenv import load_dotenv
import json

load_dotenv('.env.local')

SUPABASE_URL = os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

async def get_scans():
    url = f'{SUPABASE_URL}/rest/v1/adsense_scans?select=*&status=neq.completed&order=created_at.desc&limit=5'
    headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}'
    }
    async with httpx.AsyncClient() as client:
        r = await client.get(url, headers=headers)
        if r.status_code == 200:
            data = r.json()
            if not data:
                print("No non-completed scans found (all are complete or failed/pending matches 0).")
                return
            for s in data:
                print(f"ID: {s['id']} | Status: {s['status']} | Created: {s.get('created_at')}")
        else:
            print(f'Error: {r.status_code} {r.text}')

if __name__ == "__main__":
    asyncio.run(get_scans())
