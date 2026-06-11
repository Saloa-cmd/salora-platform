import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const csvPath = "salora_products_clean_import.csv";
const expectedCount = 94;

function loadEnv() {
  if (!fs.existsSync(".env")) return;
  for (const line of fs.readFileSync(".env", "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([^#][^=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  }
}

function parseCsv(input) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (quoted) {
      if (char === "\"") {
        if (input[i + 1] === "\"") {
          cell += "\"";
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += char;
      }
    } else if (char === "\"") {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell.replace(/\r$/, ""));
    rows.push(row);
  }

  return rows.filter((candidate) => candidate.some((value) => value.trim() !== ""));
}

function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function readProducts() {
  const text = fs.readFileSync(csvPath, "utf8").replace(/^\uFEFF/, "");
  const rows = parseCsv(text);
  const headers = rows[0].map((header) => header.trim());
  const records = rows.slice(1).map((row) =>
    Object.fromEntries(headers.map((header, index) => [header, (row[index] ?? "").trim()]))
  );

  const requiredColumns = ["sort_order", "sku", "handle", "name", "category", "price_omr", "status"];
  const missingColumns = requiredColumns.filter((column) => !headers.includes(column));
  const invalidRows = [];
  const seenHandles = new Set();
  const seenSkus = new Set();
  const duplicateHandles = [];
  const duplicateSkus = [];

  records.forEach((record, index) => {
    const rowNumber = index + 2;
    const handle = record.handle.toLowerCase();
    const sku = record.sku.toLowerCase();
    const price = Number(record.price_omr);

    if (!record.handle) invalidRows.push({ rowNumber, reason: "missing handle" });
    if (!record.name) invalidRows.push({ rowNumber, reason: "missing product name" });
    if (!record.category) invalidRows.push({ rowNumber, reason: "missing category" });
    if (!Number.isFinite(price) || price < 0) invalidRows.push({ rowNumber, reason: `invalid price: ${record.price_omr}` });
    if (record.status.toLowerCase() !== "active") invalidRows.push({ rowNumber, reason: `unsupported status: ${record.status}` });

    if (handle && seenHandles.has(handle)) duplicateHandles.push(record.handle);
    if (sku && seenSkus.has(sku)) duplicateSkus.push(record.sku);
    if (handle) seenHandles.add(handle);
    if (sku) seenSkus.add(sku);
  });

  if (records.length !== expectedCount || missingColumns.length || invalidRows.length || duplicateHandles.length || duplicateSkus.length) {
    throw new Error(
      JSON.stringify({ records: records.length, expectedCount, missingColumns, invalidRows, duplicateHandles, duplicateSkus }, null, 2)
    );
  }

  return records.map((record) => ({
    sortOrder: Number(record.sort_order),
    sku: record.sku,
    slug: record.handle,
    name: record.name,
    categoryName: record.category,
    categorySlug: slugify(record.category),
    description: record.description,
    price: record.price_omr,
    imageUrl: record.image_url,
    status: "ACTIVE"
  }));
}

async function main() {
  loadEnv();
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DIRECT_URL or DATABASE_URL is required.");

  const postgresPackage = fs
    .readdirSync("node_modules/.pnpm", { withFileTypes: true })
    .find((entry) => entry.isDirectory() && entry.name.startsWith("postgres@"));
  if (!postgresPackage) throw new Error("postgres package not found in node_modules/.pnpm.");
  const postgresModule = await import(
    pathToFileURL(path.join("node_modules/.pnpm", postgresPackage.name, "node_modules/postgres/src/index.js"))
  );
  const postgres = postgresModule.default;

  const products = readProducts();
  const categories = [...new Map(products.map((product) => [product.categorySlug, product.categoryName])).entries()]
    .map(([slug, name], index) => ({ slug, name, sortOrder: index + 1 }));

  const sql = postgres(connectionString, { max: 1, ssl: "require" });
  const report = {
    csvRows: products.length,
    categoriesCreated: 0,
    categoriesUpdated: 0,
    productsCreated: 0,
    productsUpdated: 0,
    productImagesCreated: 0,
    couponsUpserted: 0,
    promotionsUpserted: 0,
    promotionProductsLinked: 0,
    featureFlagsUpserted: 0,
    duplicatesSkipped: 0
  };

  try {
    await sql.begin(async (tx) => {
      const categoryIds = new Map();
      for (const category of categories) {
        const existing = await tx`SELECT id FROM product_categories WHERE slug = ${category.slug}`;
        if (existing.length) {
          await tx`
            UPDATE product_categories
            SET name = ${category.name}, sort_order = ${category.sortOrder}
            WHERE slug = ${category.slug}
          `;
          categoryIds.set(category.slug, existing[0].id);
          report.categoriesUpdated += 1;
        } else {
          const inserted = await tx`
            INSERT INTO product_categories (slug, name, sort_order)
            VALUES (${category.slug}, ${category.name}, ${category.sortOrder})
            RETURNING id
          `;
          categoryIds.set(category.slug, inserted[0].id);
          report.categoriesCreated += 1;
        }
      }

      const productIds = new Map();
      for (const product of products) {
        const categoryId = categoryIds.get(product.categorySlug);
        const existing = await tx`SELECT id FROM catalog_products WHERE slug = ${product.slug}`;
        if (existing.length) {
          await tx`
            UPDATE catalog_products
            SET category_id = ${categoryId},
                name = ${product.name},
                description = ${product.description},
                status = ${product.status},
                base_price = ${product.price},
                tags = ${[`sku:${product.sku}`, `category:${product.categorySlug}`]},
                updated_at = CURRENT_TIMESTAMP
            WHERE slug = ${product.slug}
          `;
          productIds.set(product.slug, existing[0].id);
          report.productsUpdated += 1;
        } else {
          const inserted = await tx`
            INSERT INTO catalog_products (category_id, slug, name, description, status, base_price, tags, created_at, updated_at)
            VALUES (${categoryId}, ${product.slug}, ${product.name}, ${product.description}, ${product.status}, ${product.price}, ${[`sku:${product.sku}`, `category:${product.categorySlug}`]}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING id
          `;
          productIds.set(product.slug, inserted[0].id);
          report.productsCreated += 1;
        }

        if (product.imageUrl) {
          const productId = productIds.get(product.slug);
          const existingImage = await tx`
            SELECT id FROM product_images
            WHERE product_id = ${productId} AND public_url = ${product.imageUrl} AND deleted_at IS NULL
          `;
          if (!existingImage.length) {
            await tx`
              INSERT INTO product_images (product_id, storage_bucket, storage_path, public_url, alt_text, sort_order, is_primary, created_at, updated_at)
              VALUES (${productId}, 'product-images', ${`csv/${product.slug}`}, ${product.imageUrl}, ${product.name}, 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `;
            report.productImagesCreated += 1;
          }
        }
      }

      const coupons = [
        {
          code: "FIRSTORDER",
          name: "First Order Bonus",
          description: "Soft launch first order bonus.",
          discountType: "PERCENTAGE",
          discountValue: "10.000",
          maxDiscountAmount: "1.000",
          minimumOrderTotal: "2.000",
          usageLimitPerCustomer: 1
        },
        {
          code: "MATCHA10",
          name: "Matcha Launch Offer",
          description: "Soft launch matcha offer.",
          discountType: "PERCENTAGE",
          discountValue: "10.000",
          maxDiscountAmount: "0.800",
          minimumOrderTotal: "1.500",
          usageLimitPerCustomer: 2
        }
      ];

      for (const coupon of coupons) {
        await tx`
          INSERT INTO coupons (
            code, name, description, discount_type, discount_value, currency,
            minimum_order_total, max_discount_amount, usage_limit_per_customer,
            is_active, metadata, created_at, updated_at
          )
          VALUES (
            ${coupon.code}, ${coupon.name}, ${coupon.description}, ${coupon.discountType}, ${coupon.discountValue},
            'OMR', ${coupon.minimumOrderTotal}, ${coupon.maxDiscountAmount}, ${coupon.usageLimitPerCustomer},
            true, ${sql.json({ launch: "simple_soft_launch" })}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          )
          ON CONFLICT (code) DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            discount_type = EXCLUDED.discount_type,
            discount_value = EXCLUDED.discount_value,
            minimum_order_total = EXCLUDED.minimum_order_total,
            max_discount_amount = EXCLUDED.max_discount_amount,
            usage_limit_per_customer = EXCLUDED.usage_limit_per_customer,
            is_active = true,
            metadata = EXCLUDED.metadata,
            updated_at = CURRENT_TIMESTAMP
        `;
        report.couponsUpserted += 1;
      }

      const promotions = [
        {
          slug: "coffee-dessert-bundle",
          name: "Coffee + Dessert Bundle",
          description: "Soft launch bundle for coffee and dessert pairings.",
          priority: 20,
          rules: { type: "bundle", discount: "modest", categories: ["hot-coffee", "cold-coffee", "desserts"] },
          categorySlugs: ["hot-coffee", "cold-coffee", "desserts"]
        },
        {
          slug: "matcha-launch-offer",
          name: "Matcha Launch Offer",
          description: "Soft launch visibility offer for matcha menu items.",
          priority: 15,
          rules: { type: "category_offer", discount: "modest", categories: ["matcha-section"] },
          categorySlugs: ["matcha-section"]
        }
      ];

      for (const promotion of promotions) {
        const rows = await tx`
          INSERT INTO promotions (slug, name, description, status, priority, rules, metadata, created_at, updated_at)
          VALUES (${promotion.slug}, ${promotion.name}, ${promotion.description}, 'ACTIVE', ${promotion.priority}, ${sql.json(promotion.rules)}, ${sql.json({ launch: "simple_soft_launch" })}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT (slug) DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            status = 'ACTIVE',
            priority = EXCLUDED.priority,
            rules = EXCLUDED.rules,
            metadata = EXCLUDED.metadata,
            updated_at = CURRENT_TIMESTAMP
          RETURNING id
        `;
        report.promotionsUpserted += 1;
        const promotionId = rows[0].id;
        for (const product of products.filter((candidate) => promotion.categorySlugs.includes(candidate.categorySlug))) {
          const productId = productIds.get(product.slug);
          await tx`
            INSERT INTO promotion_products (promotion_id, product_id, created_at)
            VALUES (${promotionId}, ${productId}, CURRENT_TIMESTAMP)
            ON CONFLICT (promotion_id, product_id) DO NOTHING
          `;
          report.promotionProductsLinked += 1;
        }
      }

      const flags = [
        ["soft_launch_enabled", true],
        ["online_ordering_enabled", true],
        ["stripe_payments_enabled", true],
        ["openai_concierge_enabled", true],
        ["gemini_provider_enabled", false],
        ["whatsapp_channel_enabled", false]
      ];

      for (const [key, enabled] of flags) {
        await tx`
          INSERT INTO feature_flags (key, description, enabled, environment, rules, created_at, updated_at)
          VALUES (${key}, ${`SALORA Simple Soft Launch flag: ${key}`}, ${enabled}, 'staging', ${sql.json({ launch: "simple_soft_launch" })}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT (key, environment) DO UPDATE SET
            description = EXCLUDED.description,
            enabled = EXCLUDED.enabled,
            rules = EXCLUDED.rules,
            updated_at = CURRENT_TIMESTAMP
        `;
        report.featureFlagsUpserted += 1;
      }
    });

    const [categoryCount] = await sql`SELECT count(*)::int AS count FROM product_categories`;
    const [activeProductCount] = await sql`SELECT count(*)::int AS count FROM catalog_products WHERE status = 'ACTIVE'`;
    const [imageCount] = await sql`SELECT count(*)::int AS count FROM product_images WHERE deleted_at IS NULL`;
    const [couponCount] = await sql`SELECT count(*)::int AS count FROM coupons WHERE is_active = true AND deleted_at IS NULL`;
    const [promotionCount] = await sql`SELECT count(*)::int AS count FROM promotions WHERE status = 'ACTIVE' AND deleted_at IS NULL`;
    const [flagCount] = await sql`SELECT count(*)::int AS count FROM feature_flags WHERE environment = 'staging' AND deleted_at IS NULL`;

    report.controlTower = {
      categories: categoryCount.count,
      activeProducts: activeProductCount.count,
      productImages: imageCount.count,
      activeCoupons: couponCount.count,
      activePromotions: promotionCount.count,
      stagingFeatureFlags: flagCount.count,
      csvProductsMissingImages: products.filter((product) => !product.imageUrl).length
    };

    console.log(JSON.stringify(report, null, 2));
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
