# Gemini Activation Playbook

## Rollout Plan

1. Configure `GEMINI_API_KEY` in staging secret storage.
2. Keep mock fallback active.
3. Set `AI_ENABLE_REAL_PROVIDERS=true` in staging only.
4. Remove `gemini` from `AI_PROVIDER_BLACKLIST`.
5. Set `AI_DEFAULT_PROVIDER=gemini` for a controlled staging pass.
6. Compare Gemini against OpenAI and mock using evaluation v2 metrics.

## Rollback Plan

- Set `AI_DEFAULT_PROVIDER=mock`.
- Add `gemini` to `AI_PROVIDER_BLACKLIST`.
- Set `AI_ENABLE_REAL_PROVIDERS=false` if all real providers should be disabled.

## Monitoring Plan

- Latency.
- Error rate.
- Fallback rate.
- Cost efficiency.
- Recommendation quality.
- Safety compliance.

## Incident Plan

On degradation, return traffic to mock, keep evaluation records for review, and avoid production promotion until the provider is stable in staging.
