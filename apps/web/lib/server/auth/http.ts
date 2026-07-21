import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAuthService } from "./runtime";
import { roleNames } from "./types";
import { accessTokenCookieName } from "./cookies";

export const registerSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().trim().min(2).max(120),
  password: z.string().min(12).max(256)
});

export const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(256)
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(20)
});

export function bearerToken(request: NextRequest): string | null {
  const header = request.headers.get("authorization");

  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length);
}

export function clientMeta(request: NextRequest) {
  return {
    ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    userAgent: request.headers.get("user-agent") ?? undefined
  };
}

export function jsonError(message: string, status = 400, requestId?: string) {
  return NextResponse.json({ error: message, requestId }, { status });
}

export async function currentAuthPayload(request: NextRequest) {
  // Browser sessions use an HttpOnly cookie. Keep bearer-token support for
  // trusted API clients, but never require browser code to copy a JWT into
  // localStorage where it would be exposed to JavaScript.
  const token = bearerToken(request) ?? request.cookies.get(accessTokenCookieName)?.value;

  if (!token) {
    throw new Error("Missing bearer token.");
  }

  return getAuthService().verifyAccessToken(token);
}
