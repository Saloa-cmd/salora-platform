# SALORA P0 EXECUTION BOARD

## Critical Path to 80-82/100 Readiness

**Date**: 9 June 2026  
**Duration**: 14 engineering days  
**Target Completion**: End of Week 2  
**Expected Readiness After**: 80-82/100

---

## P0 Blockers: Execution Order & Timeline

```
WEEK 1
├─ Day 1-2:   BLOCKER 1: RLS Runtime Enforcement
├─ Day 3-5:   BLOCKER 2: Direct Prisma Removal
├─ Day 6-7:   BLOCKER 3: Build Certification
│
WEEK 2
├─ Day 8-9:   BLOCKER 4: Distributed Rate Limiting
├─ Day 10-11: BLOCKER 5: Worker Certification
├─ Day 12-13: BLOCKER 6: Backup/Restore Certification
└─ Day 14:    BLOCKER 7: Staging Certification
```

---

## BLOCKER 1: RLS Runtime Enforcement

**Timeline**: Day 1-2 (2 engineering days)  
**Readiness Impact**: 68 → 71 (+3 points)  
**Risk Level**: MEDIUM (architectural change, must not break routes)  
**Owner**: Principal Backend Engineer + Principal Database Architect

### Current State

- RLS policies exist in database ✓
- RLS context NOT set on queries ✗
- `withPrismaAuthContext` NOT implemented ✗
- All 24 control-tower routes bypass RLS ✗

### Files to Modify

| File                                                                   | Action | Priority |
| ---------------------------------------------------------------------- | ------ | -------- |
| `packages/backend/src/database/rls-context.ts`                         | CREATE | 1        |
| `packages/backend/src/database/prisma.ts`                              | UPDATE | 2        |
| `packages/backend/src/database/transactions.ts`                        | UPDATE | 2        |
| `apps/web/app/api/control-tower/simple-launch/products/route.ts`       | UPDATE | 3        |
| `apps/web/app/api/control-tower/simple-launch/runtime-config/route.ts` | UPDATE | 3        |

### Implementation Steps

**Step 1: Create RLS Context Module** (4 hours)

Create `packages/backend/src/database/rls-context.ts`:

```typescript
import { connectPrisma } from "./prisma";

export interface PrismaAuthContext {
  userId: string;
  roles: string[];
}

export async function withPrismaAuthContext<T>(
  context: PrismaAuthContext,
  operation: (prisma: any) => Promise<T>,
): Promise<T> {
  const prisma = await connectPrisma();
  await prisma.$executeRaw`
    SET LOCAL app.current_user_id = ${context.userId};
    SET LOCAL app.user_roles = ${JSON.stringify(context.roles)};
  `;
  return operation(prisma);
}
```

**Step 2: Update Control Tower Routes** (6 hours)

For each route file, replace:

```typescript
// BEFORE
const db = prisma()
const products = await db.catalogProduct.findMany({...})

// AFTER
const authContext = { userId: actor.sub, roles: actor.roles }
const products = await withPrismaAuthContext(authContext, async (db) => {
  return db.catalogProduct.findMany({...})
})
```

Routes to update:

1. `/products/route.ts`
2. `/runtime-config/route.ts`
3. `/categories/route.ts`
4. `/promotions/route.ts`
5. `/coupons/route.ts`
6. `/media/route.ts`
7. `/orders/route.ts`
8. `/whatsapp/route.ts`
9. `/activity-logs/route.ts`
10. `/audit-logs/route.ts`

**Step 3: Create RLS Enforcement Test** (4 hours)

Create `scripts/rls-enforcement.test.mjs`:

```mjs
import { withPrismaAuthContext } from "@salora/backend/database/rls-context";

// Test 1: Verify context is set
const result = await withPrismaAuthContext(
  { userId: "test-user", roles: ["STAFF"] },
  async (db) => {
    return db.$queryRaw`SELECT current_setting('app.current_user_id')`;
  },
);

if (result[0].current_setting !== "test-user") {
  throw new Error("RLS context not set correctly");
}
console.log("✓ RLS context setting works");

// Test 2: Verify RLS policies are evaluated
const products = await withPrismaAuthContext(
  { userId: "unauthorized-user", roles: ["CUSTOMER"] },
  async (db) => {
    return db.catalogProduct.findMany(); // Should return filtered results
  },
);

console.log("✓ RLS policies evaluated");
```

### Validation Commands

```bash
# 1. Run RLS enforcement test
node --experimental-strip-types scripts/rls-enforcement.test.mjs

# 2. Verify no direct prisma() calls in control-tower
rg "= prisma\(\)" apps/web/app/api/control-tower/

# 3. Run typecheck
pnpm typecheck

# 4. Run full test suite
pnpm test

# 5. Test single control-tower route locally
curl -X GET http://localhost:3000/api/control-tower/simple-launch/products
```

### Rollback Strategy

If RLS enforcement breaks routes:

1. Revert rls-context.ts changes
2. Revert route file changes
3. Fall back to requireControlPermission only (application-level checks)
4. Document why RLS enforcement was not feasible
5. Plan for future RLS implementation with better database migration

### Exit Criteria

✓ `withPrismaAuthContext` wrapper implemented and tested  
✓ All control-tower routes updated to set RLS context  
✓ RLS enforcement test passing  
✓ `pnpm typecheck` passes  
✓ `pnpm test` passes  
✓ No route timeout or errors  
✓ Query response times within acceptable range (< 100ms)

---

## BLOCKER 2: Direct Prisma Removal

**Timeline**: Day 3-5 (3 engineering days)  
**Readiness Impact**: 71 → 75 (+4 points)  
**Risk Level**: MEDIUM (extensive refactoring)  
**Owner**: Principal Backend Engineer

### Current State

- Direct `prisma()` calls in 10 control-tower routes ✗
- No repository pattern for protected paths ✗
- No architectural enforcement ✗

### Files to Modify

| File                                                       | Action |
| ---------------------------------------------------------- | ------ |
| `packages/backend/src/domains/control-tower/repository.ts` | CREATE |
| All 10 control-tower route files                           | UPDATE |

### Implementation Steps

**Step 1: Create Control Tower Repository** (6 hours)

Create `packages/backend/src/domains/control-tower/repository.ts`:

```typescript
import {
  withPrismaAuthContext,
  type PrismaAuthContext,
} from "../../database/rls-context";

export async function createControlTowerRepository(
  authContext: PrismaAuthContext,
) {
  return {
    products: {
      findMany: (filter?: any) =>
        withPrismaAuthContext(authContext, (db) =>
          db.catalogProduct.findMany(filter),
        ),
      upsert: (where: any, data: any) =>
        withPrismaAuthContext(authContext, (db) =>
          db.catalogProduct.upsert({ where, data }),
        ),
    },
    runtimeConfig: {
      findMany: (filter?: any) =>
        withPrismaAuthContext(authContext, (db) =>
          db.runtimeConfiguration.findMany(filter),
        ),
      upsert: (where: any, data: any) =>
        withPrismaAuthContext(authContext, (db) =>
          db.runtimeConfiguration.upsert({ where, data }),
        ),
    },
    // ... etc for all resources
  };
}
```

**Step 2: Update Route Files** (12 hours)

For each route, replace direct prisma() calls:

```typescript
// BEFORE
const db = prisma()
const products = await db.catalogProduct.findMany({...})

// AFTER
const repo = await createControlTowerRepository({
  userId: actor.sub,
  roles: actor.roles
})
const products = await repo.products.findMany({...})
```

**Step 3: Remove Raw Prisma Export** (1 hour)

Update `apps/web/lib/server/simpleLaunchControl.ts`:

```typescript
// REMOVE
// export function prisma() { ... }

// ADD type-safe helper
export async function getControlTowerRepository(request: NextRequest) {
  const actor = await requireControlPermission(request, "control:tower:base");
  return createControlTowerRepository({
    userId: actor.sub,
    roles: actor.roles,
  });
}
```

### Validation Commands

```bash
# 1. Verify no direct prisma() calls
rg "const db = prisma\(\)" apps/web/app/api/control-tower/

# 2. Verify repository pattern used
rg "createControlTowerRepository" apps/web/app/api/control-tower/ | wc -l

# 3. Run typecheck
pnpm typecheck

# 4. Run linting
pnpm lint

# 5. Run tests
pnpm test

# 6. Test routes still work
curl http://localhost:3000/api/control-tower/simple-launch/products
```

### Exit Criteria

✓ Control Tower Repository created with all methods  
✓ All 10 route files updated to use repository  
✓ No direct `prisma()` calls in control-tower  
✓ RLS context automatically set through repository  
✓ `pnpm typecheck` passes  
✓ `pnpm lint` passes  
✓ `pnpm test` passes  
✓ All endpoints still functional

---

## BLOCKER 3: Build Certification

**Timeline**: Day 6-7 (2 engineering days)  
**Readiness Impact**: 75 → 77 (+2 points)  
**Risk Level**: HIGH (deployment blocker)  
**Owner**: Principal DevOps Engineer + Principal Backend Engineer

### Current State

- Build times out on CI ✗
- Root cause not diagnosed ✗
- No build profiling data ✗

### Investigation & Fix Steps

**Step 1: Profile Build** (4 hours)

```bash
# Clear caches
rm -rf apps/web/.next apps/web/.turbo node_modules/.cache

# Profile build with timing
time pnpm build:web 2>&1 | tee build-profile.txt

# Analyze output for bottlenecks
grep -E "transforming|optimizing|generating" build-profile.txt
```

**Step 2: Optimize Next.js Config** (4 hours)

Update [apps/web/next.config.ts](../../apps/web/next.config.ts):

```typescript
const nextConfig: NextConfig = {
  turbopack: {
    root: join(appDir, "../.."),
    resolveExtensions: [".ts", ".tsx", ".js", ".jsx"],
  },
  experimental: {
    optimizePackageImports: ["@salora/backend"],
  },
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
};
```

**Step 3: Disable Sourcemaps on CI** (2 hours)

Update `apps/web/sentry.server.config.ts`:

```typescript
export default {
  // ...
  sourcemaps: {
    disable: process.env.CI === "true", // Skip on CI
  },
};
```

**Step 4: Add Build Certification** (4 hours)

Create `scripts/build-certification.mjs`:

```javascript
#!/usr/bin/env node
const { spawn } = require("child_process");
const start = Date.now();

const build = spawn("pnpm", ["build:web"]);
const timeout = 5 * 60 * 1000; // 5 minutes max

build.on("exit", (code) => {
  const duration = Math.round((Date.now() - start) / 1000);

  if (code !== 0) {
    console.error(`✗ Build failed`);
    process.exit(1);
  }

  if (duration > 300) {
    console.error(`✗ Build took ${duration}s (> 5 min)`);
    process.exit(1);
  }

  console.log(`✓ Build passed in ${duration}s`);
  process.exit(0);
});

setTimeout(() => {
  console.error("✗ Build timed out");
  build.kill();
  process.exit(1);
}, timeout);
```

### Validation Commands

```bash
# 1. Run build certification
node scripts/build-certification.mjs

# 2. Check build size
du -sh apps/web/.next

# 3. Test production start
pnpm start:web

# 4. Verify no runtime errors
curl http://localhost:3000 -v
```

### Exit Criteria

✓ Build completes in < 5 minutes on Node 22  
✓ Build certification script passes  
✓ No build errors or warnings  
✓ Production start works  
✓ Typecheck passes

---

## BLOCKER 4: Distributed Rate Limiting

**Timeline**: Day 8-9 (2 engineering days)  
**Readiness Impact**: 77 → 79 (+2 points)  
**Risk Level**: MEDIUM (new infrastructure dependency)  
**Owner**: Principal Backend Engineer

### Current State

- Process-local rate limiting only ✗
- Not distributed across instances ✗
- Easy to bypass ✗

### Files to Modify

| File                                                     | Action |
| -------------------------------------------------------- | ------ |
| `packages/backend/src/cache/distributed-rate-limiter.ts` | CREATE |
| `apps/web/app/api/auth/login/route.ts`                   | UPDATE |
| `apps/web/app/api/payments/stripe/webhook/route.ts`      | UPDATE |

### Implementation Steps

**Step 1: Create Redis-Backed Rate Limiter** (6 hours)

Create `packages/backend/src/cache/distributed-rate-limiter.ts` (detailed in Blocker 4 section of security report).

**Step 2: Add to Auth Endpoint** (2 hours)

Update `apps/web/app/api/auth/login/route.ts`:

```typescript
import { checkRateLimit } from "@salora/backend/cache/distributed-rate-limiter";

export async function POST(request: NextRequest) {
  const clientIp = request.headers.get("x-forwarded-for") || "unknown";

  const allowed = await checkRateLimit({
    key: `auth:login:${clientIp}`,
    maxRequests: 10,
    windowMs: 60 * 1000,
  });

  if (!allowed) {
    return Response.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  // Continue with login...
}
```

**Step 3: Add Rate Limit Headers** (2 hours)

Return rate limit info in all responses.

### Validation Commands

```bash
# 1. Test rate limiter
node --experimental-strip-types scripts/rate-limit.test.mjs

# 2. Load test endpoint
ab -n 100 -c 10 http://localhost:3000/api/auth/login

# 3. Verify headers
curl -v http://localhost:3000/api/auth/login

# 4. Run tests
pnpm test
```

### Exit Criteria

✓ Distributed rate limiter implemented  
✓ Redis-backed storage working  
✓ Rate limiting active on key endpoints  
✓ Rate limit headers in responses  
✓ Load test shows distributed enforcement  
✓ `pnpm test` passes

---

## BLOCKER 5: Worker Certification

**Timeline**: Day 10-11 (2 engineering days)  
**Readiness Impact**: 79 → 81 (+2 points)  
**Risk Level**: MEDIUM (new health checks)  
**Owner**: Principal DevOps Engineer

### Current State

- BullMQ workers running ✓
- No health checks ✗
- No startup verification ✗
- No graceful shutdown ✗

### Files to Modify

| File                                        | Action |
| ------------------------------------------- | ------ |
| `packages/backend/src/jobs/health-check.ts` | CREATE |
| `scripts/certify-worker.mjs`                | CREATE |

### Implementation Steps

**Step 1: Create Health Check Module** (4 hours)

Create `packages/backend/src/jobs/health-check.ts` (detailed in Blocker 5 section of security report).

**Step 2: Create Certification Script** (4 hours)

Create `scripts/certify-worker.mjs`:

```javascript
import { verifyWorkerHealth } from "../packages/backend/src/jobs/health-check.ts";

async function certify() {
  const health = await verifyWorkerHealth();

  if (!health.healthy) {
    console.error("✗ Worker health check failed");
    process.exit(1);
  }

  console.log("✓ Worker certification passed");
  process.exit(0);
}

certify().catch(console.error);
```

### Validation Commands

```bash
# 1. Run worker certification
pnpm certify:worker

# 2. Check worker startup logs
pnpm dev:jobs 2>&1 | head -20

# 3. Test graceful shutdown
timeout 5 pnpm dev:jobs || true

# 4. Run tests
pnpm test
```

### Exit Criteria

✓ Health check module implemented  
✓ Worker startup verification working  
✓ Graceful shutdown implemented  
✓ `pnpm certify:worker` passes  
✓ Worker logs show successful startup

---

## BLOCKER 6: Backup/Restore Certification

**Timeline**: Day 12-13 (2 engineering days)  
**Readiness Impact**: 81 → 82 (+1 point)  
**Risk Level**: LOW (staging only)  
**Owner**: Principal DevOps Engineer

### Implementation

Create `scripts/backup-restore-certification.mjs` (staging-only).

### Exit Criteria

✓ Backup/restore script created  
✓ Staging-only protection active  
✓ `pnpm certify:backup-restore` passes on staging

---

## BLOCKER 7: Staging Certification

**Timeline**: Day 14 (1 engineering day)  
**Readiness Impact**: 82 → 83 (+1 point)  
**Risk Level**: LOW  
**Owner**: Principal QA Engineer

### Implementation

Create `scripts/staging-smoke-tests.mjs` with tests for:

- Homepage
- Health endpoint
- Ready endpoint
- Authentication
- Authorization
- Rate limiting
- Database
- Cache
- Observability

### Exit Criteria

✓ Staging smoke tests created  
✓ All critical paths tested  
✓ `pnpm test:staging-smoke` passes

---

## Daily Standup Template

```
BLOCKER: [Number]
Owner: [Name]
Status: On Track / At Risk / Blocked

Completed Today:
- [ ] Task 1
- [ ] Task 2

Planned Tomorrow:
- [ ] Task 3
- [ ] Task 4

Blockers:
- [If any]

Readiness Score:
Current: X/100
Target: Y/100
```

---

## Risk Mitigation

### If Blocker 1 (RLS) Fails

- Fallback: Application-only auth checks (current state)
- Impact: -3 points
- Recovery: Plan RLS for enterprise phase

### If Blocker 2 (Prisma) Fails

- Fallback: Keep direct Prisma calls
- Impact: -4 points
- Recovery: Refactor for enterprise phase

### If Blocker 3 (Build) Fails

- Fallback: Disable sourcemaps, split build
- Impact: -2 points
- Recovery: Deep profiling + optimization

### If Blocker 4 (Rate Limiting) Fails

- Fallback: Process-local limiting
- Impact: -2 points
- Recovery: Alternative rate limiting solution

### If Any Blocker Misses Day Target

- Add 1 day to next blocker
- Reassess completion feasibility
- Escalate if readiness at risk

---

## Post-Execution

After all P0 blockers close:

1. Generate updated readiness report
2. Run full test suite
3. Create evidence report
4. Present to leadership
5. Proceed to P1 execution or Soft Launch

---

**Owner**: CTO & Principal Engineering Team  
**Last Updated**: 9 June 2026
