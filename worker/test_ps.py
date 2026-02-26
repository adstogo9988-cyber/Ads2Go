import asyncio
from main import fetch_pagespeed_data
import os

async def test_pagespeed():
    result = await fetch_pagespeed_data("https://example.com")
    print("PageSpeed Result:")
    print(result)

if __name__ == "__main__":
    asyncio.run(test_pagespeed())
