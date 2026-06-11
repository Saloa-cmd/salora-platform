# SALORA Enterprise Architecture Blueprint v2.0

## Future State Post-Soft-Launch

**Target Timeline**: Weeks 5-12 (post-soft-launch)  
**Target Readiness**: 90+/100  
**Scope**: Multi-tenant, franchise, advanced RBAC

---

## Architecture Evolution: v1 → v2

### Current (v1): Single-Tenant Monolith

```
User → Auth → Prisma Client → PostgreSQL
              ↓
           RLS Policies (proposed)
```

### Future (v2): Multi-Tenant Platform

```
Organization → Auth Context → Tenant Middleware → Prisma Client
    ↓                                                    ↓
Tenant ID ─────────────────────────────────────→ RLS Policies
    ↓                                                    ↓
Branch ID ──────────────────────────────────────→ Row Filters
    ↓
Staff/Customer

Tenant Isolation: ✓
Branch Isolation: ✓
Advanced RBAC: ✓
Franchise Ready: ✓
```

---

## Multi-Tenant Data Model

### Tenant Hierarchy

```
Organization (Tenant)
├─ Location/Branch
│  ├─ Menu (Products)
│  ├─ Orders
│  ├─ Staff
│  └─ Customers (in-location)
├─ Franchise (if enabled)
│  ├─ Sub-Location
│  └─ Sub-Customers
└─ Enterprise Features
   ├─ Reporting
   ├─ Analytics
   └─ Advanced AI
```

### Schema Changes Required

- Add `tenantId` to: Users, Products, Orders, Configs
- Add `branchId` to: Products, Orders, Staff, Customers
- Add `organizationId` to core tables
- Add soft tenancy boundaries via RLS

---

## Franchise Model

### Franchise Topology

```
Master Cafe (owned by Salora)
├─ Salora HQ (tenant)
│  ├─ Coffee Lab
│  └─ Roastery
│
Franchise Partner A
├─ Franchise Tenant A1
├─ Franchise Tenant A2
│
Franchise Partner B
└─ Franchise Tenant B1
```

### Revenue Model

- Master: Direct profit
- Franchise: Revenue share + SaaS fee

---

## Advanced RBAC Model

### Role Scoping

**Current**: `ADMIN | MANAGER | STAFF | CUSTOMER`

**Future**:

```
SUPER_ADMIN
├─ view:all-orgs
├─ manage:all-orgs
└─ system:controls

ORG_ADMIN (scoped to tenant)
├─ manage:tenant
├─ manage:branches
├─ manage:franchise
└─ view:reports

BRANCH_MANAGER (scoped to branch)
├─ manage:branch-products
├─ manage:branch-orders
├─ view:branch-reports
└─ train:staff

STAFF (scoped to branch)
├─ process:orders
├─ view:branch-inventory
└─ use:ai-assist

CUSTOMER
├─ view:products
├─ place:orders
└─ use:ai-chat
```

---

## API Evolution

### Current API

```
GET  /api/products
POST /api/orders
GET  /api/control-tower/products
```

### v2 Multi-Tenant API

```
GET  /api/tenants/{tenantId}/products
GET  /api/tenants/{tenantId}/branches/{branchId}/products
GET  /api/tenants/{tenantId}/orders
POST /api/tenants/{tenantId}/orders
GET  /api/tenants/{tenantId}/reports
```

---

## Implementation Phases

### Phase 1: Auth Context Layer (Week 5-6)

- Add tenant context to JWT
- Add branch context to JWT
- Update `withPrismaAuthContext` to include tenant/branch

### Phase 2: Data Isolation (Week 7-8)

- Add `tenantId` to RLS checks
- Add `branchId` to RLS checks
- Validate tenant isolation in tests

### Phase 3: API Multi-Tenancy (Week 9-10)

- Version API to `/api/tenants/`
- Add tenant parameter to all routes
- Validate tenant access control

### Phase 4: Advanced Features (Week 11-12)

- Franchise support
- Advanced reporting
- Tenant-specific configurations

---

**Owner**: Principal Software Architect  
**Next Review**: Post-Soft-Launch Week 1
