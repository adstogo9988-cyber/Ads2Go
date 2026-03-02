import traceback
import asyncio
from main import process_scan
import os

WHOIS_XML_API_KEY = os.getenv("WHOIS_XML_API_KEY")

async def test():
    try:
        await process_scan({"id": "3f9b21d4-ed02-4c1b-9057-904676c9a302", "site_id": "b51fbe5f-e8b0-4a38-a61a-a736df8f5924"})
    except Exception as e:
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())
