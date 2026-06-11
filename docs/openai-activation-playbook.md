# OpenAI Activation Playbook

## Rollout Plan

1. Configure `OPENAI_API_KEY` in staging secret storage.
2. Keep `AI_DEFAULT_PROVIDER=mock` for baseline validation.
3. Set `AI_ENABLE_REAL_PROVIDERS=true` in staging only.
4. Remove `openai` from `AI_PROVIDER_BLACKLIST`.
5. Switch `AI_DEFAULT_PROVIDER=openai` for controlled staging traffic.
6. Run staging validation suite and inspect `/api/metrics`.

## Rollback Plan

- Set `AI_DEFAULT_PROVIDER=mock`.
- Set `AI_ENABLE_REAL_PROVIDERS=false`.
- Add `openai` to `AI_PROVIDER_BLACKLIST`.
- Re-run staging validation and release health checks.

## Monitoring Plan

- Provider latency.
- Provider failures.
- Fallback rate.
- Evaluation score.
- Safety blocks.
- Estimated cost.

## Incident Plan

If OpenAI degrades, blacklist OpenAI, return to mock, preserve AI evaluation records, and review provider failure metrics before reactivation.
