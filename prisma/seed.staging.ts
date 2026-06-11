import { PrismaPg } from "../apps/web/node_modules/@prisma/adapter-pg/dist/index.mjs";
import { PrismaClient } from "../packages/backend/src/database/generated/client.ts";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Staging seed requires DIRECT_URL or DATABASE_URL.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString })
});

async function main() {
  await prisma.$executeRaw`
    INSERT INTO roles (id, name, description)
    VALUES
      (gen_random_uuid(), 'CUSTOMER', 'Customer account access'),
      (gen_random_uuid(), 'STAFF', 'Staff operational access'),
      (gen_random_uuid(), 'MANAGER', 'Manager operational access'),
      (gen_random_uuid(), 'ADMIN', 'Administrative access')
    ON CONFLICT (name) DO NOTHING
  `;

  await prisma.$executeRaw`
    INSERT INTO product_categories (id, slug, name, sort_order)
    VALUES
      (gen_random_uuid(), 'signature-drinks', 'Signature Drinks', 10),
      (gen_random_uuid(), 'desserts', 'Desserts', 20)
    ON CONFLICT (slug) DO NOTHING
  `;

  await prisma.$executeRaw`
    INSERT INTO catalog_products (id, category_id, slug, name, description, status, base_price, tags, pairing_hint)
    SELECT gen_random_uuid(), id, 'staging-matcha-latte', 'Staging Matcha Latte', 'Safe staging product for catalog validation.', 'ACTIVE', 2.500, ARRAY['staging', 'matcha'], 'Pairs with light desserts.'
    FROM product_categories
    WHERE slug = 'signature-drinks'
    ON CONFLICT (slug) DO NOTHING
  `;

  await prisma.$executeRaw`
    INSERT INTO catalog_products (id, category_id, slug, name, description, status, base_price, tags, pairing_hint)
    SELECT gen_random_uuid(), id, 'staging-honey-cake', 'Staging Honey Cake', 'Safe staging dessert for catalog validation.', 'ACTIVE', 1.900, ARRAY['staging', 'dessert'], 'Pairs with espresso.'
    FROM product_categories
    WHERE slug = 'desserts'
    ON CONFLICT (slug) DO NOTHING
  `;

  await prisma.$executeRaw`
    INSERT INTO runtime_configurations (id, scope, key, value, version, is_active, updated_at)
    VALUES
      (gen_random_uuid(), 'LOYALTY', 'default-earn-rule', '{"pointsPerOmr":10,"status":"staging"}'::jsonb, 1, true, CURRENT_TIMESTAMP),
      (gen_random_uuid(), 'FEATURE_FLAGS', 'staging-runtime', '{"payments":false,"realAiProviders":false,"whatsapp":false}'::jsonb, 1, true, CURRENT_TIMESTAMP),
      (gen_random_uuid(), 'APP', 'homepage-defaults', '{"hero":"SALORA Staging","menuMode":"staging"}'::jsonb, 1, true, CURRENT_TIMESTAMP)
    ON CONFLICT (scope, key) DO NOTHING
  `;

  console.info("Staging seed completed. Create the first admin user through the approved auth flow; no admin password is hardcoded by this seed.");
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
