# Local Startup

Surrogate Network uses one repository-owned local configuration path for development and release verification. The application does not fall back to demo data, fake Supabase credentials, or dashboard-only configuration.

The local Supabase stack is for development and CI verification only. Do not expose it directly to public traffic. A public deployment must use a production-hardened database/Auth deployment while preserving the repository-owned schema, grants, policies, and configuration contract.

## Prerequisites

- Node.js 22 or newer
- npm
- Docker-compatible container runtime
- Supabase CLI

## 1. Install dependencies

```bash
npm ci
```

## 2. Start the canonical local runtime

```bash
npm run local:up
```

This command starts Supabase from `supabase/config.toml` and generates `.env.local` from the values reported by the running local stack. The generator rejects non-loopback Supabase URLs, writes only the application runtime values it owns, and stores `.env.local` with restricted file permissions.

Do not copy provider keys into the repository and do not hand-edit `.env.local` as a second configuration authority.

## 3. Rebuild from canonical migrations

```bash
npm run local:reset
```

The command explicitly targets the local database, replays `supabase/migrations/` without seed data, and refreshes `.env.local` afterward.

The repository intentionally has no `supabase/seed.sql`. Product behavior must be exercised with records created through the real application or explicit test setup, never with synthetic consumer records that silently appear during startup.

## 4. Start Next.js

```bash
npm run dev
```

Or perform steps 2 and 4 together:

```bash
npm run dev:local
```

Development URL:

```text
http://localhost:9002
```

## Local configuration ownership

The canonical Supabase service configuration is `supabase/config.toml`.

The shipped application currently requires PostgreSQL/Data API and Auth. Storage, Realtime, Edge Runtime, analytics, and Studio AI integration are disabled because no current consumer feature owns those service lifecycles.

`.env.local` is generated from `supabase status -o env` and is gitignored. It contains:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `MAILPIT_URL` when reported by the local stack

`SUPABASE_SERVICE_ROLE_KEY` is privileged server-only material. Never expose it in client components, browser code, screenshots, logs, or committed files.

Schema and authorization changes belong in `supabase/migrations/`. Do not rely on dashboard-only schema edits, manually remembered grants, or provider-side defaults.

## Validate the local runtime

Before treating a checkout as healthy, run:

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

The CI pipeline starts fresh local Supabase runtimes for SECURITY, BUILD, E2E TRIAL, and A11Y. BUILD therefore compiles against real local Supabase credentials instead of invented build-only values.

## Common failures

### Local configuration is missing

Run:

```bash
npm run local:up
```

If Supabase is already running, regenerate only the local application environment:

```bash
npm run local:config
```

### Local database schema is stale

Rebuild from migrations:

```bash
npm run local:reset
```

### Local Supabase is not running

Check Docker, then restart the local stack:

```bash
supabase stop
npm run local:up
```

### Consumer workflow behaves differently from CI

Recreate the same clean-database assumption used by CI:

```bash
npm run local:reset
npm run build
npm run test:e2e:smoke
```

## Release evidence ownership

Release evidence is immutable and SHA-specific. This startup guide must not claim a forever-current release SHA or workflow run because any later merge would make that claim stale.

For every repository candidate:

- use the exact PR head's complete `QUALITY GATE` run as candidate evidence;
- verify the post-merge `master` SHA independently;
- treat evidence from older SHAs as historical only;
- use GitHub issue #11, **Launch certification: hosted verification and operating controls**, as the mutable ledger for the current unrestricted-launch state.

Repository CI certifies the repository-owned local runtime contract and exact application build. It does not by itself certify an internet-facing deployment. A public release additionally requires deployment verification against the real HTTPS production origin and the same immutable deployed revision.
