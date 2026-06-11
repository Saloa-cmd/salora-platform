# WhatsApp Meta Payload Analysis

Date: 2026-06-04
Scope: Blocker resolution only. No new features, APIs, dashboards, or schema changes.

## Outgoing Payload Source

The outgoing text payload is built in:

- `packages/backend/src/integrations/whatsapp/whatsapp.client.ts`
- Existing channel fallback: `packages/backend/src/channels/whatsapp/provider.ts`

Sanitized structure:

```json
{
  "messaging_product": "whatsapp",
  "to": "[redacted-recipient]",
  "type": "text",
  "text": {
    "preview_url": false,
    "body": "[redacted-test-body]"
  }
}
```

## Field Validation

| Field | Observed | Status |
| --- | --- | --- |
| `messaging_product` | `whatsapp` | PASS |
| `to` recipient | Present; tested original and digits-only variants | STRUCTURALLY PASS, META SEND BLOCKED |
| recipient format | Original had `+`; normalized variant was digits only with valid length | PASS |
| `type` | `text` | PASS |
| `text.body` | Present, non-empty, below 4096 chars | PASS |
| endpoint | `https://graph.facebook.com/v23.0/{PHONE_NUMBER_ID}/messages` | PASS |
| authorization | Bearer token sourced from env only | PASS |

## Meta v23 Comparison

Meta Cloud API message sends use:

- Graph API versioned endpoint: `/{phone-number-id}/messages`
- `messaging_product: "whatsapp"`
- recipient `to`
- message `type`
- type-specific payload, such as `text.body` for text messages

Official references used for comparison:

- https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages
- https://developers.facebook.com/docs/whatsapp/cloud-api/reference/phone-numbers
- https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-messages

The local payload matches the documented text-message structure. The remaining Meta send failure is not caused by missing `messaging_product`, missing `type`, or missing `text.body`.

## Live Meta Payload Tests

Two sanitized live send attempts were executed against Meta:

| Variant | Recipient Form | HTTP | Meta Code | Result |
| --- | --- | ---: | ---: | --- |
| original | Existing recipient form | 400 | 100 | BLOCKED |
| digits_only | `+` and non-digits removed | 400 | 100 | BLOCKED |

Meta response category:

- `OAuthException`
- `(#100) Invalid parameter`

## Phone Number ID Verification

The configured WhatsApp phone number ID was verified with Meta:

| Check | Result |
| --- | --- |
| phone number ID matches configured ID | PASS |
| display phone exists | PASS |
| verified name exists | PASS |
| code verification status | VERIFIED |
| platform type | CLOUD_API |
| throughput | STANDARD |

## Conclusion

Payload structure is valid. The current blocker is Meta-side send eligibility or recipient eligibility, not the text payload schema.

Most likely causes:

1. The inferred recipient is not an approved/test recipient for this app or phone number.
2. A free-form text message is being sent outside a customer service window and an approved template is required.
3. The recipient is not reachable by this WABA/phone number despite valid phone number ID and token.

## Required Resolution

Provide or configure a Meta-approved `WHATSAPP_TEST_RECIPIENT`, or provide an approved template name/language for an outbound template test. Then rerun the send test.
