---
name: marketplace-community-rules
description: Rules for the cross-garage parts marketplace, the mechanical solutions knowledge base, the professional directory, and direct messaging between professionals. Use whenever building any of these four surfaces.
---

# Marketplace & Community Rules

## Cross-tenant read, single-tenant write
- Parts marketplace listings, solution posts/comments, and professional directory
  profiles are PLATFORM-WIDE READ surfaces — any authenticated professional can browse
  them regardless of which organization they belong to. This is intentional; it's the
  whole point of the network effect.
- WRITE actions are still strictly scoped: a user can only create/edit listings, posts,
  and profile content attributed to their own `user_id` and/or their own
  `organization_id`. Never allow editing another org's listing or another user's post.

## Feature gating
- Creating a marketplace listing is gated by the acting organization's plan limit (see
  billing-and-plans-rules) and requires `subscription_status` in `('trialing','active')`.
  Browsing/searching listings is NOT gated — only creation is.
- Messaging another professional requires the SENDER's organization to have an active
  or trialing subscription. Reading existing conversation threads is always allowed even
  if the subscription later lapses (never lock users out of their own message history).

## Directory visibility — resolve at query time, never store
- `professional_profiles.visibility_tier` is NOT a column you set directly. Visibility
  (listed / featured / spotlight) is ALWAYS derived at query/render time by joining the
  profile's `organization_id` to that organization's CURRENT `plans.directory_tier`. If a
  garage downgrades or lapses, their team's directory boost disappears on the next query
  — automatically, with no separate sync job to maintain and no stale-badge bug possible.
- Directory search ranking: spotlight > featured > listed, then relevance/recency within
  tier. Never let a garage pay once and keep a boosted badge after downgrading.

## Content moderation
- Every piece of user-generated content (solution posts, comments, marketplace listing
  descriptions, profile bios) has a `status` supporting `published/active`, `flagged`,
  and `removed`. Any authenticated user can report content (creates a flag); only
  `platform_admin` can move something to `removed`. Removed content stays in the
  database (soft-delete) for moderation audit trail — never hard-delete user content.
- Never expose a garage's own customer PII (client phone/email/address) anywhere in a
  public solution post, marketplace listing, or professional profile — these are
  professional-facing surfaces about the mechanic/garage, not about their customers.
- Public professional profile pages (`/pro/{slug}`) are SEO-indexable and rendered
  server-side. Confirm at code-review time that the query backing that page selects ONLY
  professional_profiles + organization branding fields — never join anything from
  clients/vehicles/actions into that response.

## Contact-info protection
- Real phone/email of a professional is never rendered in a public listing, post, or
  directory card. It's revealed only inside an accepted marketplace inquiry thread or an
  active direct-message conversation — both are authenticated, logged interactions.
