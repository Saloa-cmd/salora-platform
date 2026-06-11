# Channel Abstraction

The channel abstraction keeps customer communication provider-neutral.

## Interface

Every channel provider supports:

- `sendMessage`
- `sendNotification`
- `sendTemplate`
- `trackDelivery`

## Current Providers

- WhatsApp Cloud API

## Future Providers

- Mobile push
- Email
- Future voice

The business domains and AI runtime should not depend on a provider SDK directly.
