---
name: ui-design-system-rules
description: Rules for all UI work under src/app/** and src/components/**. Use whenever creating or editing a page, form, table, card, modal, button, or any visual element.
---

# UI Design System Rules

## Never hand-roll a primitive
- Buttons, cards, badges, tables, modals, inputs, empty states, and loading
  spinners are imported from `src/components/ui/*` — never written inline.
- If a needed variant doesn't exist yet, add it to the shared component
  (with a new prop/variant), never as a one-off className on the page.

## Never use a raw Tailwind palette color in `src/app/**`
- Use the semantic tokens from `globals.css` (`bg-surface-raised`,
  `text-text-muted`, `border-border-subtle`, etc.), never `slate-800`,
  `blue-600`, etc. directly. If a needed shade doesn't exist as a token,
  add it to the `@theme` block in `globals.css` first — never invent a
  number (this is exactly how `slate-850` — which doesn't exist — ended up
  used 22 times with zero effect).

## Page files stay thin
- A `page.tsx` file over ~300 lines is a signal to extract subcomponents,
  not a normal outcome. Data-fetching, one visual section each, one
  concern each — mirror the extraction pattern used for
  `vehicles/[id]/page.tsx` in the Section 4 refactor.

## Every list has all three states, using the shared components
- Loading → `<Spinner />`. Empty → `<EmptyState />` with a title specific
  to what's missing (not a generic message). Populated → `<Table />` or a
  card grid built from `<Card />`. A list that only handles the populated
  case is incomplete, not done.

## Copy matches the audience
- This product is used by garage owners and mechanics, not aerospace
  operators. Avoid "cockpit," "telemetry," "command station," or similar
  metaphor language in new component names, page titles, or UI copy —
  plain, task-based naming only ("Tableau de bord," not "Executive
  Cockpit Dashboard").
