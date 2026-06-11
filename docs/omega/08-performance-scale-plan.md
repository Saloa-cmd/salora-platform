# SALORA Performance & Scale Plan

## 1K Concurrent / 10K DAU / 100K MAU Target

**Target Timeline**: Post-Soft-Launch (Weeks 5+)  
**Current Capacity**: 100 concurrent users  
**Target Capacity**: 1000 concurrent users

---

## Scaling Assumptions

### Traffic Profile

```
Peak Hours: 9 AM - 2 PM (lunch rush)
├─ 1000 concurrent users
├─ 10,000 DAU
├─ 100,000 MAU
└─ 5 orders per user per month

Peak Requests/sec: ~500
Average Requests/sec: ~50
Database Connections: 100-200 active
```

### Cost Assumptions

```
Database: ~$2000/month
Cache (Redis): ~$200/month
CDN: ~$500/month
AI API: ~$10,000/month
Monitoring: ~$500/month
─────────────────────────
Total: ~$13,200/month
```

---

## Database Scaling Strategy

### Current (Single Node)

```
Supabase PostgreSQL 15
├─ Max connections: 100
├─ Storage: 100 GB (included)
├─ Performance: Standard
└─ Cost: $25-50/month
```

### Scaled (Read Replicas)

```
Primary (Write):
├─ 256 GB RAM
├─ 4 vCPU
├─ Max connections: 500
└─ Cost: $2000+/month

Read Replicas (3x):
├─ 64 GB RAM each
├─ 2 vCPU each
└─ Cost: $600/month each
```

### Strategy

1. Monitor connections (alert at 80%)
2. Add read replicas when write latency > 100ms
3. Implement connection pooling (PgBouncer)
4. Archive old data quarterly

---

## Caching Strategy

### Current

```
Upstash Redis (free tier)
├─ 10 GB storage
├─ 10k requests/day free
└─ Single region
```

### Scaled

```
Upstash Redis Pro
├─ Unlimited storage
├─ Unlimited requests
├─ Multi-region replicas
├─ Automatic failover
└─ Cost: ~$200-500/month
```

### Caching Rules

```
Products: 1 hour TTL
Orders: 5 minute TTL
Configs: 30 minute TTL
Customer Data: 10 minute TTL
AI Responses: 24 hour TTL (if identical query)
```

---

## Queue & Worker Scaling

### Current (BullMQ)

```
Single Redis instance
├─ Max throughput: 1000 jobs/sec
├─ Single worker process
└─ No fault tolerance
```

### Scaled

```
Upstash Redis (Pro)
├─ Multi-region replication
├─ Horizontal scaling: 10+ worker processes
├─ Auto-scaling based on queue depth
├─ Dead-letter queue for failed jobs
├─ Max throughput: 10,000+ jobs/sec
```

### Job Types

- Email notifications
- WhatsApp message delivery
- Order confirmation processing
- AI response generation
- Analytics aggregation

---

## AI Cost Scaling

### Current

```
~50 requests/day
├─ Average cost: $0.01/request
├─ Daily cost: $0.50
└─ Monthly: ~$15
```

### Scaled (10K DAU)

```
~100,000 requests/day
├─ Average cost: $0.01/request
├─ Daily cost: $1,000
└─ Monthly: ~$30,000
```

### Cost Optimization

- Route to cheapest model (Gemini) when possible
- Implement response caching
- Use smaller models for simple queries
- Batch non-realtime requests
- Set usage limits per customer

---

## WhatsApp Scaling

### Current

```
~100 messages/day
├─ Delivery rate: 95%
└─ Cost: ~$0.002/message
```

### Scaled (10K DAU)

```
~50,000 messages/day
├─ Delivery rate: 99%
└─ Monthly cost: ~$3,000
```

### Requirements

- Distributed message queue
- Retry logic with exponential backoff
- Delivery receipt tracking
- Webhook signature verification
- Rate limiting per customer

---

## Web Application Scaling

### Current (Single Instance)

```
Vercel (hobby tier)
├─ 1 instance
├─ 100 concurrent connections
└─ Auto-scaling disabled
```

### Scaled (Pro)

```
Vercel (Pro)
├─ Auto-scaling: 3-10 instances
├─ Global edge caching
├─ Edge functions for rate limiting
├─ ISR (Incremental Static Regeneration)
└─ Monthly cost: ~$20/month
```

---

## Monitoring & Observability at Scale

### Key Metrics

- P95/P99 latency (target: < 1000ms)
- Error rate (target: < 0.1%)
- Availability (target: 99.5%)
- Database connections (target: < 80%)
- Cache hit rate (target: > 80%)
- Queue depth (target: < 1000)

### Alerts

```
✓ P99 latency > 2 seconds
✓ Error rate > 1%
✓ Availability < 99%
✓ Database connections > 80%
✓ Queue depth > 5000
✓ AI cost > daily budget
✓ WhatsApp delivery rate < 95%
```

---

## Rollout Plan

### Week 1-2: Baseline Metrics

- Establish performance baseline
- Configure monitoring
- Document current limits

### Week 3-4: Database Optimization

- Add indexes for common queries
- Implement connection pooling
- Enable query monitoring

### Week 5-6: Caching Optimization

- Implement intelligent caching
- Add cache warming
- Monitor hit rates

### Week 7-8: Horizontal Scaling

- Add load balancing
- Horizontal scaling of workers
- Auto-scaling policies

### Week 9-10: AI Optimization

- Implement cost controls
- Add intelligent routing
- Response caching

---

## Performance Regression Prevention

### Regression Tests

```bash
# Measure baseline
time curl http://localhost:3000/api/products
# Result: 120ms

# After changes
time curl http://localhost:3000/api/products
# Result: 125ms (OK: +4.1%)
# Result: 200ms (FAIL: +66.7%)
```

### Automated Checks

- Add performance benchmarks to CI
- Fail build if regression > 10%
- Track historical trends

---

**Owner**: Principal DevOps Engineer + Principal Backend Engineer  
**Status**: Planning Phase
