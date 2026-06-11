# SALORA Admin - Phase 1 Architecture Placeholder

The admin dashboard is intentionally not implemented in Phase 1. This folder documents the future surface so the platform can scale without reshaping the product later.

## Future Modules

- Products: names, descriptions, prices, tags, visual assets, availability, featured flags.
- Categories: Matcha, Coffee, Dessert, seasonal collections, sort order.
- Orders: status workflow, WhatsApp source, pickup/delivery metadata, notes.
- Offers: limited-time cards, loyalty eligibility, publication dates.
- Customers: profiles, preferences, phone numbers, order history.
- Loyalty: accounts, points, transactions, VIP tiers, rewards.
- AI Concierge Settings: recommendation prompts, mood rules, fallback messages, future model settings.
- Content Management: landing page sections, hiring copy, investor messaging, Instagram-ready content blocks.

## Phase 2 Direction

Build as a protected Next.js app or route group after Supabase auth and row-level security are defined. Admin actions must write to Supabase tables and revalidate web/mobile data sources through a shared data layer.
