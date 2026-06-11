# AI Governance

AI Governance controls what providers, models, environments, costs, and request rates are allowed.

## Controls

- Provider approval
- Model approval
- Environment restrictions
- Real provider feature flag
- Provider blacklist
- Cost ceiling checks
- Per-scope rate limit checks
- AI feature flags

## Environment Policy

Development and CI default to mock-only behavior. Production may enable real providers only after credentials, budget ceilings, operational monitoring, and provider approval are configured.

## Blocked Until Production Decision

- Real provider keys
- Paid provider budget ceilings
- Persisted evaluation retention policy
- Provider-specific incident response thresholds
