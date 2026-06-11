# Control Tower Architecture

The Universal Control Tower is SALORA's management plane. It complements the Executive Command Center by turning visibility into no-code action.

## Web Routes

- `/control-tower`
- `/control-tower/executive`
- `/control-tower/revenue`
- `/control-tower/orders`
- `/control-tower/inventory`
- `/control-tower/customers`
- `/control-tower/loyalty`
- `/control-tower/ai`
- `/control-tower/whatsapp`
- `/control-tower/notifications`
- `/control-tower/content`
- `/control-tower/automation`
- `/control-tower/integrations`
- `/control-tower/settings`

## Implementation

- Section registry: `apps/web/lib/control-tower/registry.ts`
- Types: `apps/web/lib/control-tower/types.ts`
- Mutations: `apps/web/lib/control-tower/client.ts`
- Shell and workspaces: `apps/web/components/control-tower/**`

## First-Wave Live Actions

- Create product through `/api/products`.
- Record inventory movement through `/api/inventory`.
- Award loyalty points through `/api/loyalty`.
- Queue notification through `/api/notifications`.

All live writes preserve existing RBAC and request correlation IDs.
