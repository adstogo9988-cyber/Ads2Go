import asyncio
import sys
import os

# Put worker dir in path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from main import verify_ssl, check_safe_browsing

async def test_ssl():
    print("--- SSL Check Test ---")
    urls = ["https://google.com", "https://expired.badssl.com", "http://neverssl.com"]
    for url in urls:
        print(f"\nURL: {url}")
        res = await verify_ssl(url)
        print(res)

async def test_safe_browsing():
    print("\n--- Safe Browsing Check Test ---")
    res = await check_safe_browsing("http://malware.testing.google.test/testing/malware/")
    print("Malware URL:", res)
    res2 = await check_safe_browsing("https://google.com")
    print("Clean URL:", res2)

async def run_all():
    await test_ssl()
    await test_safe_browsing()

if __name__ == "__main__":
    asyncio.run(run_all())
