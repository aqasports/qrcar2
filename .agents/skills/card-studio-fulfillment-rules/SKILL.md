---
name: card-studio-fulfillment-rules
description: Rules for the PVC card design studio and the card reorder/fulfillment flow. Use whenever building card design, preview rendering, reorder detection, or order/shipping logic.
---

# Card Design Studio & Fulfillment Rules

## Design studio
- Canvas is a fixed CR-80 card size (85.6mm x 54mm) at print resolution (300dpi ->
  1011x638px). Enforce a safe-zone margin (~3mm / ~36px on every edge) — no text or logo
  may render inside that margin; the studio must visually indicate the safe zone and
  should not let a user export/submit a design with elements outside it.
- A design has independent front and back layouts. The QR code itself is ALWAYS
  system-generated (never user-uploadable as an image) and always placed with adequate
  quiet-zone margin so it stays scannable regardless of the rest of the layout.
- Design lifecycle: `draft` (freely editable) -> `submitted` (locked, awaiting review) ->
  `approved` (usable in orders) | `rejected` (editable again, with a reason shown to the
  garage) -> `archived`.
- **A design must be `approved` before it can be attached to a card_order.** Self-service
  preview/export is fine at any stage, but nothing enters production printing without an
  explicit approval step — this protects print-vendor relationships and card quality.
- Starter plan: restrict to a small set of platform-provided template designs (logo
  upload + one accent color only, no free-form layout editing). Pro/Enterprise: full
  studio access, per the plans table in billing-and-plans-rules.

## Reorder detection
- After every card link or revoke action, recompute `count(pvc_cards WHERE organization_id
  = X AND status = 'unassigned')` for that org.
- If the count is at or below `card_stock_settings.reorder_threshold`: surface an in-app
  banner + a scheduled email nudge. If `card_stock_settings.auto_reorder` is enabled,
  auto-create a `card_order` in status `draft` (never auto-charge — a human must still
  confirm and pay).

## Ordering & fulfillment (this is a real e-commerce checkout, treat it like one)
- A `card_order` requires: an APPROVED `card_design_id`, quantity, full shipping address,
  and a completed Stripe PaymentIntent/Checkout session before it can move past
  `pending_payment`. Never generate physical inventory (pvc_cards rows) for an unpaid order.
- Order status machine: `draft -> pending_payment -> paid -> in_production -> shipped ->
  delivered` (or `cancelled` from any pre-shipped state). Only `platform_admin` can advance
  an order past `paid` (this reflects real-world printing/shipping, done by your ops team,
  not automated).
- **The moment (and only the moment) an order transitions to `delivered`**, the system
  auto-inserts exactly `quantity` new `pvc_cards` rows: `status = 'unassigned'`,
  `organization_id` = the order's org, `card_design_id` = the order's design. A garage can
  never generate unassigned card rows any other way — that would be a free-inventory
  exploit against your physical card supply chain.
- Every status transition writes an audit log entry with the acting `platform_admin` user.
