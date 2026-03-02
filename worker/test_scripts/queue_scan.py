import asyncio
import httpx
import os
from dotenv import load_dotenv

load_dotenv("../.env.local")

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

async def test_trigger():
    # We will fetch a site from Supabase sites table explicitly
    url = f"{SUPABASE_URL}/rest/v1/sites?limit=1"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}"
    }

    async with httpx.AsyncClient() as client:
        r = await client.get(url, headers=headers)
        sites = r.json()
        if not sites:
            print("No sites in Supabase to test.")
            return
        
        site = sites[0]
        site_id = site["id"]
        
        print(f"Triggering scan for site {site['url']} (ID: {site_id})")
        
        payload = {
            "site_id": site_id,
            "status": "pending",
            "url": site["url"]
        }
        
        post_url = f"{SUPABASE_URL}/rest/v1/scans"
        r_post = await client.post(post_url, headers={**headers, "Prefer": "return=representation"}, json=payload)
        
        if r_post.status_code in [200, 201]:
            print(f"Created scan: {r_post.json()[0]['id']}")
        else:
            print(f"Failed to create scan: {r_post.text}")

if __name__ == "__main__":
    asyncio.run(test_trigger())
