import { createHash, timingSafeEqual } from "node:crypto";
import { SYSTEM_AUTH_CONTEXT, withPrismaAuthContext, withPrismaAuthContextTx } from "@salora/backend";
import { hashPassword } from "./crypto";

const RECOVERY_KEY = "owner.recovery.completed";
const LOCK_KEY = "salora:owner-admin-recovery";
const DEFAULT_OWNER_EMAIL = "admin@salora.cafe";

export class OwnerRecoveryUnavailableError extends Error {}

function recoveryConfiguration() {
  if (process.env.VERCEL_ENV !== "production" || process.env.SALORA_OWNER_RECOVERY_ENABLED !== "true") {
    throw new OwnerRecoveryUnavailableError("Owner recovery is unavailable.");
  }

  const token = process.env.SALORA_OWNER_RECOVERY_TOKEN?.trim();
  if (!token || token.length < 32) throw new OwnerRecoveryUnavailableError("Owner recovery is unavailable.");
  return {
    token,
    email: (process.env.SALORA_OWNER_RECOVERY_EMAIL || DEFAULT_OWNER_EMAIL).trim().toLowerCase()
  };
}

function tokensMatch(candidate: string, expected: string) {
  const candidateHash = createHash("sha256").update(candidate).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(candidateHash, expectedHash);
}

export async function ownerRecoveryAvailable() {
  try {
    recoveryConfiguration();
    return withPrismaAuthContext(SYSTEM_AUTH_CONTEXT, async (tx) => {
      const [completed, adminCount] = await Promise.all([
        tx.runtimeConfiguration.findUnique({ where: { scope_key: { scope: "APP", key: RECOVERY_KEY } } }),
        tx.user.count({ where: { roles: { some: { role: { name: "ADMIN" } } } } })
      ]);
      return !completed?.isActive && adminCount === 0;
    });
  } catch {
    return false;
  }
}

export async function recoverOwnerAdmin(input: { email: string; name: string; password: string; recoveryToken: string; requestId: string; ipAddress?: string; userAgent?: string }) {
  const configuration = recoveryConfiguration();
  if (input.email.toLowerCase() !== configuration.email || !tokensMatch(input.recoveryToken, configuration.token)) {
    throw new OwnerRecoveryUnavailableError("Owner recovery authorization failed.");
  }

  const passwordHash = await hashPassword(input.password);
  return withPrismaAuthContextTx(SYSTEM_AUTH_CONTEXT, async (tx) => {
    await tx.$executeRaw`select pg_advisory_xact_lock(hashtextextended(${LOCK_KEY}, 0))`;
    const completed = await tx.runtimeConfiguration.findUnique({ where: { scope_key: { scope: "APP", key: RECOVERY_KEY } } });
    const adminCount = await tx.user.count({ where: { roles: { some: { role: { name: "ADMIN" } } } } });
    if (completed?.isActive || adminCount > 0) throw new OwnerRecoveryUnavailableError("Owner recovery has already been completed.");

    const existingOwner = await tx.user.findUnique({ where: { email: configuration.email } });
    if (existingOwner) throw new OwnerRecoveryUnavailableError("Owner recovery requires operator review.");

    const role = await tx.role.upsert({
      where: { name: "ADMIN" },
      create: { name: "ADMIN", description: "Enterprise administrator" },
      update: { description: "Enterprise administrator" }
    });
    const now = new Date();
    const user = await tx.user.create({
      data: {
        email: configuration.email,
        name: input.name,
        passwordHash,
        isActive: true,
        emailVerifiedAt: now,
        roles: { create: { roleId: role.id } }
      }
    });

    await tx.runtimeConfiguration.upsert({
      where: { scope_key: { scope: "APP", key: RECOVERY_KEY } },
      create: { scope: "APP", key: RECOVERY_KEY, value: { completed: true, requestId: input.requestId, completedAt: now.toISOString() }, isActive: true, createdBy: user.id, updatedBy: user.id },
      update: { value: { completed: true, requestId: input.requestId, completedAt: now.toISOString() }, isActive: true, updatedBy: user.id }
    });
    await tx.activityLog.create({
      data: { actorId: user.id, actorType: "owner-recovery", action: "admin.ownerRecovery", entityType: "User", entityId: user.id, requestId: input.requestId, ipAddress: input.ipAddress, userAgent: input.userAgent, metadata: { email: configuration.email, oneTime: true } }
    });
    await tx.auditLog.create({
      data: { actorId: user.id, action: "CREATE", entityType: "User", entityId: user.id, after: { email: configuration.email, roles: ["ADMIN"], passwordHashStored: true, emailVerified: true }, requestId: input.requestId, reason: "One-time owner recovery after certified zero-admin preflight" }
    });

    return { email: user.email, completedAt: now.toISOString() };
  });
}
