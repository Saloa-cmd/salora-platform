import { NextResponse, type NextRequest } from "next/server";
import { createContentSecurityPolicy } from "@/lib/server/contentSecurityPolicy";

function requestId(request: NextRequest): string {
  const candidate = request.headers.get("x-request-id");
  return candidate && /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/.test(candidate)
    ? candidate
    : crypto.randomUUID();
}

export function proxy(request: NextRequest) {
  const id = requestId(request);
  const nonce = crypto.randomUUID().replaceAll("-", "");
  const contentSecurityPolicy = createContentSecurityPolicy(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", id);
  requestHeaders.set("x-nonce", nonce);
  // Next.js reads the request CSP while rendering and applies the nonce to its
  // generated framework scripts and style elements.
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("x-request-id", id);
  response.headers.set("Content-Security-Policy", contentSecurityPolicy);
  response.headers.set("X-DNS-Prefetch-Control", "on");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");

  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|brand/).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" }
      ]
    }
  ]
};
