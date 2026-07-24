import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const menu = read("apps/web/components/menu/MenuExperience.tsx");
const shell = read("apps/web/components/control-tower/ControlTowerShell.tsx");
const css = read("apps/web/app/globals.css");
const primitives = read("apps/web/components/ui/SaloraPrimitives.tsx");
const mediaManager = read("apps/web/components/control-tower/ProductMediaManager.tsx");
const proxy = read("apps/web/proxy.ts");

assert.match(menu, /salora-display/, "Menu hero must use the locale-aware display scale.");
assert.match(menu, /SaloraEmptyState/, "Menu empty results must use the shared accessible primitive.");
assert.match(menu, /language === "ar" \? "lg:grid-cols-/, "Menu hero must preserve language-aware column proportions.");
assert.match(shell, /salora-command-bar/, "Control Tower commands must remain responsive and horizontally safe.");
assert.match(shell, /salora-page-title/, "Control Tower title must use the responsive title primitive.");
assert.match(css, /:lang\(ar\) \.salora-display/, "Arabic display typography must have a dedicated scale.");
assert.match(css, /prefers-reduced-motion: reduce/, "Reduced-motion support is required.");
assert.match(css, /forced-colors: active/, "Forced-colors support is required.");
assert.match(primitives, /export function SaloraButton/, "The shared button primitive is required.");
assert.match(primitives, /export function SaloraEmptyState/, "The shared empty-state primitive is required.");
assert.match(proxy, /img-src[^"]+https:\/\/\*\.supabase\.co/, "CSP must allow the isolated Supabase product-media origin.");
assert.match(mediaManager, /onError=\{\(\) => setFailedSrc\(src\)\}/, "Media cards must recover visibly when a storage asset cannot load.");
assert.match(mediaManager, /salora_catalog_photography_v1/, "The authoritative 117-product media source must remain explicitly isolated.");
assert.match(mediaManager, /authoritativeProducts/, "Media management must report unique product coverage instead of conflating products with draft records.");

console.log("Unified experience contract passed: responsive typography, RTL, primitives, and accessibility guards verified.");
