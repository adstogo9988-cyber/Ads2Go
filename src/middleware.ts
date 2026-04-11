import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  
  // Enforce HTTPS and WWW only in production environments
  if (process.env.NODE_ENV === "production" && process.env.VERCEL) {
    const isAd2GoDomain = url.hostname === "ad2vo.com";
    const isHttp = url.protocol === "http:";

    if (isAd2GoDomain || isHttp) {
      url.hostname = "www.ad2vo.com";
      url.protocol = "https:";
      return NextResponse.redirect(url, 301);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - internal api and auth paths
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
