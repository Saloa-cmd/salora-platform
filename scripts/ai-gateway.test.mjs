import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const aiTypes = readFileSync(join(root, "packages/backend/src/ai/types/index.ts"), "utf8");
const gateway = readFileSync(join(root, "packages/backend/src/ai/gateway/gateway.ts"), "utf8");
const safety = readFileSync(join(root, "packages/backend/src/ai/safety/safety.ts"), "utf8");
const env = readFileSync(join(root, ".env.example"), "utf8");
const docs = readFileSync(join(root, "docs/ai-gateway-architecture-review.md"), "utf8");

for (const intent of ["concierge", "recommend_products", "suggest_pairings", "explain_product", "help_with_order", "loyalty_assistant"]) {
  assert.ok(aiTypes.includes(`"${intent}"`), `AI intent ${intent} should be declared`);
}

for (const key of ["AI_DEFAULT_PROVIDER=mock", "AI_ENABLE_REAL_PROVIDERS=false", "AI_SAFETY_LEVEL=strict"]) {
  assert.ok(env.includes(key), `.env.example should include ${key}`);
}

assert.ok(gateway.includes("routeAiRequest"), "gateway should expose routeAiRequest");
assert.ok(safety.includes("safeRefusal"), "safety should include safe refusal helper");
assert.ok(docs.includes("Provider Abstraction Strategy"), "architecture review should include provider abstraction strategy");

console.log("AI gateway tests passed.");
