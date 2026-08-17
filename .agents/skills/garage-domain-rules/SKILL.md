---
name: garage-domain-rules
description: Non-negotiable business rules for the garage management platform (client/vehicle/PVC card/action/stock/invoice model). Use whenever creating or modifying anything related to clients, vehicles, PVC cards, service actions, parts/stock, workers, or invoices.
---

# Garage Domain Rules

## Ownership model
- A `client` owns N `vehicles`. A `vehicle` belongs to exactly one client at a time.
- A `pvc_card` links to a **vehicle**, never directly to a client. A client can have several
  vehicles, each with its own card and its own history.
- Transferring a vehicle to a new owner updates `vehicles.client_id` in place — never delete
  and recreate the vehicle. History must survive ownership changes. Log the transfer in
  `audit_logs`.

## PVC card lifecycle (do not simplify this state machine)
- Cards are generated in batches BEFORE being assigned: status starts as `unassigned`,
  each with a random, non-sequential token (min 128-bit, e.g. UUIDv4 or crypto-random string
  — never a sequential/incrementing ID, since the token IS the public access key).
- Linking a card to a vehicle sets status `active` and stores `vehicle_id` + `linked_at`.
- Losing/damaging a card sets status `revoked` (never delete the row — keep it for audit
  history) and a new pre-printed card gets linked to the same vehicle. The public route for
  a revoked token must show "this card has been deactivated" — never 404, never leak
  whether the token ever existed if it wasn't valid.
- Every link/revoke action writes an `audit_logs` row (actor, timestamp, old/new status).

## Stock and actions (must be atomic)
- When a part is attached to an action with a quantity, in the SAME database transaction:
  1. Insert the `action_parts` row with `unit_price_snapshot` = the part's CURRENT
     `sale_price` at that instant (never a reference/join to the live price — copy the value).
  2. Decrement `parts.quantity_in_stock` by that quantity.
  3. Insert a `stock_movements` row (`type = 'out'`, referencing the action).
- If any step fails, roll back all three. Never let stock drift from the movement ledger.
- If requested quantity exceeds available stock, warn but allow override by a manager role
  (soft block, not a hard block) — log the override.
- Changing a part's `sale_price` later must NEVER change historical `action_parts` rows or
  past invoices. Only future usages get the new price.

## Invoicing
- Invoice numbers are sequential per calendar year (e.g. `2026-000123`), generated inside a
  transaction with a row lock or a dedicated sequence — never computed as "max + 1" via a
  plain SELECT (race condition under concurrent writes).
- An invoice is generated from a completed action's `action_parts` + labor cost. Once an
  invoice is `issued`, its line items are frozen — regenerating never overwrites an issued
  invoice; it creates a new draft version.

## Roles
- `super_admin`: everything.
- `manager`: clients, vehicles, cards, actions, parts, workers, invoices — no system settings
  or user management.
- `technician`: read/write ONLY on actions they are assigned to via `action_workers`. Cannot
  browse other clients' data, cannot see cost/margin data.

## Public QR view (`/v/:token`)
- Strictly read-only. No endpoint reachable from this route may ever perform a write.
- Never serialize client `phone`, `email`, or `address` into this route's response — enforce
  this in the data-access/serializer layer, not just by omitting fields in the UI.
- Never expose other vehicles owned by the same client.
- Never expose `internal_notes` on an action — only `client_visible_notes`.
- Rate-limit this route; tokens must never be enumerable/guessable in the URL structure
  (no incrementing IDs, no short tokens).
