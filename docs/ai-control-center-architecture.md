# AI Control Center Architecture

## Goal

Allow operators to manage providers, models, routing rules, fallback rules, cost limits, safety policies, prompt templates, and recommendation rules without code changes.

## Current State

SALORA has code-level AI provider, routing, safety, governance, cost-control, evaluation, recommendation, and observability primitives. The Control Tower exposes AI management as a first-class workspace and links it to live AI intelligence.

## Required Backend Activation

- Persistent AI policy records.
- Prompt template versioning.
- Provider/model routing table.
- Cost budget enforcement config.
- Safety policy approvals.
- Evaluation-driven rollout gates.
- Rollback for AI behavior changes.
