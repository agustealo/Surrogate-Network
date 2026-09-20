# Project Manifest

## Product

**Surrogate Network** is a needs-based social companion platform. Members publish Needs and Offers, discover compatible people, form explicit Proposals, establish Surrogacies, schedule Moments, record Exchanges, and build trust through Feedback.

Canonical lifecycle:

```text
Need + Offer -> Discovery -> Proposal -> Surrogacy -> Moment -> Exchange -> Feedback
```

Progression, tokens, notifications, media permissions, moderation, and administration support that lifecycle. They are not parallel product models.

## Engineering methodology

The project follows these non-negotiable rules:

1. **Runtime truth over presentation.** A consumer-visible control must execute real logic or be absent/disabled with an honest state. Production UI must never present fabricated users, counts, health, messages, rewards, reports, balances, or activity as live data.
2. **One canonical implementation.** Routes, navigation, domain rules, persistence contracts, authorization, and state transitions each have one source of truth. Duplicate implementations are removed rather than synchronized.
3. **Dependency direction points inward.** UI depends on application use cases; application depends on domain/repository contracts; infrastructure implements those contracts. Domain code must not import Supabase, Next.js, or presentation code.
4. **Server authority for privileged state.** Tokens, XP, ranks, verification, moderation, restrictions, audit records, and administrative mutations are server-authoritative and auditable. The browser never calculates or writes authoritative economic/security state.
5. **RLS is mandatory, not decorative.** User-scoped data access is performed with the request-scoped Supabase client so Row Level Security evaluates the authenticated user. The service-role client is reserved for narrowly scoped trusted system/admin commands.
6. **No silent demo fallback.** Tests may own fixtures. Production and development runtime must use real local/remote Supabase data. A backend failure renders a real error or empty state, never invented consumer data.
7. **Schema changes are migrations.** The `supabase/migrations` directory is the database history. Dashboard-only schema edits are not accepted.
8. **Exact-head certification.** A release candidate is the exact commit that passed dependency audit, typecheck, lint, unit/component/security/navigation tests, production build, the fresh-database two-member E2E trial, accessibility smoke, and the aggregate quality gate. Evidence from an earlier SHA is historical only.
9. **Small modules, explicit contracts.** Avoid `any`, god services, mega-pages, implicit globals, and cross-surface imports. Prefer typed repositories, use cases, pure domain functions, and focused components.
10. **Docs are part of the product.** Architectural changes update this manifest and the relevant architecture/data/development documents in the same change. Documentation must not certify a release before the exact-head gate has actually passed.

## Canonical stack

- Next.js App Router + React + TypeScript
- Supabase Auth, PostgreSQL, Storage, Realtime, and RLS
- Repository interfaces under `src/repositories`
- Supabase adapters under `src/infrastructure/supabase`
- Application orchestration under `src/application`
- Canonical domain definitions under `src/domain`
- Public, member, and admin UI surfaces under `src/app`
- Jest + Testing Library + Playwright
- GitHub Actions as the release quality gate

Firebase is not part of the architecture.

## Surface ownership

- **Public:** marketing, principles, safety, authentication, public discovery, trial Terms and Privacy Notice.
- **Member:** authenticated consumer experience only, including explicit trial consent and account lifecycle controls.
- **Admin:** separate authorized operational console. Moderation and other privileged operations never leak into the member shell.

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
infrastructure (Supabase)
```

Forbidden dependencies include domain -> infrastructure, member -> admin UI, public -> admin UI, client -> service-role credentials, and presentation -> direct privileged mutations.

## Production data policy

Production code must not contain consumer-facing mock/demo/sample records. Fixtures belong in test-only modules or database seed tooling. Placeholder routes must not be linked as shipped features. Placeholder image hosts are not production media storage.

## Consumer-trial readiness

A consumer-trial candidate must have real authentication; explicit age/Terms/Privacy consent; real Need/Offer/Proposal/Surrogacy/Moment/Exchange/Feedback persistence; database-enforced member authority; blocking/reporting; an actionable admin moderation queue; suspension and self-deactivation boundaries; honest public/member navigation; privacy and safety surfaces; responsive/accessibility smoke coverage; and exact-head CI certification of the canonical two-member journey on a freshly migrated database.

Features that are not complete enough for the trial must be absent from primary navigation rather than simulated. Messaging and Rewards may retain truthful non-primary routes while their production behavior remains incomplete.

## Definition of market-ready

A broader market release requires everything in the consumer-trial bar plus hardened account recovery and deletion/export policy; production observability and error reporting; rate and abuse controls; backup/recovery procedures; production media/storage lifecycle; operational runbooks; and any additional compliance or support processes required by the deployed product.

Anything below the relevant bar must be described by its actual state rather than labeled production-ready.
