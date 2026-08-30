import { createHash, randomBytes } from "node:crypto";
import { connectRedis, SYSTEM_AUTH_CONTEXT, withPrismaAuthContext, withPrismaAuthContextTx } from "@salora/backend";
import { hashPassword } from "./crypto";

const RESET_TTL_SECONDS = 15 * 60;
const RESET_KEY_PREFIX = "auth:password-reset:";

export class PasswordResetConfigurationError extends Error {}
export class PasswordResetTokenError extends Error {}

function resetSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SALORA_SITE_URL?.trim();
  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  const value = configured || (vercelHost ? `https://${vercelHost}` : "");
  if (!value) throw new PasswordResetConfigurationError("Password reset site URL is unavailable.");
  const url = new URL(value);
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new PasswordResetConfigurationError("Password reset requires HTTPS.");
  }
  return url;
}

function emailConfiguration() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.SALORA_PASSWORD_RESET_FROM?.trim();
  if (!apiKey || !from) throw new PasswordResetConfigurationError("Password reset email is not configured.");
  return { apiKey, from, siteUrl: resetSiteUrl() };
}

function tokenDigest(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function resetKey(token: string) {
  return `${RESET_KEY_PREFIX}${tokenDigest(token)}`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] || character);
}

async function sendResetEmail(input: { apiKey: string; from: string; to: string; name: string; resetUrl: string; idempotencyKey: string }) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${input.apiKey}`,
      "content-type": "application/json",
      "idempotency-key": input.idempotencyKey
    },
    body: JSON.stringify({
      from: input.from,
      to: [input.to],
      subject: "استعادة كلمة مرور SALORA | SALORA password reset",
      html: `<div dir="rtl" style="font-family:Arial,sans-serif;max-width:560px;margin:auto;background:#111;color:#f5efe3;padding:32px;border-radius:20px"><p style="color:#c9a45c;letter-spacing:.2em">SALORA</p><h1>استعادة كلمة المرور</h1><p>مرحبًا ${escapeHtml(input.name)}، تلقينا طلبًا لتغيير كلمة مرور لوحة التحكم.</p><p><a href="${escapeHtml(input.resetUrl)}" style="display:inline-block;background:#f5efe3;color:#111;padding:14px 22px;border-radius:12px;text-decoration:none;font-weight:700">تعيين كلمة مرور جديدة</a></p><p style="color:#9c9387">الرابط صالح لمدة 15 دقيقة ولمرة واحدة. تجاهل الرسالة إذا لم تطلب الاستعادة.</p><hr style="border-color:#2a2825"><p dir="ltr">This one-time link expires in 15 minutes. Ignore this email if you did not request a password reset.</p></div>`
    }),
    cache: "no-store"
  });
  if (!response.ok) throw new Error(`Password reset delivery failed with status ${response.status}.`);
}

export async function requestPasswordReset(email: string, meta: { requestId: string; ipAddress?: string; userAgent?: string }) {
  const configuration = emailConfiguration();
  const normalizedEmail = email.trim().toLowerCase();
  const user = await withPrismaAuthContext(SYSTEM_AUTH_CONTEXT, (tx) => tx.user.findUnique({ where: { email: normalizedEmail } }));
  if (!user?.isActive) return { accepted: true };

  const token = randomBytes(32).toString("base64url");
  const redis = await connectRedis();
  const key = resetKey(token);
  const stored = await redis.set(key, JSON.stringify({ userId: user.id, email: user.email }), "EX", RESET_TTL_SECONDS, "NX");
  if (stored !== "OK") throw new Error("Password reset token could not be reserved.");

  const resetUrl = new URL("/reset-password", configuration.siteUrl);
  resetUrl.hash = new URLSearchParams({ token }).toString();
  try {
    await sendResetEmail({
      apiKey: configuration.apiKey,
      from: configuration.from,
      to: user.email,
      name: user.name,
      resetUrl: resetUrl.toString(),
      idempotencyKey: `password-reset-${tokenDigest(token)}`
    });
  } catch (error) {
    await redis.del(key);
    throw error;
  }

  await withPrismaAuthContextTx(SYSTEM_AUTH_CONTEXT, async (tx) => {
    await tx.activityLog.create({
      data: { actorId: user.id, actorType: "password-reset", action: "auth.passwordResetRequested", entityType: "User", entityId: user.id, requestId: meta.requestId, ipAddress: meta.ipAddress, userAgent: meta.userAgent, metadata: { delivery: "email", expiresInSeconds: RESET_TTL_SECONDS } }
    });
  });
  return { accepted: true };
}

export async function confirmPasswordReset(input: { token: string; password: string; requestId: string; ipAddress?: string; userAgent?: string }) {
  const redis = await connectRedis();
  const key = resetKey(input.token);
  const raw = await redis.eval("local value = redis.call('GET', KEYS[1]); if value then redis.call('DEL', KEYS[1]); end; return value", 1, key);
  if (typeof raw !== "string") throw new PasswordResetTokenError("Password reset token is invalid or expired.");

  let claim: { userId: string; email: string };
  try {
    claim = JSON.parse(raw) as { userId: string; email: string };
  } catch {
    throw new PasswordResetTokenError("Password reset token is invalid or expired.");
  }
  if (!claim.userId || !claim.email) throw new PasswordResetTokenError("Password reset token is invalid or expired.");

  const passwordHash = await hashPassword(input.password);
  const now = new Date();
  await withPrismaAuthContextTx(SYSTEM_AUTH_CONTEXT, async (tx) => {
    const user = await tx.user.findUnique({ where: { id: claim.userId } });
    if (!user?.isActive || user.email.toLowerCase() !== claim.email.toLowerCase()) throw new PasswordResetTokenError("Password reset token is invalid or expired.");
    await tx.user.update({ where: { id: user.id }, data: { passwordHash } });
    const revoked = await tx.session.updateMany({ where: { userId: user.id, status: "ACTIVE" }, data: { status: "REVOKED", revokedAt: now } });
    await tx.activityLog.create({
      data: { actorId: user.id, actorType: "password-reset", action: "auth.passwordResetCompleted", entityType: "User", entityId: user.id, requestId: input.requestId, ipAddress: input.ipAddress, userAgent: input.userAgent, metadata: { sessionsRevoked: revoked.count } }
    });
    await tx.auditLog.create({
      data: { actorId: user.id, action: "UPDATE", entityType: "User", entityId: user.id, before: { passwordHashStored: true }, after: { passwordHashStored: true, sessionsRevoked: revoked.count }, requestId: input.requestId, reason: "One-time email password reset" }
    });
  });
  return { reset: true };
}
