# Fix Package — Action / Service Adder

## 1. New skill: `.agents/skills/professional-form-ux/SKILL.md`

This is reusable for every form in the app (clients, vehicles, workers, parts), not just this
one — worth keeping even after the action form is fixed.

```markdown
---
name: professional-form-ux
description: Standards for building production-quality forms in the garage admin panel — layout, validation, feedback states, microcopy, and accessibility. Use whenever building or reworking any create/edit form (clients, vehicles, actions, parts, workers, invoices).
---

# Professional Form UX Standards

## Layout
- Group fields into clearly labeled sections with visual separation (cards or dividers),
  never one long undifferentiated column. For the Action form specifically: Vehicle &
  Details / People / Parts & Stock / Costs / Notes / Status are distinct sections.
- Use a consistent spacing scale (e.g. Tailwind's 4/6/8/12 steps) — no ad-hoc margins.
- Related inputs sit on the same row on desktop (e.g. date-in / date-out), stack on mobile.
- The primary action ("Save action") is always visible — sticky footer or sticky header on
  long forms, not scrolled out of view.
- Design for a tablet at a service bay, not just a desktop monitor — test the layout at
  ~768px width.

## Inputs that need to be smart, not just `<input>`
- Any field referencing another table (vehicle, worker, part) is a searchable
  autocomplete/combobox, never a raw ID field or a giant unsearchable `<select>` with
  hundreds of options.
- Multi-select fields (workers on an action) show selected items as removable chips/tags,
  not a multi-line native `<select multiple>`.
- Numeric fields (mileage, quantity, cost) use appropriate input types, sensible min/step
  values, and format currency/units consistently across the whole app.
- A field referencing live inventory (parts picker) shows the current stock quantity inline
  next to each option, and updates a running subtotal as items are added — the person should
  never have to leave the form to check if a part is in stock.

## Validation & feedback
- Validate inline, on blur or on change — never only on submit. Show the specific problem
  next to the specific field, in plain language ("Mileage can't be lower than the last
  recorded value (58,200 km)" — not "Invalid input").
- Disable the submit button while the form is invalid or a request is in flight; show a
  spinner in the button itself during submit, not just a full-page loader.
- On success: a toast confirming what happened in the same words as the button
  ("Action saved" for a button that said "Save action"). On failure: a toast that states
  what went wrong and what to do, never a raw error code or stack trace.
- If the user tries to navigate away with unsaved changes, warn them before losing the data.

## Business-rule surfacing (not just decoration)
- If a part's requested quantity exceeds current stock, show an inline warning at that line
  item (not a silent block) and require explicit manager confirmation to proceed, per the
  garage-domain-rules skill — this must be visible in the UI, not just enforced silently in
  the backend.
- Internal notes vs. client-visible notes are two visually distinct fields with a persistent
  label/icon (e.g. an eye-off icon on internal notes) so staff never confuse which one the
  client will see on the public QR page.
- The action's status (open / in progress / completed / invoiced) is shown as a clear
  stepper or badge, not buried as one option in a dropdown among many fields.
- A running total cost (parts + labor) is visible at all times while editing, updating live
  as parts or labor change.

## Empty and first-use states
- If the parts catalog or worker list is empty, the picker doesn't just show a blank
  dropdown — it says so and links to where to add one ("No parts yet — add one").
- Never show a broken-looking empty table or a dropdown with only a placeholder as the only
  option with no explanation.

## Accessibility & polish
- Every input has a real `<label>`, visible keyboard focus states, and a logical tab order.
- Respect reduced-motion preferences; keep transitions purposeful (state changes), not
  decorative.
- Use one consistent icon set (lucide-react) and one consistent button/input component
  system (shadcn/ui) across the whole form — no mixing native and styled inputs.

## Self-check before calling a form "done"
Before considering any form complete, verify against this list explicitly and report which
items were already fine vs. which you had to fix:
1. Can I search instead of scroll for vehicle/worker/part selection?
2. Do I see stock levels and running cost without leaving the form?
3. Does every validation error tell me exactly what to fix, at the field?
4. Can I tell internal notes from client-visible notes at a glance?
5. Does it work cleanly at tablet width?
6. Is the button state (idle/loading/disabled) always accurate?
```

## 2. The Fix Prompt

Paste this into Antigravity CLI. It has the agent audit itself first — that self-critique
step matters, since "rebuild it" without a checklist tends to produce a reshuffled version of
the same problems.

```
The Action/Service creation and edit form is unprofessional and needs a full rework. Follow
the garage-domain-rules and professional-form-ux skills for this — they are constraints, not
suggestions.

## Step 1 — Audit first
Before writing any code, open the current Action form and list concretely what's wrong
against the professional-form-ux skill's standards: layout/grouping, which fields are raw
inputs that should be searchable comboboxes, what validation is missing or only checked on
submit, whether stock levels and running cost are visible, whether internal vs
client-visible notes are distinguishable, whether status is a clear stepper, and how it
behaves at tablet width. Show me this audit before touching any code.

## Step 2 — Rebuild to this spec
Rebuild the Action form (both create and edit) with these sections, each visually distinct:

1. **Vehicle & Details** — searchable vehicle combobox (shows plate + owner name), action
   type select, date-in / date-out, mileage input that validates against the vehicle's last
   recorded mileage and warns (doesn't hard-block) if lower.

2. **People** — searchable multi-select for workers, each assigned worker shown as a
   removable chip with a lead/assist role toggle next to it.

3. **Parts & Stock** — searchable parts combobox showing current stock quantity inline per
   result; adding a part shows a quantity stepper, its unit price, and updates a running
   subtotal live. If requested quantity exceeds stock, show an inline warning on that line
   and require an explicit manager-confirm checkbox to proceed (per garage-domain-rules —
   this still triggers the atomic stock-deduction transaction and stock_movements log on
   save, just with the override flag noted).

4. **Costs** — labor cost field (manual, or computed from assigned worker hourly rate x
   hours if you want to offer both), with a persistent running total (parts + labor) visible
   at all times.

5. **Notes** — two visually distinct fields: "Internal notes" (staff-only, marked with a
   closed-eye icon) and "Notes visible to client" (marked clearly as public-facing, this is
   what renders on the /v/:token page).

6. **Status** — a stepper/badge component for open -> in_progress -> completed ->
   invoiced, not a plain dropdown.

Apply full inline validation, loading/disabled submit states, success/error toasts using the
same verb as the button, unsaved-changes warning on navigate-away, and empty states for the
worker/parts pickers if those tables are empty. Confirm responsive behavior at ~768px width.

## Step 3 — Confirm
After rebuilding, re-run the self-check list from the professional-form-ux skill explicitly
and confirm each item passes. Show me the before/after.
```
