# qrCar UI/UX Recovery — Design System & Refactor
## Corrective Build Package for the Build Agent

**Prepared for:** qrCar (Garage Management Platform)
**Document type:** Corrective spec — read this before touching any more UI code
**Trigger:** UI/UX audit of the current codebase found the platform has no design system, causing visible inconsistency and at least one confirmed rendering bug.

---

## 1. What's actually wrong (evidence, not opinion)

This isn't "make it prettier." It's a specific, structural problem: **there is no shared component library**, so every page reinvents its own buttons, cards, tables, and states from scratch. Verified directly against the codebase:

| Finding | Evidence |
|---|---|
| No design system | `src/components/` has **6 files** total (`AdminSidebar`, `AdminCockpitHeader`, `CommandPalette`, `FlippablePvcCard`, `LocaleSwitcher`, `Providers`) for **42 pages**. No `Button`, `Card`, `Table`, `Modal`, `Badge`, `Input`, `EmptyState`, or `Spinner` component exists anywhere. |
| Massive, unreusable page files | `vehicles/[id]/page.tsx` — **1,250 lines**. `actions/[id]/page.tsx` — **1,081**. `actions/new/page.tsx` — **1,013**. `cards/studio/page.tsx` — 676. `inventory/page.tsx` — 645. Nothing is small enough to be reused elsewhere, so nothing is. |
| Visual drift from copy-paste | **163 distinct `rounded-*` class combinations** across admin pages. The "primary blue button" alone exists in at least 5 subtly different variants (different padding, font size, shadow opacity) because it was hand-typed fresh on every page instead of imported once. |
| A live rendering bug caused by this | `bg-slate-850` / `border-slate-850` used **22 times**. That shade was never defined — not in `globals.css`, not in a Tailwind config (there isn't one; this project uses Tailwind v4's `@import "tailwindcss"` with no `@theme` override). Every element using it is silently missing its background or border right now. |
| Inconsistent feedback states | **4 different hand-rolled loading spinners.** Only **one** empty-state message exists in the entire codebase ("Aucune application trouvée") — meaning almost every other empty list either has no empty state or an ad-hoc one that doesn't match anything else. |
| Mismatched tone | Component/page names like `ExecutiveCockpitDashboard`, section headers like "Cockpit & Télémétrie" — a sci-fi/aviation metaphor applied to a tool a garage owner uses to log oil changes. Not the actual root cause of the mess, but a symptom of the same thing: the agent is improvising presentation instead of following a defined system. |

**Root cause:** the build agent is strong at backend logic (the developer-platform work proved that) and has zero instinct to build reusable UI primitives before building pages. It writes plausible Tailwind every time, and "plausible" drifts a little on every page. Multiply by 42 pages and you get exactly what you're looking at.

**The fix is not "redesign everything."** It's: build ~10 primitive components once, migrate the worst offenders to use them, and put a rule in place so every future page is *forced* to reuse them instead of improvising.

---

## 2. Design tokens (fixes the `slate-850` bug permanently)

The actual bug — inventing color shades that don't exist — is a symptom of referencing raw Tailwind palette numbers (`slate-800`, `slate-850`, `slate-900`...) instead of semantic names. Nobody can remember if a card border should be `slate-700` or `slate-800` on page 30 of 42; they guess, and sometimes the guess is a shade that was never defined. Fix it at the token level so a "guess" is structurally impossible.

Add to `globals.css`:

```css
@import "tailwindcss";

@theme {
  /* Surfaces */
  --color-surface-base: #020617;      /* app background — was: bg-slate-950 */
  --color-surface-raised: #0f172a;    /* cards, panels — was: bg-slate-900 */
  --color-surface-overlay: #1e293b;   /* modals, dropdowns — was: bg-slate-800 */
  --color-surface-hover: #1e293b;     /* hover state on raised surfaces */

  /* Borders */
  --color-border-subtle: #1e293b;     /* was: border-slate-800 */
  --color-border-default: #334155;    /* was: border-slate-700 */

  /* Text */
  --color-text-primary: #f8fafc;
  --color-text-secondary: #cbd5e1;
  --color-text-muted: #94a3b8;
  --color-text-disabled: #64748b;

  /* Brand / accent */
  --color-accent: #2563eb;
  --color-accent-hover: #3b82f6;

  /* Semantic status — used consistently for every status pill/badge in the app */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;
  --color-info: #0ea5e9;
}
```

This generates real utilities (`bg-surface-raised`, `border-border-subtle`, `text-text-muted`, etc.) that autocomplete correctly and **cannot silently fail** the way `slate-850` did, because they're either defined or the build errors — not a typo that quietly renders nothing.

---

## 3. The component library to build (once)

Ten components. Not a framework, not a library to publish — just enough shared primitives that no page ever hand-writes a button again. Location: `src/components/ui/`.

| Component | Replaces | Variants needed |
|---|---|---|
| `Button.tsx` | The 5+ hand-rolled blue button variants | `primary`, `secondary`, `danger`, `ghost` × `sm`/`md` sizes, `loading` state, `disabled` state |
| `Card.tsx` | Every `<div className="bg-slate-900 border border-slate-800 rounded-xl p-6">` | `default`, `interactive` (hover state for clickable cards) |
| `Badge.tsx` | Every hand-rolled status pill (order status, subscription status, app lifecycle status, invoice status — all currently styled separately) | `success`, `warning`, `danger`, `info`, `neutral` |
| `Table.tsx` | Every hand-rolled `<table>` in vehicles/actions/inventory/invoices/apps lists | Header, row, empty state, loading state built in |
| `Modal.tsx` | Any inline modal/dialog markup currently duplicated per page | `sm`/`md`/`lg` sizes, built-in close button and backdrop |
| `Input.tsx` / `Select.tsx` / `Textarea.tsx` | Every hand-styled form field | Label, error state, helper text built in — one visual style for every form in the app |
| `EmptyState.tsx` | The single existing empty-state message | Icon + title + description + optional CTA button, reused everywhere a list can be empty |
| `Spinner.tsx` | The 4 different `animate-spin` variants | One size prop, one visual style |
| `PageHeader.tsx` | The hand-rolled `<h1>` + breadcrumb + action-button row at the top of every page | Title, optional subtitle, optional breadcrumb, right-aligned action slot |
| `StatCard.tsx` | The dashboard's revenue/vehicles/parts stat tiles, currently one-off | Label, value, optional trend indicator, optional icon |

Each one uses the tokens from Section 2 — never a raw `slate-N` or `blue-N` class again inside `src/app/**`.

---

## 4. Refactor priority (worst offenders first)

Don't touch all 42 pages at once. Fix the five files that are both the largest and the most-used, in this order:

1. **`src/app/admin/vehicles/[id]/page.tsx`** (1,250 lines) — break into `VehicleHeader`, `VehicleSpecsCard`, `ServiceHistoryTable`, `VehicleDocumentsCard` sub-components, each using the new primitives. This one file alone is almost 2% of the entire `src/` tree.
2. **`src/app/admin/actions/[id]/page.tsx`** (1,081 lines) — same treatment: `ActionHeader`, `ActionPartsTable`, `ActionTimeline`, `ActionCostSummary`.
3. **`src/app/admin/actions/new/page.tsx`** (1,013 lines) — this is a *form*. A 1,000-line form is almost always missing field-level components; break into `VehicleSelectStep`, `ServiceDetailsStep`, `PartsSelectionStep` using `Input`/`Select` from Section 3.
4. **`src/app/admin/inventory/page.tsx`** (645 lines) and **`src/app/admin/vehicles/page.tsx`** (596 lines) — both are list pages; both should shrink dramatically once they use `Table`, `EmptyState`, and `PageHeader` instead of hand-rolling all three.
5. **The dashboard** (`src/app/admin/page.tsx`) — replace every stat tile with `StatCard`, drop the `ExecutiveCockpitDashboard` naming, rename to something a garage owner actually thinks of their day in — "Tableau de bord" is already what the sidebar calls it; the component name and copy should match.

Every other page gets migrated opportunistically after this — the point of Section 5 is that new pages literally can't be written the old way anymore, so the remaining 35 pages stop getting worse even before they're individually refactored.

---

## 5. The guardrail (so this doesn't come back)

Add a fifth^H^H sixth skill file, same pattern as `developer-platform-rules`:

**`.agents/skills/ui-design-system-rules/SKILL.md`**

```markdown
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
```

---

## 6. Master Prompt — paste this into the build agent

```
Read .agents/skills/ui-design-system-rules/SKILL.md before doing any of this.

We're fixing a UI consistency problem, not redesigning the product. Do this
in order and stop after each numbered step for review:

STEP 1 — Design tokens
Add the @theme block from Section 2 of qrcar-ui-ux-recovery-spec.md to
src/app/globals.css. Then find and fix every use of bg-slate-850 and
border-slate-850 across the codebase (22 occurrences) — replace with the
correct semantic token (bg-surface-overlay / border-border-default,
whichever matches the visual intent at each call site).

STEP 2 — Component library
Build the 10 components listed in Section 3, in src/components/ui/, using
the new semantic tokens exclusively. Each needs the variants listed in the
table. Do not touch any page yet.

STEP 3 — Refactor the five files listed in Section 4, in that order, one at
a time. For each: extract the sub-components named in that section, replace
every hand-rolled button/card/table/badge/spinner/empty-state with the
Section 3 components, confirm the page still works, then move to the next
file.

STEP 4 — Confirm ui-design-system-rules/SKILL.md is saved to
.agents/skills/ so every future page-generation task in this project
follows it automatically.

Stop after Step 1 and show me the diff before continuing.
```

---

## 7. What I'm not proposing

Not a visual redesign, not a new color palette or brand identity, not a rewrite. The current dark theme, the sidebar grouping, the overall information architecture are all fine — a garage owner can navigate this today. What's broken is *consistency*, and consistency is a component-library problem, not a taste problem. Fix Section 2 and 3 once, and the platform stops visibly fighting itself on every page — that's most of the distance to feeling "Shopify-level," because Shopify's actual UI is not visually daring, it's just *relentlessly consistent*.
