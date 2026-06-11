import type { Product } from "@salora/types";
import { helpWithOrder, loyaltyAssistant, askConcierge } from "../../ai/concierge/service";
import { recommendProductsAdvanced, recommendPairingsAdvanced, recommendUpsells, recommendLoyaltyRewards } from "../../ai/recommendations/engine";
import { listOrders, listLoyaltyEntries } from "../../domains/services";
import { addConversationMessageRuntime, findOrCreateConversationRuntime, updateMessageStatusRuntime } from "../../domains/conversations/service";
import { publishDomainEvent } from "../../domains/events";
import { beginProviderMessageProcessing, completeProviderMessageProcessing, failProviderMessageProcessing } from "../idempotency";
import { recordChannelInbound, recordChannelLatency } from "../metrics";
import { getChannelProvider } from "../registry";
import type { WhatsAppInboundMessage, WhatsAppStatusUpdate } from "./types";

function classifyIntent(text: string): "order" | "loyalty" | "recommendation" | "pairing" | "concierge" {
  const lower = text.toLowerCase();
  if (lower.includes("order") || lower.includes("status") || lower.includes("reorder")) return "order";
  if (lower.includes("point") || lower.includes("reward") || lower.includes("loyalty")) return "loyalty";
  if (lower.includes("recommend") || lower.includes("suggest")) return "recommendation";
  if (lower.includes("pair")) return "pairing";
  return "concierge";
}

export async function handleWhatsAppInboundMessage(input: { message: WhatsAppInboundMessage; products: Product[] }) {
  const started = Date.now();
  const processing = await beginProviderMessageProcessing({
    provider: "whatsapp",
    providerMessageId: input.message.providerMessageId,
    channel: "whatsapp",
    payload: { from: input.message.from, timestamp: input.message.timestamp }
  });

  if (processing.duplicate) {
    return { duplicate: true, providerMessageId: input.message.providerMessageId };
  }

  recordChannelInbound("whatsapp");
  try {
    publishDomainEvent({ name: "WhatsAppInboundReceived", aggregateId: input.message.providerMessageId, aggregateType: "WhatsAppMessage", payload: { from: input.message.from } });

    const conversation = await findOrCreateConversationRuntime({
      channel: "whatsapp",
      customerPhone: input.message.from,
      metadata: { customerName: input.message.customerName }
    });

    await addConversationMessageRuntime({
      conversationId: conversation.id,
      channel: "whatsapp",
      direction: "inbound",
      status: "received",
      text: input.message.text,
      providerMessageId: input.message.providerMessageId,
      metadata: { from: input.message.from }
    });

    const intent = classifyIntent(input.message.text);
    const loyaltyEntries = listLoyaltyEntries().filter((entry) => entry.customerId === conversation.customerId);
    const loyalty = {
      points: loyaltyEntries.reduce((total, entry) => total + entry.points, 0),
      tier: "CLASSIC"
    };

    const orders = listOrders().filter((order) => order.customerPhone === input.message.from || order.customerId === conversation.customerId);
    const base = { message: input.message.text, channel: "future_whatsapp" as const, products: input.products, loyalty };
    const ai = intent === "order"
      ? await helpWithOrder({ ...base, order: orders[0] ? { items: orders[0].items.map((item) => ({ name: item.productName, quantity: item.quantity })), total: orders[0].total } : undefined })
      : intent === "loyalty"
        ? await loyaltyAssistant(base)
        : await askConcierge(base);

    const recommendations = intent === "recommendation"
      ? recommendProductsAdvanced({ products: input.products, loyalty })
      : intent === "pairing"
        ? recommendPairingsAdvanced(input.products)
        : [];
    const upsells = recommendUpsells(input.products);
    const rewards = recommendLoyaltyRewards(loyalty);

    const replyParts = [
      ai.answer,
      recommendations.length ? `Recommended: ${recommendations.map((item) => item.name).join(", ")}` : "",
      intent === "loyalty" ? `Rewards: ${rewards.join(", ")}` : "",
      intent === "recommendation" && upsells.length ? `Pairs well with: ${upsells.map((item) => item.name).join(", ")}` : ""
    ].filter(Boolean);

    const provider = getChannelProvider("whatsapp");
    const delivery = await provider?.sendMessage({
      to: input.message.from,
      text: replyParts.join("\n\n"),
      conversationId: conversation.id,
      correlationId: ai.correlationId
    });

    await addConversationMessageRuntime({
      conversationId: conversation.id,
      channel: "whatsapp",
      direction: "outbound",
      status: delivery?.status === "sent" ? "sent" : delivery?.status === "disabled" ? "queued" : "failed",
      text: replyParts.join("\n\n"),
      providerMessageId: delivery?.providerMessageId,
      metadata: { aiCorrelationId: ai.correlationId, delivery }
    });

    recordChannelLatency("whatsapp", Date.now() - started);
    await completeProviderMessageProcessing("whatsapp", input.message.providerMessageId);
    return { conversationId: conversation.id, intent, ai, recommendations, delivery };
  } catch (error) {
    await failProviderMessageProcessing("whatsapp", input.message.providerMessageId, error);
    throw error;
  }
}

export function handleWhatsAppStatusUpdate(status: WhatsAppStatusUpdate) {
  publishDomainEvent({ name: "WhatsAppStatusUpdated", aggregateId: status.providerMessageId, aggregateType: "WhatsAppMessage", payload: { status: status.status } });
  return updateMessageStatusRuntime(status.providerMessageId, status.status);
}
