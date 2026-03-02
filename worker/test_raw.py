import os
import httpx
import asyncio
from dotenv import load_dotenv
import json

load_dotenv()
WHOIS_XML_API_KEY = os.getenv("WHOIS_XML_API_KEY")

async def main():
    api_url = f"https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey={WHOIS_XML_API_KEY}&domainName=google.com&outputFormat=JSON"
    async with httpx.AsyncClient() as client:
        r = await client.get(api_url)
        with open("raw_whois.json", "w") as f:
            f.write(r.text)

if __name__ == "__main__":
    asyncio.run(main())
