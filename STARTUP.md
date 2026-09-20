# Local Startup

This project does not use a demo runtime or fake Supabase credentials. Local development should run against a real local Supabase stack or an explicitly configured hosted Supabase project.

## Prerequisites

- Node.js 22 or newer
- npm
- Docker
- Supabase CLI

## 1. Install dependencies

```bash
npm ci
```

## 2. Start local Supabase

```bash
supabase start
```

Use the values reported by the Supabase CLI for the local API URL, anon key, and service-role key.

## 3. Create local environment configuration

```bash
cp .env.example .env.local
```

Populate `.env.local` with real values from the Supabase runtime:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

`SUPABASE_SERVICE_ROLE_KEY` is privileged server-only material. Never expose it in client components, browser code, screenshots, logs, or committed files.

## 4. Rebuild the database from canonical migrations

```bash
supabase db reset --no-seed
```

The source of truth for schema and authority changes is `supabase/migrations/`. Do not rely on dashboard-only schema edits.

## 5. Start Next.js

```bash
npm run dev
```

Development URL:

```text
http://localhost:9002
```

## Validate the local runtime

Before treating a local checkout as healthy, run:

```bash
npm run typecheck
npm run lint
npm run test:unit
npm run test:component
npm run test:security
npm run test:navigation
npm run build
```

For browser proof:

```bash
npm run test:e2e:smoke
npm run test:a11y
```

The CI pipeline performs the stronger release proof by starting fresh Supabase runtimes for SECURITY, E2E TRIAL, and A11Y.

## Hosted Supabase development

A hosted project may be used instead of local Supabase when intentionally configured. Use the hosted project URL and keys in `.env.local`, keep the service-role key server-only, and apply schema changes through the repository migration process.

Do not substitute placeholder URLs, dummy keys, in-memory fixtures, or browser demo data when the backend is unavailable. A broken backend should fail visibly.

## Common failures

### Missing required environment variable

The server deliberately throws when one of the required Supabase variables is absent. Verify `.env.local` contains:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Then restart the Next.js process.

### Local database schema is stale

Rebuild from migrations:

```bash
supabase db reset --no-seed
```

### Local Supabase is not running

Check Docker, then restart Supabase:

```bash
supabase stop
supabase start
```

### Consumer workflow behaves differently from CI

Recreate the same clean-database assumption used by CI:

```bash
supabase db reset --no-seed
npm run build
npm run test:e2e:smoke
```

## Release evidence

The consumer-trial baseline merged on September 20, 2026 at:

```text
c68fe8af3ace66622ce4e0f24f672807dadf984e
```

Post-merge CI run #235 passed the full quality rail, including SECURITY, BUILD, A11Y, E2E TRIAL, and QUALITY GATE.

That evidence belongs only to that exact commit. Any newer branch or commit must pass its own exact-head CI before being described as release-ready.
