import { incrementMetric } from "../../runtime/metrics";
import { publishDomainEvent } from "../events";
import type { ConversationInput, MessageInput, MessageStatus } from "./schemas";
import { addConversationMessagePersisted, findOrCreateConversationPersisted, updateMessageStatusPersisted } from "./persistence";

export type Conversation = ConversationInput & {
  id: string;
  status: "open" | "closed";
  createdAt: string;
  updatedAt: string;
};

export type ConversationMessage = MessageInput & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

const conversations: Conversation[] = [];
const messages: ConversationMessage[] = [];

function now() {
  return new Date().toISOString();
}

export function createConversation(input: ConversationInput): Conversation {
  const createdAt = now();
  const conversation = { ...input, id: crypto.randomUUID(), status: "open" as const, createdAt, updatedAt: createdAt };
  conversations.push(conversation);
  incrementMetric("salora_conversations_created_total");
  publishDomainEvent({ name: "ConversationStarted", aggregateId: conversation.id, aggregateType: "Conversation", payload: { channel: input.channel } });
  return conversation;
}

export function findOrCreateConversation(input: ConversationInput): Conversation {
  const existing = conversations.find((conversation) =>
    conversation.channel === input.channel &&
    conversation.status === "open" &&
    ((input.customerId && conversation.customerId === input.customerId) || (input.customerPhone && conversation.customerPhone === input.customerPhone))
  );
  return existing ?? createConversation(input);
}

export function findOrCreateConversationRuntime(input: ConversationInput): Promise<Conversation> {
  return findOrCreateConversationPersisted(input, () => findOrCreateConversation(input));
}

export function addConversationMessage(input: MessageInput): ConversationMessage {
  const createdAt = now();
  const message = { ...input, id: crypto.randomUUID(), createdAt, updatedAt: createdAt };
  messages.push(message);
  incrementMetric(`salora_conversation_messages_${input.direction}_total`);
  publishDomainEvent({ name: "ConversationMessageRecorded", aggregateId: input.conversationId, aggregateType: "Conversation", payload: { channel: input.channel, direction: input.direction, status: input.status } });
  return message;
}

export function addConversationMessageRuntime(input: MessageInput): Promise<ConversationMessage> {
  return addConversationMessagePersisted(input, () => addConversationMessage(input));
}

export function updateMessageStatus(providerMessageId: string, status: MessageStatus): ConversationMessage | undefined {
  const message = messages.find((item) => item.providerMessageId === providerMessageId);
  if (!message) return undefined;
  message.status = status;
  message.updatedAt = now();
  incrementMetric(`salora_conversation_message_status_${status}_total`);
  return message;
}

export function updateMessageStatusRuntime(providerMessageId: string, status: MessageStatus): Promise<ConversationMessage | undefined> {
  return updateMessageStatusPersisted(providerMessageId, status, () => updateMessageStatus(providerMessageId, status));
}

export function listConversations(): Conversation[] {
  return [...conversations];
}

export function listConversationMessages(conversationId?: string): ConversationMessage[] {
  return conversationId ? messages.filter((message) => message.conversationId === conversationId) : [...messages];
}
