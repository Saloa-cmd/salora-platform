# SALORA Master Roadmap: 30/60/90 Days

## Execution Plan to Soft Launch

**Start Date**: 9 June 2026  
**Soft Launch Target**: 30 June 2026  
**Public Launch Target**: 15 August 2026

---

## 30-Day Sprint: P0 Execution (9 June - 9 July)

### Objectives

- Close all 7 P0 blockers
- Achieve 80-82/100 readiness
- Achieve Soft Launch GO WITH CONDITIONS
- Internal Pilot proven successful

### Week 1 (June 9-15)

#### Blocker 1: RLS Runtime Enforcement

- Mon: Create withPrismaAuthContext wrapper
- Wed: Update control-tower routes (batch 1)
- Thu: Create RLS enforcement tests
- Fri: Verify all routes use RLS context

**Exit Criteria**: RLS context set on 100% of protected queries

#### Blocker 2: Direct Prisma Removal (Start)

- Mon: Create Control Tower Repository
- Tue-Thu: Update route files (1-5 of 10)
- Fri: Verify no direct prisma() calls

**Readiness Target**: 68 → 73/100

### Week 2 (June 16-22)

#### Blocker 2: Direct Prisma Removal (Complete)

- Mon-Wed: Update remaining route files (6-10 of 10)
- Thu: Type safety verification
- Fri: Full test suite

**Exit Criteria**: All routes use repository pattern

#### Blocker 3: Build Certification (Start)

- Wed: Profile build, identify bottlenecks
- Thu: Implement optimizations
- Fri: Build certification script

**Readiness Target**: 73 → 77/100

### Week 3 (June 23-29)

#### Blocker 3: Build Certification (Complete)

- Mon: Finalize build optimization
- Tue: Add to CI pipeline
- Wed: Test on target environment

#### Blocker 4: Distributed Rate Limiting

- Mon-Wed: Implement Redis-backed rate limiter
- Thu: Add to key endpoints
- Fri: Load test verification

**Exit Criteria**: Rate limiting enforced across instances

#### Blocker 5: Worker Certification (Start)

- Fri: Create health check module

**Readiness Target**: 77 → 81/100

### Week 4 (June 30 - July 6)

#### Blocker 5: Worker Certification (Complete)

- Mon: Complete graceful shutdown
- Tue: Create certification script
- Wed: Verify worker health checks

#### Blocker 6: Backup/Restore Certification

- Thu: Create staging-only backup tests
- Fri: Verify restore functionality

#### Blocker 7: Staging Certification

- Fri: Create staging smoke tests

**Readiness Target**: 81 → 83/100

### Week 5 (July 7-9)

#### Final Validation

- Mon: Full test suite execution
- Tue: Evidence collection
- Wed: Leadership review
- Thu-Fri: Buffer for issues

**Readiness Target**: 83/100 (achieved)

---

## 60-Day Sprint: P1 Execution & Soft Launch (10 July - 9 August)

### Objectives

- Close P1 blockers
- Achieve 85-87/100 readiness
- Soft Launch APPROVED
- Initial customer feedback collected

### Week 6-7 (July 7-20)

#### P1: Control Tower Transactions

- Implement transaction-safe mutations
- Add comprehensive audit logging
- Test failure recovery

#### P1: Advanced Rate Limiting

- Implement advanced rate limit rules
- Add per-customer limits
- Add adaptive rate limiting

**Readiness Target**: 83 → 85/100

### Week 8 (July 21-27)

#### P1: Webhook Security

- Add idempotency keys
- Implement replay attack prevention
- Test webhook resilience

**Readiness Target**: 85 → 86/100

### Week 9-10 (July 28 - Aug 9)

#### Soft Launch Preparation

- Feature flag framework
- Gradual rollout configuration
- Customer support training
- Monitoring & alerting
- Kill switch testing

#### Soft Launch Week

- July 30: Limited launch (1% of users)
- Aug 2: Expand to 5% of users
- Aug 5: Expand to 10% of users
- Aug 8: Expand to 50% of users
- Aug 9: Decision on 100% rollout

**Readiness Target**: 86 → 87/100

---

## 90-Day Sprint: Enterprise & Public Launch (10 August - 8 September)

### Objectives

- Enterprise architecture ready
- 90+/100 readiness
- Public Launch APPROVED
- Production hardening complete

### Week 11-12 (Aug 10-23)

#### Enterprise: Multi-Tenant Foundation

- Add tenant context to JWT
- Implement tenant isolation in RLS
- Create multi-tenant tests

#### Enterprise: Advanced RBAC

- Implement scoped role system
- Add resource-level permissions
- Create RBAC tests

**Readiness Target**: 87 → 88/100

### Week 13 (Aug 24-30)

#### Enterprise: Franchise Support

- Implement franchise model
- Create franchise provisioning
- Test franchise isolation

**Readiness Target**: 88 → 89/100

### Week 14-15 (Aug 31 - Sep 8)

#### Enterprise: Advanced Features

- AI prompt versioning
- Advanced reporting
- Cost controls
- Performance optimization

**Readiness Target**: 89 → 91/100

#### Public Launch Preparation

- Enterprise SLA agreements
- Extended support model
- Regional deployment strategy
- Geographic rollout plan

#### Public Launch (Phased)

- Sep 1: Limited regions (5%)
- Sep 4: More regions (20%)
- Sep 8: Full regions (100%)

---

## Daily Execution Framework

### Daily Standup (9 AM)

```
1. What completed yesterday?
2. What's planned today?
3. Any blockers?
4. Readiness delta?
```

### Weekly Sync (Friday 3 PM)

```
1. Blocker status
2. Readiness update
3. Risk assessment
4. Decision checkpoints
```

### Bi-Weekly Leadership Review (Every 2 weeks)

```
1. Readiness scorecard
2. GO/NO-GO assessment
3. Risk mitigation
4. Resource needs
5. Customer impact
```

---

## Critical Path Decision Points

### June 23 (Day 14)

**Decision**: Can Blocker 3 (Build) be resolved?

- IF YES: Continue
- IF NO: ESCALATE - requires urgent action

### June 30 (Day 21)

**Decision**: Are all P0 blockers on track?

- IF YES: Proceed to Soft Launch prep
- IF NO: Extend timeline or scope cut

### July 9 (Day 30)

**Decision**: Readiness ≥ 83/100?

- IF YES: Launch Internal Pilot
- IF NO: NO-GO, reset timeline

### July 30 (Day 51)

**Decision**: Soft Launch GO?

- IF YES: Begin 1% rollout
- IF NO: Extended testing + P1 completion

### August 9 (Day 61)

**Decision**: Soft Launch 100%?

- IF YES: Proceed to 100% rollout
- IF NO: Continue phased rollout or rollback

---

## Success Metrics

### Week 1-4 (P0 Execution)

| Metric          | Target | Current | Status |
| --------------- | ------ | ------- | ------ |
| Blockers Closed | 7      | 0       | -      |
| RLS Enforced    | 100%   | 0%      | -      |
| Readiness Score | 82     | 68      | -      |

### Week 5-10 (Soft Launch)

| Metric             | Target   | Status |
| ------------------ | -------- | ------ |
| P1 Blockers Closed | 100%     | -      |
| Soft Launch Active | Yes      | -      |
| Readiness Score    | 87       | -      |
| Customer Feedback  | Positive | -      |

### Week 11-15 (Enterprise)

| Metric             | Target | Status |
| ------------------ | ------ | ------ |
| Multi-Tenant Ready | Yes    | -      |
| Franchise Support  | Yes    | -      |
| Readiness Score    | 91     | -      |
| Public Launch      | GO     | -      |

---

## Risk Mitigation Triggers

### If Behind Schedule

- Cut lower-priority P1 items
- Extend soft launch phase
- Reduce scope for public launch

### If Build Fails

- Emergency profiling session
- Consider split deployment
- Skip sourcemaps if critical

### If RLS Breaks Routes

- Immediate rollback
- Fall back to application-only checks
- Plan RLS for enterprise phase

### If Rate Limiting Fails

- Disable distributed limiter
- Fall back to process-local
- Implement alternative solution

---

**Owner**: Program Manager + CTO  
**Last Updated**: 9 June 2026
