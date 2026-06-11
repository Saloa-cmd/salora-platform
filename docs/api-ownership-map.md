# SALORA API Ownership Map

Date: 2026-06-05
Workspace: `C:\dev\salora-platform`

## Objective

Identify duplicated API surfaces, define canonical ownership, and preserve backward compatibility.

## Ownership Map

| Pair | Canonical Endpoint | Legacy Endpoint | Status | Strategy |
|---|---|---|---:|---|
| AI chat vs concierge | `/api/ai/concierge` | `/api/ai/chat` | DUPLICATED | Keep `/chat` as compatibility alias; add deprecation headers in a later client-aware pass. |
| WhatsApp webhook pair | `/api/channels/whatsapp/webhook` | `/api/whatsapp/webhook` | DUPLICATED/PARTIAL | Keep both until Meta webhook config is verified; document one canonical channel route. |
| Public orders vs Control Tower orders | `/api/control-tower/orders` for operators; `/api/orders` for commerce checkout | None | SPLIT OWNERSHIP | Preserve both. Public checkout and operator governance are different actors. |
| Runtime config pair | `/api/control-tower/simple-launch/runtime-config` | `/api/control-tower/config` | DUPLICATED | Prefer simple-launch route for Control Tower operations; preserve config route until permission model is consolidated. |

## Risk Analysis

- Removing `/api/ai/chat` could break clients using the generic chat path.
- Removing a WhatsApp webhook without verifying Meta configuration could stop inbound message processing.
- Merging public and Control Tower orders could create security confusion between customer checkout and operator actions.
- Runtime config duplication risks inconsistent RBAC expectations.

## Deprecation Strategy

1. Add response headers to legacy endpoints.
2. Instrument request counts by route.
3. Confirm external webhook/client configuration.
4. Publish migration notes.
5. Remove only after zero verified traffic and an approved release window.

## Current Decision

No duplicate endpoint was removed in this remediation pass.
