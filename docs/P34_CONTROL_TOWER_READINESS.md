# P34 — Control Tower Product Readiness

P34 turns P33 server-side orderability into an operator-visible workflow inside the Menu workspace.

## Operator surface

- Shows all 117 SALORA catalog products by loading the Control Tower products API in two bounded pages.
- Displays Price Ready, Media Ready, Category Ready, Options Ready and Order Ready state per product.
- Provides filters for Active, Draft, Activation Ready and Needs Work.
- Exposes a Safe Bulk Activation action only for DRAFT products that already satisfy Price + Media + Category + Options readiness.

## Safety invariant

Bulk activation does not perform a privileged database shortcut. It calls the existing typed Control Tower product mutation for each candidate, and every candidate is re-validated by the P33 server-side activation guard before status can become ACTIVE.

A product that changes between UI refresh and mutation is therefore rejected with HTTP 409 rather than being activated incorrectly.

## Current Production truth at P34 start

- 117 total products
- 104 ACTIVE
- 13 DRAFT
- 104/104 ACTIVE products are currently order-ready
- 0/13 DRAFT products are activation-ready because the DRAFT set currently lacks approved positive price and published media

No P34 code automatically prices or activates those 13 products.
