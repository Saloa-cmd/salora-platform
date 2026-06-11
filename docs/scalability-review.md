# SALORA Scalability Review

Date: 2026-06-01

## Simulation Model

This is an architectural simulation based on current code paths, not a synthetic load-test run.

## 100 Users

- CPU: Low to moderate.
- Memory: Low.
- Database: Low because current dashboard analytics are mostly in-memory snapshots.
- Redis: Optional; not required for current dashboard cache.
- AI requests: Not triggered by dashboard rendering.

Expected result: Stable.

## 1,000 Users

- CPU: Moderate if every user loads dashboards concurrently.
- Memory: Moderate due to in-process cache and client bundles.
- Database: Moderate once Prisma-backed read models replace in-memory stores.
- Redis: Recommended for shared dashboard cache.
- AI requests: Still isolated from dashboard rendering.

Required controls:

- Redis-backed aggregation cache.
- Batched executive summary endpoint.
- CDN caching for static assets.
- API rate limits per tenant/user.

Expected result after current Phase 10.5 rendering fix: Stable with horizontal web scaling.

## 10,000 Users

- CPU: High without read models and shared cache.
- Memory: Moderate to high across instances.
- Database: High if aggregations hit OLTP tables directly.
- Redis: Required.
- AI requests: Must remain decoupled from dashboard page loads.

Required enterprise controls:

- Materialized analytics/read models.
- Redis or edge cache for dashboard aggregates.
- Query latency SLOs and slow-query alerts.
- Tenant-level rate limits.
- Queue-backed automation and notification workloads.
- Dedicated observability dashboards for cache hit ratio, p95 API latency, p95 render time, and worker lag.

## Scalability Score

Current after Phase 10.5 fixes: 9.1/10.

Target 9.8 requires:

- Real load test execution.
- Redis-backed cross-instance cache.
- Prisma query instrumentation.
- Materialized analytics read models.
- p95 latency dashboards.
