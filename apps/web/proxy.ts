import { NextResponse, type NextRequest } from "next/server";

const requestWindowMs = 60_000;
const maxRequestsPerWindow = 120;
const requestCounts = new Map<string, { count: number; resetAt: number }>();

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://wa.me https://api.whatsapp.com",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "upgrade-insecure-requests"
].join("; ");

function getClientKey(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(key);

  if (!record || record.resetAt <= now) {
    requestCounts.set(key, { count: 1, resetAt: now + requestWindowMs });
    return false;
  }

  record.count += 1;
  return record.count > maxRequestsPerWindow;
}

export function proxy(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  const key = getClientKey(request);

  if (isRateLimited(key)) {
    return NextResponse.json(
      { error: "Rate limit exceeded", requestId },
      {
        status: 429,
        headers: {
          "x-request-id": requestId,
          "retry-after": "60"
        }
      }
    );
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("x-request-id", requestId);
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-DNS-Prefetch-Control", "on");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand/).*)"]
};
