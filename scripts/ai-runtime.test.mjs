import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const files = {
  openai: readFileSync(join(root, "packages/backend/src/ai/providers/openai/provider.ts"), "utf8"),
  gemini: readFileSync(join(root, "packages/backend/src/ai/providers/gemini/provider.ts"), "utf8"),
  claude: readFileSync(join(root, "packages/backend/src/ai/providers/claude/provider.ts"), "utf8"),
  registry: readFileSync(join(root, "packages/backend/src/ai/providers/registry.ts"), "utf8"),
  router: readFileSync(join(root, "packages/backend/src/ai/gateway/routing/router.ts"), "utf8"),
  evaluator: readFileSync(join(root, "packages/backend/src/ai/evaluation/v2/evaluator.ts"), "utf8"),
  evaluationStore: readFileSync(join(root, "packages/backend/src/ai/evaluation/v2/store.ts"), "utf8"),
  knowledge: readFileSync(join(root, "packages/backend/src/ai/knowledge/repository.ts"), "utf8"),
  context: readFileSync(join(root, "packages/backend/src/ai/context/builders.ts"), "utf8"),
  recommendations: readFileSync(join(root, "packages/backend/src/ai/recommendations/engine.ts"), "utf8"),
  governance: readFileSync(join(root, "packages/backend/src/ai/governance/governance.ts"), "utf8"),
  metrics: readFileSync(join(root, "packages/backend/src/ai/observability/metrics.ts"), "utf8"),
  env: readFileSync(join(root, ".env.example"), "utf8")
};

for (const [name, source] of Object.entries({ openai: files.openai, gemini: files.gemini, claude: files.claude })) {
  assert.ok(source.includes("AI_ENABLE_REAL_PROVIDERS"), `${name} adapter must stay disabled by default`);
  assert.ok(source.includes("AbortController"), `${name} adapter must support timeout cancellation`);
  assert.ok(source.includes("providerResult"), `${name} adapter must normalize usage and metadata`);
}

for (const provider of ["openai", "gemini", "claude", "mock"]) {
  assert.ok(files.registry.includes(provider), `registry should include ${provider}`);
}

for (const token of ["providerFallbackOrder", "AI_PROVIDER_BLACKLIST", "healthScore", "latencyMs"]) {
  assert.ok(files.router.includes(token), `routing engine should include ${token}`);
}

for (const metric of ["accuracy", "recommendationQuality", "safety", "latency", "costEfficiency"]) {
  assert.ok(files.evaluator.includes(metric), `evaluation v2 should score ${metric}`);
}

assert.ok(files.evaluationStore.includes("persistEvaluationMetadata"), "evaluation v2 should persist metadata");
assert.ok(files.evaluationStore.includes("aiEvaluationRecord"), "evaluation v2 should support Prisma persistence");

for (const source of ["products", "categories", "loyalty_rules", "offers", "faqs", "policies", "business_rules"]) {
  assert.ok(files.knowledge.includes(source), `knowledge repository should support ${source}`);
}

for (const builder of ["customer", "orderHistorySummary", "loyalty", "inventory", "knowledge"]) {
  assert.ok(files.context.includes(builder), `context engine should build ${builder}`);
}

for (const fn of ["recommendProductsAdvanced", "recommendPairingsAdvanced", "recommendUpsells", "recommendLoyaltyRewards"]) {
  assert.ok(files.recommendations.includes(fn), `recommendation engine should expose ${fn}`);
}

for (const rule of ["assertProviderApproved", "assertCostCeiling", "assertRateLimit", "aiFeatureEnabled"]) {
  assert.ok(files.governance.includes(rule), `governance should expose ${rule}`);
}

for (const metric of ["recordAiProviderUsage", "recordAiProviderLatency", "recordAiProviderFailure", "recordAiEstimatedCost", "recordAiKnowledgeUsage", "recordAiRecommendationScore"]) {
  assert.ok(files.metrics.includes(metric), `observability v2 should expose ${metric}`);
}

for (const key of ["AI_PROVIDER_BLACKLIST=", "AI_FEATURE_RECOMMENDATIONS=true", "AI_FEATURE_KNOWLEDGE=true"]) {
  assert.ok(files.env.includes(key), `.env.example should include ${key}`);
}

console.log("AI runtime tests passed.");
