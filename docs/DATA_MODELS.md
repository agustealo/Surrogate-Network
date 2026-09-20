# Data Models

Surrogate Network has three related sources of model truth:

1. `supabase/migrations/` defines the authoritative PostgreSQL schema, constraints, RLS, functions, grants, and triggers.
2. `src/infrastructure/supabase/database.types.ts` is generated from the migrated database and is the canonical TypeScript database contract.
3. `src/domain/types.ts` defines business-facing domain types used by the application.

Do not duplicate the full generated schema into prose. Generated types and migrations are more precise and are enforced by CI.

## Core lifecycle

```text
Need + Offer -> Proposal -> Surrogacy -> Moment -> Exchange -> Feedback
```

## Profile

The business-facing `Profile` contains member identity/profile information such as:

- id;
- display name;
- avatar;
- bio;
- location/availability/boundaries;
- verification/progression fields where relevant to the application.

Not every profile column is safe for cross-user reads.

### Public profile projection

Cross-user/public discovery uses a restricted `public_profiles` database projection rather than the full base profile row.

Private or authority-sensitive fields such as email, admin/suspension state, trial-consent state, XP/tokens, and similar account metadata must not be exposed through public profile reads.

### Profile authority

Member-editable descriptive fields and server-authoritative account/security fields are intentionally different categories. Database grants/RLS enforce that distinction.

## Need

Business-facing `Need` includes concepts such as:

- owner;
- title and description;
- category/tags;
- location mode;
- timing;
- boundaries;
- urgency;
- lifecycle status;
- created/expiry timestamps.

Current lifecycle statuses include active/fulfilled/paused/expired semantics.

Needs participate in Proposal pairing and accepted-proposal fulfillment state.

## Offer

Business-facing `Offer` includes:

- owner;
- title and description;
- category;
- location mode;
- timing;
- boundaries;
- capacity/current capacity;
- lifecycle status;
- reputation summary fields where rendered;
- created timestamp.

Capacity/reputation state that affects marketplace authority is not a free-form client write surface.

## Proposal

`Proposal` links one Need, one Offer, a proposing member, and a receiving member.

Current business fields include:

- Need/Offer IDs;
- proposer/recipient IDs;
- optional proposed date/duration/frequency/location method/message;
- lifecycle status;
- timestamps.

Current statuses include pending, accepted, declined, countered, and withdrawn semantics.

Proposal pairing and state transitions are database/server authoritative. Acceptance is a transactional boundary that creates the Surrogacy relationship and related evidence.

## Surrogacy / Connection

A `Surrogacy` is the established relationship created from an accepted Proposal.

It links the originating Need/Offer and participant identities and carries lifecycle state such as active/paused/ended/completed.

The UI may label Surrogacies as **Connections**, but `surrogacy` remains the canonical domain/database term in existing code.

## Moment

A `Moment` is a scheduled occurrence inside a Surrogacy.

Business fields include:

- Surrogacy ID;
- scheduled time;
- duration;
- status;
- optional location/notes;
- creation timestamp.

Lifecycle semantics include scheduled, in-progress, completed, cancelled, and missed states.

Creation/completion/cancellation uses trusted lifecycle authority rather than arbitrary client table writes.

## Exchange

An `Exchange` records fulfillment/activity in Moment/Surrogacy context.

Business fields include:

- Moment ID;
- Surrogacy ID;
- completion timestamp;
- completion/dispute state.

Exchange records provide the context for downstream Feedback.

## Feedback

`Feedback` is participant-to-participant evaluation tied to an Exchange and Surrogacy.

Business fields include:

- Exchange/Surrogacy IDs;
- from/to member IDs;
- overall rating;
- rating breakdown dimensions;
- comments/endorsements;
- created timestamp.

Feedback submission is context-bound and server/database authoritative where it affects reputation/progression.

## Safety models

### Blocks

Persist member-to-member block relationships. Blocking is enforced by database/privacy logic and affects discovery/relationship initiation.

### Reports

Reports capture reporter, reported member, report type/severity/description, moderation status, and resolution metadata.

Report creation is member-scoped. Moderation status/outcome is privileged authority.

### Restrictions / suspension

Moderation restrictions and suspension are protected account/safety state. They are distinct from voluntary trial deactivation.

## Trial consent and account participation

The profile/account schema contains protected fields for the current trial policy version/timestamps, age confirmation, and voluntary deactivation state.

These fields are not direct client-editable profile preferences.

## Audit and outbox evidence

Privileged/important transitions create audit evidence. Some transactional flows also create outbox/event records so side effects can be processed without making the browser the source of truth.

Audit records are designed to preserve system history even when an actor relationship changes or an account is removed where schema rules allow.

## Progression/economic models

The schema/domain includes progression/economic concepts such as:

- token transactions;
- XP events/transactions;
- member progression/rank data;
- notifications.

These are protected state. Client UI may render them, but authoritative mutation belongs to trusted server/database paths.

Rewards/economic UX is not currently a primary trial navigation surface.

## Media/permission models

The broader schema/domain includes media permission/grant concepts. Their existence in the schema does not imply that every media-management workflow is a primary trial feature.

Production media/storage lifecycle remains part of broader market-readiness hardening.

## Database vs domain types

Domain interfaces are business-facing shapes. They are not guaranteed to be one-to-one copies of PostgreSQL rows.

Examples:

- snake_case database columns may become camelCase application properties;
- a domain object may aggregate multiple rows;
- public projections intentionally expose fewer fields than base tables;
- generated database enums may be represented by narrower domain unions.

Do not cast between database rows and domain objects without an explicit adapter/mapping boundary.

## Schema evolution

For every database model change:

1. add a migration under `supabase/migrations/`;
2. replay from a clean database:

```bash
supabase db reset --no-seed
```

3. regenerate canonical database types:

```bash
supabase gen types typescript --local > src/infrastructure/supabase/database.types.ts
```

4. update adapters/domain mappings as needed;
5. add or update security/regression tests;
6. run exact-head CI.

CI independently regenerates `database.types.ts` and fails when the committed schema contract drifts from the migrated database.

## What not to document here

Do not add:

- Firestore DTOs;
- Firebase timestamps;
- speculative “Phase 1” replacement models for entities that already exist;
- duplicate handwritten database schemas;
- planned fields presented as current runtime contract.

For exact columns/functions/enums, read the current migration chain and generated database types.
