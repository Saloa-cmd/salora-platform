import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { PrismaPg } from "../packages/backend/node_modules/@prisma/adapter-pg/dist/index.mjs";
import { PrismaClient } from "../packages/backend/src/database/generated/client.ts";

const BRAND = "SALORA";
const BUCKET = process.env.SALORA_PRODUCT_MEDIA_BUCKET || "salora-product-media";
const SOURCE = "salora_catalog_photography_v1";
const args = new Set(process.argv.slice(2));
const apply = args.has("--apply");
const publishApproved = args.has("--publish-approved");
const assetsArg = process.argv.find((value) => value.startsWith("--assets="));
const assetsDir = resolve(assetsArg?.slice("--assets=".length) || "assets/salora-product-media");

const aliases = new Map(Object.entries({
  "blue-sky-mocktail": "blue-sky",
  "dragon-cocktail": "dragon",
  "florida-cocktail": "florida",
  "havana-cocktail": "havana",
  "hawaii-cocktail": "hawaii",
  "hot-spanish-latte": "spanish-latte",
  "lemon-mint-juice": "lemon-mint",
  "mango-passion-juice": "mango-passion-fruit",
  "salora-signature-cappuccino": "salora-cappuccino",
  "salora-signature-latte": "salora-latte",
  "sunrise-mocktail": "sunrise",
  "sunshine-mocktail": "sunshine"
}));

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value.replace(/\/$/, "");
}

function objectUrl(base, bucket, path) {
  return `${base}/storage/v1/object/public/${encodeURIComponent(bucket)}/${path.split("/").map(encodeURIComponent).join("/")}`;
}

async function upload(base, key, path, body) {
  const endpoint = `${base}/storage/v1/object/${encodeURIComponent(BUCKET)}/${path.split("/").map(encodeURIComponent).join("/")}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      "content-type": "image/webp",
      "cache-control": "31536000",
      "x-upsert": "true"
    },
    body
  });
  if (!response.ok) throw new Error(`Storage upload failed (${response.status}) for ${path}: ${await response.text()}`);
}

async function main() {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DIRECT_URL or DATABASE_URL is required.");
  const supabaseUrl = apply ? required("SUPABASE_URL") : (process.env.SUPABASE_URL || "https://dry-run.invalid").replace(/\/$/, "");
  const secretKey = apply ? (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || required("SUPABASE_SECRET_KEY")) : "dry-run";
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    const files = (await readdir(assetsDir)).filter((name) => name.endsWith(".webp")).sort();
    if (files.length !== 117) throw new Error(`Expected 117 WebP assets, found ${files.length}.`);
    const mapped = files.map((file) => {
      const assetSlug = file.slice(0, -5);
      return { file, assetSlug, productSlug: aliases.get(assetSlug) || assetSlug };
    });
    if (new Set(mapped.map((item) => item.productSlug)).size !== 117) throw new Error("Asset mapping contains duplicate product slugs.");

    const products = await prisma.catalogProduct.findMany({
      where: { brandKey: BRAND },
      select: { id: true, slug: true, nameAr: true, nameEn: true }
    });
    const productBySlug = new Map(products.map((product) => [product.slug, product]));
    const missing = mapped.filter((item) => !productBySlug.has(item.productSlug)).map((item) => item.productSlug);
    const withoutAsset = products.filter((product) => !mapped.some((item) => item.productSlug === product.slug)).map((product) => product.slug);
    if (products.length !== 117 || missing.length || withoutAsset.length) {
      throw new Error(`Mapping gate failed: db=${products.length}, assets=${mapped.length}, missing=${missing.join(",") || "none"}, withoutAsset=${withoutAsset.join(",") || "none"}`);
    }

    const report = [];
    for (const item of mapped) {
      const product = productBySlug.get(item.productSlug);
      const filePath = resolve(assetsDir, item.file);
      const bytes = await readFile(filePath);
      const digest = createHash("sha256").update(bytes).digest("hex");
      const storagePath = `${BRAND.toLowerCase()}/products/${product.slug}/${digest.slice(0, 16)}.webp`;
      const publicUrl = objectUrl(supabaseUrl, BUCKET, storagePath);
      const altText = [product.nameAr, product.nameEn].filter(Boolean).join(" — ");
      const size = (await stat(filePath)).size;

      if (apply) {
        await upload(supabaseUrl, secretKey, storagePath, bytes);
        const existing = await prisma.productMediaDraft.findFirst({
          where: { productId: product.id, source: SOURCE, storagePath, archivedAt: null }
        });
        const data = {
          source: SOURCE,
          storageBucket: BUCKET,
          storagePath,
          publicUrl,
          altText,
          isPrimaryCandidate: true,
          metadata: { brand: BRAND, sha256: digest, bytes: size, width: 1200, height: 1200, format: "webp", reviewRequired: true }
        };
        if (existing) await prisma.productMediaDraft.update({ where: { id: existing.id }, data });
        else await prisma.productMediaDraft.create({ data: { productId: product.id, ...data } });
      }
      report.push({ productSlug: product.slug, file: item.file, storagePath, sha256: digest, bytes: size, action: apply ? "draft-upserted" : "validated" });
    }

    if (publishApproved) {
      if (!apply) throw new Error("--publish-approved requires --apply.");
      const approved = await prisma.productMediaDraft.findMany({
        where: { source: SOURCE, status: "APPROVED", archivedAt: null, product: { brandKey: BRAND } }
      });
      for (const draft of approved) {
        await prisma.$transaction(async (tx) => {
          if (draft.isPrimaryCandidate) await tx.productImage.updateMany({ where: { productId: draft.productId }, data: { isPrimary: false } });
          const prior = await tx.productImage.findFirst({ where: { productId: draft.productId, metadata: { path: ["sourceDraftId"], equals: draft.id } } });
          if (!prior) await tx.productImage.create({ data: {
            productId: draft.productId, storageBucket: draft.storageBucket, storagePath: draft.storagePath,
            publicUrl: draft.publicUrl, altText: draft.altText, sortOrder: draft.sortOrder,
            isPrimary: draft.isPrimaryCandidate, metadata: { sourceDraftId: draft.id, source: SOURCE }
          }});
          await tx.productMediaDraft.update({ where: { id: draft.id }, data: { status: "PUBLISHED", publishedAt: new Date() } });
        });
      }
      console.info(`Published ${approved.length} previously approved media drafts.`);
    }

    console.info(JSON.stringify({ ok: true, mode: apply ? "apply" : "dry-run", brand: BRAND, bucket: BUCKET, assets: report.length, aliases: aliases.size }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
