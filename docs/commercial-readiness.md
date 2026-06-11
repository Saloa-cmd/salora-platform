# SALORA Commercial Readiness

Date: 2026-06-02

## Summary

SALORA is commercially viable for a focused cafe launch if launch scope is limited to website, mobile foundation, Control Tower, PostgreSQL, Redis, OpenAI, Stripe, orders, products, customers, loyalty, and revenue analytics.

## Lifecycle Verification

| Lifecycle | Readiness | Evidence | Launch Action |
|---|---:|---|---|
| Product management | 9.0/10 | Product API and Control Tower product creation action exist. | Seed final launch menu and verify operator permissions. |
| Category management | 8.5/10 | Product action supports category assignment; database category model exists. | Use simple category names for launch; postpone full CMS taxonomy. |
| Order lifecycle | 8.7/10 | Order API, order domain, payment state sync, operations intelligence. | Add operating runbook for manual exception handling. |
| Customer lifecycle | 8.5/10 | Customer profile domain and customer intelligence APIs exist. | Launch with basic profiles and retention tracking. |
| Loyalty lifecycle | 9.0/10 | Loyalty award/reversal, payment success/reversal sync, loyalty assistant context. | Keep rules simple for first launch. |
| Revenue lifecycle | 9.6/10 | Stripe test-mode certification, refund path, metrics, reconciliation readiness. | Register production webhook endpoint before real traffic. |
| AI Concierge lifecycle | 9.4/10 | OpenAI live app route certification for concierge, recommendations, explainer, loyalty assistant. | Keep OpenAI primary and mock fallback. |

## Runtime Configuration First

Business rules that should be managed through `runtime_configurations`:

| Scope | Launch Use |
|---|---|
| `PRICING` | Launch prices, limited-time pricing rules, AOV experiments. |
| `PROMOTIONS` | Launch offers and campaign copy. |
| `LOYALTY` | Earn/burn ratios, launch bonus, reward thresholds. |
| `AI_ROUTING` | OpenAI primary, mock fallback, Gemini disabled. |
| `AI_PROVIDER` | Provider activation state and model selection. |
| `FEATURE_FLAGS` | Checkout, AI, loyalty, promotion, and mobile gates. |
| `HOMEPAGE` | Launch hero copy and featured products. |
| `APP` | Mobile launch flags and navigation visibility. |
| `RECOMMENDATIONS` | Recommendation tone, product constraints, pairing rules. |

## Commercial Blockers

| Blocker | Severity | Resolution |
|---|---|---|
| Stripe production webhook endpoint not registered | High | Register production/staging webhook URL before real payments. |
| Supabase backup/restore live drill pending | Medium | Execute one drill before public launch. |
| WhatsApp missing credentials | Low for simple launch | Postpone; not launch-critical. |
| OTEL exporter not certified | Low for simple launch | Use Sentry and local metrics for first launch. |

## Decision

Commercial Readiness: 9.1/10

SALORA is ready for a controlled soft launch once Stripe production-mode settings and the pre-launch Supabase backup checklist are completed.
