![Surrogate Network](docs/assets/surrogate-network-banner.svg)

# Surrogate Network

Surrogate Network is a needs-based social companion platform for meaningful exchanges of support, companionship, and capability.

The canonical relationship loop is:

```text
Need + Offer -> Discovery -> Proposal -> Surrogacy -> Moment -> Exchange -> Feedback
```

The product is hardened for controlled consumer trials with real persistence, explicit authority boundaries, production-oriented account lifecycle controls, runtime observability, health/readiness semantics, recovery proof, and exact-head release gates. That does **not** mean every roadmap feature or deployment-owner control is complete for unrestricted public-market launch.

## Real product tour

These are **actual browser screenshots** captured by the real Playwright consumer-trial journey against a freshly migrated Supabase runtime. They are the exact PNG frames promoted from green CI run **#357** for `master@be859bca5a0639c7f8d2472faaa46c2732bad442`. They are not mockups, stitched galleries, marketing renders, or manually reconstructed screens.

### 1. Public entry

![Surrogate Network public home](docs/screenshots/01-public-home.png)

The public landing experience introduces needs-based relationships and routes people into the real authentication journey.

### 2. Publish a Need

![Published Need](docs/screenshots/02-published-need.png)

The member has created a real persisted Need. The screenshot shows the authenticated shell and the saved listing state.

### 3. Discover real marketplace records

![Discovery marketplace](docs/screenshots/08-discovery-marketplace.png)

Discovery reads the Need and Offer records created by the same trial journey rather than seeded presentation data.

### 4. Publish an Offer

![Published Offer](docs/screenshots/09-published-offer.png)

The complementary Offer is persisted through the shipped member flow.

### 5. Compose a Proposal

![Proposal composer](docs/screenshots/10-proposal-composer.png)

The proposal composer is bound to the actual Need and Offer records created earlier in the journey.

### 6. Receive the Proposal

![Incoming Proposal](docs/screenshots/03-incoming-proposal.png)

This is the real browser page after Proposal persistence. The compact proposal card and its Accept / Decline / Counter controls are the shipped UI state, not a rendered substitute.

### 7. Form an active Surrogacy

![Active Surrogacy](docs/screenshots/12-active-surrogacy.png)

After acceptance, the database-backed relationship becomes an active Surrogacy/Connection and exposes the real Moment scheduling flow.

### 8. Complete the Exchange

![Completed Exchange](docs/screenshots/04-completed-exchange.png)

The lifecycle is shown after Moment completion and submitted Feedback, proving the product beyond proposal acceptance.

Eight additional standalone runtime frames cover How It Works, Safety, the member dashboard, profile safety controls, account privacy controls, the Admin Console, moderation reports, and Community Principles. See [`docs/VISUAL_EVIDENCE.md`](docs/VISUAL_EVIDENCE.md) for the full 16-shot catalog, exact provenance, and regeneration rules.

## Trial-ready product surface

### Public

- Landing, How It Works, Explore, Principles, and Safety surfaces.
- Sign up and sign in through Supabase Auth.
- Password recovery through Supabase email + PKCE callback exchange.
- Trial Terms and Privacy Notice.
- Public profile projection that excludes private/account-authority fields.

### Member

- Explicit trial age/Terms/Privacy consent.
- Needs and Offers creation and management.
- Discovery across active marketplace records.
- Proposal creation and proposal state transitions.
- Surrogacy/Connection creation after accepted proposals.
- Moment scheduling and completion.
- Exchange recording.
- Exchange-bound Feedback.
- Member blocking and safety reporting.
- Account settings and reversible trial deactivation.
- Machine-readable account export.
- Password-confirmed permanent account deletion with retained tombstone/history boundaries.

Messaging and Rewards are intentionally absent from primary member navigation until their production behavior is complete. Existing non-primary routes must remain truthful about their availability rather than simulate data.

### Admin

- Separate authorized admin console.
- Global operational counts through trusted server authority.
- Report moderation queue.
- Atomic moderation outcomes, restrictions/suspensions, and audit events.

## Canonical architecture

- **Framework:** Next.js 16, React 19, TypeScript.
- **Data/Auth:** Supabase Auth + PostgreSQL + Row Level Security.
- **Data API authority:** explicit PostgreSQL grants owned by migrations, with RLS and column authority layered on top.
- **Storage/Realtime:** not a generic requirement. A future shipped feature must own an explicit object/realtime lifecycle before adopting these services.
- **Domain:** `src/domain`.
- **Application orchestration:** `src/application`.
- **Repository contracts:** `src/repositories`.
- **Supabase adapters:** `src/infrastructure/supabase`.
- **Runtime configuration:** `src/infrastructure/config`.
- **Observability:** `src/infrastructure/observability`.
- **Operations/health:** `src/infrastructure/health`, `src/infrastructure/operations`, and `/api/health/*`.
- **UI surfaces:** `src/app` and `src/components`.
- **Navigation authority:** `src/navigation`.
- **Database history:** `supabase/migrations`.
- **Tests:** Jest, Testing Library, Playwright.
- **Release gate:** GitHub Actions.

Firebase and Genkit are not part of the current architecture. Production runtime must not fall back to mock, demo, sample, or invented consumer data.

## Local development

### Prerequisites

- Node.js 22 or newer.
- npm.
- Docker.
- Supabase CLI for the local database/auth stack.

### Start with a real local Supabase runtime

```bash
npm ci
supabase start
cp .env.example .env.local
```

Populate `.env.local` with the values reported by the local Supabase runtime:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Then rebuild the local database from canonical migrations and start Next.js:

```bash
supabase db reset --no-seed
npm run dev
```

The application listens on `http://localhost:9002` in development.

`SUPABASE_SERVICE_ROLE_KEY` is server-only. Never expose it to client components, browser bundles, public logs, screenshots, or committed files.

See [`STARTUP.md`](STARTUP.md) for the startup sequence and failure checks.

## Runtime health

- `GET /api/health/live` reports process liveness without depending on Supabase.
- `GET /api/health/ready` validates required server configuration and the real anonymous Supabase data plane.
- Both are dynamic/no-store and retain request-correlation headers.
- Health responses expose only a sanitized release revision when deployment metadata is available.

Readiness must fail when the dependency is unusable. It is not a decorative always-green endpoint.

## Test and quality commands

```bash
npm run typecheck
npm run lint
npm run test:unit
npm run test:component
npm run test:security
npm run test:navigation
npm run build
npm run test:e2e:smoke
npm run test:a11y
```

The CI quality rail includes:

- INSTALL
- DEPENDENCY AUDIT
- TYPECHECK
- LINT
- UNIT
- COMPONENT
- SECURITY
- NAVIGATION
- BUILD
- E2E TRIAL
- A11Y
- QUALITY GATE

SECURITY starts a fresh Supabase runtime, replays all migrations, runs the logical application-data recovery drill, runs security regressions, regenerates canonical database types, and rejects schema/type drift.

E2E TRIAL proves the canonical two-member journey against a freshly migrated database, captures the source PNG documentation evidence from that real runtime, uploads it for review, and exercises the deployment verification contract against an exact local production build.

## Deployment verification

A hosted deployment must be checked independently from repository CI.

Run **Deployment Verification** from GitHub Actions on the exact revision intended to be live and provide the canonical target deployment origin. The workflow rejects redirects to a different route/origin and rejects a target whose reported release revision does not equal the exact workflow SHA.

Manual equivalent:

```bash
npm run verify:deployment -- https://app.example.com <exact-git-sha>
```

The verifier is read-only. It checks same-origin/no-redirect responses, liveness, dependency readiness, exact revision provenance, request correlation, health caching/cookie behavior, public auth/recovery surfaces, CSP, anti-framing/content-sniffing/referrer/permissions headers, and HSTS.

If the hosting provider does not expose `VERCEL_GIT_COMMIT_SHA` or `GITHUB_SHA` to the runtime, set the non-secret `SURROGATE_RELEASE_SHA` to the exact deployed git revision.

See [`docs/OPERATIONS_RUNBOOK.md`](docs/OPERATIONS_RUNBOOK.md).

## Recovery

The SECURITY rail runs `scripts/recovery-drill.sh`, which proves that canonical migrations plus a logical application-data dump can recover the application-owned `public` relational dataset.

That drill does not prove Supabase-managed Auth, provider backup/PITR policy, or a full production project restore. See [`docs/PRODUCTION_RECOVERY.md`](docs/PRODUCTION_RECOVERY.md).

## Verified parent evidence for this documentation slice

This screenshot/documentation slice was cut from merged `master` commit:

```text
be859bca5a0639c7f8d2472faaa46c2732bad442
```

Post-merge CI run **#357** passed on that exact revision, including the recovery drill, SECURITY, zero schema/type drift, BUILD, E2E TRIAL, A11Y, exact local deployment verification, and aggregate QUALITY GATE. The 16 committed screenshots are the exact PNG files from that run's `consumer-visual-evidence` artifact.

This records independently verified parent evidence. The documentation/screenshot commit must still earn its own exact-head CI before merge.

## Readiness boundary

The repository covers the core consumer lifecycle, account recovery/export/deletion, structured runtime error observability, request correlation, runtime configuration ownership, liveness/readiness, logical application-data recovery, and exact-head CI.

Remaining unrestricted-launch work is primarily deployment/governance/operations-specific:

- protect the default branch and require the aggregate `QUALITY GATE` before merge;
- run Deployment Verification against the actual hosted production target and exact release revision;
- record the real Supabase backup/PITR policy and perform a provider-level restore rehearsal;
- verify real outbound password-recovery email delivery/domain configuration;
- assign external alerting, on-call/support, moderation, and incident ownership;
- complete any organization-specific privacy/compliance/support process;
- complete Messaging and Rewards before promoting them into primary product navigation.

The dormant media metadata subsystem was deliberately removed rather than presented as a production Storage feature. A future media feature must begin with an explicit private object ownership/access/deletion/recovery contract.

## Repository structure

```text
src/
  app/                 public, member, admin, auth, and health route surfaces
  application/         use-case orchestration and server actions
  components/          UI and feature components
  domain/              canonical business definitions
  infrastructure/      config, health, observability, operations, Supabase adapters
  navigation/          canonical navigation registry
  repositories/        persistence interfaces
  __tests__/           security and regression coverage
supabase/
  migrations/          canonical database/security history
scripts/                recovery, workflow-integrity, and deployment-verification tooling
e2e/                   Playwright trial and accessibility coverage
docs/                  architecture, operations, recovery, development, visual evidence, and manifest docs
```

## Project rules

- Real runtime logic only. No silent demo fallback.
- One canonical implementation per responsibility.
- Privileged state is server/database authoritative.
- Data API grants, column authority, and RLS are enforced, not decorative.
- Schema changes are migrations.
- Public, member, and admin concerns remain separated.
- Exact-head CI evidence is required before merge/release claims.
- A hosted release must be tied to an immutable deployed revision before certification.
- Documentation must describe the repository that actually exists.
- Product screenshots used by repository documentation must originate from the real E2E runtime, remain standalone and inspectable, and only then be promoted into durable docs assets.

Read [`docs/PROJECT_MANIFEST.md`](docs/PROJECT_MANIFEST.md) for the full methodology and release definitions.

## Documentation

- [Project Manifest](docs/PROJECT_MANIFEST.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Visual Evidence & Brand Assets](docs/VISUAL_EVIDENCE.md)
- [Production Operations](docs/OPERATIONS_RUNBOOK.md)
- [Production Recovery](docs/PRODUCTION_RECOVERY.md)
- [Development Guide](docs/DEVELOPMENT.md)
- [API Reference](docs/API.md)
- [Data Models](docs/DATA_MODELS.md)
- [Contributing](docs/CONTRIBUTING.md)
- [Current Sprint Status](SPRINT_PROGRESS.md)
