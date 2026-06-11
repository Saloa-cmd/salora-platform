# Automation Architecture

## Model

Automation uses a visual Trigger -> Condition -> Action model.

## Required Recipes

- Order Paid -> Loyalty Award.
- Customer Inactive -> Offer Campaign.
- Payment Failed -> WhatsApp Reminder.

## Runtime Requirements

- Trigger registry.
- Condition registry.
- Action registry.
- Dry-run simulator.
- Idempotency keys.
- Retry policy.
- Dead-letter queue.
- Audit events.

## Current Implementation

The Control Tower includes the Automation section and recipe catalog as a typed workspace. Persistent rule storage and execution runtime remain backend activation work.
