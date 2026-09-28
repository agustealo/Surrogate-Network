# Project Manifest

## Product

**Surrogate Network** is a needs-based social companion platform. Members publish Needs and Offers, discover compatible people, form explicit Proposals, establish Surrogacies (shown to consumers as Connections), schedule Moments, record Exchanges, and build trust through Feedback.

Canonical lifecycle:

```text
Need + Offer -> Discovery -> Proposal -> Surrogacy -> Moment -> Exchange -> Feedback
```

Rewards/progression, moderation, administration, account lifecycle, safety, and operational controls support that lifecycle. They are not parallel product models.

Messaging, token economy, generic notifications, and media are not current consumer features. Dormant database/UI implementations for those concepts are removed rather than hidden behind direct URLs or described as shipped capability.

## Engineering methodology

The project follows these non-negotiable rules:

1. **Runtime truth over presentation.** A consumer-visible control executes real logic or does not ship. The product never presents fabricated users, counts, health, messages, rewards, reports, balances, or activity as live data.
2. **One canonical implementation.** Routes, navigation, domain rules, persistence contracts, runtime configuration, authorization, and state transitions each have one owner. Duplicate implementations are removed rather than synchronized.
3. **Dependency direction points inward.** UI depends on application use cases; application depends on domain/repository contracts; infrastructure implements those contracts. Domain code does not import Supabase, Next.js, or presentation code.
4. **Server/database authority for privileged state.** XP, rank, verification, moderation, restrictions, account tombstones, audit records, and administrative mutations are authoritative outside the browser.
5. **Data API grants and RLS are both mandatory.** PostgreSQL grants define reachable operations; RLS defines reachable rows. Column grants and trusted RPCs protect authoritative fields.
6. **No silent demo fallback.** Tests may own fixtures. Product runtime uses real persisted state. Failure produces a real error/empty/unavailable state, never invented consumer data.
7. **No canonical seed data.** `supabase/seed.sql` is intentionally absent. Consumer records used in E2E are created through explicit test/application setup and do not silently appear in normal startup.
8. **Schema changes are migrations.** `supabase/migrations` is database/security history. Dashboard-only schema edits are not accepted.
9. **Repository-owned Supabase configuration.** `supabase/config.toml` owns local service configuration. `.env.local` is generated from the running local stack and remains uncommitted.
10. **Exact-head certification.** A release candidate is the exact commit that passes dependency audit, typecheck, lint, tests, clean migration replay, production build, E2E trial, accessibility smoke, and aggregate QUALITY GATE.
11. **Deployed revision truth.** A hosted release is not certified until its immutable deployed revision is verified against the repository release SHA.
12. **Small modules, explicit contracts.** Avoid `any`, god services, mega-pages, implicit globals, and cross-surface ownership.
13. **Docs are part of the product.** Documentation describes the final runtime, not historical migration residue or roadmap ideas.

## Canonical stack

- Next.js 16 App Router + React 19 + TypeScript
- Supabase Auth + PostgreSQL + Row Level Security
- Explicit PostgreSQL Data API grants owned by migrations
- Local Supabase service configuration under `supabase/config.toml`
- Repository interfaces under `src/repositories`
- Supabase adapters under `src/infrastructure/supabase`
- Runtime config under `src/infrastructure/config`
- Health/observability/operations under `src/infrastructure/health`, `src/infrastructure/observability`, and `src/infrastructure/operations`
- Application orchestration under `src/application`
- Canonical domain definitions under `src/domain`
- Public/member/admin UI surfaces under `src/app`
- Jest + Testing Library + Playwright
- GitHub Actions as release verification authority

Firebase and Genkit are not part of the architecture.

Storage, Realtime, Edge Runtime, analytics, and Studio AI integration are disabled in the canonical local Supabase configuration because no shipped feature currently owns those lifecycles.

## Surface ownership

### Public

Marketing, How It Works, Explore, Principles, Safety, authentication, password recovery, public profile discovery, Terms, and Privacy.

### Member

Authenticated consumer experience, explicit trial consent, Needs/Offers, discovery, Proposals, Connections, Moments, Exchanges, Feedback, Rewards & Progress, safety controls, account export/deactivation/deletion, profile, and settings.

### Admin

Separate authorized operational console for live operational counts and moderation. Admin authority never leaks into the member shell.

### Operations

Health endpoints, request correlation, structured error telemetry, recovery tooling, release evidence, and deployment verification. These are infrastructure, not consumer features.

## Runtime boundaries

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

Forbidden dependencies include domain -> infrastructure, member -> admin UI, public -> admin UI, client -> service-role credentials, and presentation -> direct privileged mutations.

## Product surface policy

A feature may be present in consumer navigation only when its end-to-end behavior exists, is persisted, authorized, tested, and has honest failure/empty states.

Current decisions:

- **Rewards & Progress:** shipped. It reads real `member_progression` and `xp_transactions` state and is surfaced through member navigation, dashboard, and account menu.
- **Messaging:** not shipped. There is no `/messages` placeholder route.
- **Notifications:** not shipped. The dormant notifications table/type and Data API privileges are retired from the final schema.
- **Token economy:** not shipped. Token transaction state, profile token balance, and token mutation authority are retired from the final schema.
- **Media:** not shipped. Metadata-only media tables were retired previously; Storage remains disabled until a complete object lifecycle exists.
- **Intelligence/compatibility prediction:** not shipped. Dormant scaffolding with assumed metrics or placeholder prediction identifiers is removed.

Historical migrations may contain earlier versions of retired concepts. Historical SQL is not the current feature inventory. The final migrated schema and generated database types are authoritative.

## Supabase local configuration contract

The canonical local setup is:

```bash
npm ci
npm run local:up
npm run local:reset
npm run dev
```

`npm run local:up` starts Supabase from `supabase/config.toml` and generates `.env.local` from `supabase status -o env`.

The environment generator:

- accepts only loopback local Supabase/Mailpit URLs;
- writes the public local URL/key and server-only service-role key;
- restricts `.env.local` file permissions;
- never commits credentials;
- does not create a second hand-maintained configuration authority.

The local stack is development/CI infrastructure. It must not be exposed directly to public traffic. Production hosting may use a hardened database/Auth deployment, but the schema, grants, policies, and configuration contract remain repository-owned.

## Supabase Data API authority

- `anon` may reach only intentionally public projections required by the shipped public experience.
- `authenticated` receives explicit relation/operation grants for current member flows; RLS still filters rows.
- authoritative lifecycle/status/reputation/account fields remain protected by column ACLs and trusted RPC/trigger paths.
- `service_role` remains server-only trusted authority and never ships to browser code.
- future `public` objects are private to API roles until their migration explicitly grants the required surface.

## Account lifecycle policy

- Password recovery uses Supabase email + PKCE exchange and a recovery-session-gated password update.
- Self-deactivation is reversible and distinct from moderation suspension.
- Permanent deletion is terminal and database-first.
- Direct member/profile/listing content is redacted before external Auth cleanup.
- Shared relationship/safety/moderation/audit records may remain as tombstoned/redacted history where deleting them would damage counterpart history or platform integrity.
- Stale JWTs must not regain direct mutation authority after deactivation/deletion.
- External Auth cleanup failures remain operationally visible rather than pretending deletion completed everywhere.

## Runtime health and observability

- `/api/health/live`: process liveness only; does not require Supabase.
- `/api/health/ready`: required runtime config plus real anonymous Supabase data-plane readiness.
- Every dynamic request receives a validated/generated request ID.
- Production request errors are structured and request-correlated.
- Raw sensitive exception/query details are excluded from public error surfaces.
- Member/admin route groups have visible loading feedback for server-backed navigation.
- Global failure recovery uses current Surrogate Network branding and exposes a safe digest when available.

Readiness fails closed. It is never an unconditional deployment-green endpoint.

## Recovery boundary

Repository CI proves logical application-data recovery for the app-owned `public` schema using canonical migrations and a transactional restore drill.

Repository CI does **not** prove external-provider Auth recovery, provider backup/PITR policy, or a full hosted production restoration. Those require deployment-owner/provider evidence as documented in `docs/PRODUCTION_RECOVERY.md`.

## Consumer-trial readiness contract

A consumer-trial candidate requires:

- real authentication and recovery behavior;
- explicit age/Terms/Privacy consent;
- real Need/Offer/Proposal/Surrogacy/Moment/Exchange/Feedback persistence;
- visible real Rewards/Progression behavior;
- blocking/reporting and actionable admin moderation;
- suspension/self-deactivation/deletion boundaries;
- honest public/member/admin navigation;
- privacy/safety surfaces and member account export;
- responsive/accessibility coverage;
- visible route transition/failure states;
- clean database migration replay without seed data;
- production build against a real local Supabase runtime;
- canonical two-member E2E journey;
- exact-head QUALITY GATE.

Incomplete roadmap features are absent, not hidden behind direct routes or partially retained as product-like database authority.

## Visual evidence contract

The consumer E2E rail captures 16 real runtime PNG frames spanning public, member, relationship, safety, account, admin, moderation, and Principles surfaces. CI uploads those exact PNGs as the `consumer-visual-evidence` artifact.

Reviewed documentation may promote those individual source PNGs. It must not replace them with stitched mockups, browserless recreations, or hand-built approximations. Historical screenshot provenance remains documented in `docs/VISUAL_EVIDENCE.md`.

Visual evidence never substitutes for exact-head CI or hosted deployment proof.

## Definition of unrestricted market-ready

A broader market release requires the repository consumer-trial bar plus external operating proof:

- protected default branch requiring the aggregate QUALITY GATE;
- exact hosted-deployment verification tied to immutable release provenance;
- recorded provider backup/PITR policy and provider-level restore rehearsal;
- verified real outbound password-recovery email delivery/domain configuration;
- production alerting/on-call/support/moderation/privacy ownership;
- tested incident and rollback escalation;
- any organization-specific privacy/compliance/support process.

Repository code must not claim those external facts until evidence exists.

## Release evidence rule

There are two separate proofs:

1. **Repository candidate proof:** exact SHA passes the complete CI `QUALITY GATE`.
2. **Hosted deployment proof:** Deployment Verification confirms the real target reports that same immutable revision and satisfies the runtime/header/readiness contract.

Both are required before claiming a specific hosted release corresponds to a specific green repository revision.
