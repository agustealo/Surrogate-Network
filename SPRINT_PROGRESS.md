# Consumer Trial Readiness Sprint

## Status

**Current baseline:** `master@c68fe8af3ace66622ce4e0f24f672807dadf984e`

**Post-merge evidence:** GitHub Actions run **#235** passed the complete quality rail on September 20, 2026.

This document describes the current repository state. Historical sprint narratives, obsolete certification SHAs, removed compatibility scaffolds, and demo-mode claims are intentionally not retained as current truth.

## Consumer-trial objective

Deliver a controlled consumer-trial build where every visible primary workflow executes real persisted logic with explicit authority boundaries:

```text
Need + Offer -> Discovery -> Proposal -> Surrogacy -> Moment -> Exchange -> Feedback
```

The trial bar also includes consent, safety, moderation, account participation controls, honest navigation, fresh-database migration proof, and a real two-member browser journey.

## Completed on the merged baseline

### Runtime and persistence

- Supabase/PostgreSQL is the canonical persistence platform.
- Supabase Auth owns member identity.
- Row Level Security is enforced for user-scoped access.
- Service-role authority is isolated to trusted server/system operations.
- Supabase-generated database types are canonical and CI rejects schema/type drift.
- Need, Offer, Proposal, Surrogacy, Moment, Exchange, and Feedback flows persist real data.

### Proposal and relationship authority

- Proposal pairing validates Need/Offer ownership at the database boundary.
- Clients cannot directly author authoritative proposal state transitions.
- Proposal acceptance is transactional across proposal status, Need/Offer counters/status, Surrogacy creation, participants, audit, and outbox state.
- Connections render the canonical linked Need and Offer identity for both participants.

### Safety and member lifecycle

- Blocking and reporting are persisted and RLS-protected.
- Public profile visibility respects blocking and excludes private/authority fields.
- Admin moderation uses authenticated human-admin verification plus trusted transactional database authority.
- Moderation can resolve/dismiss/investigate reports and atomically apply member restrictions/suspension with audit evidence.
- Trial Terms/Privacy/age consent is explicit and server-authoritative.
- Member self-deactivation is distinct from moderation suspension.
- Deactivation blocks new participation and preserves historical relationship records.
- Database-backed abuse/rate controls are present on trial action paths.

### UI and surface ownership

- Public, member, and admin shells are separate.
- Primary member navigation contains only trial-ready surfaces.
- Messaging and Rewards remain outside primary navigation until production behavior is complete.
- Admin operations remain in the dedicated admin console.
- Privacy and Terms trial surfaces are present.
- Browser response security headers are configured.

### Test and release evidence

Post-merge run #235 passed:

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

SECURITY proved:

- clean Supabase startup;
- full migration replay from an empty database;
- the security regression suite;
- generated Supabase database types;
- zero schema/type drift.

E2E TRIAL proved a real two-member flow:

1. Both members sign up and accept trial policy.
2. Requester creates a Need.
3. Provider creates an Offer.
4. Provider sends a Proposal linked to the Need/Offer pair.
5. Requester accepts the Proposal.
6. Surrogacy/Connection is created.
7. A Moment is scheduled and completed.
8. An Exchange is recorded.
9. Feedback is submitted.
10. The counterpart sees the resulting Connection identity.

A11Y passed the public accessibility smoke suite on a fresh runtime.

## Current documentation/onboarding cleanup

The former root README, sprint file, and startup guide had drifted behind runtime reality. They still described placeholder routes, demo fixtures, fake Supabase credentials, obsolete SC-00.x certification, and a future relationship runtime that now exists.

This cleanup converges repository guidance on the current architecture:

- no demo mode;
- no fake Supabase credentials;
- no mock proposal/runtime claims;
- no obsolete exact-head certification SHA;
- current Next.js/React/Node stack;
- current CI gate names;
- real local Supabase startup;
- tracked `.env.example` containing only actual runtime keys.

## Remaining release work

The merged baseline is appropriate for controlled consumer trials under the project manifest. It is **not** a blanket market-ready certification.

### Governance

- Protect the default branch.
- Require PR-based changes and the aggregate `QUALITY GATE` before merge.
- Prevent direct pushes that bypass exact-head evidence.

The current GitHub connection used during this audit exposes branch protection as read-only, so this governance control must be enabled through a connection/account with repository administration permission.

### Broader market-readiness

- Validate and harden account recovery end to end.
- Define and implement the production account deletion/export policy.
- Add production observability and error reporting.
- Establish backup/restore procedures and prove recovery.
- Complete production media/storage lifecycle and retention rules.
- Create operational/support incident runbooks.
- Complete Messaging before returning it to primary navigation.
- Complete Rewards/economic UX before returning it to primary navigation.
- Perform deployment-environment verification against the actual production hosting/Supabase configuration.

## Engineering rules carried forward

1. No mock/demo/sample fallback in production runtime.
2. No duplicate authority paths.
3. No legacy compatibility layer kept merely for history.
4. Server/database authority for privileged state.
5. RLS for member-scoped access.
6. Schema changes only through migrations.
7. Generated database types must match the migrated schema.
8. Exact-head green CI before merge or release claims.
9. Public/member/admin surface separation remains enforced.
10. Documentation changes with architecture and runtime behavior.

## Next engineering slice

After this documentation/onboarding truth cleanup is independently green, the next release-hardening slice should focus on **governance plus production operations**, not reopening the already-proven core relationship lifecycle.
