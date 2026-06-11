import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");

const schema = read("prisma/schema.prisma");
const migration = read("prisma/migrations/202605310003_runtime_persistence/migration.sql");
const conversationPersistence = read("packages/backend/src/domains/conversations/persistence.ts");
const idempotency = read("packages/backend/src/channels/idempotency.ts");
const evaluationStore = read("packages/backend/src/ai/evaluation/v2/store.ts");
const whatsappService = read("packages/backend/src/channels/whatsapp/service.ts");
const env = read(".env.example");
const activationReview = read("docs/production-activation-review.md");
const checklist = read("docs/production-activation-checklist.md");

for (const model of ["Conversation", "ConversationMessage", "ChannelSession", "ProviderMessage", "AiEvaluationRecord"]) {
  assert.ok(schema.includes(`model ${model}`), `Prisma schema should include ${model}`);
}

for (const table of ["conversations", "conversation_messages", "channel_sessions", "provider_messages", "ai_evaluation_records"]) {
  assert.ok(migration.includes(`\"${table}\"`), `runtime migration should create ${table}`);
}

assert.ok(schema.includes("@@unique([provider, providerMessageId])"), "ProviderMessage should enforce webhook idempotency");
assert.ok(conversationPersistence.includes("findOrCreateConversationPersisted"), "conversation persistence should support find-or-create");
assert.ok(conversationPersistence.includes("textRedacted"), "conversation messages should persist redacted text");
assert.ok(idempotency.includes("beginProviderMessageProcessing"), "idempotency should begin provider processing");
assert.ok(idempotency.includes("completeProviderMessageProcessing"), "idempotency should complete provider processing");
assert.ok(whatsappService.includes("processing.duplicate"), "WhatsApp service should skip duplicate provider messages");
assert.ok(evaluationStore.includes("aiEvaluationRecord"), "AI evaluations should persist to Prisma when available");
assert.ok(!evaluationStore.includes("message:"), "AI evaluation persistence should not store prompts");

for (const key of ["AI_PROVIDER_ROLLOUT_ENV=staging", "AI_STAGING_REAL_PROVIDERS=false"]) {
  assert.ok(env.includes(key), `.env.example should include ${key}`);
}

assert.ok(activationReview.includes("Persistence Gaps Closed"), "activation review should document closed persistence gaps");
assert.ok(checklist.includes("Rollback Plan"), "activation checklist should include rollback plan");

console.log("Production activation tests passed.");
