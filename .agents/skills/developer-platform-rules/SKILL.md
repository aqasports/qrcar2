---
name: developer-platform-rules
description: Rules for the public API, OAuth apps, webhooks, and App Store. Use whenever touching api_keys, apps, app_installs, webhook_subscriptions, webhook_deliveries, or api_request_log, or building ANY endpoint under /api/public/*.
---

# Developer Platform Rules

## 1. Identity Resolution & Data Path Invariant
- Public API requests authenticate via API key or OAuth bearer token through `resolveApiKey(bearerToken)`, NEVER NextAuth `getServerSession` or session cookies.
- The resolved `organization_id` MUST feed directly into the exact same `withOrgScope(orgId)` / Postgres RLS data path that session auth uses.
- Two distinct entry/auth points, but ONE shared, RLS-guaranteed data-access engine.
- Never log, display, or store raw API secret keys. Store only bcrypt hashes (`hashedSecret`) and non-sensitive UI prefixes (e.g. `qrc_live_...`).

## 2. Dynamic Scope Validation
- Scopes are evaluated per request on live execution -- never cached in claims or long-lived tokens.
- Every public endpoint strictly declares its required scope (e.g., `read_vehicles`, `write_actions`, `manage_webhooks`).
- Sensitive PII scope `read_clients` (client full name, phone number, physical address, notes) is strictly isolated and NEVER bundled into generic read scopes.
- Install consent screens must explicitly render prominent warnings when an application requests `read_clients`.

## 3. App Lifecycle & Review Gates
- Public apps MUST traverse the non-negotiable lifecycle: `draft -> submitted -> approved | rejected -> published -> suspended`.
- Only `platform_admin` holds authority to transition public apps to `approved`, `published`, or `suspended`.
- Private custom apps (`visibility = 'private'`) bypass the review queue but are permanently locked to their creator's `owner_organization_id` -- never listed in the App Store, never installable by external tenants.
- Suspending an app immediately terminates all active API key authentications and pauses all attached webhook subscriptions in real time.

## 4. Outbound Webhook Protocol
- Every outbound webhook request MUST be cryptographically signed using HMAC-SHA256: `HMAC-SHA256(rawBody, subscription.signingSecret)`.
- Deliver payloads with `X-QrCar-Topic`, `X-QrCar-Event-Id` (unique idempotency UUID), and `X-QrCar-Signature`.
- Webhooks must be delivered with at-least-once semantics, exponential backoff (immediate, 1m, 5m, 30m, 2h, 12h), and status tracking (`pending`, `delivered`, `failed`, `exhausted`).
- Never retry infinitely against dead/failing endpoints.

## 5. Durable Rate Limiting
- Rate limiting for public API consumers is enforced against `apiKeyId` using durable PostgreSQL sliding-window tracking -- never volatile in-memory Maps that reset on serverless cold starts.
- Rate limit tiers correlate with subscription plans (e.g., Starter: 100 req/min, Pro: 500 req/min, Enterprise: 2,000 req/min).

## 6. Multi-Tenancy & Audit Isolation
- `api_request_log` and `webhook_deliveries` tables carry tenant traffic metadata and MUST be protected by Row Level Security (RLS). No garage may inspect another tenant's integration logs or webhook telemetry.
