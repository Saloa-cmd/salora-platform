# Customer Journeys

## Product Discovery

Customer asks a menu question through WhatsApp. SALORA records the message, routes it to AI Concierge, uses product context, and responds through the channel provider.

## Recommendations

Customer asks for a recommendation. SALORA combines products, preferences, loyalty, availability readiness, and recommendation scoring.

## Loyalty

Customer asks about points or rewards. SALORA uses the loyalty domain and recommendation engine to explain eligibility.

## Order Assistance

Customer asks about an order, status, history, or reorder. SALORA uses the order domain for assistance only. No payment flow is performed in Phase 5.

## Future Payments

Stripe should attach to the Order Domain later. WhatsApp should remain a channel that presents payment links or status, not the owner of payment logic.

## Future Voice

Voice should reuse the same ChannelProvider contract and Conversation Domain with a future speech adapter.
