
import asyncio
import os
import httpx
from dotenv import load_dotenv

load_dotenv('../.env.local')
SUPABASE_URL = os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

async def main():
    async with httpx.AsyncClient() as client:
        res = await client.get(
            f'{SUPABASE_URL}/rest/v1/sites?domain=eq.vnhax.site&select=id',
            headers={'apikey': SUPABASE_KEY, 'Authorization': f'Bearer {SUPABASE_KEY}'}
        )
        data = res.json()
        print(data)
        if data:
            site_id = data[0]['id']
            from main import process_scan
            print('Testing site_id:', site_id)
            await process_scan({'id': 'ec59afa8-e30e-465b-b152-f786585a3f8f', 'site_id': site_id})

asyncio.run(main())
