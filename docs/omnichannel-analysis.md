# Omnichannel Analysis

SALORA now has business domains, AI runtime, recommendations, loyalty, orders, notifications, mobile, and web. The missing capability is a production customer channel that consumes those foundations. Phase 5 makes WhatsApp Cloud API the first real channel while preserving the architecture for web, mobile, future voice, email, and push.

## Required WhatsApp Flows

- Webhook verification for Meta challenge flow.
- Inbound text message intake.
- AI Concierge response for menu and product discovery.
- Recommendation flow for personalized products, pairings, and upsells.
- Loyalty flow for points, rewards, and eligibility.
- Order assistance for lookup, history, status, and reorder suggestions.
- Delivery status tracking for sent, delivered, read, and failed messages.

## Service Boundaries

| Boundary | Responsibility |
| --- | --- |
| Channel Layer | Provider-neutral send, template, notification, delivery tracking |
| WhatsApp Adapter | Cloud API webhook parsing, signature validation, outbound message transport |
| Conversation Domain | Channel-independent conversation and message history |
| AI Runtime | Safety, provider routing, cost, evaluation, observability |
| Business Domains | Customers, products, orders, loyalty, notifications |

## API Contracts

- `GET /api/channels/whatsapp/webhook` verifies Meta webhook challenge.
- `POST /api/channels/whatsapp/webhook` receives inbound messages and delivery statuses.
- Channel providers implement `sendMessage`, `sendNotification`, `sendTemplate`, and `trackDelivery`.

## Event Flows

1. WhatsApp inbound message arrives.
2. Webhook validates signature and parses payload.
3. Conversation domain records inbound message.
4. Channel service classifies the flow as concierge, recommendation, loyalty, pairing, or order help.
5. AI Concierge and business domain services build a response.
6. WhatsApp provider attempts outbound delivery, or queues logically when disabled.
7. Conversation domain records outbound message and delivery state.

## Risks

- Security: webhook signature validation requires `WHATSAPP_APP_SECRET` before live use.
- Operations: live webhook retries can duplicate messages; idempotency by provider message id should become persistent before production.
- Scaling: in-memory conversation storage is acceptable for current local tests only; production needs database-backed conversations.
- Customer experience: ordering is assistance-only until payments and fulfillment workflows are implemented.

## Deployment Strategy

Keep `WHATSAPP_ENABLED=false` through development and CI. Enable in staging only after Meta app approval, webhook secret setup, verify token setup, phone number provisioning, and dashboard alerts.

## Observability Strategy

Track inbound messages, outbound messages, webhook failures, delivery states, channel latency, AI latency, AI errors, recommendation scores, and safety blocks.
