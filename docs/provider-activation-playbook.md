# Provider Activation Playbook

Real AI providers remain disabled by default. Phase 5.5 prepares staging activation only.

## OpenAI

1. Set `OPENAI_API_KEY` in staging secret storage.
2. Keep `AI_DEFAULT_PROVIDER=mock`.
3. Set `AI_ENABLE_REAL_PROVIDERS=true` only in staging.
4. Remove `openai` from `AI_PROVIDER_BLACKLIST`.
5. Run AI Gateway, recommendation, safety, and evaluation smoke tests.
6. Monitor latency, failures, estimated cost, fallback count, safety blocks, and evaluation scores.

## Gemini

1. Set `GEMINI_API_KEY` in staging secret storage.
2. Keep mock fallback active.
3. Route selected staging traffic by changing `AI_DEFAULT_PROVIDER=gemini`.
4. Compare latency, safety, recommendation quality, and cost efficiency against OpenAI and mock.

## Claude

Claude adapter is implemented but should remain inactive until business approval because the requested next activation is OpenAI + Gemini staging.

## Rollback

- Set `AI_ENABLE_REAL_PROVIDERS=false`.
- Set `AI_DEFAULT_PROVIDER=mock`.
- Add failing provider to `AI_PROVIDER_BLACKLIST`.
- Verify `pnpm release:check` and `/api/ready`.
