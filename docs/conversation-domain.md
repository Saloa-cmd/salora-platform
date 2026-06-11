# Conversation Domain

The Conversation Domain stores channel-independent customer conversations and messages.

## Entities

- Conversation
- Message
- Channel
- MessageStatus
- CustomerContext through customer id, phone, order id, loyalty account id, and AI correlation id

## Integration

Conversations can link to customers, orders, loyalty accounts, and AI correlations without embedding raw provider payloads in business logic.

## Production Note

Phase 5 uses in-memory storage matching the existing local domain service pattern. Production should persist conversations with Prisma before live traffic.
