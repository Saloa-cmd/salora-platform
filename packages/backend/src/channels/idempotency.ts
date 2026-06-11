import { createHash } from "node:crypto";
import { getPrismaClient, withQueryProtection } from "../database/prisma";

type PrismaDelegate = {
  findUnique(args: unknown): Promise<unknown>;
  upsert(args: unknown): Promise<unknown>;
  update(args: unknown): Promise<unknown>;
};

export type ProviderProcessingDecision = {
  duplicate: boolean;
  provider: string;
  providerMessageId: string;
  status: "received" | "processing" | "processed" | "failed" | "duplicate";
};

const memory = new Map<string, ProviderProcessingDecision>();

function key(provider: string, providerMessageId: string) {
  return `${provider}:${providerMessageId}`;
}

function payloadHash(payload?: unknown) {
  return payload === undefined ? undefined : createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function prismaOrUndefined() {
  try {
    return getPrismaClient() as unknown as Record<string, Record<string, (...args: unknown[]) => Promise<unknown>>>;
  } catch {
    return undefined;
  }
}

export async function beginProviderMessageProcessing(input: {
  provider: string;
  providerMessageId: string;
  channel: "whatsapp" | "web" | "mobile" | "future_voice";
  payload?: unknown;
}): Promise<ProviderProcessingDecision> {
  const id = key(input.provider, input.providerMessageId);
  const existing = memory.get(id);
  if (existing && existing.status !== "failed") {
    return { ...existing, duplicate: true, status: "duplicate" };
  }

  const decision: ProviderProcessingDecision = { duplicate: false, provider: input.provider, providerMessageId: input.providerMessageId, status: "processing" };
  memory.set(id, decision);

  const prisma = prismaOrUndefined();
  if (!prisma?.providerMessage) return decision;
  const providerMessageDelegate = prisma.providerMessage as PrismaDelegate;

  return withQueryProtection("providerMessage.begin", async () => {
    const record = await providerMessageDelegate.findUnique({
      where: { provider_providerMessageId: { provider: input.provider, providerMessageId: input.providerMessageId } }
    }) as { processingStatus?: string } | null;

    if (record && record.processingStatus !== "FAILED") {
      return { ...decision, duplicate: true, status: "duplicate" as const };
    }

    await providerMessageDelegate.upsert({
      where: { provider_providerMessageId: { provider: input.provider, providerMessageId: input.providerMessageId } },
      create: {
        provider: input.provider,
        providerMessageId: input.providerMessageId,
        channel: input.channel.toUpperCase(),
        processingStatus: "PROCESSING",
        payloadHash: payloadHash(input.payload)
      },
      update: {
        processingStatus: "PROCESSING",
        payloadHash: payloadHash(input.payload),
        errorMessage: null
      }
    });

    return decision;
  }).catch(() => decision);
}

export async function completeProviderMessageProcessing(provider: string, providerMessageId: string): Promise<void> {
  const id = key(provider, providerMessageId);
  const current = memory.get(id);
  if (current) memory.set(id, { ...current, status: "processed" });

  const prisma = prismaOrUndefined();
  if (!prisma?.providerMessage) return;
  const providerMessageDelegate = prisma.providerMessage as PrismaDelegate;

  await withQueryProtection("providerMessage.complete", async () => {
    await providerMessageDelegate.update({
      where: { provider_providerMessageId: { provider, providerMessageId } },
      data: { processingStatus: "PROCESSED", processedAt: new Date() }
    });
  }).catch(() => undefined);
}

export async function failProviderMessageProcessing(provider: string, providerMessageId: string, error: unknown): Promise<void> {
  const id = key(provider, providerMessageId);
  const current = memory.get(id);
  if (current) memory.set(id, { ...current, status: "failed" });

  const prisma = prismaOrUndefined();
  if (!prisma?.providerMessage) return;
  const providerMessageDelegate = prisma.providerMessage as PrismaDelegate;

  await withQueryProtection("providerMessage.fail", async () => {
    await providerMessageDelegate.update({
      where: { provider_providerMessageId: { provider, providerMessageId } },
      data: {
        processingStatus: "FAILED",
        failedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : "Unknown processing failure."
      }
    });
  }).catch(() => undefined);
}
