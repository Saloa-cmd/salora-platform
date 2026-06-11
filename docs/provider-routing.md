# Provider Routing

SALORA supports OpenAI, Gemini, Claude, and mock providers behind the same `AiProvider` interface.

## Strategy

- Preferred provider comes from AI policy.
- Fallback order is preferred provider, configured fallback, then mock.
- Provider blacklist is controlled with `AI_PROVIDER_BLACKLIST`.
- Provider health records latency, failures, and health score.
- `mock` remains available even when real providers are disabled.

## Provider Enablement

Real providers require:

- `AI_ENABLE_REAL_PROVIDERS=true`
- A provider API key
- An approved provider/model pair
- Non-test runtime environment

This keeps CI deterministic and avoids accidental paid calls.
