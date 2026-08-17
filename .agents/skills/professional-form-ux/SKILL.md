---
name: professional-form-ux
description: Standards for building production-quality forms in the garage admin panel — layout, validation, feedback states, microcopy, and accessibility. Use whenever building or reworking any create/edit form (clients, vehicles, actions, parts, workers, invoices).
---

# Professional Form UX Standards

## Layout
- Group fields into clearly labeled sections with visual separation (cards or dividers), never one long undifferentiated column. For the Action form specifically: Vehicle & Details / People / Parts & Stock / Costs / Notes / Status are distinct sections.
- Use a consistent spacing scale (e.g. Tailwind's 4/6/8/12 steps) — no ad-hoc margins.
- Related inputs sit on the same row on desktop (e.g. date-in / date-out), stack on mobile.
- The primary action ("Save action") is always visible — sticky footer or sticky header on long forms, not scrolled out of view.
- Design for a tablet at a service bay, not just a desktop monitor — test the layout at ~768px width.

## Inputs that need to be smart, not just `<input>`
- Any field referencing another table (vehicle, worker, part) is a searchable autocomplete/combobox, never a raw ID field or a giant unsearchable `<select>` with hundreds of options.
- Multi-select fields (workers on an action) show selected items as removable chips/tags, not a multi-line native `<select multiple>`.
- Numeric fields (mileage, quantity, cost) use appropriate input types, sensible min/step values, and format currency/units consistently across the whole app.
- A field referencing live inventory (parts picker) shows the current stock quantity inline next to each option, and updates a running subtotal as items are added — the person should never have to leave the form to check if a part is in stock.

## Validation & feedback
- Validate inline, on blur or on change — never only on submit. Show the specific problem next to the specific field, in plain language ("Mileage can't be lower than the last recorded value (58,200 km)" — not "Invalid input").
- Disable the submit button while the form is invalid or a request is in flight; show a spinner in the button itself during submit, not just a full-page loader.
- On success: a toast confirming what happened in the same words as the button ("Action saved" for a button that said "Save action"). On failure: a toast that states what went wrong and what to do, never a raw error code or stack trace.
- If the user tries to navigate away with unsaved changes, warn them before losing the data.

## Business-rule surfacing (not just decoration)
- If a part's requested quantity exceeds current stock, show an inline warning at that line item (not a silent block) and require explicit manager confirmation to proceed, per the garage-domain-rules skill — this must be visible in the UI, not just enforced silently in the backend.
- Internal notes vs. client-visible notes are two visually distinct fields with a persistent label/icon (e.g. an eye-off icon on internal notes) so staff never confuse which one the client will see on the public QR page.
- The action's status (open / in progress / completed / invoiced) is shown as a clear stepper or badge, not buried as one option in a dropdown among many fields.
- A running total cost (parts + labor) is visible at all times while editing, updating live as parts or labor change.

## Empty and first-use states
- If the parts catalog or worker list is empty, the picker doesn't just show a blank dropdown — it says so and links to where to add one ("No parts yet — add one").
- Never show a broken-looking empty table or a dropdown with only a placeholder as the only option with no explanation.

## Accessibility & polish
- Every input has a real `<label>`, visible keyboard focus states, and a logical tab order.
- Respect reduced-motion preferences; keep transitions purposeful (state changes), not decorative.
- Use one consistent icon set (lucide-react) and one consistent button/input component system (shadcn/ui) across the whole form — no mixing native and styled inputs.

## Self-check before calling a form "done"
Before considering any form complete, verify against this list explicitly and report which items were already fine vs. which you had to fix:
1. Can I search instead of scroll for vehicle/worker/part selection?
2. Do I see stock levels and running cost without leaving the form?
3. Does every validation error tell me exactly what to fix, at the field?
4. Can I tell internal notes from client-visible notes at a glance?
5. Does it work cleanly at tablet width?
6. Is the button state (idle/loading/disabled) always accurate?
