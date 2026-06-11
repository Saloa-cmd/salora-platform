# SALORA Build Bottlenecks

Date: 2026-06-01

## Top Slowest Routes Observed

The previous build explicitly reported retries for these routes:

1. `/_global-error`
2. `/_not-found`
3. `/control-tower/executive`
4. `/control-tower/revenue`
5. `/control-tower/orders`
6. `/control-tower/inventory`
7. `/control-tower/customers`
8. `/control-tower/loyalty`

Expected additional Control Tower SSG paths in the same risk class before the fix:

9. `/control-tower/ai`
10. `/control-tower/whatsapp`
11. `/control-tower/notifications`
12. `/control-tower/content`
13. `/control-tower/automation`
14. `/control-tower/integrations`
15. `/control-tower/settings`
16. `/dashboard`
17. `/dashboard/revenue`
18. `/dashboard/operations`
19. `/dashboard/ai`
20. `/dashboard/customers`

## Top Slowest Components by Risk

Measured component-level profiler data is not available yet. Risk-based ranking:

1. `ControlTowerView`
2. `ControlTowerShell`
3. `NoCodeActionPanel`
4. `DashboardView`
5. `DashboardShell`
6. `DashboardSidebar`
7. `DashboardTopBar`
8. `AlertCard`
9. `TrendCard`
10. `RuntimeStatusCard`
11. `KpiCard`
12. `CapabilityCard`
13. `ProductActionPanel`
14. `InventoryActionPanel`
15. `LoyaltyActionPanel`
16. `NotificationActionPanel`
17. `DashboardGrid`
18. `DashboardSection`
19. `DashboardCard`
20. `ControlTowerPerf`

## Top Expensive Queries

No heavy Prisma query was found in the dashboard/control tower execution path during this audit. Current query risk is future-facing:

1. Revenue aggregation by payment status/channel.
2. Orders summary by status/time.
3. Customer repeat purchase and churn scoring.
4. Loyalty ledger rollups.
5. AI evaluation aggregation.
6. Inventory reorder risk scan.
7. Notification queue counts.
8. WhatsApp message direction counters.
9. Campaign attribution.
10. Tenant-scoped cross-domain analytics.

## Top Expensive Aggregations

1. `generateKpis`
2. `generateExecutiveReport`
3. `getRevenueAnalyticsSnapshot`
4. `getOperationsSnapshot`
5. `getCustomerIntelligenceSnapshot`
6. `getLoyaltyIntelligenceSnapshot`
7. `getAiIntelligenceSnapshot`
8. `getInventoryIntelligenceSnapshot`
9. `detectOperationalAlerts`
10. `getForecastingReadiness`

## Fix Applied

- Removed SSG generation from Control Tower dynamic sections.
- Marked operational dashboards and Control Tower pages as `force-dynamic`.
- Added server-side intelligence cache and metrics.
- Added client widget load telemetry.
