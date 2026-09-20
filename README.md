# Surrogate Network

Surrogate Network is a needs-based social companion platform for meaningful exchanges of support, companionship, and capability.

The canonical relationship loop is:

```text
Need + Offer -> Discovery -> Proposal -> Surrogacy -> Moment -> Exchange -> Feedback
```

The product is currently hardened for controlled consumer trials. Trial readiness means the shipped surfaces use real persistence and real authority boundaries. It does **not** mean every roadmap feature is complete or that the repository is certified for unrestricted public-market launch.

## Trial-ready product surface

### Public

- Landing, How It Works, Explore, Principles, and Safety surfaces.
- Sign up and sign in through Supabase Auth.
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
- Account settings, trial participation, and self-deactivation.

Messaging and Rewards are intentionally absent from primary member navigation until their production behavior is complete. Existing non-primary routes must remain truthful about their availability rather than simulate data.

### Admin

- Separate authorized admin console.
- Global operational counts through trusted server authority.
- Report moderation queue.
- Atomic moderation outcomes, restrictions/suspensions, and audit events.

## Canonical architecture

- **Framework:** Next.js 16, React 19, TypeScript.
- **Data/Auth:** Supabase Auth + PostgreSQL + Row Level Security.
- **Storage/Realtime:** Supabase platform services where used by the product.
- **Domain:** `src/domain`.
- **Application orchestration:** `src/application`.
- **Repository contracts:** `src/repositories`.
- **Supabase adapters:** `src/infrastructure/supabase`.
- **UI surfaces:** `src/app` and `src/components`.
- **Navigation authority:** `src/navigation`.
- **Database history:** `supabase/migrations`.
- **Tests:** Jest, Testing Library, Playwright.
- **Release gate:** GitHub Actions.

Firebase is not part of the current architecture. Production runtime must not fall back to mock, demo, sample, or invented consumer data.

## Local development

### Prerequisites

- Node.js 22 or newer.
- npm.
- Docker.
- Supabase CLI for the local database/auth stack.

### Start the app with a real local Supabase runtime

```bash
npm ci
supabase start
cp .env.example .env.local
```

Populate `.env.local` with the real values reported by your Supabase runtime:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Then rebuild the local database from the canonical migrations and start Next.js:

```bash
supabase db reset --no-seed
npm run dev
```

The application listens on `http://localhost:9002` in development.

`SUPABASE_SERVICE_ROLE_KEY` is server-only. Never expose it to client components, browser bundles, public logs, screenshots, or committed files.

See [`STARTUP.md`](STARTUP.md) for the full startup sequence and failure checks.

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

SECURITY starts a fresh Supabase runtime, replays all migrations, runs the security regression suite, regenerates the canonical database types, and rejects schema/type drift.

E2E TRIAL proves the canonical two-member journey against a freshly migrated database: sign up, create Need and Offer, send/accept Proposal, create Surrogacy, schedule/complete Moment, record Exchange, submit Feedback, and verify the counterpart sees the resulting Connection.

## Current exact-head evidence

On September 20, 2026, merged `master` commit:

```text
c68fe8af3ace66622ce4e0f24f672807dadf984e
```

passed post-merge CI run **#235**, including SECURITY, BUILD, A11Y, E2E TRIAL, and QUALITY GATE.

That evidence certifies that exact merged baseline for the controlled consumer-trial bar defined in [`docs/PROJECT_MANIFEST.md`](docs/PROJECT_MANIFEST.md). Any later commit must earn its own green exact-head evidence.

## Readiness boundary

Consumer-trial readiness is not the same as unrestricted market readiness. Broader release work still includes governance hardening such as protected default-branch rules, production observability/error reporting, validated account recovery and deletion/export policy, backup/recovery operations, production media lifecycle, and operational/support runbooks.

## Repository structure

```text
src/
  app/                 public, member, and admin route surfaces
  application/         use-case orchestration and server actions
  components/          UI and feature components
  domain/              canonical business definitions
  infrastructure/      Supabase and external adapters
  navigation/          canonical navigation registry
  repositories/        persistence interfaces
  __tests__/           security and regression coverage
supabase/
  migrations/          canonical database history
e2e/                   Playwright trial and accessibility coverage
docs/                  architecture, development, API, data, and manifest docs
```

## Project rules

- Real runtime logic only. No silent demo fallback.
- One canonical implementation per responsibility.
- Privileged state is server/database authoritative.
- RLS is enforced, not decorative.
- Schema changes are migrations.
- Public, member, and admin concerns remain separated.
- Exact-head CI evidence is required before merge/release claims.
- Documentation must describe the repository that actually exists.

Read [`docs/PROJECT_MANIFEST.md`](docs/PROJECT_MANIFEST.md) for the full methodology and release definitions.

## Documentation

- [Project Manifest](docs/PROJECT_MANIFEST.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Development Guide](docs/DEVELOPMENT.md)
- [API Reference](docs/API.md)
- [Data Models](docs/DATA_MODELS.md)
- [Contributing](docs/CONTRIBUTING.md)
- [Current Sprint Status](SPRINT_PROGRESS.md)
