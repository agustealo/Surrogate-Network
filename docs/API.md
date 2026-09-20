# Application API and Authority Reference

This repository does not currently publish a stable external HTTP API contract for third-party consumers. The authoritative application API is the set of internal server actions, repository contracts, Supabase adapters, and migration-managed PostgreSQL functions that power the Next.js product.

Do not treat old Firestore service examples as current API documentation.

## Request flow

Typical member flow:

```text
Client/server UI
    -> application action
    -> authenticated member context
    -> repository or trusted PostgreSQL function
    -> PostgreSQL/RLS
    -> result + route revalidation
```

Typical admin flow:

```text
Admin UI
    -> application action
    -> authenticated human admin check
    -> narrowly scoped service-role/RPC call
    -> PostgreSQL transaction
    -> audit evidence
```

## Supabase clients

### Browser client

Used only for browser-safe Supabase operations with the public project configuration.

### Request-scoped server client

Created in `src/infrastructure/supabase/server.ts`. It preserves the authenticated session and is the canonical client for member-scoped server reads/writes where RLS should evaluate the caller.

### Service-role client

Also created server-side. It bypasses RLS and is reserved for narrowly scoped trusted operations.

Rules:

- never expose the service-role key to the browser;
- never use the service-role client to determine the current human user;
- authenticate the human first, then invoke trusted authority;
- do not replace RLS with ad hoc application filtering.

## Application action modules

Current server-side action boundaries live under `src/application/actions/`.

### `marketplaceActions.ts`

Owns member marketplace commands such as Need, Offer, and Proposal operations.

### `connectionActions.ts`

Owns Surrogacy lifecycle operations including Moment, Exchange, and Feedback commands.

### `safetyActions.ts`

Owns member safety operations such as reports and blocking/unblocking.

### `moderationActions.ts`

Owns admin report moderation commands after human-admin verification.

### `trialPolicyActions.ts`

Owns current trial Terms/Privacy/age-consent acceptance for existing members.

### `accountLifecycleActions.ts`

Owns voluntary trial participation/deactivation/reactivation.

### `memberContext.ts`

Resolves and validates the current member boundary, including suspension/deactivation requirements.

### `adminContext.ts`

Resolves and validates the current human admin before privileged operations.

These modules are the use-case entry points. Do not add a second command layer for the same responsibility.

## Repository contracts

Repository interfaces under `src/repositories/` currently include:

- `ProfileRepository`
- `NeedRepository`
- `OfferRepository`
- `ProposalRepository`

Supabase adapters live under `src/infrastructure/supabase/repositories/`.

Repository interfaces should express persistence needs without importing presentation code.

## PostgreSQL function boundary

Complex state changes are migration-managed PostgreSQL functions/RPCs. They exist to provide transactionality and central authority for operations that span multiple records or protected fields.

Current examples include functions for:

- proposal transition and acceptance;
- Moment creation/cancellation/completion;
- Exchange creation;
- Feedback submission;
- report moderation;
- trial-policy acceptance;
- account participation/deactivation;
- blocking checks;
- abuse/rate-limit enforcement.

The exact database function signatures are defined by `supabase/migrations/` and reflected in generated `src/infrastructure/supabase/database.types.ts`.

Do not maintain a separate handwritten RPC signature catalog in this document. The generated types are canonical.

## Proposal lifecycle contract

The Proposal API is deliberately not a generic client-side update endpoint.

- creation validates legitimate Need/Offer ownership/pairing;
- status transitions are actor/state aware;
- acceptance is server/database authoritative;
- acceptance atomically creates the Surrogacy relationship and related evidence;
- direct authenticated-client mutation of protected transition fields is not the authority model.

## Relationship lifecycle contract

Surrogacy operations are contextual and authenticated.

- Moments belong to a Surrogacy.
- Exchanges are recorded in Surrogacy/Moment context.
- Feedback is tied to an Exchange/Surrogacy and participant relationship.
- protected progression/reputation side effects remain server/database authoritative.

## Safety API contract

### Blocking

Blocking is persisted and enforced by the data layer. It is not a presentation-only mute.

### Reports

Member report creation is user-scoped. Report status/outcome mutation belongs to trusted moderation authority.

### Moderation

A moderation action requires:

1. current authenticated user;
2. human admin verification;
3. trusted database operation;
4. audit evidence.

Normal authenticated members cannot directly invoke the privileged moderation RPC.

## Account and consent contract

Trial policy acceptance and account participation state are protected fields.

Clients cannot directly forge:

- current policy acceptance/version timestamps;
- age-confirmation acceptance;
- suspension state;
- voluntary deactivation state.

These transitions use trusted server/database authority.

## Public profile contract

Do not expose the full `profiles` row cross-user.

Public/member discovery uses the restricted `public_profiles` projection, which excludes private/account-authority fields and participates in blocking/privacy enforcement.

## Errors and UI behavior

Application actions should return/throw truthful errors. The UI must not convert backend failure into fake success or invented records.

Expected categories include:

- unauthenticated;
- unauthorized/permission denied;
- validation failure;
- missing resource;
- invalid state transition;
- blocked/suspended/deactivated participation;
- rate/abuse limit rejection;
- persistence failure.

User-facing error wording may differ, but authority semantics must remain intact.

## Adding a new application API

Before adding a new action or RPC:

1. identify the canonical owner of the responsibility;
2. decide whether RLS-scoped repository access or trusted RPC authority is required;
3. avoid duplicating an existing action/repository path;
4. validate actor and target relationships;
5. make multi-row privileged changes transactional;
6. add security/regression coverage;
7. update migrations and generated types if the database contract changes;
8. update this document only with stable architectural boundaries, not speculative future endpoints.

## Source-of-truth order

When documentation and code disagree, fix the documentation/code divergence. For current API truth, inspect in this order:

1. `supabase/migrations/`
2. `src/infrastructure/supabase/database.types.ts`
3. `src/application/actions/`
4. `src/repositories/`
5. `src/infrastructure/supabase/repositories/`
6. tests proving the relevant authority boundary

Exact-head CI remains the release evidence for those contracts.
