import { createHmac, timingSafeEqual } from "node:crypto";
import { getWhatsAppEnv } from "./config";

export function verifyWhatsAppChallenge(input: { mode?: string | null; token?: string | null; challenge?: string | null }): string | undefined {
  const env = getWhatsAppEnv();
  if (input.mode === "subscribe" && env.WHATSAPP_VERIFY_TOKEN && input.token === env.WHATSAPP_VERIFY_TOKEN) {
    return input.challenge ?? "";
  }
  return undefined;
}

export function verifyWhatsAppSignature(rawBody: string, signatureHeader?: string | null): boolean {
  const appSecret = getWhatsAppEnv().WHATSAPP_APP_SECRET;
  if (!appSecret) {
    return process.env.NODE_ENV !== "production";
  }

  if (!signatureHeader?.startsWith("sha256=")) return false;
  const expected = `sha256=${createHmac("sha256", appSecret).update(rawBody).digest("hex")}`;
  if (Buffer.byteLength(expected) !== Buffer.byteLength(signatureHeader)) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
}

export function sanitizeWhatsAppText(text: string): string {
  return text.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 1000);
}
