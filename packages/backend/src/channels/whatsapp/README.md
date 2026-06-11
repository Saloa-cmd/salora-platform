# WhatsApp Channel

WhatsApp is implemented as a customer channel, not as a standalone bot. It routes inbound messages through the channel layer, conversation domain, AI Concierge, recommendation engine, and business domains.

Real WhatsApp Cloud API calls remain disabled unless `WHATSAPP_ENABLED=true` and credentials are configured.
