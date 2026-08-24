# SALORA AI runtime update

This update adds a bounded bilingual SALORA system policy, a 600-token response ceiling,
empty-response rejection, real provider token accounting, and configurable cost estimates.

Required production variables:

- `OPENAI_API_KEY`
- `AI_ENABLE_REAL_PROVIDERS=true`
- `AI_DEFAULT_PROVIDER=openai`
- `AI_OPENAI_INPUT_USD_PER_MILLION`
- `AI_OPENAI_OUTPUT_USD_PER_MILLION`
