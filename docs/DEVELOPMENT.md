# Development Guide

This guide describes the current Surrogate Network development workflow. Runtime truth lives in the repository, migrations, generated database types, and CI. Do not use old Firebase, Genkit, demo-mode, or mock-runtime instructions.

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
infrastructure (Supabase)
```

Non-negotiable rules:

1. UI renders and collects input. It does not become the authority for protected state.
2. Application actions orchestrate authenticated use cases.
3. Domain code must not depend on Next.js or Supabase.
4. Repository interfaces define persistence contracts where repositories are used.
5. Request-scoped Supabase clients preserve member identity so RLS remains authoritative.
6. The service-role client is reserved for narrowly scoped trusted system/admin operations.
7. Production runtime never falls back to invented/demo/sample consumer data.
8. Database changes are migrations, not dashboard-only edits.
9. Public, member, and admin UI concerns remain separated.
10. Documentation changes with runtime architecture.

See `docs/PROJECT_MANIFEST.md` for the full methodology.

## Primary source locations

```text
src/app/                                  route surfaces
src/components/                           UI and feature components
src/application/actions/                  server-side use-case entry points
src/domain/                               business vocabulary and domain types
src/repositories/                         repository interfaces
src/infrastructure/supabase/              Supabase clients/adapters/generated types
src/navigation/                           navigation authority
src/__tests__/security/                   security regression suite
supabase/migrations/                      canonical schema/authority history
e2e/                                      Playwright trial/a11y coverage
.github/workflows/ci.yml                  release quality rail
```

## Current application actions

The `src/application/actions` layer contains the live server-side use-case boundaries for:

- marketplace operations;
- Surrogacy/Moment/Exchange/Feedback operations;
- safety/report/block operations;
- moderation;
- trial policy consent;
- account lifecycle participation;
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

1. Add a migration under `supabase/migrations/`.
2. Start local Supabase.
3. Rebuild from a clean database:

```bash
supabase db reset --no-seed
```

4. Regenerate canonical database types:

```bash
supabase gen types typescript --local > src/infrastructure/supabase/database.types.ts
```

5. Run the relevant test rail.
6. Ensure generated types match the migrated schema exactly.

CI independently regenerates the types and fails on drift.

Never weaken RLS or privileged function grants merely to make a UI flow pass.

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

Run it against a correctly started/migrated local Supabase runtime.

Build:

```bash
npm run build
```

Browser suites:

```bash
npm run test:e2e:smoke
npm run test:a11y
```

The E2E smoke script is the CI **E2E TRIAL** journey. It proves the real two-member marketplace lifecycle against a fresh Supabase database.

## CI release rail

Every release candidate is the exact commit that passed:

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

Evidence from an older SHA does not certify a newer SHA.

## Branch and PR workflow

The active default branch is `master`.

1. Start from the latest green `master`.
2. Create one focused branch for the slice.
3. Keep the branch small and avoid stacked PRs unless there is a real dependency reason.
4. Open a PR back to `master`.
5. Freeze the candidate while exact-head CI runs.
6. Fix the root cause of failures. Do not weaken tests or gates to manufacture green.
7. Merge only when the exact PR head is green.
8. Verify the post-merge `master` run separately.

Default-branch protection is a repository-governance requirement and should require the aggregate `QUALITY GATE` once administrative rules are enabled.

## TypeScript and component conventions

- Avoid `any` unless an external boundary makes it unavoidable and documented.
- Keep components focused.
- Prefer Server Components where interaction is not required.
- Use Client Components only when browser state/events are necessary.
- Keep business state transitions out of presentation components.
- Reuse the canonical navigation registry instead of hardcoding parallel menus.
- Add focused regression coverage for changed contracts.

## Security development rules

- Never use the service-role client to identify the current user.
- Never expose private profile/account fields through public views.
- Never give authenticated clients direct write authority over XP, tokens, moderation, consent, suspension, or other protected state.
- Keep SECURITY DEFINER functions narrowly granted and search-path hardened.
- Treat blocking, suspension, and deactivation as database-enforced boundaries, not UI-only states.
- Preserve audit evidence for privileged transitions.

## Documentation expectations

Update the relevant documentation in the same change when you modify:

- architecture or dependency direction;
- routes/navigation ownership;
- schema/data contracts;
- setup/runtime environment;
- CI/release gates;
- privileged authority boundaries.

Do not preserve obsolete setup instructions as historical clutter in active docs. Git history already preserves history.
