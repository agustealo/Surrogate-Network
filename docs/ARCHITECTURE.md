# Surrogate Network Architecture

## Product model

Surrogate Network is a needs-based social companion platform. The canonical consumer lifecycle is:

```text
Need + Offer -> Discovery -> Proposal -> Surrogacy -> Moment -> Exchange -> Feedback
```

The architecture is designed around that lifecycle. Progression, moderation, notifications, account lifecycle, operations, and administration support it; they are not separate product models.

## Canonical stack

- Next.js 16 App Router
- React 19
- TypeScript
- Supabase Auth
- PostgreSQL
- Row Level Security
- Supabase platform services only where a shipped feature owns the lifecycle contract
- Jest + Testing Library
- Playwright
- GitHub Actions

Firebase and Genkit are not part of the current runtime architecture.

## Application surfaces

### Public

Primary public navigation owns:

- Home
- How It Works
- Explore
- Principles
- Safety
- Sign In
- Join

Public routes also include trial Terms/Privacy, password recovery, and public profile projection as required by the flow.

### Member

Primary member navigation owns:

- Home
- Discover
- Proposals
- Connections (`/surrogacies`)
- Needs
- Offers
- Profile
- Settings

Mobile navigation exposes the same core member experience with explicit Need/Offer create actions.

Messaging and Rewards are intentionally not in primary navigation while their production behavior is incomplete. Existing non-primary routes must render truthful unavailable/history states rather than fake data.

### Admin

The admin console is a separate authorized surface. Its current primary navigation is intentionally narrow:

- Dashboard
- Reports

Moderation operations run through authenticated admin verification plus trusted server/database authority. Member UI must not import or expose admin controls.

### Operations

Operational surfaces are deliberately separate from consumer features:

- `/api/health/live`
- `/api/health/ready`
- request correlation and structured error events
- logical recovery tooling
- deployment verification tooling/workflow

Health and verification endpoints must not become a second consumer API or leak credentials/internal exception content.

## Dependency direction

```text
app/components
      |
      v
application
      |
      v
domain + repository contracts
      ^
      |
infrastructure
  |-- Supabase
  |-- runtime config
  |-- health
  |-- observability
  `-- operations
```

### Presentation

`src/app` and `src/components` render the product and collect input. They must not own privileged business state or duplicate database rules.

### Application

`src/application` coordinates use cases, member/admin context checks, revalidation, and calls into repositories or trusted database functions.

### Domain

`src/domain` defines product vocabulary and business-facing types. Domain code should not depend on Supabase or Next.js.

### Repository contracts

`src/repositories` contains the current persistence interfaces:

- `ProfileRepository`
- `NeedRepository`
- `OfferRepository`
- `ProposalRepository`

### Infrastructure

`src/infrastructure/supabase` owns:

- browser client;
- request-scoped server client;
- privileged service client;
- middleware/session integration;
- generated database types;
- Supabase repository implementations.

`src/infrastructure/config` owns runtime environment parsing/validation. Supabase consumers do not independently read/normalize the same environment variables.

`src/infrastructure/health` owns dependency readiness probing.

`src/infrastructure/observability` owns request correlation and production-safe server error event shaping.

`src/infrastructure/operations` owns non-secret release provenance used by operational verification.

## Supabase authority model

### Request-scoped client

The request-scoped server client preserves the authenticated member session. Use it for user-authorized data access so RLS remains authoritative.

### Service-role client

The service-role client bypasses RLS and is therefore restricted to narrowly scoped trusted system/admin operations. It must never be used to infer who the current human user is.

### Data API privileges

PostgreSQL object privileges and Row Level Security are separate layers of the same data boundary:

- grants decide whether `anon`, `authenticated`, or `service_role` can reach a table/view and operation through Supabase/PostgREST at all;
- RLS decides which rows an allowed caller may see or mutate;
- column grants further fence member-controlled fields where workflow/status/reputation state must remain database-owned.

`supabase/migrations/20260925000100_explicit_data_api_privileges.sql` is the convergence point for the shipped Data API surface. It removes dependence on Supabase project-era automatic grants, explicitly declares the current role/table operations, and makes future `public` tables/functions/sequences private to API roles until the migration that owns them grants the required access.

Anonymous access is intentionally limited to the safe `public_profiles` projection. Authenticated access is explicitly granted only for shipped member read/write paths. Service-role access remains server-only trusted infrastructure and does not replace RLS-preserving member clients.

A new database object is not a shipped Data API object merely because it exists in the `public` schema. Its migration must deliberately grant the required role/operation surface and retain the appropriate RLS or trusted-RPC authority.

### Database functions

Complex privileged transitions are implemented as migration-managed PostgreSQL functions so multi-row state changes remain atomic and auditable.

Examples include:

- proposal transition/acceptance;
- Moment/Exchange/Feedback lifecycle operations;
- report moderation;
- trial-policy acceptance;
- account participation/deactivation/deletion preparation.

Function execution grants are part of the security model. Sensitive functions must not inherit broad PUBLIC/authenticated execution by accident.

## Marketplace lifecycle authority

### Need and Offer

Members create and manage their own marketplace records through authenticated actions/repositories under RLS. Lifecycle/status/counters that are authoritative remain database-owned.

### Proposal

Proposal creation validates that the Need/Offer pair and participants are legitimate. Clients do not own authoritative status transitions.

### Acceptance

Proposal acceptance is transactional. The trusted database path updates the proposal and related capacity/fulfillment state, creates the Surrogacy and participants, and records audit/outbox evidence as one authority boundary.

### Surrogacy, Moment, Exchange, Feedback

Downstream relationship operations use trusted lifecycle functions/actions rather than scattered direct table writes. Feedback is bound to completed Exchange context.

## Safety, privacy, and account lifecycle

### Public profiles

Public member discovery reads a restricted projection rather than the full `profiles` row. Private and authority fields such as email, XP/tokens, admin flags, consent state, suspension/deletion state must not leak cross-user.

### Blocking

Blocking is persisted and enforced at the data boundary. It affects discoverability and relationship initiation, not merely UI presentation.

### Reports and moderation

Members can create safety reports. Admin moderation is isolated to the admin surface and performs trusted atomic state changes with audit evidence.

### Suspension, deactivation, deletion

Moderation suspension, voluntary deactivation, and permanent deletion are distinct states.

- suspension is moderation authority;
- deactivation is reversible member participation control;
- deletion is terminal, database-first, redacts direct member content, preserves tombstone/shared history where required, and then coordinates external Auth deletion.

Stale authenticated tokens are prevented from mutating protected tables after terminal/inactive states.

### Trial consent

Current trial Terms/Privacy/age confirmation is explicit and stored through trusted authority. It is distinct from suspension/identity validity.

### Password recovery

Recovery uses Supabase email + PKCE code exchange into the SSR session. Password update requires a short-lived recovery marker plus the authenticated recovery session rather than exposing a generic signed-in password mutation route.

## Runtime configuration

`src/infrastructure/config/runtimeConfig.ts` is the canonical public Supabase config parser/validator.

`src/infrastructure/config/serverRuntimeConfig.ts` is server-only and extends the public config with the required service-role credential.

Consumers must not introduce parallel `process.env` parsing for these values.

## Health architecture

### Liveness

`/api/health/live` answers whether the application process can serve a dynamic request. It intentionally bypasses the Supabase auth refresh path so a Supabase outage does not make process liveness indistinguishable from dependency readiness.

### Readiness

`/api/health/ready` validates required server runtime config and probes the real anonymous `public_profiles` Supabase/PostgREST contract. It returns `503` when the dependency contract is unusable.

Health responses are dynamic/no-store and retain request correlation. They expose no credentials or raw upstream errors.

## Observability architecture

Middleware owns validated/generated `x-request-id` propagation.

Next.js `instrumentation.ts` captures request errors through the supported framework hook and sends them through the canonical structured logger.

Production error events retain route/request/error grouping metadata while omitting raw query strings, error messages, and stacks from the application event payload.

`error.tsx` and `global-error.tsx` own honest user-facing rendering failure states.

## Release provenance and deployment verification

Health responses expose a sanitized git revision when runtime metadata is available. Provenance sources are resolved in this order:

1. `SURROGATE_RELEASE_SHA`
2. `VERCEL_GIT_COMMIT_SHA`
3. `GITHUB_SHA`

`scripts/verify-deployment.mjs` is the read-only deployment contract verifier. The manual GitHub **Deployment Verification** workflow executes it against a supplied hosted origin and requires the target's reported revision to match the exact workflow SHA.

Repository CI also runs the verifier against the exact local production build and proves that a deliberately wrong revision is rejected.

This separates two claims:

- CI proves a repository candidate;
- deployment verification proves a hosted target corresponds to that immutable candidate and satisfies the operational HTTP/header/readiness contract.

## Recovery architecture

`scripts/recovery-drill.sh` proves logical recovery of application-owned relational `public` data after a destructive migration rebuild.

`docs/PRODUCTION_RECOVERY.md` owns the boundary between repository recovery proof and provider-level Supabase backup/PITR/full-project restoration.

Provider-managed Auth/backup settings are not inferred from local CI.

## Media boundary

The dormant URL-metadata media subsystem was removed because it did not own a real Supabase Storage/object lifecycle and was not part of the current consumer surface.

A future media feature must define, before UI promotion:

- bucket/object ownership;
- upload authority;
- private/public access semantics;
- signed-access rules if needed;
- deletion/retention behavior;
- provider/object recovery behavior.

Do not restore the retired metadata tables as a shortcut.

## Navigation ownership

`src/navigation/index.ts` is the canonical navigation registry. Route existence does not automatically make a route a primary shipped feature.

Navigation tests protect:

- public/member/admin ownership;
- primary route integrity;
- shell isolation;
- mobile member navigation.

Do not hardcode a second menu registry in another component.

## Database/schema ownership

`supabase/migrations` is the canonical schema and security history.

`src/infrastructure/supabase/database.types.ts` is generated from the migrated local database. CI regenerates this file and rejects drift.

A schema/security change is incomplete until:

1. the migration exists;
2. a clean database can replay all migrations;
3. Data API grants, RLS, column authority, and function execution remain explicit for affected objects;
4. security regression tests pass;
5. logical recovery remains valid when affected;
6. generated database types match the schema.

Provider default grants must never be treated as application authority.

## Browser security

`next.config.ts` owns response security headers. CSP sources are scoped to the configured Supabase origin rather than wildcard projects; production also sends HSTS plus anti-framing, content-sniffing, referrer, permissions, and related controls.

Do not loosen headers solely to silence a failing integration without understanding the required source.

## CI architecture

The release rail is intentionally layered:

1. INSTALL
2. DEPENDENCY AUDIT / TYPECHECK / LINT / UNIT / COMPONENT / SECURITY / NAVIGATION
3. BUILD
4. E2E TRIAL + A11Y
5. QUALITY GATE

SECURITY starts a fresh Supabase runtime, replays migrations, proves logical application-data recovery, runs security tests, regenerates database types, and rejects schema drift.

E2E TRIAL rebuilds a fresh runtime, proves the canonical two-member lifecycle, and exercises the deployment verifier against the exact local production build.

Any commit change invalidates earlier exact-head evidence.

## Deferred/non-primary systems

The following remain outside primary product claims until production behavior is complete:

- Messaging
- Rewards/economic UX
- future media/object workflows
- broader community/governance systems
- advanced automated trust/fraud systems
- additional admin modules beyond the current operational console

Deferred systems must not be simulated with consumer-facing fake data.

## Architecture change rule

When architecture changes, update this document, `docs/PROJECT_MANIFEST.md`, and any affected development/data/API/operations docs in the same change. Remove obsolete guidance rather than preserving contradictory active documentation.