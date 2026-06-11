# SALORA Security Trust Boundary Report

## P0/P1/P2 Blocker Analysis & Implementation Plans

**Report Date**: 9 June 2026  
**Assessment**: Post-auth-hardening security state  
**Format**: Root cause → Impact → Fix → Validation → Rollback

---

## Executive Summary

| Blocker                           | Priority | Status | Root Cause                        | Fix Effort | Risk Reduction |
| --------------------------------- | -------- | ------ | --------------------------------- | ---------- | -------------- |
| RLS runtime enforcement           | P0       | OPEN   | No auth context in Prisma queries | 2d         | +3 points      |
| Direct Prisma in protected routes | P0       | OPEN   | Bypass of repository pattern      | 3d         | +4 points      |
| Build certification incomplete    | P0       | OPEN   | Turbopack timeout undiagnosed     | 2d         | +2 points      |
| Rate limiting not distributed     | P0       | OPEN   | Process-local token bucket        | 2d         | +2 points      |
| Worker deployment uncertified     | P0       | OPEN   | No health verification            | 2d         | +2 points      |
| Backup/restore untested           | P0       | OPEN   | No disaster recovery tests        | 2d         | +1 point       |
| Staging certification incomplete  | P0       | OPEN   | No smoke test suite               | 1d         | +1 point       |

**Total Risk Reduction if All Fixed**: +14 points (68 → 82)

---

## P0 BLOCKER #1: RLS Runtime Enforcement Incomplete

### Current Severity

**Risk Level**: CRITICAL  
**Impact**: Data isolation not enforced, customer data could be visible to unauthorized users

### Root Cause Analysis

**Where**: [packages/backend/src/database/prisma.ts](../../packages/backend/src/database/prisma.ts)

```typescript
// CURRENT - NO RLS CONTEXT
export function getPrismaClient(): SaloraPrismaClient {
  // Returns unauthenticated Prisma client
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
  return new PrismaClient({ adapter });
}
```

**Problem**:

1. `getPrismaClient()` creates client without setting RLS context
2. When queries execute, database doesn't know current user
3. RLS policies check `current_user_id` which is NULL
4. Policies evaluate to "allow all" when context is missing

**Evidence**:

- RLS policies exist in migrations but don't execute during queries
- `withTransaction()` doesn't set RLS context
- `withQueryProtection()` only handles timeouts, not auth

### Affected Routes

All control-tower routes using `prisma()`:

- `/api/control-tower/simple-launch/products/*`
- `/api/control-tower/simple-launch/runtime-config/*`
- `/api/control-tower/simple-launch/categories/*`
- `/api/control-tower/simple-launch/promotions/*`
- `/api/control-tower/simple-launch/orders/*`
- Plus 18 more endpoints

### Implementation Plan

#### Step 1: Create RLS Context Wrapper (File: Create new)

**Location**: `packages/backend/src/database/rls-context.ts`

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

  // Set RLS context via PostgreSQL session variables
  await prisma.$executeRaw`
    SET LOCAL app.current_user_id = ${context.userId};
    SET LOCAL app.user_roles = ${JSON.stringify(context.roles)};
  `;

  try {
    return await operation(prisma);
  } finally {
    // Context is automatically cleared at transaction end
  }
}

export async function withPrismaAuthContextTx<T>(
  context: PrismaAuthContext,
  operation: (tx: any) => Promise<T>,
): Promise<T> {
  const prisma = await connectPrisma();

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      SET LOCAL app.current_user_id = ${context.userId};
      SET LOCAL app.user_roles = ${JSON.stringify(context.roles)};
    `;

    return operation(tx);
  });
}
```

#### Step 2: Update Protected Routes

**Location**: [apps/web/app/api/control-tower/simple-launch/](../../apps/web/app/api/control-tower/simple-launch/)

**File**: `products/route.ts` (and others)

**Change**:

```typescript
// BEFORE
const db = prisma()
const products = await db.catalogProduct.findMany({...})

// AFTER
const authContext: PrismaAuthContext = {
  userId: actor.sub,
  roles: actor.roles
}
const products = await withPrismaAuthContext(authContext, async (db) => {
  return db.catalogProduct.findMany({...})
})
```

#### Step 3: Add RLS Context to Repository Layer

**Location**: `packages/backend/src/database/repositories/`

Create wrapper repositories that set RLS context automatically.

#### Step 4: Update Transaction Wrapper

**Location**: [packages/backend/src/database/transactions.ts](../../packages/backend/src/database/transactions.ts)

```typescript
// UPDATED
export async function withTransaction<T>(
  name: string,
  context: PrismaAuthContext | null,
  run: (tx: TransactionClient) => Promise<T>,
): Promise<T> {
  // Now accepts auth context and sets RLS
  return withPrismaAuthContextTx(
    context || { userId: "system", roles: [] },
    (tx) => {
      return; // existing transaction logic
    },
  );
}
```

### Validation Commands

```bash
# 1. Verify RLS context setting
node -e "
const { withPrismaAuthContext } = require('./packages/backend/src/database/rls-context');
const context = { userId: 'test-user', roles: ['STAFF'] };
withPrismaAuthContext(context, async (db) => {
  const result = await db.\$executeRaw\`SELECT current_setting('app.current_user_id')\`;
  console.log('RLS context:', result);
  process.exit(0);
}).catch(console.error);
"

# 2. Test protected route with RLS enforcement
node --experimental-strip-types scripts/rls-enforcement.test.mjs

# 3. Run typecheck
pnpm typecheck

# 4. Run full test suite
pnpm test
```

### Rollback Strategy

1. **If RLS context causes performance regression**:
   - Disable RLS context setting (fall back to current behavior)
   - This reverts to no enforcement but doesn't break routes

2. **If authentication context is incorrect**:
   - Check JWT token extraction in `currentAuthPayload()`
   - Verify role mapping in auth service

3. **If database connection fails**:
   - RLS context setting is `LOCAL` - affects only current transaction
   - Connection pool automatically recovers

### Exit Criteria

✓ `withPrismaAuthContext` wrapper created and tested  
✓ All control-tower routes updated to use wrapper  
✓ RLS context verified to set in database  
✓ Integration tests pass with RLS enforcement  
✓ `pnpm typecheck` passes  
✓ `pnpm test` passes  
✓ No performance regression (queries complete in < 100ms)

---

## P0 BLOCKER #2: Direct Prisma Usage in Protected Paths

### Current Severity

**Risk Level**: CRITICAL  
**Impact**: Architectural regression, future RLS changes will be missed

### Root Cause Analysis

**Where**: [apps/web/lib/server/simpleLaunchControl.ts](../../apps/web/lib/server/simpleLaunchControl.ts)

```typescript
export function prisma() {
  return getPrismaClient() as unknown as PrismaAny;
}
```

**Problem**:

1. Control-tower routes call `prisma()` directly
2. Bypasses any repository pattern or auth wrapper
3. Future developers won't know to add RLS context
4. Hard to audit which routes are protected

**Evidence**:

- 24 control-tower endpoints use `prisma()` directly
- Routes check `requireControlPermission()` but then bypass pattern
- No type safety on Prisma client usage
- Impossible to enforce architectural rules

### Affected Files

All files in [apps/web/app/api/control-tower/simple-launch/](../../apps/web/app/api/control-tower/simple-launch/):

```
├─ products/route.ts (lines 1-50)
├─ runtime-config/route.ts (lines 1-50)
├─ categories/route.ts
├─ promotions/route.ts
├─ coupons/route.ts
├─ media/route.ts
├─ orders/route.ts
├─ whatsapp/route.ts
├─ activity-logs/route.ts
└─ audit-logs/route.ts
```

### Implementation Plan

#### Step 1: Create Control Tower Repository (File: Create new)

**Location**: `packages/backend/src/domains/control-tower/repository.ts`

```typescript
import {
  withPrismaAuthContext,
  type PrismaAuthContext,
} from "../../database/rls-context";

export interface ControlTowerRepository {
  products: {
    findMany: (filter?: any) => Promise<any[]>;
    upsert: (where: any, data: any) => Promise<any>;
    update: (where: any, data: any) => Promise<any>;
  };
  runtimeConfig: {
    findMany: (filter?: any) => Promise<any[]>;
    upsert: (where: any, data: any) => Promise<any>;
  };
  // ... etc
}

export async function createControlTowerRepository(
  authContext: PrismaAuthContext,
): Promise<ControlTowerRepository> {
  return {
    products: {
      findMany: (filter) =>
        withPrismaAuthContext(authContext, (db) =>
          db.catalogProduct.findMany(filter),
        ),
      upsert: (where, data) =>
        withPrismaAuthContext(authContext, (db) =>
          db.catalogProduct.upsert({ where, data }),
        ),
      // ...
    },
    // ...
  };
}
```

#### Step 2: Update Control Tower Routes

**Location**: [apps/web/app/api/control-tower/simple-launch/products/route.ts](../../apps/web/app/api/control-tower/simple-launch/products/route.ts)

**Before**:

```typescript
const db = prisma()
const products = await db.catalogProduct.findMany({...})
```

**After**:

```typescript
const repo = await createControlTowerRepository({ userId: actor.sub, roles: actor.roles })
const products = await repo.products.findMany({...})
```

#### Step 3: Add Type Safety

Update `simpleLaunchControl.ts` to export only allowed utilities, not raw Prisma:

```typescript
// REMOVE this export
// export function prisma() { ... }

// ADD this export
export async function getControlTowerRepository(request: NextRequest) {
  const actor = await requireControlPermission(request, "control:tower:base");
  return createControlTowerRepository({
    userId: actor.sub,
    roles: actor.roles,
  });
}
```

#### Step 4: Migrate All Routes

Update each route file systematically:

1. `products/route.ts`
2. `runtime-config/route.ts`
3. `categories/route.ts`
4. `promotions/route.ts`
5. `coupons/route.ts`
6. `media/route.ts`
7. `orders/route.ts`
8. `whatsapp/route.ts`
9. `activity-logs/route.ts`
10. `audit-logs/route.ts`

### Validation Commands

```bash
# 1. Verify no direct prisma() calls in control-tower routes
rg "prisma\(\)" apps/web/app/api/control-tower/

# 2. Verify all routes use repository pattern
rg "createControlTowerRepository" apps/web/app/api/control-tower/

# 3. Run typecheck
pnpm typecheck

# 4. Run linting
pnpm lint

# 5. Run repository pattern tests
node --experimental-strip-types scripts/repository-pattern.test.mjs

# 6. Run full test suite
pnpm test
```

### Rollback Strategy

1. **If repository pattern causes performance issues**:
   - Create async-optimized repository with batch operations
   - Add caching layer

2. **If migration incomplete**:
   - Revert route files to previous commit
   - Keep repository interfaces for future use

3. **If type system breaks**:
   - Add `as any` temporarily
   - Fix type errors incrementally

### Exit Criteria

✓ Control Tower Repository interfaces created  
✓ All 10 route files updated to use repository pattern  
✓ No direct `prisma()` calls in control-tower routes  
✓ RLS context automatically applied through repository  
✓ `pnpm typecheck` passes  
✓ `pnpm lint` passes  
✓ `pnpm test` passes  
✓ All route endpoints still functional (no regression)

---

## P0 BLOCKER #3: Build Certification Incomplete

### Current Severity

**Risk Level**: HIGH  
**Impact**: Cannot deploy to production if build times out

### Root Cause Analysis

**Issue**: `pnpm build:web` times out on CI  
**Where**: [apps/web/next.config.ts](../../apps/web/next.config.ts)

**Suspected Causes**:

1. Turbopack transpilation of 5 workspace packages
2. Large backend package monolithic structure
3. Sentry sourcemap generation
4. Next.js optimization phase

### Investigation Plan

#### Step 1: Profile Build Locally

```bash
# Clear build cache
rm -rf apps/web/.next apps/web/.turbo

# Profile build with verbose timing
time pnpm build:web 2>&1 | tee build-profile.log

# Analyze Turbopack timing
echo "Build analysis complete. Check build-profile.log"
```

#### Step 2: Analyze Bottlenecks

Look for:

- Transpilation time per package
- Sourcemap generation time
- Optimization phase duration

#### Step 3: Optimization Strategies

**If transpilation is bottleneck**:

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  turbopack: {
    root: join(appDir, "../.."),
  },
  // Disable Sentry sourcemaps during build if timing out
  experimental: {
    turbopackCacheHandler: {
      // Add Turbopack cache optimization
    },
  },
};
```

**If Sentry is bottleneck**:

```typescript
// sentry.server.config.ts
export default {
  // Disable sourcemaps on CI
  sourcemaps: {
    disable: process.env.CI === "true",
  },
};
```

**If backend transpilation is bottleneck**:

- Pre-compile backend to dist/
- Only transpile changed files

### Implementation Plan

#### Step 1: Add Build Optimization

**File**: [apps/web/next.config.ts](../../apps/web/next.config.ts)

```typescript
const nextConfig: NextConfig = {
  // ... existing config

  // Add build optimization
  experimental: {
    // Skip Sentry sourcemaps on CI builds
    optimizePackageImports: ["@salora/backend"],
  },

  // Add caching
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
};
```

#### Step 2: Add Build Timeout Monitoring

**File**: [scripts/build-certification.mjs](../../scripts/build-certification.mjs) (Create new)

```javascript
#!/usr/bin/env node
import { spawn } from "child_process";
import { performance } from "perf_hooks";

const timeout = 5 * 60 * 1000; // 5 minutes max
const start = performance.now();

const build = spawn("pnpm", ["build:web"], {
  stdio: "inherit",
  timeout: timeout,
});

build.on("exit", (code) => {
  const duration = performance.now() - start;
  const durationSec = Math.round(duration / 1000);

  console.log(`\n✓ Build completed in ${durationSec}s`);

  if (durationSec > 300) {
    console.warn("⚠️ Build took > 5 minutes. Consider optimization.");
    process.exit(1);
  }

  if (code !== 0) {
    console.error(`✗ Build failed with exit code ${code}`);
    process.exit(1);
  }

  process.exit(0);
});

setTimeout(() => {
  console.error(`✗ Build timed out after ${timeout / 1000}s`);
  build.kill();
  process.exit(1);
}, timeout);
```

#### Step 3: Add CI Build Task

**File**: Update CI configuration (GitHub Actions / GitLab CI)

```yaml
build-certification:
  script:
    - echo "Building SALORA Web..."
    - time pnpm build:web
    - node scripts/build-certification.mjs
  timeout: "10m"
  artifacts:
    - apps/web/.next/
```

### Validation Commands

```bash
# 1. Profile build with timing
time pnpm build:web

# 2. Check build output size
du -sh apps/web/.next

# 3. Run build certification
node scripts/build-certification.mjs

# 4. Test production start
pnpm start:web

# 5. Verify typecheck passes
pnpm typecheck
```

### Rollback Strategy

1. **If optimizations break build**:
   - Revert next.config.ts changes
   - Fall back to stock Next.js config

2. **If Sentry disabled sourcemaps break debugging**:
   - Re-enable sourcemaps in production
   - Accept longer build time

3. **If transpilation disabled breaks imports**:
   - Re-enable specific workspace packages
   - Only disable ones not needed

### Exit Criteria

✓ Build completes in < 5 minutes on Node 22  
✓ Build certification script passes  
✓ Sentry sourcemaps working in production (or disabled per strategy)  
✓ `pnpm start:web` works correctly  
✓ No build warnings/errors  
✓ Typecheck passes

---

## P0 BLOCKER #4: Rate Limiting Not Distributed

### Current Severity

**Risk Level**: HIGH  
**Impact**: Process-local limits can be bypassed by horizontal scaling or replay attacks

### Root Cause Analysis

**Where**: [apps/web/proxy.ts](../../apps/web/proxy.ts)

**Current Implementation**:

- In-memory token bucket rate limiter
- Only protects single process
- Does not persist across deployments
- Cannot be shared across multiple instances

**Problem**:

1. Multiple instances = multiple rate limit buckets
2. Total throughput = sum of all instance limits
3. No coordination between instances
4. Cost/abuse control unreliable

### Affected Endpoints

All endpoints under:

- `/api/auth/` - Auth attempts (should be rate limited)
- `/api/payments/` - Stripe webhook processing (should be rate limited)
- `/api/whatsapp/` - WhatsApp message processing (should be rate limited)
- `/api/ai/` - AI requests (should be rate limited to control costs)

### Implementation Plan

#### Step 1: Create Distributed Rate Limiter (File: Create new)

**Location**: `packages/backend/src/cache/distributed-rate-limiter.ts`

```typescript
import { getRedisClient } from "./redis";

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // milliseconds
  key: string;
}

export async function checkRateLimit(
  config: RateLimitConfig,
): Promise<boolean> {
  const redis = await getRedisClient();
  const key = `ratelimit:${config.key}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  // Remove old entries outside window
  await redis.zremrangebyscore(key, 0, windowStart);

  // Count requests in window
  const count = await redis.zcard(key);

  if (count >= config.maxRequests) {
    return false; // Rate limit exceeded
  }

  // Add current request
  await redis.zadd(key, now, `${now}-${Math.random()}`);

  // Set expiry on key
  await redis.expire(key, Math.ceil(config.windowMs / 1000));

  return true; // Rate limit OK
}

export async function getRateLimitStatus(config: RateLimitConfig): Promise<{
  remaining: number;
  resetAt: Date;
}> {
  const redis = await getRedisClient();
  const key = `ratelimit:${config.key}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  await redis.zremrangebyscore(key, 0, windowStart);
  const count = await redis.zcard(key);

  const oldest = await redis.zrange(key, 0, 0, { withScores: true });
  const resetAt =
    oldest.length > 0 ? new Date(Number(oldest[0][1]) + config.windowMs) : now;

  return {
    remaining: Math.max(0, config.maxRequests - count),
    resetAt,
  };
}
```

#### Step 2: Integrate Rate Limiter into Protected Routes

**Location**: [apps/web/app/api/auth/route.ts](../../apps/web/app/api/auth/route.ts) (and others)

```typescript
import { checkRateLimit } from "@salora/backend/cache/distributed-rate-limiter";

export async function POST(request: NextRequest) {
  const clientIp = request.headers.get("x-forwarded-for") || "unknown";

  // Check rate limit
  const allowed = await checkRateLimit({
    key: `auth:${clientIp}`,
    maxRequests: 10,
    windowMs: 60 * 1000, // 10 requests per minute
  });

  if (!allowed) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Continue with request...
}
```

#### Step 3: Add Rate Limit Headers

```typescript
// Return rate limit info in response headers
const status = await getRateLimitStatus({...});
return new Response(body, {
  status: 200,
  headers: {
    "RateLimit-Limit": "10",
    "RateLimit-Remaining": String(status.remaining),
    "RateLimit-Reset": String(Math.floor(status.resetAt.getTime() / 1000)),
  },
});
```

#### Step 4: Configure Rate Limit Policies

**File**: Create [apps/web/config/rate-limits.ts](../../apps/web/config/rate-limits.ts)

```typescript
export const RateLimitPolicies = {
  auth: {
    login: { maxRequests: 10, windowMs: 60 * 1000 },
    register: { maxRequests: 5, windowMs: 60 * 1000 },
    refreshToken: { maxRequests: 30, windowMs: 60 * 1000 },
  },
  payments: {
    stripeWebhook: { maxRequests: 1000, windowMs: 60 * 1000 },
    createOrder: { maxRequests: 100, windowMs: 60 * 1000 },
  },
  whatsapp: {
    inboundMessage: { maxRequests: 10000, windowMs: 60 * 1000 },
    outboundMessage: { maxRequests: 1000, windowMs: 60 * 1000 },
  },
  ai: {
    recommendation: { maxRequests: 1000, windowMs: 60 * 1000 },
    chat: { maxRequests: 5000, windowMs: 60 * 1000 },
  },
};
```

### Validation Commands

```bash
# 1. Test Redis connectivity
node -e "
const { getRedisClient } = require('./packages/backend/src/cache/redis');
getRedisClient().then(r => r.ping()).then(console.log).catch(console.error);
"

# 2. Test rate limiter
node --experimental-strip-types scripts/rate-limit.test.mjs

# 3. Load test auth endpoint
ab -n 100 -c 10 http://localhost:3000/api/auth/login

# 4. Verify rate limit headers
curl -v http://localhost:3000/api/auth/login

# 5. Run full test suite
pnpm test
```

### Rollback Strategy

1. **If Redis unavailable**:
   - Fall back to process-local rate limiter
   - Log warning to ops

2. **If rate limit too aggressive**:
   - Adjust limits in RateLimitPolicies
   - Can update without redeploying (via runtime config)

3. **If rate limit causes legitimate users to be blocked**:
   - Implement adaptive rate limiting based on user reputation
   - Allow bypass for certain IP ranges

### Exit Criteria

✓ Distributed rate limiter implemented  
✓ All protected endpoints protected with rate limits  
✓ Rate limit headers returned in responses  
✓ Redis-backed storage working  
✓ Load test shows distributed rate limiting across instances  
✓ `pnpm test` passes  
✓ No false positives blocking legitimate users

---

## P0 BLOCKER #5: Worker Deployment Uncertified

### Current Severity

**Risk Level**: HIGH  
**Impact**: Background jobs may fail silently or hang indefinitely

### Root Cause Analysis

**Issue**: BullMQ workers have no health certification  
**Where**: [packages/backend/src/jobs/](../../packages/backend/src/jobs/)

**Gaps**:

1. No startup health checks
2. No graceful shutdown verification
3. No worker retry policy validation
4. No dead-letter queue strategy
5. No monitoring/observability

### Implementation Plan

#### Step 1: Create Worker Health Module (File: Create new)

**Location**: `packages/backend/src/jobs/health-check.ts`

```typescript
import { getRedisClient } from "../cache/redis";
import { connectPrisma } from "../database/prisma";

export async function verifyWorkerHealth(): Promise<{
  redis: boolean;
  database: boolean;
  healthy: boolean;
  timestamp: Date;
}> {
  const checks = {
    redis: false,
    database: false,
  };

  try {
    // Check Redis
    const redis = await getRedisClient();
    const pong = await redis.ping();
    checks.redis = pong === "PONG";
  } catch (error) {
    console.error("Redis health check failed:", error);
  }

  try {
    // Check Database
    const prisma = await connectPrisma();
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch (error) {
    console.error("Database health check failed:", error);
  }

  return {
    ...checks,
    healthy: checks.redis && checks.database,
    timestamp: new Date(),
  };
}
```

#### Step 2: Add Worker Startup Verification

**File**: [packages/backend/src/jobs/worker-startup.ts](../../packages/backend/src/jobs/worker-startup.ts) (Create new)

```typescript
import { verifyWorkerHealth } from "./health-check";

export async function verifyWorkerStartup(): Promise<void> {
  console.log("Verifying worker startup...");

  const maxRetries = 5;
  let attempt = 0;

  while (attempt < maxRetries) {
    const health = await verifyWorkerHealth();

    if (health.healthy) {
      console.log("✓ Worker health check passed");
      return;
    }

    attempt++;
    console.warn(
      `⚠ Worker health check failed (attempt ${attempt}/${maxRetries})`,
    );

    if (attempt < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  throw new Error("Worker startup verification failed");
}
```

#### Step 3: Add Graceful Shutdown

**File**: Update worker initialization

```typescript
import { verifyWorkerStartup } from "./worker-startup";

async function startWorkers() {
  // Verify startup
  await verifyWorkerStartup();

  // Start processing
  const workers = [
    // Create workers here
  ];

  // Graceful shutdown
  process.on("SIGTERM", async () => {
    console.log("Shutting down workers gracefully...");

    // Close all workers
    for (const worker of workers) {
      await worker.close();
    }

    process.exit(0);
  });
}
```

#### Step 4: Add Worker Health Check Script

**File**: [scripts/certify-worker.mjs](../../scripts/certify-worker.mjs) (Create new)

```javascript
#!/usr/bin/env node
import { verifyWorkerHealth } from "../packages/backend/src/jobs/health-check.ts";

async function certifyWorker() {
  console.log("WORKER CERTIFICATION REPORT");
  console.log("==========================\n");

  // Check startup health
  const health = await verifyWorkerHealth();
  console.log(`Redis: ${health.redis ? "✓ PASS" : "✗ FAIL"}`);
  console.log(`Database: ${health.database ? "✓ PASS" : "✗ FAIL"}`);

  if (!health.healthy) {
    console.error("\n✗ Worker certification FAILED");
    process.exit(1);
  }

  console.log("\n✓ Worker certification PASSED");
  process.exit(0);
}

certifyWorker().catch(console.error);
```

#### Step 5: Add to Package Scripts

**File**: [package.json](../../package.json)

```json
{
  "scripts": {
    "certify:worker": "node --experimental-strip-types scripts/certify-worker.mjs"
  }
}
```

### Validation Commands

```bash
# 1. Verify worker health
pnpm certify:worker

# 2. Test worker startup with Redis
REDIS_URL=redis://localhost:6379 node scripts/certify-worker.mjs

# 3. Test worker startup with database
DATABASE_URL=postgres://... node scripts/certify-worker.mjs

# 4. Test graceful shutdown
timeout 5 pnpm dev:jobs || true

# 5. Check worker logs for errors
pnpm dev:jobs 2>&1 | grep -i error
```

### Rollback Strategy

1. **If health check too strict**:
   - Reduce timeout values
   - Make non-critical checks optional

2. **If workers fail to start**:
   - Check Redis connectivity first
   - Check database connectivity second
   - Fix underlying infrastructure issue

3. **If graceful shutdown hangs**:
   - Add force kill timeout
   - Log which workers didn't close

### Exit Criteria

✓ Worker health check module created  
✓ Startup verification working  
✓ Graceful shutdown implemented  
✓ Certification script created and passing  
✓ `pnpm certify:worker` passes  
✓ Worker logs show successful startup  
✓ No worker crash on startup

---

## P0 BLOCKER #6: Backup/Restore Uncertified

### Current Severity

**Risk Level**: MEDIUM  
**Impact**: No verified recovery path if production data lost

### Root Cause Analysis

**Issue**: No backup/restore testing exists  
**Gap**: Cannot verify data recoverability

### Implementation Plan

#### Step 1: Create Backup/Restore Module (File: Create new)

**Location**: `scripts/backup-restore-certification.mjs`

```javascript
#!/usr/bin/env node
// Only runs on staging, prevents accidental production backup
if (process.env.ENVIRONMENT === "production") {
  console.error("✗ Backup/restore certification can only run on staging");
  process.exit(1);
}

// 1. Create backup
// 2. Verify backup integrity
// 3. Restore to temporary database
// 4. Verify restored data matches original
// 5. Generate report
```

#### Step 2: Add to Package Scripts

```json
{
  "scripts": {
    "certify:backup-restore": "ENVIRONMENT=staging node scripts/backup-restore-certification.mjs"
  }
}
```

### Exit Criteria

✓ Backup/restore script created  
✓ Staging-only protection working  
✓ `pnpm certify:backup-restore` passes on staging  
✓ Data integrity verified after restore

---

## P0 BLOCKER #7: Staging Certification Incomplete

### Current Severity

**Risk Level**: MEDIUM  
**Impact**: Cannot verify full production topology works

### Root Cause Analysis

**Issue**: No staging smoke tests  
**Gap**: Cannot verify infrastructure integration

### Implementation Plan

#### Step 1: Create Staging Smoke Tests (File: Create new)

**Location**: `scripts/staging-smoke-tests.mjs`

```javascript
#!/usr/bin/env node
// Verify all critical endpoints work on staging

const tests = [
  { name: "Homepage", method: "GET", path: "/" },
  { name: "Health", method: "GET", path: "/api/health" },
  { name: "Ready", method: "GET", path: "/api/ready" },
  { name: "Auth Login", method: "POST", path: "/api/auth/login" },
  // ... more tests
];

// Run each test and report
```

#### Step 2: Add to Package Scripts

```json
{
  "scripts": {
    "test:staging-smoke": "node scripts/staging-smoke-tests.mjs"
  }
}
```

### Exit Criteria

✓ Staging smoke tests created  
✓ `pnpm test:staging-smoke` passes on staging  
✓ All critical paths verified

---

## Risk Reduction Summary

| Blocker               | Risk     | Fix                           | Evidence              | Timeline |
| --------------------- | -------- | ----------------------------- | --------------------- | -------- |
| RLS enforcement       | Critical | withPrismaAuthContext wrapper | RLS context tests     | 2d       |
| Direct Prisma         | Critical | Repository pattern            | Code audit + tests    | 3d       |
| Build certification   | High     | Profile + optimize            | Build < 5 min         | 2d       |
| Rate limiting         | High     | Redis-backed limiter          | Load test             | 2d       |
| Worker certification  | High     | Health checks                 | Worker startup tests  | 2d       |
| Backup/restore        | Medium   | Staging-only tests            | Restore verification  | 2d       |
| Staging certification | Medium   | Smoke tests                   | Endpoint verification | 1d       |

**Total Effort**: 14 engineering days  
**Total Risk Reduction**: +14 points (68 → 82)  
**Expected Completion**: End of Week 2

---

**Next**: Execute blockers in order. Review [09-p0-execution-board.md](09-p0-execution-board.md) for detailed tasks.

---

**Owner**: Principal Security Architect & Principal Backend Engineer  
**Last Updated**: 9 June 2026
