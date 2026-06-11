import { getAuthEnv } from "./env";
import { MemoryAuthRepository } from "./memoryRepository";
import { PrismaAuthRepository } from "./prismaRepository";
import type { AuthRepository } from "./repository";
import { AuthService } from "./service";

const runtimeEnv = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};

const fallbackEnv = {
  DATABASE_URL: runtimeEnv.DATABASE_URL || "postgresql://salora:salora@localhost:5432/salora",
  JWT_SECRET: runtimeEnv.JWT_SECRET || "local-dev-only-salora-access-secret-32",
  JWT_REFRESH_SECRET: runtimeEnv.JWT_REFRESH_SECRET || "local-dev-only-salora-refresh-secret-32",
  AUTH_ACCESS_TTL_SECONDS: Number(runtimeEnv.AUTH_ACCESS_TTL_SECONDS || 900),
  AUTH_REFRESH_TTL_DAYS: Number(runtimeEnv.AUTH_REFRESH_TTL_DAYS || 30)
};

const globalAuth = globalThis as typeof globalThis & {
  saloraMemoryAuthRepository?: MemoryAuthRepository;
  saloraPrismaAuthRepository?: PrismaAuthRepository;
};

function getRepository(): AuthRepository {
  if (runtimeEnv.NODE_ENV !== "production") {
    globalAuth.saloraMemoryAuthRepository ??= new MemoryAuthRepository();
    return globalAuth.saloraMemoryAuthRepository;
  }

  globalAuth.saloraPrismaAuthRepository ??= new PrismaAuthRepository();
  return globalAuth.saloraPrismaAuthRepository;
}

export function getAuthService(): AuthService {
  const env = runtimeEnv.NODE_ENV === "production" ? getAuthEnv() : fallbackEnv;
  return new AuthService(getRepository(), env);
}
