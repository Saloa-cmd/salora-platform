# CMS Architecture

## Goal

The CMS should allow operators to manage pages, sections, banners, promotions, menus, categories, products, and landing pages without code changes.

## Lifecycle

- Draft
- Publish
- Schedule
- Archive

## Current Implementation

The Control Tower exposes live product creation because the catalog write API already exists. Page, section, banner, promotion, menu, category, and landing-page lifecycle controls are modeled as backend activation workspaces.

## Required Backend Domain

- Versioned content records.
- Preview and publish API.
- Schedule worker.
- Archive and restore.
- Approval workflow.
- Rollback.
- Tenant-scoped content delivery for web and mobile.
