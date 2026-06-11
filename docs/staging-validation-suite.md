# Staging Validation Suite

The staging validation suite checks production activation readiness without adding customer-facing features.

## Coverage

- Auth foundation.
- Orders domain.
- Loyalty domain.
- Recommendations.
- AI Gateway.
- WhatsApp webhook.
- Runtime persistence.
- Provider activation controls.

## Automated Checks

Run:

```bash
node scripts/go-live-validation.mjs
```

The suite validates required routes, Prisma runtime models, activation playbooks, launch checklist, dashboard specification, incident runbooks, and environment governance.

## Required Manual Staging Checks

- Apply database migrations.
- Verify `/api/live`, `/api/ready`, `/api/health`, `/api/metrics`.
- Verify WhatsApp challenge against Meta staging app.
- Run one AI request using mock baseline.
- Enable OpenAI or Gemini for staging only and verify fallback.
