# Technical & Functional Audit
## Garage Management Platform (GMP) — QR-Traced Vehicle Service History System

**Prepared for:** Mechanical Garage Digitalization Project
**Document type:** Pre-development audit & specification
**Version:** 1.0

---

## 1. Executive Summary

The garage needs a system that replaces paper service books with a **PVC card + QR code** identity for each vehicle. Scanning the card lets a client see the vehicle's full service history and download/print invoices. Internally, staff need a back-office to manage clients, vehicles, cards, service actions, workers, and inventory (parts/products like oil, filters, etc.), with stock automatically consumed as it's used in repairs.

This audit defines the full scope, data model, business rules, architecture, security, and delivery plan needed before writing a single line of code, so nothing gets rebuilt halfway through.

---

## 2. Objectives

| # | Objective |
|---|---|
| 1 | Give every vehicle a permanent digital identity via a physical PVC card with QR code |
| 2 | Let clients scan and instantly see complete repair/service history, with invoice PDF export |
| 3 | Let staff log every action (repair, maintenance, inspection) against a vehicle, with the operator (worker) recorded |
| 4 | Track parts/products (oil, filters, brake pads, etc.) with stock levels, and auto-deduct stock when used in an action |
| 5 | Manage workers/technicians and their workload/performance |
| 6 | Generate accurate invoices automatically from labor + parts used |
| 7 | Give management dashboards/reports (revenue, stock alerts, worker activity) |
| 8 | Keep the public-facing QR view read-only, fast, and free of sensitive personal data |

---

## 3. Actors & Roles

| Role | Access | Typical tasks |
|---|---|---|
| **Super Admin / Owner** | Full access | Everything below + user management, reports, settings |
| **Manager / Front Desk** | Admin panel, no system settings | Register clients, link cards, create vehicles, open actions, manage stock, print invoices |
| **Technician / Worker** | Limited — only "my assigned actions" | View assigned jobs, mark parts used, mark action complete, add notes |
| **Client (public, no login)** | Read-only, via QR scan only | View vehicle history, view/print/download invoices |

> Recommendation: technicians shouldn't get a full admin login — a simplified mobile-friendly "worker view" (or even a shared tablet at each bay) reduces training friction and avoids credential sharing.

---

## 4. Functional Modules

### 4.1 Client Management
- Create/edit/deactivate client: full name, phone (primary key for lookup), email (optional), address, ID/NIF if needed for invoicing, notes.
- Search by name/phone.
- A client can own **multiple vehicles**.
- Client detail page shows all linked vehicles and a combined history.
- Duplicate detection on phone number when creating a new client.

### 4.2 Vehicle Management
- Add vehicle: plate number (unique), make, model, year, VIN/chassis number, color, engine type, mileage at intake.
- Vehicle belongs to exactly one client at a time (ownership transfer supported — keep history intact, just relink `client_id`, log the transfer).
- Vehicle detail page = the same content the client sees when they scan the QR (internally, admins see it with extra edit controls and full client PII; publicly, the client sees a stripped-down version — see 4.8).
- Mileage history tracked per action (so you can chart mileage over time and flag inconsistencies, e.g., odometer rollback).

### 4.3 PVC Card & QR Code System
This is the core "trick" of the platform — cards are **pre-printed in batches before being assigned**, so the workflow is a two-step process:

**Step A — Batch generation (before printing):**
1. Admin requests a batch of N cards.
2. System generates N unique, non-sequential, non-guessable tokens (UUID v4 or signed random string), each becomes a QR code encoding a URL like:
   `https://garage-domain.com/v/{token}`
3. System outputs a print-ready sheet/PDF (QR images + optional serial number printed in small text for manual reference) sent to the PVC printer/vendor.
4. Each card row is stored with status = `unassigned`.

**Step B — Linking (at client intake, once card is physically in hand):**
1. Admin scans (or types) the card's token/serial.
2. Admin links it to a specific **vehicle** (recommended — see rationale below).
3. Card status becomes `active`, linked to `vehicle_id`.
4. If a card is lost/damaged: admin can `revoke` the old card (token immediately stops resolving/shows "card revoked, contact garage") and link a new pre-printed card to the same vehicle — history is untouched since history is attached to the vehicle, not the card.

**Design decision — link cards to Vehicle, not Client:**
A client can have several cars; each car needs its own service history and its own physical card kept in the glovebox. Linking to the vehicle (which itself belongs to a client) keeps this natural. This is called out explicitly because it changes the schema — flagged in section 5.

- Card statuses: `unassigned`, `active`, `revoked`, `lost`.
- Full audit trail of link/relink/revoke actions (who did it, when).

### 4.4 Service Actions (Repairs / Maintenance / Inspections)
The heart of the traceability requirement.

Each **Action** records:
- Vehicle it applies to
- Type (repair, scheduled maintenance, inspection, bodywork, diagnostic, other — configurable list)
- Date/time in, date/time out
- Mileage at time of service
- Free-text description / diagnosis / work performed
- **Worker(s) who operated** — supports multiple workers on one job (e.g., mechanic + electrician), each can have a role on that action (lead / assist)
- Parts/products used (linked from inventory, with quantity, and price captured **at time of use** so later price changes don't retroactively alter old invoices)
- Labor cost (manual entry or computed from a labor-rate table × hours)
- Status: `open` (vehicle in shop) → `in progress` → `completed` → `invoiced`
- Internal notes vs. client-visible notes (some diagnostic notes may be too technical/sensitive to expose publicly — separate field, see 4.8)
- Attachments: photos of damage/before-after (optional, nice-to-have)

An action is what the client actually sees when they scan the QR — the chronological list of everything ever done to their vehicle.

### 4.5 Worker Management
- Add/edit worker: name, phone, role/specialty (mechanic, electrician, painter, apprentice…), hire date, active/inactive.
- Each worker has a history of actions performed (for performance tracking / accountability — "who touched this car" is explicitly required).
- Optional: hourly rate per worker, used to compute labor cost automatically.
- Optional login for workers (see roles table, 4.4).

### 4.6 Parts & Products / Inventory (Store)
- Product/part catalog: name, category (oil, filter, brake part, tire, consumable, tool…), SKU/reference, unit (liter, piece, kg…), purchase price, sale price, current stock quantity, minimum stock threshold, supplier (optional).
- **Stock movements** ledger: every `IN` (purchase/restock) and `OUT` (used in an action, or manual adjustment/write-off) is logged with quantity, date, reference, and reason.
- **Automatic deduction**: when a part is added to an Action, stock is decremented by that quantity the moment the action is saved/completed; if stock is insufficient, the UI warns (soft-block, manager can override for backorder cases).
- Low-stock alerts (dashboard badge + optional email) when quantity ≤ threshold.
- Manual stock adjustment (inventory count corrections) with mandatory reason field, fully logged.
- Optional supplier management (name, contact) if purchase-order tracking is wanted later.

### 4.7 Invoicing
- Auto-generated from an Action once marked `completed`: line items = each part used (qty × unit price at time of use) + labor line(s).
- Configurable tax rate (VAT), invoice numbering sequence (sequential, per year e.g. `2026-000123`), garage header/logo/legal info.
- Invoice states: `draft`, `issued`, `paid`, `cancelled`.
- PDF generation, downloadable both from admin panel and from the public QR view for that specific action.
- Optional: partial payments / payment method logging if the garage wants that level of detail (flagged as an open question in section 16).

### 4.8 Public Client Portal (the QR scan destination)
URL pattern: `/v/{token}` — no login required, token itself is the "key."

**Shown to the client:**
- Vehicle summary (make, model, plate, year) — **no client personal data** (no phone/address of the owner shown publicly, to avoid exposing PII to whoever finds/scans a lost card)
- Chronological service history: date, type of action, description (client-visible version), parts used, mileage at time
- "Print / Download Invoice" button per completed action
- Garage contact info / branding

**Not shown publicly:** internal technician notes, cost/margin breakdown, client contact details, other vehicles owned by the same client.

**Not editable** from this view under any circumstance — strictly read-only.

### 4.9 Admin Dashboard & Reporting
- KPIs: vehicles currently in shop, actions this week/month, revenue this month, top parts consumed, low-stock alerts, worker activity leaderboard.
- Filterable action list (by date range, worker, vehicle, status).
- Export to CSV/Excel for accounting.
- Full audit log viewer (who created/edited/deleted what, and when) — important given multiple staff will have write access.

---

## 5. Data Model

### 5.1 Entity list

| Entity | Purpose |
|---|---|
| `clients` | Vehicle owners |
| `vehicles` | Cars/motorcycles tracked |
| `pvc_cards` | Pre-printed card inventory + QR tokens |
| `actions` | Service/repair events |
| `action_workers` | Junction: which worker(s) did which action |
| `action_parts` | Junction: which parts were used in which action, qty + price snapshot |
| `workers` | Staff/technicians |
| `parts` | Inventory catalog (products, oils, filters…) |
| `stock_movements` | Ledger of every stock in/out |
| `suppliers` | (optional) part suppliers |
| `invoices` | Generated invoices per action |
| `users` | Admin/staff login accounts (separate from `workers` — a worker *may* have a `user` account) |
| `audit_logs` | Who did what, when, across the system |

### 5.2 Key tables (simplified schema)

```
clients
  id (PK)
  full_name
  phone            (unique, indexed)
  email
  address
  notes
  created_at, updated_at

vehicles
  id (PK)
  client_id (FK -> clients)
  plate_number     (unique, indexed)
  make, model, year
  vin
  color
  current_mileage
  created_at, updated_at

pvc_cards
  id (PK)
  token            (unique, indexed, random/UUID — this is what's in the QR)
  serial_label     (human-readable, printed small on the card)
  status           (unassigned | active | revoked | lost)
  vehicle_id (FK -> vehicles, nullable until linked)
  linked_at
  revoked_at
  created_at

workers
  id (PK)
  full_name
  phone
  role/specialty
  hourly_rate      (nullable)
  active (bool)
  user_id (FK -> users, nullable)

actions
  id (PK)
  vehicle_id (FK -> vehicles)
  type             (repair | maintenance | inspection | other)
  description
  client_visible_notes
  internal_notes
  mileage_at_service
  status           (open | in_progress | completed | invoiced)
  date_in, date_out
  labor_cost
  created_by (FK -> users)
  created_at, updated_at

action_workers
  action_id (FK)
  worker_id (FK)
  role_on_job      (lead | assist)

action_parts
  action_id (FK)
  part_id (FK)
  quantity
  unit_price_snapshot   -- price at time of use, protects historical invoices
  created_at

parts
  id (PK)
  name
  category
  sku
  unit             (piece | liter | kg | ...)
  purchase_price
  sale_price
  quantity_in_stock
  min_stock_threshold
  supplier_id (FK, nullable)
  active (bool)

stock_movements
  id (PK)
  part_id (FK)
  type             (in | out | adjustment)
  quantity
  reference_action_id (FK, nullable)
  reason
  created_by (FK -> users)
  created_at

invoices
  id (PK)
  action_id (FK -> actions)
  invoice_number   (unique, sequential per year)
  subtotal, tax_amount, total
  status           (draft | issued | paid | cancelled)
  pdf_path
  created_at

users
  id (PK)
  username, password_hash
  role             (super_admin | manager | technician)
  active (bool)

audit_logs
  id (PK)
  user_id (FK)
  entity_type, entity_id
  action           (create | update | delete | link | revoke)
  metadata (json)
  created_at
```

### 5.3 Relationships at a glance
- `clients (1) → (N) vehicles`
- `vehicles (1) → (0..1 active) pvc_cards` (history of old revoked cards kept)
- `vehicles (1) → (N) actions`
- `actions (N) ↔ (N) workers` via `action_workers`
- `actions (N) ↔ (N) parts` via `action_parts`
- `actions (1) → (0..1) invoices`
- `parts (1) → (N) stock_movements`

---

## 6. QR Code Workflow — step by step

1. **Batch print request** → system generates tokens → PDF of QR codes exported → sent to PVC printing vendor → physical cards arrive, status `unassigned`.
2. **Client/vehicle intake** at the garage → staff creates client (if new) → creates vehicle → scans a blank card with a webcam/phone or enters its serial manually → system links `pvc_cards.vehicle_id` → card handed to client, status `active`.
3. **Client scans card anytime** (their phone camera) → resolves `garage-domain.com/v/{token}` → public page loads vehicle + history, read-only, with invoice download buttons.
4. **Card lost** → client calls garage → staff finds the card row by vehicle → sets status `revoked` → link a fresh pre-printed card to the same vehicle → old token now shows "this card has been deactivated, please contact the garage."

---

## 7. Key Business Rules

- **Stock deduction is atomic with action save**: when parts are attached to an action and the action is saved, `parts.quantity_in_stock` decreases and a `stock_movements` row (`type = out`) is created in the same transaction. If this fails, the whole save fails (no silent stock drift).
- **Price snapshotting**: `action_parts.unit_price_snapshot` is captured at the moment of use — changing a part's `sale_price` later never changes historical invoices.
- **Invoice numbers are immutable and sequential** — required for accounting/tax compliance in most jurisdictions.
- **Vehicle ownership transfer** keeps `vehicles.id` stable and simply updates `client_id`, with an audit log entry — history must never be lost when a car is resold.
- **Card revocation never deletes history** — history lives on the vehicle, not the card. Revoking/replacing a card is purely an identity-token operation.
- **Public endpoint is strictly read-only** and rate-limited (protects against token brute-forcing and scraping).

---

## 8. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Security** | Non-sequential/unguessable QR tokens (UUIDv4 or HMAC-signed); RBAC on admin routes; password hashing (bcrypt/argon2); HTTPS everywhere; rate-limiting on public `/v/{token}` route; audit logging of all writes |
| **Privacy** | Public view never exposes client phone/address/email or other vehicles owned by the same client |
| **Performance** | Public QR page should load in <1s on mobile data; paginate long service histories |
| **Localization** | Recommend French + Arabic (+ English) UI given local market; invoice templates should support bilingual layout if needed |
| **Availability/Backup** | Daily automated DB backups; stock and invoice data are business-critical — no data loss tolerance |
| **Scalability** | Should comfortably handle a single garage's volume (thousands of vehicles, tens of thousands of actions) on modest hosting; architecture shouldn't block adding more garage branches later (add a `branch_id`/`location_id` now even if unused, to avoid a painful migration) |
| **Auditability** | Every create/update/delete on clients, vehicles, actions, stock, and cards is logged with actor + timestamp |

---

## 9. Suggested Architecture & Tech Stack

| Layer | Recommendation | Notes |
|---|---|---|
| Frontend (admin) | React (Next.js) or Vue 3 | SPA/dashboard feel, component-driven |
| Frontend (public QR view) | Server-rendered page (Next.js SSR or plain server template) | Needs to be fast, SEO-irrelevant, works great even on old phone browsers |
| Backend/API | Node.js (NestJS/Express) or PHP (Laravel) | Laravel is a strong fit if the team already knows PHP — great ORM, built-in auth, PDF/queue tooling |
| Database | PostgreSQL | Strong relational integrity for the FK-heavy schema above |
| QR generation | `qrcode` (Node) or equivalent | Batch-generate to PDF for print vendor |
| PDF invoices | `wkhtmltopdf` / Puppeteer (Node) or `dompdf`/`snappy` (Laravel) | Render an HTML invoice template to PDF |
| Auth | JWT (API) or Laravel session/Sanctum | RBAC middleware per role |
| File/image storage | Local disk (small scale) or S3-compatible bucket | For action photos, invoice PDFs |
| Hosting | VPS (DigitalOcean/OVH — good for Algeria-based latency) or any cloud | Modest specs are enough for single-garage scale |

> This is a recommendation, not a hard requirement — the schema and functional spec above are stack-agnostic and will work with either Node or Laravel stacks.

---

## 10. Core API Endpoints (illustrative)

```
Auth
POST   /api/auth/login

Clients
GET    /api/clients
POST   /api/clients
GET    /api/clients/:id
PATCH  /api/clients/:id

Vehicles
POST   /api/vehicles
GET    /api/vehicles/:id
PATCH  /api/vehicles/:id
POST   /api/vehicles/:id/transfer-owner

PVC Cards
POST   /api/cards/batch              (generate N new unassigned cards)
POST   /api/cards/:token/link        (link to vehicle_id)
POST   /api/cards/:token/revoke
GET    /api/cards?status=unassigned

Actions
POST   /api/actions
GET    /api/actions/:id
PATCH  /api/actions/:id
POST   /api/actions/:id/parts        (attach a part + qty -> triggers stock deduction)
POST   /api/actions/:id/workers      (assign worker(s))
POST   /api/actions/:id/complete

Parts / Inventory
GET    /api/parts
POST   /api/parts
PATCH  /api/parts/:id
POST   /api/parts/:id/adjust-stock

Workers
GET/POST/PATCH /api/workers

Invoices
POST   /api/invoices/generate/:actionId
GET    /api/invoices/:id/pdf

Public (no auth)
GET    /v/:token                     -> read-only vehicle + history page
GET    /v/:token/invoice/:actionId/pdf
```

---

## 11. Security & Access Control Summary

- Role-based middleware: `super_admin` > `manager` > `technician`, each admin route declares minimum required role.
- Technicians restricted to actions they're assigned to (can't browse all clients' data).
- All public routes are **read-only**, no write operations exposed, and separated at the routing layer from the authenticated admin API (different rate limits, different exposure).
- QR tokens: random 128-bit minimum, never derived from sequential IDs.
- Sensitive PII (client phone/address) never serialized into the public API response — enforced at the serializer/DTO level, not just hidden in the UI.

---

## 12. Screen Inventory (for design/wireframing phase)

**Admin panel:**
1. Login
2. Dashboard (KPIs)
3. Clients list / Client detail (+ vehicles)
4. Vehicle detail (history, card status)
5. Card batch generator / card list
6. Action creation/edit form (workers + parts picker)
7. Workers list / Worker detail
8. Parts/inventory list / Part detail / Stock movement log
9. Invoices list / Invoice detail
10. Reports
11. Audit log viewer
12. Settings (tax rate, invoice numbering, users)

**Public (QR):**
1. Vehicle history page
2. Invoice PDF view/download

---

## 13. Suggested Delivery Roadmap

| Phase | Scope | Outcome |
|---|---|---|
| **Phase 1 — Foundations** | DB schema, auth, RBAC, clients, vehicles CRUD | Staff can register clients & vehicles |
| **Phase 2 — Card/QR system** | Batch generation, linking, revocation, public read-only page | Cards physically usable end-to-end |
| **Phase 3 — Actions & Workers** | Action CRUD, worker assignment, client-visible vs internal notes | Full traceability of "who did what" |
| **Phase 4 — Inventory & Stock** | Parts catalog, stock movements, auto-deduction, low-stock alerts | Parts usage tied to actions, stock accurate |
| **Phase 5 — Invoicing** | Auto invoice generation, PDF export, numbering | Client can print invoice from QR page |
| **Phase 6 — Dashboard & Reports** | KPIs, exports, audit log viewer | Management visibility |
| **Phase 7 — Polish & Hardening** | Rate limiting, backups, localization, UAT with real staff | Production-ready |

---

## 14. Testing Strategy

- Unit tests on business rules: stock deduction math, invoice totals, price snapshotting.
- Integration tests on the card link/revoke lifecycle (this is the trickiest state machine in the system).
- Security testing: attempt to enumerate/guess QR tokens, attempt to access another technician's actions, attempt to write via the public route.
- UAT with actual front-desk staff and a technician before go-live — this system replaces a paper process, so real-world usability testing matters more than typical software.

---

## 15. Open Questions to Confirm Before Build

1. Should clients be able to make an account (to see *all* their vehicles at once), or is per-vehicle QR access sufficient? (Spec above assumes the latter, simpler.)
2. Is partial/multi-payment tracking needed on invoices, or is "paid/unpaid" enough?
3. Should there be SMS/WhatsApp notification when a vehicle is ready ("action completed")?
4. Single garage or multi-branch from day one? (Schema above leaves room for it via an optional `location_id`.)
5. Do technicians need their own login, or is a shared front-desk terminal sufficient for logging their work?
6. Any legal/tax invoice numbering requirements specific to your jurisdiction that must be respected?

---

## 16. Summary

This audit defines a complete, coherent system: **pre-printed PVC cards → linked to vehicles → QR-driven public history & invoices**, backed by an admin panel covering clients, vehicles, actions (with worker attribution), inventory with automatic stock consumption, and invoicing — all wrapped in role-based access control and a full audit trail.

The schema in section 5 and business rules in section 7 are the two sections to lock down first — everything else (UI, exact tech stack) can flex, but the data model and the card/action/stock relationships are the backbone of the whole platform.

---

*Next step: once this spec is validated, I can scaffold the actual database schema, API, and admin UI — happy to start with Phase 1 whenever you're ready.*
