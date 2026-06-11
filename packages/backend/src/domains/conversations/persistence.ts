import { withQueryProtection, getPrismaClient } from "../../database/prisma";
import type { Conversation, ConversationMessage } from "./service";
import type { ConversationInput, MessageInput, MessageStatus } from "./schemas";

type PrismaDelegate = {
  findFirst(args: unknown): Promise<unknown>;
  create(args: unknown): Promise<unknown>;
  update(args: unknown): Promise<unknown>;
};

function channel(value: string) {
  return value.toUpperCase();
}

function direction(value: string) {
  return value.toUpperCase();
}

function status(value: string) {
  return value.toUpperCase();
}

function redactText(text?: string) {
  if (!text) return undefined;
  return text.replace(/\b[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}\b/g, "[redacted-email]").replace(/\b\d{8,}\b/g, "[redacted-number]");
}

function prismaOrUndefined() {
  try {
    return getPrismaClient() as unknown as Record<string, Record<string, (...args: unknown[]) => Promise<unknown>>>;
  } catch {
    return undefined;
  }
}

export async function findOrCreateConversationPersisted(input: ConversationInput, fallback: () => Conversation): Promise<Conversation> {
  const prisma = prismaOrUndefined();
  if (!prisma?.conversation) return fallback();
  const conversationDelegate = prisma.conversation as PrismaDelegate;

  return withQueryProtection("conversation.findOrCreate", async () => {
    const existing = await conversationDelegate.findFirst({
      where: {
        channel: channel(input.channel),
        status: "OPEN",
        OR: [
          input.customerId ? { customerId: input.customerId } : undefined,
          input.customerPhone ? { customerPhone: input.customerPhone } : undefined
        ].filter(Boolean)
      }
    }) as Conversation | null;

    if (existing) return existing;

    return await conversationDelegate.create({
      data: {
        channel: channel(input.channel),
        customerId: input.customerId,
        customerPhone: input.customerPhone,
        orderId: input.orderId,
        loyaltyAccountId: input.loyaltyAccountId,
        aiCorrelationId: input.aiCorrelationId,
        metadata: input.metadata
      }
    }) as Conversation;
  }).catch(() => fallback());
}

export async function addConversationMessagePersisted(input: MessageInput, fallback: () => ConversationMessage): Promise<ConversationMessage> {
  const prisma = prismaOrUndefined();
  if (!prisma?.conversationMessage) return fallback();
  const messageDelegate = prisma.conversationMessage as PrismaDelegate;

  return withQueryProtection("conversationMessage.create", async () => {
    return await messageDelegate.create({
      data: {
        conversationId: input.conversationId,
        channel: channel(input.channel),
        direction: direction(input.direction),
        status: status(input.status),
        textRedacted: redactText(input.text),
        provider: input.channel,
        providerMessageId: input.providerMessageId,
        customerId: input.customerId,
        metadata: input.metadata
      }
    }) as ConversationMessage;
  }).catch(() => fallback());
}

export async function updateMessageStatusPersisted(providerMessageId: string, nextStatus: MessageStatus, fallback: () => ConversationMessage | undefined): Promise<ConversationMessage | undefined> {
  const prisma = prismaOrUndefined();
  if (!prisma?.conversationMessage) return fallback();
  const messageDelegate = prisma.conversationMessage as PrismaDelegate;

  return withQueryProtection("conversationMessage.updateStatus", async () => {
    const existing = await messageDelegate.findFirst({ where: { providerMessageId } }) as { id: string } | null;
    if (!existing) return fallback();
    return await messageDelegate.update({
      where: { id: existing.id },
      data: { status: status(nextStatus) }
    }) as ConversationMessage;
  }).catch(() => fallback());
}

export async function createChannelSession(input: {
  conversationId: string;
  channel: string;
  provider: string;
  externalId?: string;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const prisma = prismaOrUndefined();
  if (!prisma?.channelSession) return;
  const sessionDelegate = prisma.channelSession as PrismaDelegate;

  await withQueryProtection("channelSession.create", async () => {
    await sessionDelegate.create({
      data: {
        conversationId: input.conversationId,
        channel: channel(input.channel),
        provider: input.provider,
        externalId: input.externalId,
        expiresAt: input.expiresAt,
        metadata: input.metadata
      }
    });
  }).catch(() => undefined);
}
