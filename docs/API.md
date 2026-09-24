# Application API and Authority Reference

This repository does not currently publish a stable external business HTTP API for third-party consumers. The authoritative application API is the set of internal server actions, repository contracts, Supabase adapters, migration-managed PostgreSQL functions, and the small operational health surface used by deployment infrastructure.

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

Operational health flow:

```text
host/operator
    -> /api/health/live or /api/health/ready
    -> request correlation
    -> process/config/dependency check
    -> no-store JSON response
```

## Operational HTTP endpoints

These endpoints exist for runtime/deployment operations, not as a consumer data API.

### `GET /api/health/live`

Purpose: application-process liveness only.

Successful response:

```json
{
  "status": "alive",
  "revision": "<sanitized git revision or null>"
}
```

Properties:

- does not depend on Supabase readiness;
- bypasses the normal Supabase auth-refresh path;
- returns `Cache-Control: no-store`;
- retains `x-request-id` correlation;
- sets no member session cookie;
- may expose only sanitized non-secret release revision metadata.

### `GET /api/health/ready`

Purpose: traffic/dependency readiness.

Ready response:

```json
{
  "status": "ready",
  "revision": "<sanitized git revision or null>",
  "checks": {
    "runtimeConfig": "ok",
    "supabase": "ok"
  }
}
```

Failure returns HTTP `503` with `status: "not_ready"` and coarse check states only. Credentials and raw upstream exceptions are never returned.

Readiness validates the required server runtime config and probes the real anonymous Supabase `public_profiles` data-plane contract. It deliberately does not exercise service-role authority merely to report health.

### Release revision sources

Operational revision metadata resolves in this order:

1. `SURROGATE_RELEASE_SHA`
2. `VERCEL_GIT_COMMIT_SHA`
3. `GITHUB_SHA`

Only 7-64 hexadecimal revision strings are accepted for exposure.

## Supabase clients

### Browser client

Used only for browser-safe Supabase operations with canonical public project configuration.

### Request-scoped server client

Created in `src/infrastructure/supabase/server.ts`. It preserves the authenticated session and is the canonical client for member-scoped server reads/writes where RLS should evaluate the caller.

### Service-role client

Created server-side from the server-only runtime-config boundary. It bypasses RLS and is reserved for narrowly scoped trusted operations.

Rules:

- never expose the service-role key to the browser;
- never use the service-role client to determine the current human user;
- authenticate the human first, then invoke trusted authority;
- do not replace RLS with ad hoc application filtering.

## Runtime configuration contract

`src/infrastructure/config/runtimeConfig.ts` owns:

- `NEXT_PUBLIC_SUPABASE_URL` validation/normalization;
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` presence.

`src/infrastructure/config/serverRuntimeConfig.ts` extends that boundary with required server-only `SUPABASE_SERVICE_ROLE_KEY`.

Consumers should not create parallel environment parsers for these variables.

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

Owns member participation state plus the authenticated boundaries for export/deletion orchestration.

Password recovery uses dedicated auth/recovery routes and server action logic rather than a generic member-state update.

### `memberContext.ts`

Resolves and validates the current member boundary, including suspension/deactivation/deletion requirements.

### `adminContext.ts`

Resolves and validates the current human admin before privileged operations.

These modules are use-case entry points. Do not add a second command layer for the same responsibility.

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
- terminal account-deletion preparation and external Auth cleanup evidence;
- blocking checks;
- abuse/rate-limit enforcement.

The exact database function signatures are defined by `supabase/migrations/` and reflected in generated `src/infrastructure/supabase/database.types.ts`.

Do not maintain a second handwritten RPC signature catalog here. Generated types are canonical.

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

The anonymous public-profile projection may execute only the null/same-user-safe block-helper shape required to evaluate anonymous projection rows. It may not probe concrete anonymous block-state pairs.

### Reports

Member report creation is user-scoped. Report status/outcome mutation belongs to trusted moderation authority.

### Moderation

A moderation action requires:

1. current authenticated user;
2. human admin verification;
3. trusted database operation;
4. audit evidence.

Normal authenticated members cannot directly invoke privileged moderation RPCs.

## Account and consent contract

Clients cannot directly forge:

- current policy acceptance/version timestamps;
- age-confirmation acceptance;
- suspension state;
- voluntary deactivation state;
- terminal deletion timestamp;
- post-deletion reactivation.

Permanent deletion is database-first: direct member content is redacted and the profile becomes a retained tombstone before external Auth deletion is attempted. Shared relationship/safety/audit history may remain in redacted/tombstoned form where referential/product integrity requires it.

Stale authenticated tokens do not retain direct table mutation authority after restricted/deactivated/deleted states.

## Public profile contract

Do not expose the full `profiles` row cross-user.

Public/member discovery uses the restricted `public_profiles` projection, which excludes private/account-authority fields and participates in blocking/privacy/suspension/deactivation/deletion enforcement.

## Errors and UI behavior

Application actions should return/throw truthful errors. UI must not convert backend failure into fake success or invented records.

Expected categories include:

- unauthenticated;
- unauthorized/permission denied;
- validation failure;
- missing resource;
- invalid state transition;
- blocked/suspended/deactivated/deleted participation;
- rate/abuse limit rejection;
- persistence/dependency failure.

User-facing error wording may differ, but authority semantics must remain intact.

Production request-error events are structured and request-correlated. Query strings and raw production exception message/stack content are intentionally excluded from the application event payload.

## Deployment verification contract

`scripts/verify-deployment.mjs` performs read-only validation of a hosted target. It checks:

- liveness/readiness;
- exact reported git revision;
- request correlation;
- no-store/cookie-free health behavior;
- public authentication/recovery routes;
- production CSP and response-security headers.

The manual GitHub **Deployment Verification** workflow runs this script from the exact workflow revision. A target that reports a different revision fails verification.

This is an operational certification surface, not a third-party product API.

## Adding a new application API

Before adding a new action or RPC:

1. identify the canonical owner of the responsibility;
2. decide whether RLS-scoped repository access or trusted RPC authority is required;
3. avoid duplicating an existing action/repository path;
4. validate actor and target relationships;
5. make multi-row privileged changes transactional;
6. add security/regression coverage;
7. update migrations/generated types if the database contract changes;
8. update operational health/readiness if the new dependency becomes launch-critical;
9. update this document only with stable architectural boundaries, not speculative future endpoints.

## Source-of-truth order

When documentation and code disagree, fix the divergence. For current API truth, inspect in this order:

1. `supabase/migrations/`
2. `src/infrastructure/supabase/database.types.ts`
3. `src/application/actions/`
4. `src/repositories/`
5. `src/infrastructure/supabase/repositories/`
6. `src/infrastructure/config/`, `health/`, `observability/`, and `operations/` for runtime/operational contracts
7. tests proving the relevant boundary

Exact-head CI remains repository release evidence. Hosted release evidence additionally requires deployment verification against the real target.
