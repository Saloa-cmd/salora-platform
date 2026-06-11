import { type NextResponse } from "next/server";
import type { AuthResult } from "./types";

export const accessTokenCookieName = "salora_access_token";
export const refreshTokenCookieName = "salora_refresh_token";

function secureCookie() {
  return process.env.NODE_ENV === "production";
}

export function applyAuthCookies(response: NextResponse, result: AuthResult): NextResponse {
  response.cookies.set(accessTokenCookieName, result.tokens.accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookie(),
    path: "/",
    maxAge: Math.max(1, Math.floor((Date.parse(result.tokens.accessTokenExpiresAt) - Date.now()) / 1000))
  });
  response.cookies.set(refreshTokenCookieName, result.tokens.refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookie(),
    path: "/",
    maxAge: Math.max(1, Math.floor((Date.parse(result.tokens.refreshTokenExpiresAt) - Date.now()) / 1000))
  });
  return response;
}

export function clearAuthCookies(response: NextResponse): NextResponse {
  for (const name of [accessTokenCookieName, refreshTokenCookieName]) {
    response.cookies.set(name, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: secureCookie(),
      path: "/",
      maxAge: 0
    });
  }
  return response;
}
