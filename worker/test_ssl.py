import ssl
import socket
import datetime
from urllib.parse import urlparse
import asyncio

async def verify_ssl(url):
    try:
        parsed = urlparse(url)
        host = parsed.netloc
        if not host:
            host = url.replace("https://", "").replace("http://", "")
        if ':' in host:
            host = host.split(':')[0]
            
        port = 443
        context = ssl.create_default_context()
        
        def fetch_cert():
            with socket.create_connection((host, port), timeout=5.0) as sock:
                with context.wrap_socket(sock, server_hostname=host) as ssock:
                    return ssock.getpeercert(), ssock.version()
        
        cert, tls_version = await asyncio.to_thread(fetch_cert)
        
        not_after_str = cert.get('notAfter')
        if not_after_str:
            not_after = datetime.datetime.strptime(not_after_str, '%b %d %H:%M:%S %Y %Z')
            days_left = (not_after - datetime.datetime.utcnow()).days
            is_valid = days_left > 0
            
            issuer = "Unknown"
            for rdn in cert.get('issuer', []):
                for attr, value in rdn:
                    if attr == 'organizationName':
                        issuer = value
                        break
            
            return {
                "status": "passed" if is_valid else "failed",
                "valid": is_valid,
                "days_remaining": days_left,
                "issuer": issuer,
                "protocol": tls_version if tls_version else "HTTPS"
            }
        return {"status": "failed", "error": "Could not parse expiration date", "protocol": "HTTPS"}
    except Exception as e:
        return {"status": "failed", "error": str(e), "protocol": "HTTP"}

async def main():
    print("Google:", await verify_ssl("https://google.com"))
    print("Expired:", await verify_ssl("https://expired.badssl.com"))

asyncio.run(main())
