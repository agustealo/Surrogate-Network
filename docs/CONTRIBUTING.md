# Contributing to Surrogate Network

Surrogate Network uses exact-head CI and a single canonical runtime architecture. Contributions should improve the live product, not add parallel implementations, compatibility graveyards, demo fallbacks, or speculative scaffolds.

## Before you start

Read:

- `README.md`
- `STARTUP.md`
- `docs/PROJECT_MANIFEST.md`
- `docs/ARCHITECTURE.md`
- `docs/DEVELOPMENT.md`

Set up a real local Supabase runtime before testing member workflows.

## Local setup

```bash
npm ci
supabase start
cp .env.example .env.local
supabase db reset --no-seed
npm run dev
```

Populate `.env.local` with real values from the local/hosted Supabase project. Never commit real credentials.

## Branching

The active default branch is `master`.

Create focused branches from the latest green `master`, for example:

```bash
git checkout master
git pull --ff-only
git checkout -b fix/short-description
```

Useful prefixes include:

- `feat/`
- `fix/`
- `security/`
- `refactor/`
- `docs/`
- `chore/`

Do not target a fictional integration branch or keep a long-running compatibility branch without a concrete reason.

## Change discipline

- One canonical implementation per responsibility.
- Prefer deletion over preserving dead compatibility code.
- No production mock/demo/sample fallback.
- No placeholder route promoted as a shipped feature.
- No direct client authority over protected state.
- No duplicate navigation, auth, persistence, or state-transition logic.
- Keep public, member, and admin concerns isolated.
- Schema changes must be migrations.
- Update generated Supabase types when the schema changes.

## Pull requests

Open PRs against `master`.

A good PR should explain:

1. what problem it fixes;
2. what authority/runtime boundary changed;
3. how the change was tested;
4. any migration or data impact;
5. any intentional deferred work.

Avoid stacking PRs unless a hard dependency requires it.

Keep the candidate frozen while exact-head CI runs. If the head changes, previous green evidence becomes historical only.

## Required quality rail

Before merge, the exact PR head must pass the relevant repository CI, which currently includes:

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

Do not weaken a test, RLS policy, RPC boundary, or quality gate merely to make the PR green.

## Local checks

Run the focused checks for your change and, before requesting merge, the broad local checks that are practical:

```bash
npm run typecheck
npm run lint
npm run test:unit
npm run test:component
npm run test:navigation
npm run build
```

For database/security changes, also run against a real local Supabase runtime:

```bash
supabase db reset --no-seed
npm run test:security
supabase gen types typescript --local > generated-database.types.ts
diff -u src/infrastructure/supabase/database.types.ts generated-database.types.ts
```

For consumer-flow/UI changes:

```bash
npm run test:e2e:smoke
npm run test:a11y
```

## Schema and security changes

For any migration, RLS, function, grant, trigger, or privileged-action change:

- make the migration explicit and reviewable;
- preserve request-scoped RLS for member access;
- reserve service-role use for trusted server/system operations;
- keep SECURITY DEFINER functions narrowly granted and search-path hardened;
- add or update security regression coverage;
- regenerate database types;
- prove the clean migration chain from an empty database.

Security fixes should close authority gaps at the database/server boundary, not only hide controls in the UI.

## Code style

- TypeScript first.
- Avoid `any` unless unavoidable and documented.
- Keep modules focused and small.
- Prefer explicit contracts and return types at boundaries.
- Keep business transitions out of React presentation code.
- Reuse repository contracts and application actions rather than bypassing them.
- Use existing UI primitives and navigation authority.
- Preserve accessibility semantics and keyboard behavior.

## Commit messages

Use clear conventional-style messages when practical:

```text
feat: add ...
fix: repair ...
security: harden ...
refactor: simplify ...
test: prove ...
docs: align ...
chore: update ...
```

The message should describe the real change, not a vague “cleanup” when security or authority semantics changed.

## Documentation

Documentation is part of the product. Update docs when you change:

- architecture;
- runtime dependencies;
- setup/environment variables;
- routes/navigation;
- persistence/data models;
- security/authority boundaries;
- CI/release gates.

Do not leave contradictory “old” instructions in active docs. Git history preserves history.

## Review checklist

Before merge, verify:

- [ ] no duplicate or legacy authority path was added;
- [ ] no mock/demo/sample production fallback was added;
- [ ] member/admin boundaries remain separated;
- [ ] schema changes are migration-backed;
- [ ] generated database types match the schema;
- [ ] security-sensitive changes have regression coverage;
- [ ] docs match the new runtime truth;
- [ ] exact PR head is green;
- [ ] post-merge `master` is checked after merge.

## Governance note

The repository methodology requires protected default-branch rules and a required aggregate `QUALITY GATE`. If repository branch protection is not currently enabled, treat that as a governance gap rather than permission to bypass the PR/CI process.
