# Development Guide

This guide describes the current Surrogate Network development workflow. Runtime truth lives in the repository, migrations, generated database types, operational contracts, and CI. Do not use old Firebase, Genkit, demo-mode, or mock-runtime instructions.

## Prerequisites

- Node.js 22 or newer
- npm
- Git
- Docker
- Supabase CLI

Recommended editor support:

- TypeScript
- ESLint
- Tailwind CSS IntelliSense

## Local setup

```bash
npm ci
supabase start
cp .env.example .env.local
```

Populate `.env.local` with the real local Supabase values:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Then rebuild the database and start Next.js:

```bash
supabase db reset --no-seed
npm run dev
```

Development URL:

```text
http://localhost:9002
```

The service-role key is server-only. Never expose it to client components or browser bundles.

## Runtime configuration ownership

Do not parse the Supabase environment variables independently in new consumers.

- `src/infrastructure/config/runtimeConfig.ts` owns public URL/anon-key validation.
- `src/infrastructure/config/serverRuntimeConfig.ts` owns required server-only service-role configuration.
- Browser, server, middleware, security-header, and readiness code consume those canonical boundaries.

`SURROGATE_RELEASE_SHA` is optional non-secret deployment metadata used only when a hosting platform does not expose `VERCEL_GIT_COMMIT_SHA` or `GITHUB_SHA` at runtime.

## Architecture rules

The canonical dependency direction is:

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
infrastructure (Supabase / config / health / observability / operations)
```

Non-negotiable rules:

1. UI renders and collects input. It does not become the authority for protected state.
2. Application actions orchestrate authenticated use cases.
3. Domain code must not depend on Next.js or Supabase.
4. Repository interfaces define persistence contracts where repositories are used.
5. Request-scoped Supabase clients preserve member identity so RLS remains authoritative.
6. Service-role authority is reserved for narrowly scoped trusted system/admin operations.
7. Production runtime never falls back to invented/demo/sample consumer data.
8. Database changes are migrations, not dashboard-only edits.
9. Public, member, admin, and operations concerns remain separated.
10. Documentation changes with runtime architecture.

See `docs/PROJECT_MANIFEST.md` for the full methodology.

## Primary source locations

```text
src/app/                                  route surfaces, including /api/health
src/components/                           UI and feature components
src/application/actions/                  server-side use-case entry points
src/domain/                               business vocabulary and domain types
src/repositories/                         repository interfaces
src/infrastructure/config/                canonical runtime configuration
src/infrastructure/health/                readiness probing
src/infrastructure/observability/         request correlation and structured errors
src/infrastructure/operations/            non-secret release provenance
src/infrastructure/supabase/              Supabase clients/adapters/generated types
src/navigation/                           navigation authority
src/__tests__/security/                   security regression suite
supabase/migrations/                      canonical schema/authority history
scripts/recovery-drill.sh                 logical application-data recovery proof
scripts/verify-deployment.mjs             hosted deployment contract verifier
e2e/                                      Playwright trial/a11y coverage
.github/workflows/ci.yml                  release quality rail
.github/workflows/deployment-verification.yml hosted release verification
```

## Current application actions

The `src/application/actions` layer contains the live server-side use-case boundaries for:

- marketplace operations;
- Surrogacy/Moment/Exchange/Feedback operations;
- safety/report/block operations;
- moderation;
- trial policy consent;
- account lifecycle participation/recovery/deletion orchestration;
- member/admin context validation.

Do not create a parallel action path for the same responsibility.

## Repository contracts

Current repository interfaces are:

- `ProfileRepository`
- `NeedRepository`
- `OfferRepository`
- `ProposalRepository`

Supabase implementations belong under `src/infrastructure/supabase/repositories`.

## Database change workflow

For schema, RLS, RPC, trigger, index, or grant changes:

1. add a migration under `supabase/migrations/`;
2. start local Supabase;
3. rebuild from a clean database:

```bash
supabase db reset --no-seed
```

4. regenerate canonical database types:

```bash
supabase gen types typescript --local > src/infrastructure/supabase/database.types.ts
```

5. run relevant security/regression coverage;
6. ensure logical recovery still succeeds when the data contract changed;
7. ensure generated types match the migrated schema exactly.

CI independently regenerates the types and fails on drift.

Never weaken RLS or privileged function grants merely to make a UI flow pass.

## Health and operations development

- `/api/health/live` is process liveness and must stay independent of Supabase.
- `/api/health/ready` proves required configuration plus the real anonymous Supabase data plane.
- health responses are no-store and must not set auth cookies or expose raw dependency errors/credentials.
- release provenance is a non-secret immutable git revision only.

Do not turn readiness into an unconditional success response for a hosting integration.

## Test commands

Fast local gates:

```bash
npm run typecheck
npm run lint
npm run test:unit
npm run test:component
npm run test:navigation
```

Security/database gate:

```bash
npm run test:security
```

Logical recovery drill when a local Supabase runtime is already running:

```bash
bash scripts/recovery-drill.sh
```

Build:

```bash
npm run build
```

Browser suites:

```bash
npm run test:e2e:smoke
npm run test:a11y
```

The E2E TRIAL proves the real two-member marketplace lifecycle against a fresh Supabase database and also exercises the deployment verifier against the exact local production runtime.

## Deployment verification

For a real hosted target:

```bash
npm run verify:deployment -- https://app.example.com <exact-git-sha>
```

Public deployments require HTTPS. The `--allow-http` escape hatch exists only for local production-runtime proof in CI.

Preferred operator path: run the manual **Deployment Verification** GitHub Actions workflow from the exact revision that should be deployed and provide the target URL. The verifier requires the target's reported revision to match that workflow SHA.

See `docs/OPERATIONS_RUNBOOK.md`.

## CI release rail

Every repository release candidate is the exact commit that passed:

- INSTALL
- DEPENDENCY AUDIT
- TYPECHECK
- LINT
- UNIT
- COMPONENT
- SECURITY
  - fresh Supabase startup
  - migration replay
  - logical application-data recovery drill
  - security regression tests
  - generated database types
  - zero schema/type drift
- NAVIGATION
- BUILD
- E2E TRIAL
  - canonical consumer journey
  - local deployment-verifier contract proof
- A11Y
- QUALITY GATE

Evidence from an older SHA does not certify a newer SHA.

A hosted deployment requires a second proof: the manual deployment verifier against the real target and exact deployed revision.

## Branch and PR workflow

The active default branch is `master`.

1. start from the latest green `master`;
2. create one focused branch for the slice;
3. keep the branch small and avoid stacked PRs unless there is a real dependency reason;
4. open a PR back to `master`;
5. freeze the candidate while exact-head CI runs;
6. fix the root cause of failures, never weaken tests/gates to manufacture green;
7. merge only when the exact PR head is green;
8. verify post-merge `master` separately.

Default-branch protection is a repository-governance requirement and should require aggregate `QUALITY GATE` once administrative rules are enabled.

## TypeScript and component conventions

- Avoid `any` unless an external boundary makes it unavoidable and documented.
- Keep components focused.
- Prefer Server Components where interaction is not required.
- Use Client Components only when browser state/events are necessary.
- Keep business state transitions out of presentation components.
- Reuse canonical navigation instead of hardcoding parallel menus.
- Add focused regression coverage for changed contracts.

## Security development rules

- Never use the service-role client to identify the current user.
- Never expose private profile/account fields through public views.
- Never give authenticated clients direct write authority over XP, tokens, moderation, consent, suspension, deletion state, or other protected authority.
- Keep SECURITY DEFINER functions narrowly granted and search-path hardened.
- Treat blocking, suspension, deactivation, and deletion as database-enforced boundaries, not UI-only states.
- Preserve audit evidence for privileged transitions.
- Never put production credentials/dumps/recovery links in logs or repository artifacts.

## Documentation expectations

Update relevant docs in the same change when you modify:

- architecture/dependency direction;
- routes/navigation ownership;
- schema/data contracts;
- setup/runtime environment;
- CI/release/deployment gates;
- privileged authority boundaries;
- recovery/incident operations.

Do not preserve obsolete setup instructions as historical clutter in active docs. Git history already preserves history.
