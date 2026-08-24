import type { GroundedEvaluation } from "./evaluator";
import { getPrismaClient, withQueryProtection } from "../../../database/prisma";

type PrismaDelegate = {
  create(args: unknown): Promise<unknown>;
};

export type EvaluationRecord = {
  id: string;
  correlationId: string;
  provider: string;
  model: string;
  intent: string;
  channel: string;
  score: GroundedEvaluation;
  latencyMs: number;
  estimatedCost: number;
  safetyBlocked: boolean;
  createdAt: string;
};

const records: EvaluationRecord[] = [];

function prismaOrUndefined() {
  try {
    return getPrismaClient() as unknown as Record<string, Record<string, (...args: unknown[]) => Promise<unknown>>>;
  } catch {
    return undefined;
  }
}

async function persistEvaluationMetadataToPrisma(record: EvaluationRecord): Promise<void> {
  const prisma = prismaOrUndefined();
  if (!prisma?.aiEvaluationRecord) return;
  const evaluationDelegate = prisma.aiEvaluationRecord as PrismaDelegate;

  await withQueryProtection("aiEvaluationRecord.create", async () => {
    await evaluationDelegate.create({
      data: {
        correlationId: record.correlationId,
        provider: record.provider,
        model: record.model,
        intent: record.intent,
        channel: record.channel,
        overallScore: record.score.overall,
        accuracyScore: record.score.accuracy,
        recommendationScore: record.score.recommendationQuality,
        safetyScore: record.score.safety,
        latencyScore: record.score.latency,
        costEfficiencyScore: record.score.costEfficiency,
        latencyMs: record.latencyMs,
        estimatedCost: record.estimatedCost,
        safetyBlocked: record.safetyBlocked,
        notes: record.score.notes
      }
    });
  }).catch(() => undefined);
}

/**
 * Persist an evaluation before the serverless request lifecycle is allowed to
 * finish. Database/telemetry failure remains non-fatal to the AI response, but
 * the write is no longer fire-and-forget and therefore cannot be silently
 * abandoned when the runtime freezes or terminates after sending the response.
 */
export async function persistEvaluationMetadata(
  record: Omit<EvaluationRecord, "id" | "createdAt">
): Promise<EvaluationRecord> {
  const stored = {
    ...record,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString()
  };
  records.push(stored);
  await persistEvaluationMetadataToPrisma(stored);
  return stored;
}

export function listEvaluationMetadata(): EvaluationRecord[] {
  return [...records];
}
