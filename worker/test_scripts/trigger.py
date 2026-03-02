import httpx
import asyncio

async def test_api():
    url = "http://127.0.0.1:8000/scan"
    payload = {
        "url": "https://ads2go.org",
        "site_id": "test-crawl-intelligence"
    }
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            print("Sending request to worker API...")
            r = await client.post(url, json=payload)
            print(f"Status: {r.status_code}")
            print(r.json())
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_api())
