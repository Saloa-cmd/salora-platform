import { SYSTEM_AUTH_CONTEXT, withPrismaAuthContext } from "../../database/rls-context";
import type { WhatsAppRepository, WhatsAppWebhookLedgerEvent } from "./whatsapp.types";

type PrismaAny = Record<string, any>;

const memoryWebhookEvents = new Map<string, WhatsAppWebhookLedgerEvent>();

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown WhatsApp webhook processing failure.";
}

export class PrismaWhatsAppRepository implements WhatsAppRepository {
  async createWebhookEvent(input: {
    payload: unknown;
    eventType: string;
    providerEventId?: string;
    correlationId: string;
  }): Promise<WhatsAppWebhookLedgerEvent> {
    if (input.providerEventId) {
      const existingMemory = [...memoryWebhookEvents.values()].find((event) => event.providerEventId === input.providerEventId);
      if (existingMemory) return { ...existingMemory, processingStatus: "DUPLICATE" };
    }

    try {
      return await withPrismaAuthContext(SYSTEM_AUTH_CONTEXT, async (prisma: PrismaAny) => {
        if (input.providerEventId) {
          const existing = await prisma.whatsappWebhookEvent.findFirst({
            where: { providerEventId: input.providerEventId, deletedAt: null },
            select: { id: true, eventType: true, providerEventId: true, correlationId: true, processingStatus: true }
          });
          if (existing) return { ...existing, processingStatus: "DUPLICATE" } as WhatsAppWebhookLedgerEvent;
        }

        return await prisma.whatsappWebhookEvent.create({
          data: {
            providerEventId: input.providerEventId,
            eventType: input.eventType,
            processingStatus: "PROCESSING",
            correlationId: input.correlationId,
            payload: input.payload
          },
          select: {
            id: true,
            eventType: true,
            providerEventId: true,
            correlationId: true,
            processingStatus: true
          }
        }) as WhatsAppWebhookLedgerEvent;
      });
    } catch {
      const fallback = {
        id: crypto.randomUUID(),
        eventType: input.eventType,
        providerEventId: input.providerEventId,
        correlationId: input.correlationId,
        processingStatus: "RECEIVED" as const
      };
      memoryWebhookEvents.set(fallback.id, fallback);
      return fallback;
    }
  }

  async markWebhookEventProcessed(id: string): Promise<void> {
    try {
      await withPrismaAuthContext(SYSTEM_AUTH_CONTEXT, async (prisma: PrismaAny) => {
        await prisma.whatsappWebhookEvent.update({
          where: { id },
          data: { processingStatus: "PROCESSED", processedAt: new Date() }
        });
      });
    } catch {
      const current = memoryWebhookEvents.get(id);
      if (current) memoryWebhookEvents.set(id, { ...current, processingStatus: "PROCESSED" });
    }
  }

  async markWebhookEventFailed(id: string, error: unknown): Promise<void> {
    try {
      await withPrismaAuthContext(SYSTEM_AUTH_CONTEXT, async (prisma: PrismaAny) => {
        await prisma.whatsappWebhookEvent.update({
          where: { id },
          data: { processingStatus: "FAILED", failedAt: new Date(), errorMessage: errorMessage(error) }
        });
      });
    } catch {
      const current = memoryWebhookEvents.get(id);
      if (current) memoryWebhookEvents.set(id, { ...current, processingStatus: "FAILED" });
    }
  }

  async writeMutationLogs(input: {
    action: string;
    entityType: string;
    entityId?: string;
    requestId: string;
    metadata?: Record<string, unknown>;
    after?: unknown;
    reason?: string;
  }): Promise<void> {
    await withPrismaAuthContext(SYSTEM_AUTH_CONTEXT, async (prisma: PrismaAny) => {
      await prisma.activityLog.create({
        data: {
          actorType: "system",
          action: input.action,
          entityType: input.entityType,
          entityId: input.entityId,
          requestId: input.requestId,
          metadata: input.metadata
        }
      });
      await prisma.auditLog.create({
        data: {
          action: "CREATE",
          entityType: input.entityType,
          entityId: input.entityId,
          after: input.after,
          requestId: input.requestId,
          reason: input.reason
        }
      });
    }).catch(() => undefined);
  }
}
