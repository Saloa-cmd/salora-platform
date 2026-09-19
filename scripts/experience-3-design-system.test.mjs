import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const [tokens, primitivesCss, primitives, layout, globals, tailwind, docs] = await Promise.all([
  read("apps/web/styles/tokens.css"),
  read("apps/web/styles/primitives.css"),
  read("apps/web/components/ui/SaloraPrimitives.tsx"),
  read("apps/web/app/layout.tsx"),
  read("apps/web/app/globals.css"),
  read("apps/web/tailwind.config.ts"),
  read("docs/experience-3/DESIGN_SYSTEM_3.md")
]);

for (const token of [
  "--color-canvas",
  "--type-display-size",
  "--space-section",
  "--radius-modal",
  "--shadow-floating",
  "--motion-fast",
  "--motion-normal",
  "--motion-cinematic",
  "--z-modal",
  "--container-content",
  "--focus-ring-color",
  "--touch-target-min",
  "--icon-md",
  "--customer-content-gap",
  "--operator-content-gap"
]) {
  assert.match(tokens, new RegExp(`${token.replaceAll("-", "\\-")}\\s*:`), `missing token ${token}`);
}

assert.match(tokens, /\[data-theme="light"\]/, "light theme contract must remain explicit");
assert.match(tokens, /:lang\(ar\)/, "Arabic composition must be independent");
assert.match(tokens, /prefers-reduced-motion:\s*reduce/, "reduced motion token override is required");
assert.match(layout, /import "\.\.\/styles\/tokens\.css";/, "tokens must load before application CSS");
assert.match(layout, /import "\.\.\/styles\/primitives\.css";/, "primitive styles must load centrally");
assert.doesNotMatch(globals, /--background:\s*#050505/, "legacy raw token block must not remain in globals.css");

for (const primitive of [
  "SaloraButton",
  "SaloraIconButton",
  "SaloraBadge",
  "SaloraSurface",
  "SaloraField",
  "SaloraAlert",
  "SaloraSkeleton",
  "SaloraEmptyState",
  "SaloraTableRegion"
]) {
  assert.match(primitives, new RegExp(`export function ${primitive}\\b`), `missing ${primitive}`);
}

assert.match(primitives, /aria-busy=/, "button busy state must be exposed");
assert.match(primitives, /aria-invalid=/, "field error state must be exposed");
assert.match(primitives, /aria-label=\{label\}/, "icon button must require an accessible label");
assert.match(primitivesCss, /min-block-size:\s*var\(--touch-target-min\)/, "controls must use the touch target token");
assert.match(primitivesCss, /prefers-reduced-motion:\s*reduce/, "animated primitives need reduced-motion behavior");
assert.match(primitivesCss, /forced-colors:\s*active/, "focus must remain visible in forced-colors mode");
assert.match(tailwind, /background:\s*"var\(--background\)"/, "Tailwind compatibility colors must consume tokens");
assert.match(docs, /One system, two personalities/, "design system intent must be documented");

console.log("SALORA Experience 3.0 design-system contract: PASS");
