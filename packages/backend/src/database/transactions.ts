import { getInfrastructureEnv } from "../runtime/env";
import { incrementMetric, recordDuration } from "../runtime/metrics";
import { withSpan } from "../observability/tracing";
import { connectPrisma } from "./prisma";

type TransactionClient = Parameters<Parameters<Awaited<ReturnType<typeof connectPrisma>>["$transaction"]>[0]>[0];

export async function withTransaction<T>(name: string, run: (tx: TransactionClient) => Promise<T>): Promise<T> {
  const prisma = await connectPrisma();
  const env = getInfrastructureEnv();
  const started = Date.now();
  let attempt = 0;

  return withSpan("database.transaction", { "salora.transaction": name }, async () => {
    while (true) {
      try {
        const result = await prisma.$transaction((tx) => run(tx), {
          timeout: env.DATABASE_QUERY_TIMEOUT_MS
        });
        recordDuration("salora_database_transaction_duration_ms", Date.now() - started);
        return result;
      } catch (error) {
        incrementMetric("salora_database_transaction_failures_total");
        if (attempt >= env.DATABASE_RETRY_LIMIT) {
          throw error;
        }
        attempt += 1;
        incrementMetric("salora_database_transaction_retries_total");
      }
    }
  });
}
