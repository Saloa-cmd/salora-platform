# Integration Hub Architecture

## Goal

Create a universal connector layer for OpenAI, Gemini, Claude, Stripe, WhatsApp, Firebase, Google Analytics, Meta, and future systems.

## Architecture

- Connector registry.
- Credential vault.
- Health monitor.
- Capability metadata.
- Provider activation workflow.
- Tenant-scoped integration config.

## Current Implementation

SALORA already has provider architecture in code for AI, payments, and WhatsApp. The Control Tower exposes these as configured capabilities and marks credential vault management as backend activation pending.

## Secret Handling

Secrets must never be rendered back to the browser. The future UI should support create, rotate, test, disable, and delete actions only.
