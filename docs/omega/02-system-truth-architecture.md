# SALORA System Truth Architecture

## Evidence-Based Current State Assessment

**Report Date**: 9 June 2026  
**Scope**: All production-intent components  
**Evidence Source**: Code review, schema analysis, runtime configuration

---

## Current Runtime Topology

```
┌─────────────────────────────────────────────────────────────────┐
│                    SALORA Platform (Node 22)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐         ┌──────────────────┐                 │
│  │  @salora/web │ (Next.js 16.1.6)          │                 │
│  │   + API      │ ────────┤ Turbopack Build  │                 │
│  └──────────────┘         └──────────────────┘                 │
│        │                          │                             │
│        ├─ [apps/web/app/api/*]    │                             │
│        │  - Auth Routes           │                             │
│        │  - Control Tower Routes  │                             │
│        │  - Business Domain Routes│                             │
│        └─ [apps/web/lib/server/*] │                             │
│                                    │                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │             @salora/backend (Monolithic)                 │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │                                                          │  │
│  │  ├─ [database/]                                         │  │
│  │  │  └─ prisma.ts → getPrismaClient() → @prisma/client  │  │
│  │  │  └─ transactions.ts → withTransaction()             │  │
│  │  │  └─ health.ts → Database health checks              │  │
│  │  │                                                      │  │
│  │  ├─ [domains/]                                         │  │
│  │  │  ├─ payments/                                        │  │
│  │  │  ├─ conversations/                                  │  │
│  │  │  └─ runtimeConfig.ts                                │  │
│  │  │                                                      │  │
│  │  ├─ [runtime/]                                         │  │
│  │  │  ├─ env.ts → getInfrastructureEnv()                │  │
│  │  │  └─ metrics.ts → Observability SDK                 │  │
│  │  │                                                      │  │
│  │  ├─ [integrations/]                                    │  │
│  │  │  ├─ WhatsApp Cloud API                              │  │
│  │  │  ├─ Stripe Webhooks                                 │  │
│  │  │  └─ AI Gateway Routing                              │  │
│  │  │                                                      │  │
│  │  ├─ [observability/]                                   │  │
│  │  │  └─ tracing.ts → withSpan(), captureError()        │  │
│  │  │                                                      │  │
│  │  ├─ [jobs/]                                            │  │
│  │  │  └─ BullMQ Workers                                  │  │
│  │  └─ [ai/]                                              │  │
│  │     └─ AI Platform Integration                         │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────┐                     │
│  │   External Dependencies                │                     │
│  ├───────────────────────────────────────┤                     │
│  │ DATABASE:  Supabase PostgreSQL 15     │                     │
│  │ CACHE:     Upstash Redis              │                     │
│  │ OBSERVABILITY: Sentry + OTel          │                     │
│  │ WHATSAPP:  Cloud API                  │                     │
│  │ PAYMENTS:  Stripe                     │                     │
│  │ STORAGE:   Supabase/S3                │                     │
│  │ AI:        OpenAI + Gemini            │                     │
│  └───────────────────────────────────────┘                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Auth Flow (Current)

```
REQUEST → @salora/web/app/api/[route]/route.ts
    │
    ├─ Extract token from cookies
    │  [accessTokenCookieName = 'salora_access_token']
    │
    ├─ Call requireControlPermission(request, "permission:action")
    │  └─ [apps/web/lib/server/auth/controlTower.ts]
    │     ├─ Verify JWT with getAuthService().verifyAccessToken()
    │     ├─ Check roles against RBAC rules
    │     └─ Return payload: { sub, email, roles }
    │
    ├─ Get raw Prisma client
    │  └─ prisma() → getPrismaClient()
    │     [NO RLS CONTEXT SET]
    │
    └─ Execute database operation
       └─ db.resource.findMany() / create() / update()
          [RLS POLICIES EXIST BUT NOT ENFORCED]
```

---

## Auth Context Gap (Critical Blocker)

### What SHOULD Happen

```typescript
// Protected route should set RLS context
withPrismaAuthContext(userId, roles, async (prismaClient) => {
  // RLS policies now evaluate current_user_id, user_roles
  return prismaClient.catalogProduct.findMany();
  // Database enforces row-level permissions
});
```

### What ACTUALLY Happens

```typescript
// Protected route does NOT set RLS context
await requireControlPermission(request, "catalog:read");
const db = prisma(); // ← Raw client, no auth context
return db.catalogProduct.findMany(); // ← Selects ALL rows
// Database returns unfiltered results (RLS disabled)
```

---

## Database Schema: RLS Baseline

### Prisma Schema Location

- **File**: [prisma/schema.prisma](../../prisma/schema.prisma)
- **Lines**: 1-1800+

### Key Models

| Model                  | Tenant Field             | Multi-Tenant Ready |
| ---------------------- | ------------------------ | ------------------ |
| `User`                 | None                     | ✗ No               |
| `CustomerProfile`      | None (linked to User)    | ✗ No               |
| `CatalogProduct`       | None                     | ✗ No               |
| `CafeOrder`            | `customerId` (partial)   | ⚠ Partial          |
| `RuntimeConfiguration` | None                     | ✗ No               |
| `Conversation`         | `customerId` + `staffId` | ⚠ Partial          |
| `AuditLog`             | `actorId` (partial)      | ⚠ Partial          |
| `ActivityLog`          | `actorId` (partial)      | ⚠ Partial          |

---

## RLS Policies Current State

### Baseline Migration

- **File**: [prisma/migrations/](../../prisma/migrations/)
- **RLS Policies**: Defined in SQL migrations
- **Status**: Baseline policies exist but NOT ENFORCED at runtime

### Key Gaps

1. **RLS Context Not Set**
   - No `SET LOCAL SESSION` call in Prisma operations
   - Current user not communicated to database layer
   - Policies cannot evaluate `current_user_id`

2. **No Auth Wrapper**
   - `getPrismaClient()` returns unauthenticated client
   - `withTransaction()` doesn't set RLS context
   - `withQueryProtection()` only handles timeouts/errors

3. **Missing RLS Propagation**
   - Protected routes use `requireControlPermission()` for auth check
   - But RLS context never attached to Prisma client
   - Database cannot enforce row-level policies

---

## Protected Routes Current State

### Routes using direct Prisma (NO RLS)

**Location**: [apps/web/app/api/control-tower/simple-launch/](../../apps/web/app/api/control-tower/simple-launch/)

| Route             | Method | Auth Check                                  | Prisma Usage                         | RLS Context |
| ----------------- | ------ | ------------------------------------------- | ------------------------------------ | ----------- |
| `/products`       | GET    | `requireControlPermission("catalog:read")`  | `db.catalogProduct.findMany()`       | ✗ NO        |
| `/products`       | PATCH  | `requireControlPermission("catalog:write")` | `db.catalogProduct.upsert()`         | ✗ NO        |
| `/runtime-config` | GET    | `requireControlPermission("system:write")`  | `db.runtimeConfiguration.findMany()` | ✗ NO        |
| `/runtime-config` | PATCH  | `requireControlPermission("system:write")`  | `db.runtimeConfiguration.upsert()`   | ✗ NO        |

### All Control Tower Routes Affected

```
/api/control-tower/simple-launch/
├─ products/ (GET, PATCH)
├─ runtime-config/ (GET, PATCH)
├─ categories/ (GET, PATCH)
├─ promotions/ (GET, PATCH)
├─ coupons/ (GET, PATCH)
├─ media/ (GET, PATCH)
├─ orders/ (GET, PATCH)
├─ whatsapp/ (GET, PATCH)
├─ activity-logs/ (GET)
└─ audit-logs/ (GET)
```

**Total: 24 protected endpoints without RLS context**

---

## Auth Implementation Details

### Access Token JWT Structure

```typescript
// From requireControlPermission() → verifyAccessToken()
{
  sub: string(userId);
  email: string;
  roles: ["STAFF" | "MANAGER" | "ADMIN"];
  iat: number;
  exp: number;
}
```

### Session Model

```prisma
model Session {
  id               String        @id
  userId           String        @map("user_id")
  refreshTokenHash String        @unique // Opaque refresh token
  status           SessionStatus @default(ACTIVE) // ACTIVE|REVOKED|EXPIRED
  ipAddress        String?
  userAgent        String?
  expiresAt        DateTime
  revokedAt        DateTime?
}
```

**Status**: Opaque refresh tokens ✓ implemented, hashing ✓ implemented

---

## Permission Model (RBAC)

### Role Hierarchy

```
ADMIN
  ├─ catalog:read, catalog:write
  ├─ orders:read, orders:write
  ├─ system:write
  ├─ ai-studio:read, ai-studio:write
  └─ control:tower:full

MANAGER
  ├─ catalog:read
  ├─ orders:read, orders:write
  └─ ai-studio:read

STAFF
  ├─ orders:read
  └─ catalog:read

CUSTOMER
  ├─ customer:read
  └─ customer:write
```

### RBAC Implementation

- **File**: [apps/web/lib/server/auth/rbac.ts](../../apps/web/lib/server/auth/rbac.ts)
- **Function**: `hasPermission(roles, permission)`
- **Status**: Role-based checks implemented in application layer
- **Gap**: No database-level RBAC enforcement (RLS not checking roles)

---

## Direct Prisma Usage Pattern

### Current Implementation

```typescript
// apps/web/lib/server/simpleLaunchControl.ts
export function prisma() {
  return getPrismaClient() as unknown as PrismaAny;
}
```

### Usage in Routes

```typescript
// apps/web/app/api/control-tower/simple-launch/products/route.ts
const db = prisma();
const products = await db.catalogProduct.findMany({
  // Selects ALL products regardless of user permissions
  // RLS policies not evaluated
});
```

### Impact

- No auth context passed to database
- All data rows accessible (RLS bypassed)
- Audit logging relies on application layer only
- Data isolation not guaranteed

---

## Webhook Integration Points

### WhatsApp Cloud API

- **Status**: Signature verification implemented
- **Location**: [apps/web/app/api/whatsapp/](../../apps/web/app/api/whatsapp/)
- **Gap**: No idempotency/replay protection

### Stripe Payments

- **Status**: Signature verification implemented
- **Location**: [apps/web/app/api/payments/stripe/](../../apps/web/app/api/payments/stripe/)
- **Gap**: No transaction-safe webhook processing

---

## Build Configuration

### Next.js Configuration

- **File**: [apps/web/next.config.ts](../../apps/web/next.config.ts)
- **Transpilation**: `@salora/backend`, `@salora/config`, `@salora/data`, `@salora/types`, `@salora/ui`
- **Build Tool**: Turbopack
- **Issue**: Build timeout on CI

### Turbopack Config

```typescript
const nextConfig: NextConfig = {
  turbopack: {
    root: join(appDir, "../.."),
  },
  transpilePackages: ["@salora/backend", "..."],
};
```

---

## Worker Architecture (Uncertified)

### BullMQ Setup

- **Status**: Redis-connected, no health certification
- **Location**: [packages/backend/src/jobs/](../../packages/backend/src/jobs/)
- **Gaps**:
  - No startup health checks
  - No graceful shutdown verification
  - No worker retry policy certification
  - No dead-letter queue strategy

---

## Rate Limiting Current State

### Process-Local Limiter

- **Location**: [apps/web/proxy.ts](../../apps/web/proxy.ts)
- **Type**: In-memory token bucket
- **Gap**: Not distributed across processes
- **Risk**: Bypass on multi-instance deployments

---

## Observability Integration

### Sentry Configuration

- **Files**:
  - [apps/web/sentry.edge.config.ts](../../apps/web/sentry.edge.config.ts)
  - [apps/web/sentry.server.config.ts](../../apps/web/sentry.server.config.ts)
- **Status**: Configured
- **Gap**: Audit trail not integrated

### OpenTelemetry Integration

- **Location**: [packages/backend/src/observability/tracing.ts](../../packages/backend/src/observability/tracing.ts)
- **Status**: `withSpan()` wrapper implemented
- **Gap**: No transaction audit context

---

## Backup & Disaster Recovery

### Current State

- **Status**: NOT TESTED
- **Gap**: No restore verification
- **Risk**: Unrecoverable if data loss occurs

### Expected Strategy

- PostgreSQL WAL-G backups
- Point-in-time recovery capability
- Staging-only restore tests

---

## Mobile App Integration

### Mobile App Status

- **Location**: [apps/mobile/](../../apps/mobile/)
- **Framework**: React Native (inferred)
- **Auth**: Uses same JWT tokens as web
- **Gap**: Mobile-specific RLS context not implemented

---

## Dependency Graph

```
@salora/web
├─ @salora/backend
│  ├─ Prisma Client (7.8.0)
│  ├─ @prisma/adapter-pg
│  └─ Node.js 22
├─ @salora/config
├─ @salora/data
├─ @salora/types
├─ @salora/ui
├─ Next.js (16.1.6)
├─ React (19.2.4)
├─ Zod (4.4.3)
└─ @sentry/nextjs (10.55.0)

@salora/backend (monolithic)
├─ Prisma Client (7.8.0)
├─ Node 22 runtime
└─ Third-party integrations
   ├─ OpenAI API
   ├─ Google Gemini API
   ├─ WhatsApp Cloud API
   ├─ Stripe API
   └─ Sentry SDK
```

---

## Test Coverage Baseline

### Existing Test Scripts

- [scripts/auth-foundation.test.mjs](../../scripts/auth-foundation.test.mjs) - Auth verification
- [scripts/security-remediation.test.mjs](../../scripts/security-remediation.test.mjs) - Security checks
- [scripts/go-live-validation.mjs](../../scripts/go-live-validation.mjs) - Deployment readiness
- [scripts/business-domain.test.mjs](../../scripts/business-domain.test.mjs) - Domain logic

### Coverage Gaps

- ✗ No RLS enforcement tests
- ✗ No repository pattern tests
- ✗ No architecture compliance tests
- ✗ No distributed rate limiting tests
- ✗ No worker health certification
- ✗ No backup/restore tests
- ✗ No staging smoke tests

---

## Evidence Summary

**RLS Status**: Policies exist in database, NOT enforced at application layer  
**Auth Context**: Applied at HTTP layer only, not propagated to database  
**Protected Routes**: 24+ endpoints use direct Prisma access without auth context  
**Build**: Timeout reported, not certified  
**Workers**: No health verification  
**Rate Limiting**: Process-local only, not distributed  
**Backup/Restore**: Not tested  
**Staging**: No smoke test suite

**Next**: Review [03-security-trust-boundary-report.md](03-security-trust-boundary-report.md) for blocker details and fixes.

---

**Owner**: Principal Database Architect & Principal Backend Engineer  
**Last Updated**: 9 June 2026
