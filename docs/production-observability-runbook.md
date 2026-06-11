# Production Observability Runbook

## Dashboards

- WhatsApp inbound and outbound message rate.
- WhatsApp webhook failure rate.
- Delivery status rates: sent, delivered, read, failed.
- Provider message duplicate rate.
- AI provider usage, latency, failures, fallback rate, and cost estimate.
- AI evaluation score by provider, channel, and intent.
- Database query failures and slow queries.

## Alerts

- Webhook failure rate above 2% for 5 minutes.
- WhatsApp delivery failures above 5% for 10 minutes.
- AI fallback spike above baseline for 10 minutes.
- AI safety block spike above baseline for 10 minutes.
- Database query timeout count above zero for 5 minutes.

## Incident Handling

1. Disable live channel: `WHATSAPP_ENABLED=false`.
2. Disable real providers: `AI_ENABLE_REAL_PROVIDERS=false`.
3. Add failing AI provider to `AI_PROVIDER_BLACKLIST`.
4. Inspect provider message processing status.
5. Replay only records that are failed and safe to retry.
