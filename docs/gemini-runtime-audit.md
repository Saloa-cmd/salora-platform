# Gemini Runtime Audit

Date: 2026-06-01

## Classification

Result: `PARTIAL`

## Live Evidence

| Audit Item | Result |
|---|---|
| Credential validation | PASS |
| Environment loading | PASS |
| API key shape | WARNING |
| Model listing | PASS |
| Lightweight completion | FAILED |
| Completion HTTP status | `404` |
| Error classification | `NOT_FOUND` |
| Token metadata | NOT_AVAILABLE |
| AI Gateway integration | NOT_RUN |
| Routing validation | NOT_RUN |
| Fallback validation | READY_BY_POLICY |
| Observability validation | PARTIAL |

## Provider Details

Gemini model listing succeeded, but the configured completion endpoint for `gemini-1.5-flash` returned `NOT_FOUND`. The configured key has a nonstandard shape compared with the common Google API key format.

## Remaining Gate

Verify Gemini API key type, Google Cloud project/API enablement, and model endpoint name. Re-run completion and gateway certification after endpoint access is corrected.

No API key, project id, or secret value is included in this report.
