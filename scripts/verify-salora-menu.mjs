import fs from "node:fs";

const source = fs.readFileSync(new URL("../prisma/seed.salora-menu.ts", import.meta.url), "utf8");
const menuBlock = source.match(/const menu: MenuRow\[\] = \[([\s\S]*?)\n\];/u)?.[1];
if (!menuBlock) throw new Error("SALORA menu dataset was not found.");

const rows = [...menuBlock.matchAll(/^\s*\["([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*(null|\d+(?:\.\d+)?)/gmu)]
  .map((match) => ({ category: match[1], slug: match[2], nameAr: match[3], nameEn: match[4], price: match[5] }));
const slugs = new Set(rows.map((row) => row.slug));
const categories = new Set(rows.map((row) => row.category));

if (rows.length !== 117) throw new Error(`Expected 117 SALORA products, found ${rows.length}.`);
if (slugs.size !== rows.length) throw new Error("SALORA product slugs must be unique.");
if (categories.size !== 17) throw new Error(`Expected 17 SALORA categories, found ${categories.size}.`);
if (rows.some((row) => !row.nameAr.trim() || !row.nameEn.trim())) throw new Error("Every SALORA product requires Arabic and English names.");
if (!rows.some((row) => row.price === "null")) throw new Error("Unpriced products must remain explicit drafts.");

console.info(`SALORA menu verified: ${rows.length} bilingual products across ${categories.size} categories.`);
