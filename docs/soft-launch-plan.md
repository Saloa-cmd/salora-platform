# SALORA Soft Launch Plan

Date: 2026-06-02

## Launch Objective

Launch SALORA as a focused cafe commerce platform with a small customer cohort, measurable revenue, and low operational complexity.

## Stages

| Stage | Users | Duration | Exit Criteria |
|---|---:|---|---|
| Stage 1 | 10 | 2-3 days | Orders complete, no payment blocker, AI Concierge stable. |
| Stage 2 | 25 | 3-5 days | Conversion and refund metrics stable, operator workflow understood. |
| Stage 3 | 50 | 1 week | Revenue dashboard reflects real activity, loyalty flow works. |
| Stage 4 | 100 | 1-2 weeks | Repeat orders and retention signals visible, support load acceptable. |

## Metrics to Track

| Metric | Target |
|---|---|
| Orders | Increasing by stage with no stuck payment state. |
| Conversion | Baseline first; improve after Stage 2. |
| Revenue | Stripe captured revenue reconciles with SALORA revenue analytics. |
| AI usage | Concierge requests are useful and cost-controlled. |
| Customer retention | Loyalty and repeat activity visible by Stage 3. |
| Refunds | Low and explainable. |
| Runtime health | PostgreSQL, Redis, Sentry, Stripe healthy. |

## Operating Rules

- OpenAI stays primary.
- Gemini, WhatsApp, full CMS, automation builder, and multi-tenant mode remain off.
- Product/pricing/promotion changes go through Control Tower runtime configuration or product action.
- Refunds require elevated roles.
- Daily launch review uses revenue, operations, AI, and Sentry evidence only.

## Stop Conditions

- Payment confirmation or refund failure cannot be resolved the same day.
- Database backup readiness is not confirmed before public customer traffic.
- Error rate or AI cost increases without explanation.
- Operators need code edits to perform routine business changes.
