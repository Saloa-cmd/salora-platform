# Gemini Failure Certification

Date: 2026-06-01

## Status

Status: `PARTIAL_LIVE`

| Drill | Status | Notes |
|---|---|---|
| Timeout | NOT_RUN | Requires successful baseline routing first. |
| Unavailable provider | NOT_RUN | Requires successful baseline routing first. |
| Invalid response | NOT_RUN | Requires successful baseline routing first. |
| Provider not found | PASS | Live provider returned `NOT_FOUND`. |

Full fallback certification must be rerun after Gemini connectivity succeeds.
