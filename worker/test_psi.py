import asyncio
import os
import sys
from dotenv import load_dotenv

load_dotenv('.env.local')

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from worker.main import fetch_pagespeed_data

async def test():
    print(f"Key loaded: {'Yes' if os.environ.get('NEXT_PUBLIC_GOOGLE_PAGESPEED_API_KEY') else 'No'}")
    res = await fetch_pagespeed_data('https://example.com')
    print('Result:', res)

if __name__ == '__main__':
    asyncio.run(test())
