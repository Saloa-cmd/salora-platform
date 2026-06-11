import { disconnectPrisma, getPrismaClient } from "../packages/backend/src/database/prisma.ts";
import { hashPassword } from "../apps/web/lib/server/auth/crypto.ts";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

function loadDotEnv() {
  const envPath = join(process.cwd(), ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([^#=]+)=(.*)$/);
    if (match && process.env[match[1].trim()] === undefined) {
      process.env[match[1].trim()] = match[2].trim().replace(/^"|"$/g, "");
    }
  }
}

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required for SALORA admin bootstrap.`);
  return value;
}

loadDotEnv();

if (process.env.SALORA_ADMIN_BOOTSTRAP_ENABLED !== "true") {
  throw new Error("SALORA_ADMIN_BOOTSTRAP_ENABLED must be true to run admin bootstrap.");
}

const email = required("SALORA_ADMIN_BOOTSTRAP_EMAIL").toLowerCase();
const name = required("SALORA_ADMIN_BOOTSTRAP_NAME");
const password = required("SALORA_ADMIN_BOOTSTRAP_PASSWORD");

if (password.length < 16) {
  throw new Error("SALORA_ADMIN_BOOTSTRAP_PASSWORD must be at least 16 characters.");
}

const prisma = getPrismaClient();
const requestId = `admin-bootstrap-${crypto.randomUUID()}`;

try {
  const passwordHash = await hashPassword(password);
  const role = await prisma.role.upsert({
    where: { name: "ADMIN" },
    create: { name: "ADMIN", description: "Enterprise administrator" },
    update: { description: "Enterprise administrator" }
  });
  const before = await prisma.user.findUnique({ where: { email }, include: { roles: { include: { role: true } } } });
  const user = await prisma.user.upsert({
    where: { email },
    create: { email, name, passwordHash, isActive: true },
    update: { name, passwordHash, isActive: true }
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: role.id } },
    create: { userId: user.id, roleId: role.id },
    update: {}
  });
  await prisma.runtimeConfiguration.upsert({
    where: { scope_key: { scope: "APP", key: `admin.password_rotation_required.${user.id}` } },
    create: {
      scope: "APP",
      key: `admin.password_rotation_required.${user.id}`,
      value: { required: true, reason: "bootstrap_admin", requestId },
      isActive: true,
      createdBy: user.id,
      updatedBy: user.id
    },
    update: {
      value: { required: true, reason: "bootstrap_admin", requestId },
      isActive: true,
      updatedBy: user.id
    }
  });
  await prisma.activityLog.create({
    data: {
      actorId: user.id,
      actorType: "system",
      action: "admin.bootstrap",
      entityType: "User",
      entityId: user.id,
      requestId,
      metadata: { rotationRequired: true }
    }
  });
  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: before ? "UPDATE" : "CREATE",
      entityType: "User",
      entityId: user.id,
      before: before ? { id: before.id, email: before.email, roles: before.roles.map((entry) => entry.role.name) } : undefined,
      after: { id: user.id, email: user.email, roles: ["ADMIN"], passwordHashStored: true, rotationRequired: true },
      requestId,
      reason: "Environment-controlled first admin bootstrap"
    }
  });
  console.log(`SALORA admin bootstrap completed for ${email}. Password rotation required. requestId=${requestId}`);
} finally {
  await disconnectPrisma();
}
