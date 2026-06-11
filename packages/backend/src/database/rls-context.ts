import { Prisma } from "./generated/client";
import { connectPrisma } from "./prisma";
import { withSpan } from "../observability/tracing";
import { incrementMetric } from "../runtime/metrics";

export interface PrismaAuthContext {
  userId: string;
  roles: string[];
  dbRole?: "authenticated" | "service_role";
}

type SaloraPrismaClient = Awaited<ReturnType<typeof connectPrisma>>;
export type PrismaTransactionClient = Parameters<Parameters<SaloraPrismaClient["$transaction"]>[0]>[0];

export const SYSTEM_AUTH_CONTEXT: PrismaAuthContext = {
  userId: "00000000-0000-0000-0000-000000000000",
  roles: ["ADMIN", "MANAGER", "STAFF", "SERVICE"],
  dbRole: "service_role"
};

function assertAuthContext(context: PrismaAuthContext): PrismaAuthContext {
  if (!context.userId || !Array.isArray(context.roles) || context.roles.length === 0) {
    incrementMetric("salora_rls_context_rejections_total");
    throw new Error("RLS auth context is required.");
  }

  return context;
}

async function setAuthContext(tx: PrismaTransactionClient, context: PrismaAuthContext) {
  const dbRole = context.dbRole ?? "authenticated";
  const claims = {
    sub: context.userId,
    role: dbRole,
    app_metadata: { roles: context.roles }
  };

  await tx.$executeRaw`
    select
      set_config('request.jwt.claim.sub', ${context.userId}, true),
      set_config('request.jwt.claim.role', ${dbRole}, true),
      set_config('request.jwt.claims', ${JSON.stringify(claims)}, true),
      set_config('app.current_user_id', ${context.userId}, true),
      set_config('app.user_roles', ${JSON.stringify(context.roles)}, true)
  `;
}

/**
 * Executes a Prisma operation with RLS context set.
 * Sets PostgreSQL session variables for row-level security.
 * @param context Auth context with userId and roles
 * @param operation Function that receives Prisma client with RLS context set
 */
export async function withPrismaAuthContext<T>(
  context: PrismaAuthContext,
  operation: (tx: PrismaTransactionClient) => Promise<T>
): Promise<T> {
  return withPrismaAuthContextTx(context, operation);
}

/**
 * Executes a transaction with RLS context set.
 * All queries within the transaction will have RLS context applied.
 * @param context Auth context with userId and roles
 * @param operation Function that receives transaction client with RLS context set
 */
export async function withPrismaAuthContextTx<T>(
  context: PrismaAuthContext,
  operation: (tx: PrismaTransactionClient) => Promise<T>
): Promise<T> {
  const authContext = assertAuthContext(context);

  return withSpan("database.rls-transaction", { "rls.user": authContext.userId, "rls.role": authContext.dbRole ?? "authenticated" }, async () => {
    const prisma = await connectPrisma();

    return prisma.$transaction(async (tx) => {
      await setAuthContext(tx, authContext);

      try {
        return await operation(tx);
      } catch (error) {
        incrementMetric("salora_rls_transaction_failures_total");
        throw error;
      }
    });
  });
}

/**
 * Verifies RLS context is set in the current session.
 * Used for testing/validation purposes.
 */
export async function verifyRLSContext(context: PrismaAuthContext): Promise<boolean> {
  return withPrismaAuthContext(context, async (prisma) => {
    const result = await prisma.$queryRaw<Array<{ user_id: string; user_roles: string; jwt_claims: Prisma.JsonValue }>>`
      SELECT current_setting('app.current_user_id', true) as user_id,
             current_setting('app.user_roles', true) as user_roles,
             current_setting('request.jwt.claims', true)::jsonb as jwt_claims
    `;

    const row = result[0];
    return row?.user_id === context.userId && row?.user_roles === JSON.stringify(context.roles);
  });
}
