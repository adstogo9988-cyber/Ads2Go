import asyncio
import socket
import httpx
from urllib.parse import urlparse
import datetime

async def detect_server_ip(domain: str) -> list:
    """Resolve domain to list of A records using python's socket."""
    clean_domain = domain.replace("https://", "").replace("http://", "").rstrip("/").split("/")[0]
    try:
        # gethostbyname_ex returns (hostname, aliaslist, ipaddrlist)
        _, _, ip_addresses = socket.gethostbyname_ex(clean_domain)
        return ip_addresses
    except socket.gaierror:
        return []
    except Exception as e:
        print(f"Error resolving IP for {domain}: {e}")
        return []

async def detect_hosting_provider(ips: list) -> str:
    """Reverse DNS lookup on first IP to identify hosting provider."""
    provider = "Unknown"
    if not ips: return provider
    
    first_ip = ips[0]
    try:
        hostname, _, _ = socket.gethostbyaddr(first_ip)
        hostname = hostname.lower()
        if "google" in hostname or "1e100" in hostname:
            provider = "Google Cloud"
        elif "amazonaws" in hostname:
            provider = "AWS"
        elif "cloudflare" in hostname:
            provider = "Cloudflare"
        elif "fastly" in hostname:
            provider = "Fastly"
        elif "linode" in hostname or "akamai" in hostname:
            provider = "Akamai / Linode"
        elif "digitalocean" in hostname:
            provider = "DigitalOcean"
        elif "ovh" in hostname:
            provider = "OVH"
        elif "hostgator" in hostname:
            provider = "HostGator"
        elif "vultr" in hostname:
            provider = "Vultr"
        else:
            # Maybe return the base domain as the provider name
            parts = hostname.split('.')
            if len(parts) >= 2:
                provider = ".".join(parts[-2:]).capitalize()
    except socket.herror:
        # Unknown host
        pass
    except Exception as e:
        print(f"Error reverse DNS {first_ip}: {e}")
    
    return provider

async def detect_cdn(headers: dict, domain: str) -> dict:
    """Check common CDN footprints in HTTP headers."""
    cdn_detected = False
    provider = None
    
    # Headers are usually lowercased if we use httpx response.headers
    server = headers.get("server", "").lower()
    x_cache = headers.get("x-cache", "").lower()
    
    if "cloudflare" in server or "cf-ray" in headers:
        cdn_detected = True
        provider = "Cloudflare"
    elif "akamai" in server or "akamai" in x_cache:
        cdn_detected = True
        provider = "Akamai"
    elif "amazon" in server or "cloudfront" in x_cache:
        cdn_detected = True
        provider = "AWS CloudFront"
    elif "fastly" in server or "fastly" in x_cache:
        cdn_detected = True
        provider = "Fastly"
    elif "bunny" in server.split('-') or "bunnycdn" in headers.get("server", "").lower():
        cdn_detected = True
        provider = "BunnyCDN"
        
    return {
        "cdn_detected": cdn_detected,
        "cdn_provider": provider
    }

async def check_http2_http3(url: str) -> dict:
    """Check if server supports HTTP/2 and HTTP/3 via secure HTTPS method."""
    h2_supported = False
    h3_supported = False
    try:
        async with httpx.AsyncClient(http2=True, verify=False, timeout=10.0) as client:
            resp = await client.get(url)
            # Check http_version
            if resp.http_version == "HTTP/2":
                h2_supported = True
            
            # Check for HTTP/3 in Alt-Svc
            alt_svc = resp.headers.get("alt-svc", "").lower()
            if "h3" in alt_svc or "quic" in alt_svc:
                h3_supported = True
                
    except Exception as e:
         print(f"HTTP/2 check failed: {e}")
         
    return {
        "http2_supported": h2_supported,
        "http3_supported": h3_supported
    }


async def test_domain(url: str):
    parsed = urlparse(url)
    domain = parsed.netloc or parsed.path
    print(f"\n--- Testing {domain} ---")
    
    ips = await detect_server_ip(domain)
    print(f"IPs: {ips}")
    
    host = await detect_hosting_provider(ips)
    print(f"Hosting: {host}")
    
    # Needs headers
    try:
        async with httpx.AsyncClient(verify=False, follow_redirects=True, timeout=10.0) as client:
            r = await client.get(url)
            cdn = await detect_cdn(r.headers, domain)
            print(f"CDN: {cdn}")
    except Exception as e:
        print("Could not fetch to get headers:", e)
        
    h2h3 = await check_http2_http3(url)
    print(f"HTTP/2 & HTTP/3: {h2h3}")

async def main():
    domains = [
        "https://ads2go.org",
        "https://google.com",
        "https://cloudflare.com"
    ]
    await asyncio.gather(*(test_domain(d) for d in domains))


if __name__ == "__main__":
    asyncio.run(main())
