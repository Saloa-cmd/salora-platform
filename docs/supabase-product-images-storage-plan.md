# Supabase Product Images Storage Plan

Date: 2026-06-03

## Status

Status: PLAN_ONLY

No bucket was created. No storage objects were uploaded. No ProductImage rows were created.

## Bucket

Bucket name: `product-images`

Recommended access model: public-read only after explicit approval, with upload/write restricted to approved operators or service role workflows.

## Folder Structure

Use this structure exactly:

```text
product-images/
coffee/
matcha/
desserts/
cold-drinks/
hot-drinks/
specials/
```

## Path Standard

Primary image path:

```text
product-images/<group>/<slug>/<slug>-primary.webp
```

Optional future alternates:

```text
product-images/<group>/<slug>/<slug>-instagram.webp
product-images/<group>/<slug>/<slug>-menu-card.webp
```

## Group Mapping

| Menu Category | Storage Group |
| --- | --- |
| Specialty coffee | `coffee` |
| Matcha section | `matcha` |
| Desserts | `desserts` |
| Cold Coffee | `cold-drinks` |
| Frappes | `cold-drinks` |
| Fresh juices | `cold-drinks` |
| Fresh juice cocktails | `cold-drinks` |
| Iced tea | `cold-drinks` |
| Milkshake | `cold-drinks` |
| Smoothie section | `cold-drinks` |
| Soft cocktails | `cold-drinks` |
| Water | `cold-drinks` |
| Hot coffee | `hot-drinks` |
| Hot Drinks | `hot-drinks` |
| Signature Drinks / staging-only | `specials` unless retained and remapped |

## Operational Rules

- Upload only real approved assets.
- Use `.webp` for primary menu assets.
- Do not create a ProductImage record until the real storage path or approved public URL exists.
- Do not use AI-generated final product images without explicit approval.
