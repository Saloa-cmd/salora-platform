import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "./generated/client.ts";

export const P22C3C_PRODUCTION_PROJECT_REF = "grcycqdtjjfklibutfos";

export const P22C3C_ISOLATION_LEVELS = {
  snapshot: Prisma.TransactionIsolationLevel.RepeatableRead,
  preflight: Prisma.TransactionIsolationLevel.Serializable
} as const;

const forbiddenProjectRefs = [
  "wauwsfrckjjwwmdhifjt",
  "axpwsqahswkobrjvldrc"
] as const;

function decodedConnectionString(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function createP22C3CReadOnlyPrismaClient(databaseUrl: string) {
  if (!databaseUrl) {
    throw new Error("P22C3C_DATABASE_URL_MISSING");
  }

  const decoded = decodedConnectionString(databaseUrl);

  if (!decoded.includes(P22C3C_PRODUCTION_PROJECT_REF)) {
    throw new Error("P22C3C_PRODUCTION_DATABASE_IDENTITY_MISMATCH");
  }

  for (const forbiddenRef of forbiddenProjectRefs) {
    if (decoded.includes(forbiddenRef)) {
      throw new Error("P22C3C_FORBIDDEN_DATABASE_IDENTITY");
    }
  }

  let url: URL;

  try {
    url = new URL(databaseUrl);
  } catch {
    throw new Error("P22C3C_DATABASE_URL_INVALID");
  }

  if (!["postgres:", "postgresql:"].includes(url.protocol)) {
    throw new Error("P22C3C_DATABASE_URL_NOT_POSTGRESQL");
  }

  const existingOptions = url.searchParams.get("options") ?? "";

  url.searchParams.set(
    "application_name",
    "salora_p22c3c_runtime_readonly"
  );

  url.searchParams.set(
    "options",
    [
      existingOptions,
      "-c default_transaction_read_only=on",
      "-c statement_timeout=45000",
      "-c lock_timeout=5000",
      "-c idle_in_transaction_session_timeout=45000"
    ]
      .filter(Boolean)
      .join(" ")
  );

  const adapter = new PrismaPg({
    connectionString: url.toString()
  });

  return new PrismaClient({ adapter });
}
