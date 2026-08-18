---
name: garage-tenancy-rules
description: Non-negotiable multi-tenancy and business rules for the garage SaaS. Use whenever touching clients, vehicles, PVC cards, actions, stock, invoices, or ANY database query.
---

# Garage Tenancy & Domain Rules

## Multi-tenancy — the single most important rule in this codebase
- Every tenant-owned table has a NOT NULL `organization_id` column: clients, vehicles,
  pvc_cards, workers, actions, parts, stock_movements, invoices, appointments, reminders,
  audit_logs, card_designs, card_orders, marketplace_listings, suppliers.
- Never hand-write a raw query against a tenant table. All data access goes through the
  shared query helper (`withOrgScope(orgId)` or the Drizzle repository layer) that
  automatically injects `WHERE organization_id = :orgId`. If you find yourself writing
  `db.select().from(clients)` with no org filter, stop — that is a cross-tenant data leak.
- Enforce this AGAIN at the database layer with Postgres Row-Level Security policies on
  every tenant table, keyed to a `app.current_org_id` session variable set at the top of
  every request from the authenticated session. Application-layer filtering is not
  sufficient on its own — RLS is the backstop for when application code has a bug.
- A `platform_admin` role (separate from `owner`/`super_admin`/`manager`/`technician`)
  exists for YOUR staff only (card fulfillment ops, support, moderation). It is the ONLY
  role allowed to query across organizations, and only through explicitly separate,
  audited admin routes under `/platform-admin/*` — never through the normal tenant API.

## Ownership model (unchanged from before)
- A `client` (garage's customer) owns N `vehicles`, scoped to one `organization_id`.
- A `pvc_card` links to a vehicle, never directly to a client.
- Transferring a vehicle to a new owner updates `client_id` in place; never delete/recreate.
  Log the transfer in `audit_logs`.

## PVC card lifecycle (do not simplify this state machine)
- Cards are generated in batches BEFORE assignment: status `unassigned`, random
  non-sequential token (128-bit minimum). See card-studio-fulfillment-rules for how
  unassigned cards now enter the system (via a PAID order, not free generation).
- Linking sets status `active` + `vehicle_id` + `linked_at`.
- Lost/damaged sets status `revoked` (never delete the row); a new pre-printed card links
  to the same vehicle. Revoked tokens show "this card has been deactivated" — never 404,
  never leak whether a token ever existed.
- Every link/revoke writes an `audit_logs` row scoped to the organization.

## Stock and actions (must be atomic, unchanged)
- Attaching a part to an action, in ONE transaction: insert `action_parts` with
  `unit_price_snapshot` = the part's current `sale_price` copied at that instant (never a
  live join); decrement `parts.quantity_in_stock`; insert a `stock_movements` row. Roll
  back all three on any failure.
- Manager role can soft-override an insufficient-stock warning; log the override.
- Changing `sale_price` later never touches historical `action_parts`/invoices.

## Invoicing (unchanged)
- Invoice numbers sequential PER organization PER year (e.g. `{org_slug}-2026-000123`),
  generated inside a transaction with a row lock — never `max + 1` via plain SELECT.
- Issued invoices are frozen; regenerating creates a new draft, never overwrites.

## Roles (now nested under organization_members, not a global users.role)
- `owner`: billing + everything below. Exactly one per organization initially (can add more).
- `super_admin` (org-scoped): everything except billing/plan changes.
- `manager`: day-to-day operations, no user management or billing.
- `technician`: read/write only on actions they're assigned to via `action_workers`. Cannot
  browse other clients' data or see cost/margin figures.
- `platform_admin`: superuser for platform ops team only (see multi-tenancy section above).

## Public QR view (`/v/:token`)
- Strictly read-only, no write-capable endpoint reachable from this route.
- Never serialize client phone/email/address. Never expose other vehicles of the same
  client. Never expose `internal_notes`.
- Now also renders per-organization branding: logo, brand color, locale — resolved from
  the card's `organization_id`, cached aggressively (this data changes rarely).
- Rate-limited; tokens never enumerable/sequential.
