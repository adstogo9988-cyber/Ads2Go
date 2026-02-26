import asyncio
from main import process_scan
import os
import sys

# use scan id dfdb36ed-05bb-4ee8-8e19-fd51e07d4b79
# site_id 2e0914d9-b548-4bcd-a18c-48d82e223114

async def test():
    scan_record = {
        "id": "dfdb36ed-05bb-4ee8-8e19-fd51e07d4b79",
        "site_id": "2e0914d9-b548-4bcd-a18c-48d82e223114"
    }
    print("Running process_scan locally...")
    await process_scan(scan_record)
    print("Finished.")

if __name__ == "__main__":
    asyncio.run(test())
