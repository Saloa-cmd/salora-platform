import { hash as argon2Hash, verify as argon2Verify } from "@node-rs/argon2";
import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const passwordKeyLength = 64;

function base64Url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function fromBase64Url(input: string): Buffer {
  return Buffer.from(input, "base64url");
}

export async function hashPassword(password: string): Promise<string> {
  return argon2Hash(password, {
    algorithm: 2,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1
  });
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  if (passwordHash.startsWith("$argon2")) {
    return argon2Verify(passwordHash, password);
  }

  const [, version, salt, hash] = passwordHash.split("$");

  if (version !== "v=1" || !salt || !hash) {
    return false;
  }

  const expected = fromBase64Url(hash);
  const actual = (await scrypt(password, salt, expected.length)) as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function hashToken(token: string): string {
  return createHmac("sha256", "salora-refresh-token").update(token).digest("base64url");
}

export function createRefreshToken(): string {
  return randomBytes(48).toString("base64url");
}

export type JwtPayload = {
  sub: string;
  email: string;
  roles: string[];
  sessionId?: string;
  type: "access" | "refresh";
  iat?: number;
  exp?: number;
};

export function signJwt(payload: JwtPayload, secret: string, ttlSeconds: number): string {
  const issuedAt = Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", typ: "JWT" };
  const body = { ...payload, iat: issuedAt, exp: issuedAt + ttlSeconds };
  const unsigned = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(body))}`;
  const signature = createHmac("sha256", secret).update(unsigned).digest("base64url");
  return `${unsigned}.${signature}`;
}

export function verifyJwt(token: string, secret: string): JwtPayload {
  const [encodedHeader, encodedPayload, signature] = token.split(".");

  if (!encodedHeader || !encodedPayload || !signature) {
    throw new Error("Invalid JWT format.");
  }

  const unsigned = `${encodedHeader}.${encodedPayload}`;
  const expected = createHmac("sha256", secret).update(unsigned).digest("base64url");

  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    throw new Error("Invalid JWT signature.");
  }

  const payload = JSON.parse(fromBase64Url(encodedPayload).toString("utf8")) as JwtPayload;

  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("JWT expired.");
  }

  return payload;
}
