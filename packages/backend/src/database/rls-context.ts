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
type PrismaOperationClient = PrismaTransactionClient;

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
 * Executes a Prisma operation with the requested authorization semantics.
 *
 * Authenticated/user-scoped reads still require an interactive transaction so
 * SET LOCAL-backed RLS claims remain pinned to the same database session.
 * Internal service-role reads do not require those session-local claims and
 * therefore use the connected Prisma client directly. Avoiding an unnecessary
 * interactive transaction is important for serverless + pooled PostgreSQL:
 * long pool waits must not consume Prisma's transaction lifetime and produce
 * P2028 "expired transaction" errors.
 *
 * Call withPrismaAuthContextTx explicitly whenever atomic transaction semantics
 * are required, including for service-role writes.
 */
export async function withPrismaAuthContext<T>(
  context: PrismaAuthContext,
  operation: (tx: PrismaOperationClient) => Promise<T>
): Promise<T> {
  const authContext = assertAuthContext(context);

  if (authContext.dbRole === "service_role") {
    return withSpan("database.service-role-operation", { "rls.user": authContext.userId, "rls.role": "service_role" }, async () => {
      const prisma = await connectPrisma();
      return operation(prisma as unknown as PrismaOperationClient);
    });
  }

  return withPrismaAuthContextTx(authContext, operation);
}

/**
 * Executes an atomic transaction with RLS context set.
 * All queries within the transaction will have RLS context applied.
 * The operation must await queries sequentially; an interactive transaction
 * owns one pg.Client and must not use Promise.all for database calls.
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
 * Used for testing/validation purposes. This intentionally forces the
 * authenticated transaction path even when the supplied context is privileged.
 */
export async function verifyRLSContext(context: PrismaAuthContext): Promise<boolean> {
  const verificationContext: PrismaAuthContext = {
    ...context,
    dbRole: context.dbRole === "service_role" ? "authenticated" : context.dbRole
  };

  return withPrismaAuthContextTx(verificationContext, async (prisma) => {
    const result = await prisma.$queryRaw<Array<{ user_id: string; user_roles: string; jwt_claims: Prisma.JsonValue }>>`
      SELECT current_setting('app.current_user_id', true) as user_id,
             current_setting('app.user_roles', true) as user_roles,
             current_setting('request.jwt.claims', true)::jsonb as jwt_claims
    `;

    const row = result[0];
    return row?.user_id === verificationContext.userId && row?.user_roles === JSON.stringify(verificationContext.roles);
  });
}
