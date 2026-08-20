# Control Tower Information Architecture

The prior navigation exposed 15 implementation-oriented destinations, including overlapping content, menu, revenue, inventory, loyalty, notifications and channel surfaces. PR3 groups real jobs into ten stable workspaces and redirects legacy routes.

```text
Control Tower
├── Overview — priority work, readiness, alerts
├── Experience — Homepage, pages, mobile presentation, brand, assets, navigation
├── Menu — products, categories, collections, media, presentation
├── Orders — queues, details, validated transitions
├── Customers — intelligence and existing loyalty operations
├── Marketing — promotions, coupons and campaign operations
├── AI — contextual draft assistance
├── Analytics — existing authoritative dashboards
├── Operations — WhatsApp, runtime and diagnostics
└── Settings — governed configuration, access and audit
```

Only sections supported by the actor's current permissions are sent to the client. Hidden navigation is not authorization: routes, APIs and repositories retain their own server checks. Global Search and Ctrl/Cmd+K share this permission-scoped model and return bounded server results.

Empty aspirational destinations are not created. Brand, generic assets and navigation remain within Experience until their backend contracts justify independent screens.
