# Surrogate Network Architecture

## Product model

Surrogate Network is a needs-based social companion platform. The canonical consumer lifecycle is:

```text
Need + Offer -> Discovery -> Proposal -> Surrogacy -> Moment -> Exchange -> Feedback
```

The architecture is designed around that lifecycle. Progression, moderation, notifications, permissions, and administration support it; they are not separate product models.

## Canonical stack

- Next.js 16 App Router
- React 19
- TypeScript
- Supabase Auth
- PostgreSQL
- Row Level Security
- Supabase Storage/Realtime where used
- Jest + Testing Library
- Playwright
- GitHub Actions

Firebase and Genkit are not part of the current runtime architecture.

## Application surfaces

### Public

Primary public navigation owns:

- Home
- How It Works
- Explore
- Principles
- Safety
- Sign In
- Join

Public routes also include trial Terms/Privacy and public profile projection as required by the flow.

### Member

Primary member navigation owns:

- Home
- Discover
- Proposals
- Connections (`/surrogacies`)
- Needs
- Offers
- Profile
- Settings

Mobile navigation exposes the same core member experience with explicit Need/Offer create actions.

Messaging and Rewards are intentionally not in primary navigation while their production behavior is incomplete. Existing non-primary routes must render truthful unavailable/history states rather than fake data.

### Admin

The admin console is a separate authorized surface. Its current primary navigation is intentionally narrow:

- Dashboard
- Reports

Moderation operations run through authenticated admin verification plus trusted server/database authority. Member UI must not import or expose admin controls.

## Dependency direction

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

### Presentation

`src/app` and `src/components` render the product and collect input. They must not own privileged business state or duplicate database rules.

### Application

`src/application` coordinates use cases, member/admin context checks, revalidation, and calls into repositories or trusted database functions.

### Domain

`src/domain` defines product vocabulary and business-facing types. Domain code should not depend on Supabase or Next.js.

### Repository contracts

`src/repositories` contains the current persistence interfaces:

- `ProfileRepository`
- `NeedRepository`
- `OfferRepository`
- `ProposalRepository`

### Infrastructure

`src/infrastructure/supabase` owns:

- browser client;
- request-scoped server client;
- privileged service client;
- middleware/session integration;
- generated database types;
- Supabase repository implementations.

## Supabase authority model

### Request-scoped client

The request-scoped server client preserves the authenticated member session. Use it for user-authorized data access so RLS remains authoritative.

### Service-role client

The service-role client bypasses RLS and is therefore restricted to narrowly scoped trusted system/admin operations. It must never be used to infer who the current human user is.

### Database functions

Complex privileged transitions are implemented as migration-managed PostgreSQL functions so multi-row state changes remain atomic and auditable.

Examples include:

- proposal transition/acceptance;
- Moment/Exchange/Feedback lifecycle operations;
- report moderation;
- trial-policy acceptance;
- account participation/deactivation.

Function execution grants are part of the security model. Sensitive functions must not inherit broad PUBLIC/authenticated execution by accident.

## Marketplace lifecycle authority

### Need and Offer

Members create and manage their own marketplace records through authenticated actions/repositories under RLS.

### Proposal

Proposal creation validates that the Need/Offer pair and participants are legitimate. Clients do not own authoritative status transitions.

### Acceptance

Proposal acceptance is transactional. The trusted database path updates the proposal and related capacity/fulfillment state, creates the Surrogacy and participants, and records audit/outbox evidence as one authority boundary.

### Surrogacy, Moment, Exchange, Feedback

Downstream relationship operations use trusted lifecycle functions/actions rather than scattered direct table writes. Feedback is bound to completed Exchange context.

## Safety and privacy

### Public profiles

Public member discovery reads a restricted projection rather than the full `profiles` row. Private and authority fields such as email, XP/tokens, admin flags, consent state, and suspension state must not leak cross-user.

### Blocking

Blocking is persisted and enforced at the data boundary. It affects discoverability and relationship initiation, not merely UI presentation.

### Reports and moderation

Members can create safety reports. Admin moderation is isolated to the admin surface and performs trusted atomic state changes with audit evidence.

### Suspension and self-deactivation

Moderation suspension and voluntary trial deactivation are separate states. Database checks enforce both. Historical relationship records remain available where appropriate, while new participation is blocked.

### Trial consent

Current trial Terms/Privacy/age confirmation is explicit and stored through trusted authority. It is distinct from suspension/identity validity.

## Navigation ownership

`src/navigation/index.ts` is the canonical navigation registry. Route existence does not automatically make a route a primary shipped feature.

Navigation tests protect:

- public/member/admin ownership;
- primary route integrity;
- shell isolation;
- mobile member navigation.

Do not hardcode a second menu registry in another component.

## Database/schema ownership

`supabase/migrations` is the canonical schema and security history.

`src/infrastructure/supabase/database.types.ts` is generated from the migrated local database. CI regenerates this file and rejects drift.

A schema change is incomplete until:

1. the migration exists;
2. a clean database can replay all migrations;
3. security regression tests pass;
4. generated database types match the schema.

## Browser security

`next.config.ts` owns response security headers, including the current CSP and anti-framing/content-sniffing/referrer/permissions controls.

Browser security is part of the product boundary. Do not loosen headers solely to silence a failing integration without understanding the required source.

## CI architecture

The release rail is intentionally layered:

1. INSTALL
2. DEPENDENCY AUDIT / TYPECHECK / LINT / UNIT / COMPONENT / SECURITY / NAVIGATION
3. BUILD
4. E2E TRIAL + A11Y
5. QUALITY GATE

SECURITY starts a fresh Supabase runtime, replays migrations, runs security tests, regenerates database types, and rejects schema drift.

E2E TRIAL rebuilds a fresh runtime and proves the canonical two-member lifecycle in Chromium.

Any commit change invalidates earlier exact-head evidence.

## Deferred/non-primary systems

The following should remain outside primary product claims until production behavior is complete:

- Messaging
- Rewards/economic UX
- broader community/governance systems
- advanced automated trust/fraud systems
- additional admin modules beyond the current operational console

Deferred systems must not be simulated with consumer-facing fake data.

## Architecture change rule

When architecture changes, update this document, `docs/PROJECT_MANIFEST.md`, and any affected development/data/API docs in the same change. Remove obsolete guidance rather than preserving contradictory active documentation.
