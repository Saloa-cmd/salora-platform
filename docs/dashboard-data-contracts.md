# Dashboard Data Contracts

## Shared Response Handling

SALORA dashboard adapters expect API responses in the existing domain envelope:

```json
{
  "requestId": "uuid",
  "data": {}
}
```

Errors are surfaced as explicit `unauthorized`, `error`, or `empty` dashboard states.

## Adapter Mapping

| Adapter | APIs | Notes |
|---|---|---|
| `executiveAdapter.ts` | `/api/intelligence/kpis`, `/api/intelligence/revenue`, `/api/intelligence/operations`, `/api/intelligence/ai` | Combines cross-domain executive cards, trend, runtime, and alerts. |
| `revenueAdapter.ts` | `/api/intelligence/revenue` | Uses existing revenue analytics: gross, net, AOV, payment success, refunds, failures, channel revenue. |
| `operationsAdapter.ts` | `/api/intelligence/operations`, `/api/health` | Uses operations, inventory, alert, forecasting, and runtime health data. |
| `aiAdapter.ts` | `/api/intelligence/ai` | Uses AI evaluation store metrics; marks latency and fallback as unavailable until exposed. |
| `customerAdapter.ts` | `/api/intelligence/customers`, `/api/intelligence/loyalty` | Combines customer health and loyalty engagement. |
| `whatsappAdapter.ts` | `/api/intelligence/operations`, `/api/health` | Returns explicit empty states for missing exact channel metrics. |

## No Fake Success Policy

Unavailable metrics are rendered as `empty` or `warning`, never as healthy counters. In particular, WhatsApp conversations, message direction, response latency, and assistant attribution require a future channel intelligence API.
