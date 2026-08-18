---
name: billing-and-plans-rules
description: Subscription billing, plan tiers, and feature-gating rules using Chargily Pay (BaridiMob / EDAHABIA / CIB). Use whenever building signup, billing, plan upgrade/downgrade, or ANY feature that should be gated by subscription tier.
---

# Billing & Plan Rules (Chargily Pay / BaridiMob Edition)

## Source of truth
- Chargily Pay is the source of truth for payment and subscription status (EDAHABIA, BaridiMob, CIB).
- `organizations.subscription_status` is updated ONLY by verified Chargily webhook events (`checkout.paid`, `checkout.failed`, `checkout.expired`) — never set it directly from a client request.
- Verify every webhook signature using HMAC-SHA256 with `CHARGILY_SECRET_KEY`. Reject and log anything that doesn't verify.

## Plans (in Algerian Dinars DZD)

| Plan | Price (DZD/mo) | Branches | Seats | Card design studio | Marketplace listings | Directory tier |
|---|---|---|---|---|---|---|
| Starter | 4,900 DZD | 1 | 3 | Template only (pick from presets, no custom studio) | 0/mo | Listed (name only) |
| Pro | 12,900 DZD | 3 | 15 | Full studio (upload logo, custom colors/layout) | 20/mo | Featured (boosted ranking + badge) |
| Enterprise | 29,900 DZD | Unlimited | Unlimited | Full studio + white-label (remove platform branding) | Unlimited | Spotlight (top placement, badge, homepage rotation) |

Store these as rows in a `plans` table with explicit boolean/numeric feature-flag columns —
never hardcode plan-name string comparisons scattered through the codebase. One place
reads the plan's feature flags; everything else asks that one place.

## Feature gating — check at time of ACTION, not at login
- Every gated action (create a card design, submit a card order, create a marketplace
  listing, message another professional, add a branch/seat beyond the plan limit) must
  re-check the organization's CURRENT plan + subscription_status at the moment of the
  action. A session/JWT claim set at login is not sufficient — plans change mid-session.
- `subscription_status = 'past_due'`: allow all reads, block all new writes except
  updating payment method, and show a persistent billing-issue banner.
- `subscription_status = 'canceled'`: read-only grace period (configurable, e.g. 30 days)
  before data access is fully suspended (never deleted — export remains available).
- Trials: default 14 days, `trial_ends_at` set at signup, no payment card required to start a trial.

## Plan changes & renewals
- Downgrading is blocked if current usage exceeds the target plan's limits (e.g. 5 branches
  on a Pro plan trying to downgrade to Starter's 1-branch limit) — surface exactly what
  needs to change first.
- Upgrading or renewing generates a Chargily Checkout Session with EDAHABIA / CIB payment options.
