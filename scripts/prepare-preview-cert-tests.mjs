import { readdir, readFile, writeFile, copyFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL(".", import.meta.url));
await mkdir(".preview-cert", { recursive: true });
for (const name of ["preview-auth-boundary.mjs", "preview-cert-fixture.ts"]) await copyFile(root + name, ".preview-cert/" + name);
const manifest = [];
for (const name of await readdir("tests/smoke")) {
  if (!name.endsWith(".spec.ts")) continue;
  const source = await readFile("tests/smoke/" + name, "utf8");
  if (!source.includes('from "@playwright/test"') || /from\s+["']\./.test(source)) throw new Error("UNSUPPORTED_SMOKE_IMPORT");
  // Preserve test bodies; substitute only the trusted fixture import in ephemeral copies.
  const adapted = source.replaceAll('from "@playwright/test"', 'from "./preview-cert-fixture"');
  await writeFile(".preview-cert/" + name, adapted);
  manifest.push({ name, originalSha256: createHash("sha256").update(source).digest("hex"), adaptedSha256: createHash("sha256").update(adapted).digest("hex") });
}
await writeFile("certification/test-adapter.json", JSON.stringify(manifest, null, 2));
