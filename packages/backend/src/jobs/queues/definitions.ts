export const queueNames = ["email", "notifications", "analytics", "ai-tasks", "media-processing"] as const;

export type QueueName = (typeof queueNames)[number];

export type BaseJobData = {
  idempotencyKey: string;
  correlationId?: string;
  requestedAt: string;
  payload: Record<string, unknown>;
};
