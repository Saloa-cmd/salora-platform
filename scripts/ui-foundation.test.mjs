import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [tokens, primitives, css] = await Promise.all([
  readFile(new URL("../packages/ui/design-tokens.ts", import.meta.url), "utf8"),
  readFile(new URL("../apps/web/components/ui/SaloraPrimitives.tsx", import.meta.url), "utf8"),
  readFile(new URL("../apps/web/app/globals.css", import.meta.url), "utf8")
]);

for (const token of ["background", "surfaceRaised", "foregroundMuted", "brandHover", "brandForeground", "success", "warning", "danger", "info"]) {
  assert.match(tokens, new RegExp(`\\b${token}:`), `missing semantic token: ${token}`);
}
for (const foundation of ["breakpoints", "motion", "touchTarget", "numeric"]) assert.match(tokens, new RegExp(`\\b${foundation}:`));
for (const primitive of ["SaloraButton", "SaloraIconButton", "SaloraField", "SaloraAlert", "SaloraSkeleton", "SaloraEmptyState", "SaloraTableRegion"]) assert.match(primitives, new RegExp(`function ${primitive}\\b`));
assert.match(primitives, /aria-busy=/);
assert.match(primitives, /aria-label=\{label\}/);
assert.match(primitives, /aria-invalid=/);
assert.match(primitives, /role="alert"/);
assert.match(css, /prefers-reduced-motion/);
assert.match(css, /inset-inline-start/);
assert.doesNotMatch(css, /\.skip-link\s*\{[^}]*\bleft:/s);
console.log("P23 UI foundation contract: PASS");
