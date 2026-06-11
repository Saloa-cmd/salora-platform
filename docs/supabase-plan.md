# Supabase Plan

Do not implement Supabase in Phase 1. This is the intended schema direction.

## Tables

- products: id, category_id, name, description, price, tags, pairing_product_id, image_url, featured, active.
- categories: id, name, slug, sort_order, active.
- orders: id, customer_id, status, order_type, subtotal, notes, phone, whatsapp_message, created_at.
- order_items: id, order_id, product_id, quantity, unit_price, line_total.
- customers: id, name, phone, email, preferences, created_at.
- loyalty_accounts: id, customer_id, points_balance, tier, created_at.
- loyalty_transactions: id, account_id, order_id, points, reason, created_at.
- offers: id, title, description, starts_at, ends_at, active, loyalty_only.
- ai_concierge_logs: id, customer_id, prompt, response, suggested_product_ids, created_at.
- content_blocks: id, location, title, body, metadata, active, sort_order.

## Security

Use Supabase Auth for admin and customer identity. Define row-level security before connecting production clients.

## Data Layer

Keep `packages/data` as the boundary. Replace local arrays with Supabase fetchers while preserving product and order types.
