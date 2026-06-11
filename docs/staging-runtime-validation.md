# Staging Runtime Validation

## WhatsApp

- Apply runtime persistence migration.
- Set WhatsApp staging secrets.
- Verify webhook challenge.
- Send one inbound text message.
- Confirm provider message idempotency by replaying the same payload.
- Confirm conversation and messages are persisted.
- Confirm outbound remains controlled by `WHATSAPP_ENABLED`.

## AI Gateway

- Run mock provider smoke tests.
- Enable OpenAI or Gemini only in staging.
- Confirm fallback to mock works.
- Confirm evaluation metadata persists without prompt content.

## Recommendations

- Validate product recommendations, pairings, upsells, and loyalty rewards.
- Confirm recommendation score metrics are emitted.

## Loyalty

- Validate points lookup and reward eligibility through channel flow.

## Orders

- Validate order lookup, order history, and reorder suggestions.
- Confirm no payment flow is triggered.

## Notifications

- Validate notification domain remains isolated from WhatsApp provider logic.
