# Multi-Tenant Architecture

## Goal

Support SALORA, future cafes, future brands, and future restaurants from one dashboard.

## Required Model

- Tenant/business record.
- Brand profile.
- Location record.
- Tenant-scoped catalog, CMS, integrations, automation, analytics, and settings.
- Business switcher in Control Tower.
- Tenant-scoped RBAC.

## Current Implementation

The Control Tower Settings section models multi-tenant readiness. Persistent tenant boundaries are not yet active and must be introduced before multiple businesses share one production dashboard.
