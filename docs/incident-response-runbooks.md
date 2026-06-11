# Incident Response Runbooks

## Provider Outage

1. Add failing provider to `AI_PROVIDER_BLACKLIST`.
2. Set `AI_DEFAULT_PROVIDER=mock`.
3. Monitor fallback and error metrics.
4. Preserve evaluation records for review.
5. Re-enable only after staging validation passes.

## WhatsApp Outage

1. Set `WHATSAPP_ENABLED=false`.
2. Keep web and mobile channels active.
3. Inspect webhook failure and provider message status.
4. Replay failed provider messages only after root cause is resolved.

## Database Outage

1. Confirm `/api/ready` state.
2. Stop activation or rollout immediately.
3. Check database provider dashboard.
4. Restore from backup only after confirming data loss or corruption.
5. Keep channels disabled until write path is healthy.

## Redis Outage

1. Check Redis connection metrics.
2. Pause background workers if queue reliability is degraded.
3. Keep synchronous customer flows operating only if readiness permits.
4. Reconnect and verify queue health before resuming.

## AI Degradation

1. Switch to mock provider.
2. Lower traffic to real providers to zero.
3. Inspect latency, cost, safety, and evaluation scores.
4. Re-run staging validation before reactivation.
