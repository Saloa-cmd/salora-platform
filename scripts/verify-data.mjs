import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const dataSource = readFileSync(join(root, "packages/data/src/index.ts"), "utf8");
const requiredDocs = [
  "docs/migration-progress.md",
  "docs/migration-decision-log.md",
  "docs/migration-gap-analysis.md",
  "docs/migration-execution-plan.md"
];

const productIds = [...dataSource.matchAll(/id: "([^"]+)"/g)].map((match) => match[1]);
const duplicateIds = productIds.filter((id, index) => productIds.indexOf(id) !== index);

if (productIds.length < 8) {
  throw new Error(`Expected at least 8 products, found ${productIds.length}.`);
}

if (duplicateIds.length > 0) {
  throw new Error(`Duplicate product ids: ${duplicateIds.join(", ")}`);
}

for (const docPath of requiredDocs) {
  readFileSync(join(root, docPath), "utf8");
}

console.log(`Verified ${productIds.length} products and ${requiredDocs.length} migration documents.`);
