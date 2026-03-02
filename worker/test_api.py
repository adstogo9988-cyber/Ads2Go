import asyncio
import sys
import os
from dotenv import load_dotenv

load_dotenv()
from main import fetch_domain_age, fetch_similarweb_data

async def main():
    original_stdout = sys.stdout
    with open("test_output2.txt", "w", encoding="utf-8") as f:
        sys.stdout = f
        print("Testing fetch_domain_age for google.com...")
        age = await fetch_domain_age("google.com")
        print(f"Age result: {age}")
        
        print("\nTesting fetch_similarweb_data for google.com...")
        traffic = await fetch_similarweb_data("google.com")
        print(f"Traffic result: {traffic}")
        sys.stdout = original_stdout

if __name__ == "__main__":
    asyncio.run(main())
