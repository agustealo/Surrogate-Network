# Project Manifest

## Product

**Surrogate Network** is a needs-based social companion platform. Members publish Needs and Offers, discover compatible people, form explicit Proposals, establish Surrogacies, schedule Moments, record Exchanges, and build trust through Feedback.

Canonical lifecycle:

```text
Need + Offer -> Discovery -> Proposal -> Surrogacy -> Moment -> Exchange -> Feedback
```

Progression, tokens, notifications, moderation, administration, account lifecycle, and operational controls support that lifecycle. They are not parallel product models.

The current product does not ship a generic media subsystem. Any future media feature must begin with an explicit object-storage ownership, authorization, deletion, and recovery contract rather than reviving arbitrary URL metadata.

## Engineering methodology

The project follows these non-negotiable rules:

1. **Runtime truth over presentation.** A consumer-visible control must execute real logic or be absent/disabled with an honest state. Production UI must never present fabricated users, counts, health, messages, rewards, reports, balances, or activity as live data.
2. **One canonical implementation.** Routes, navigation, domain rules, persistence contracts, runtime configuration, authorization, and state transitions each have one source of truth. Duplicate implementations are removed rather than synchronized.
3. **Dependency direction points inward.** UI depends on application use cases; application depends on domain/repository contracts; infrastructure implements those contracts. Domain code must not import Supabase, Next.js, or presentation code.
4. **Server authority for privileged state.** Tokens, XP, ranks, verification, moderation, restrictions, account tombstones, audit records, and administrative mutations are server/database authoritative and auditable. The browser never calculates or writes authoritative economic/security state.
5. **Data API grants and RLS are both mandatory.** PostgreSQL grants define which Supabase/PostgREST objects and operations each API role can reach; RLS defines which rows an allowed caller can access. Column grants and trusted RPCs fence authoritative fields. The project does not rely on Supabase's implicit/default grants for application authority.
6. **No silent demo fallback.** Tests may own fixtures. Production and development runtime must use real local/remote Supabase data. A backend failure renders a real error/empty/unavailable state, never invented consumer data.
7. **Schema changes are migrations.** `supabase/migrations` is the database/security history. Dashboard-only schema edits are not accepted. New public database objects are private to API roles until their owning migration explicitly grants the shipped surface.
8. **Exact-head certification.** A release candidate is the exact commit that passed dependency audit, typecheck, lint, unit/component/security/navigation tests, production build, recovery drill, fresh-database E2E trial, accessibility smoke, and aggregate QUALITY GATE. Evidence from an earlier SHA is historical only.
9. **Deployed revision truth.** A hosted release is not certified until the target reports an immutable deployed git revision and the repository deployment verifier confirms that revision and runtime contract.
10. **Small modules, explicit contracts.** Avoid `any`, god services, mega-pages, implicit globals, and cross-surface imports. Prefer typed repositories, use cases, pure domain functions, and focused components.
11. **Docs are part of the product.** Architectural/operational changes update this manifest and relevant docs in the same change. Documentation must not certify evidence that has not actually passed.

## Canonical stack

- Next.js 16 App Router + React 19 + TypeScript
- Supabase Auth + PostgreSQL + Row Level Security
- Explicit PostgreSQL Data API grants owned by migrations
- Supabase platform services only when a shipped feature owns their lifecycle contract
- Repository interfaces under `src/repositories`
- Supabase adapters under `src/infrastructure/supabase`
- Runtime config under `src/infrastructure/config`
- Health/observability/operations under `src/infrastructure/health`, `src/infrastructure/observability`, and `src/infrastructure/operations`
- Application orchestration under `src/application`
- Canonical domain definitions under `src/domain`
- Public/member/admin UI surfaces under `src/app`
- Jest + Testing Library + Playwright
- GitHub Actions as release/deployment verification authority

Firebase and Genkit are not part of the architecture.

## Surface ownership

- **Public:** marketing, principles, safety, authentication, password recovery, public discovery, trial Terms and Privacy Notice.
- **Member:** authenticated consumer experience, explicit trial consent, marketplace/relationship flows, safety controls, export/deactivation/deletion.
- **Admin:** separate authorized operational console. Moderation and privileged operations never leak into the member shell.
- **Operations:** health endpoints, request correlation, structured error telemetry, recovery tooling, and deployment verification are operational infrastructure, not consumer feature surfaces.
- **Shared presentation shells:** reusable public/member chrome may be shared as presentation components, but authorization remains owned by the canonical route/layout policy. The public profile route may choose public or member chrome from session state; it does not become a second account-policy or authorization authority.

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

## Production data policy

Production code must not contain consumer-facing mock/demo/sample records. Fixtures belong in test-only modules or database seed tooling. Placeholder routes must not be linked as shipped features. Placeholder image hosts or arbitrary URL metadata are not production media storage.

## Supabase Data API authority

Surrogate Network owns its Data API privilege surface in migrations rather than inheriting provider defaults.

- `anon` may reach only the intentionally public projection(s) required by the shipped public experience.
- `authenticated` receives explicit relation/operation grants for current member flows; RLS still filters rows.
- authoritative lifecycle/status/reputation/account fields remain protected by column ACLs and trusted RPC/trigger paths.
- `service_role` remains server-only trusted authority and must never be shipped to browser code.
- future `public` tables, functions, and sequences are private to API roles until their migration deliberately grants the required access.

A green local runtime must therefore be reproducible on a fresh Supabase project regardless of the provider's project-era automatic grant defaults.

## Account lifecycle policy

- Password recovery uses Supabase email + PKCE exchange and a recovery-session-gated password update.
- Self-deactivation is reversible and distinct from moderation suspension.
- Permanent deletion is terminal and database-first.
- Direct member/profile/listing content is redacted before external Auth cleanup.
- Shared relationship/safety/moderation/audit records may remain as tombstoned/redacted history where deleting them would damage counterpart history or platform integrity.
- Stale JWTs must not regain direct mutation authority after deactivation/deletion.
- External Auth cleanup failures remain operationally visible rather than pretending deletion completed everywhere.

## Runtime configuration and health

Public Supabase URL/anon configuration has one canonical owner. Service-role configuration has a separate server-only owner.

Health semantics are explicit:

- `/api/health/live`: process liveness only; does not require Supabase.
- `/api/health/ready`: required runtime config + real anonymous Supabase data-plane readiness.

Readiness must fail closed. Never turn it into an unconditional 200 for deployment convenience.

Health responses may expose only sanitized non-secret release provenance.

## Observability

- Every dynamic request receives a validated/generated request ID.
- Production request-error logs are structured and request-correlated.
- Query strings/fragments and raw production exception message/stack content are excluded from the application error event.
- Error fingerprints/digests exist for grouping without using sensitive raw content.
- App Router/global error boundaries provide honest user-facing failure recovery.

## Recovery boundary

Repository CI proves logical application-data recovery for the app-owned `public` schema using canonical migrations and a transactional restore drill.

Repository CI does **not** prove Supabase-managed Auth recovery, provider backup/PITR policy, Storage object recovery, or full-project provider restoration. Those require deployment-owner/provider evidence as documented in `docs/PRODUCTION_RECOVERY.md`.

## Consumer-trial readiness

A consumer-trial candidate must have real authentication; explicit age/Terms/Privacy consent; real Need/Offer/Proposal/Surrogacy/Moment/Exchange/Feedback persistence; explicit Data API grants plus database-enforced member authority; blocking/reporting; an actionable admin moderation queue; suspension/self-deactivation/deletion boundaries; honest public/member navigation; privacy/safety surfaces; account recovery/export; runtime health; responsive/accessibility coverage; and exact-head CI certification of the canonical two-member journey on a freshly migrated database.

Features that are not complete enough for the trial must be absent from primary navigation rather than simulated. Messaging and Rewards may retain truthful non-primary routes while their production behavior remains incomplete.

## Visual evidence contract

- The consumer E2E rail captures 16 real runtime PNG frames spanning public, member, relationship, safety, account, admin, moderation, and Principles surfaces.
- Source PNGs are CI evidence. They are uploaded as the `consumer-visual-evidence` artifact and are not committed as the documentation source of truth.
- Repository documentation may promote reviewed, web-optimized WebP derivatives only after the source artifact has been manually inspected.
- Documentation promotion does not replace exact-head CI. Any commit that adds or changes promoted assets or their references must itself pass the complete `QUALITY GATE` before merge.
- The current showcase derivative was produced from the fully green run **#334** artifact at `a67f0252d5a57f460716a7107ff0aed74901d739`. That parent passed SECURITY, recovery, schema/type drift checks, BUILD, E2E TRIAL, A11Y, exact local deployment verification, and aggregate `QUALITY GATE` before the documentation promotion commit was created.

## Definition of market-ready

A broader market release requires everything in the consumer-trial bar plus:

- production observability and request correlation;
- production account recovery/export/deletion controls;
- rate/abuse controls;
- logical recovery proof plus recorded provider backup/PITR policy and provider-level restore rehearsal;
- exact hosted-deployment verification tied to immutable release provenance;
- operational incident/support/rollback procedures;
- real password-recovery email/provider verification;
- repository governance preventing unproven direct pushes;
- operating-organization moderation/on-call/privacy/support ownership;
- production contracts for any additional promoted feature such as Messaging, Rewards, or media.

Repository code can implement tooling for these controls, but it must not claim deployment-owner evidence that has not actually been produced.

## Release evidence rule

There are two separate proofs:

1. **Repository candidate proof:** exact SHA passes the complete CI `QUALITY GATE`.
2. **Hosted deployment proof:** Deployment Verification confirms the real target reports that same immutable revision and satisfies the runtime/header/readiness contract.

Both proofs are required before claiming that a specific hosted release corresponds to a specific green repository revision.