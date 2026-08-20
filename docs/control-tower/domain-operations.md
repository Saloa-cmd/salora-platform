# Domain Operations

| Workspace | Reused backend | PR3 composition | Mutation boundary |
|---|---|---|---|
| Menu | catalog, media draft, Menu Authority APIs | authority status, product/media operations | existing catalog permissions, status/visibility contracts and audit |
| Orders | order API and transition validator | existing order command surface | `order:update`, state-machine validation, timeline and audit |
| Customers | customer intelligence and loyalty operations | least-privilege links and existing actions | `staff:read` and existing loyalty permission checks; no PII widening |
| Marketing | promotions/coupons services | existing launch operations | catalog permissions and typed schemas |
| Assets | `ProductImage`/`ProductMediaDraft` | product media manager and governance audit | MIME/storage governance remains in existing service; no generic asset table added |
| WhatsApp | provider/webhook/command services | current command center | server-only credentials, authenticated actions and audit |
| Operations | runtime governance services | safe operational abstractions | no raw topology or secret values |
| Settings | non-secret runtime configuration | existing protected config panel | typed keys, server authorization and audit; never arbitrary SQL/table access |

Global Search queries products, categories, orders and customers sequentially through the RLS-context repository, with explicit domain filters, a maximum of 15 DTO results and permission checks per domain. It never sends a full dataset to the browser.
