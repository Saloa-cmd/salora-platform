import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const authority = readFileSync("apps/web/lib/server/menuAuthority.ts", "utf8");
const renderer = readFileSync("apps/web/components/experience/ExperienceRenderer.tsx", "utf8");
const layout = readFileSync("apps/web/app/layout.tsx", "utf8");
const css = readFileSync("apps/web/app/p32-catalog-media.css", "utf8");

assert.match(authority, /database\.productImage\.findMany/);
assert.match(authority, /liveImagesByProduct/);
assert.match(authority, /liveProduct\?\.status \?\? product\?\.status/);
assert.match(authority, /firstPublicImage\(liveImages\) \?\? firstPublicImage\(snapshotImages\)/);
assert.match(authority, /salora-menu-authority-v3/);

assert.match(renderer, /import Image from "next\/image"/);
assert.match(renderer, /ProductShowcaseCard/);
assert.match(renderer, /Price coming soon/);
assert.match(renderer, /sizes="\(min-width: 1024px\) 31vw/);

assert.match(layout, /p32-catalog-media\.css/);
assert.match(css, /content-visibility: auto/);
assert.match(css, /prefers-reduced-motion/);

console.log("P32 catalog media regression checks passed.");
