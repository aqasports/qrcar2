# Fix Package: Restore Lost Functionality & Close Bugs from the UI Refactor

Read this fully before touching code. This is a **fix pass on the refactor you just did**, not new work — the design system and page decomposition are good and should stay as-is. Four issues need fixing, in this priority order. Stop after each numbered step and show the diff before continuing.

---

## STEP 1 (CRITICAL — do this first) — Restore the specialty telemetry & quality checkpoint system in `actions/new`

During the refactor, `src/app/admin/actions/new/page.tsx` went from 1,013 lines to 273 lines. Most of that reduction is legitimate (moved into `src/components/actions/steps/*`). But real, working functionality was silently dropped, not just relocated — I verified with `grep -rn "checkpointStatus|telemetry" src/` that these no longer exist anywhere in the codebase except a stray comment and the unused `checkpoints` field still sitting in `INTERVENTION_TEMPLATES`.

**What's missing and must be rebuilt inside `src/components/actions/steps/ServiceDetailsStep.tsx` (or a new `TelemetryStep.tsx` if that's cleaner):**

1. **A `telemetry` state object** (was in the old page, now needs to live in `src/app/admin/actions/new/page.tsx` and be passed down) with these fields, populated conditionally by which specialty chip is active:
   - `oil_service`: `oilGrade` (select: "5W-30 C3 / RN0720", "5W-40 A3/B4", "0W-20 / 0W-30 Eco", "10W-40 Semi-synthèse"), `oilCapacityLiters` (text), `serviceResetDone` (boolean toggle button — "Réinitialisation Effectuée [OK]" / "En attente de RAZ")
   - `injection_diesel`: `railPressureBars`, `injector1Correction`, `injector2Correction`, `injector3Correction`, `injector4Correction` (5 text/mono inputs)
   - `brakes_chassis`: `frontPadsMm`, `rearPadsMm`, `frontDiscsMm`, `rearDiscsMm`, `brakeFluidBoilingTemp` (5 text/mono inputs)
   - `exhaust_emissions`: `sootLoadGrams`, `diffPressureMbar`, `adbluePouredLiters` (3 text/mono inputs)
   - Each panel renders conditionally: `{activeSpecialtyId === 'oil_service' && (...)}` etc., same pattern as the specialty chip selector that's already there.

2. **The quality checkpoint checklist**, driven by `activeTemplateObj.checkpoints` (already exists in `INTERVENTION_TEMPLATES`, just unused): for each checkpoint, render its `category` and `label`, plus three buttons (`OK` / `Vigilance` / `Remplacé`) that set `checkpointStatus[cp.id]` to `'ok' | 'warn' | 'fail'`, defaulting to `'ok'`. Use the `Badge`/`Button` primitives for the three-state toggle instead of hand-rolled buttons this time.

3. **Wire both back into `handleSubmitAction`** in `page.tsx` so `telemetry` and `checkpointStatus` are actually sent in the POST body to whatever the actions-create endpoint expects — check `src/app/api/actions/route.ts` (or wherever the POST handler lives) to confirm it still accepts these fields; if the API was also trimmed, restore that side too.

Use the existing `Input`/`Select`/`Button`/`Badge` components for all of this — don't reintroduce raw `<input>`/`<select>` markup. The goal is the old functionality with the new design system, not a reversion to the old markup.

---

## STEP 2 — Fix the dangling delete-vehicle button

`src/components/vehicles/VehicleHeader.tsx` has an `onDeleteVehicle` prop wired in `vehicles/[id]/page.tsx` to:

```ts
const res = await fetch(`/api/vehicles/${vehicleId}`, { method: 'DELETE' });
```

`src/app/api/vehicles/[id]/route.ts` only exports `GET` and `PATCH` — there is no `DELETE` handler. Right now this button does nothing and shows no error when clicked, after the user already confirmed a "this is irreversible" dialog.

Pick one:
- **(a) Implement it properly**: add `export async function DELETE(...)` to that route, scoped to `organization_id` like every other handler in the file, restricted to `owner`/`super_admin` (matches the role check already in `VehicleHeader`), and decide what should actually happen — hard delete, or soft-delete/archive given this vehicle likely has linked `actions`, `invoices`, and a PVC `card` (hard-deleting a vehicle with service history is probably wrong; consider a `status = 'archived'` column instead of a real `DELETE FROM vehicles`).
- **(b) Remove the button** if vehicle deletion wasn't actually a requested feature and this was scope creep during the refactor.

Don't leave it as a silently-broken button either way.

---

## STEP 3 — Fix the `any` types introduced in the new subcomponents

Run `npx eslint src/components/vehicles src/components/actions` and fix every `@typescript-eslint/no-explicit-any` it reports (currently ~15 instances across `ActionCostSummary.tsx`, `ActionDetailsCard.tsx`, `ActionHeader.tsx`, `ServiceDetailsStep.tsx`, `VehicleOwnerCard.tsx`, `VehiclePvcCard.tsx`, `VehicleSpecsCard.tsx`). Each of these components has a real shape backing it (the `vehicle`/`action` object from the parent page) — define a proper prop interface instead of `any`, reusing the interface already declared in the parent `page.tsx` where possible instead of redefining a slightly different one.

---

## STEP 4 — Finish the token migration

13 files under `src/app` still reference raw `slate-N` classes instead of the semantic tokens (`bg-surface-raised`, `text-text-muted`, `border-border-subtle`, etc.). Find them with:

```bash
grep -rl "slate-[0-9]" src/app --include="*.tsx"
```

Migrate each to the semantic tokens, same as the other ~38 pages already done. Also fix `src/app/admin/SignOutButton.tsx` specifically — it's half-migrated (`bg-surface-overlay` but still `hover:bg-slate-800` and `border-slate-800` on the same element) and has a stray BOM character (`﻿`) at the very start of the file from whatever tool last saved it — strip that too.

---

After all four steps: run `npx tsc --noEmit` and `npx eslint src/` and confirm both are clean (aside from the pre-existing `setState`-in-`useEffect` warnings that predate this refactor entirely — those are out of scope here). Show me the final diff summary before considering this done.
