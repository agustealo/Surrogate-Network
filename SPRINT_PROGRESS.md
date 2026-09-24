# Consumer Trial and Market-Readiness Sprint

## Current status

**Current baseline:** `master@db2675221f6b81b8621088a8732b5c42f40dc8b6`

**Post-merge evidence:** GitHub Actions run **#272** completed successfully on September 24, 2026.

That run passed the full quality rail, including logical application-data recovery, SECURITY, zero schema/type drift, BUILD, E2E TRIAL, A11Y, and QUALITY GATE.

This file is the current engineering status sheet. Historical candidate SHAs and already-closed gaps are intentionally not presented as open work.

## Product objective

Surrogate Network remains centered on one canonical consumer lifecycle:

```text
Need + Offer -> Discovery -> Proposal -> Surrogacy -> Moment -> Exchange -> Feedback
```

The engineering rule is unchanged: visible controls execute real persisted behavior, or they remain absent/truthfully unavailable.

## Completed product/runtime authority

### Identity and member authority

- Supabase Auth owns human identity.
- PostgreSQL/RLS owns member-scoped data access.
- Service-role authority is server-only and narrowly scoped.
- Public profile projection excludes private/authoritative account fields.
- Direct member writes cannot mutate authoritative lifecycle/account fields.

### Marketplace and relationship lifecycle

- Need and Offer persistence is real.
- Proposal pairing and transitions are database-authoritative.
- Proposal acceptance is transactional across marketplace and Surrogacy state.
- Surrogacy, Moment, Exchange, and Feedback paths are persisted and browser-proven.
- Connections preserve canonical Need/Offer relationship identity.

### Safety and moderation

- Blocking/reporting are persisted and enforced at the data boundary.
- Admin moderation is a separate authorized surface.
- Restrictions/suspension, audit evidence, and moderation outcomes use canonical trusted authority.
- Trial action rate limits are database-backed.

### Account lifecycle

- Password recovery uses real Supabase email + PKCE callback exchange.
- Password update is recovery-session gated.
- Members can download a machine-readable data export.
- Reversible deactivation is separate from permanent deletion.
- Permanent deletion is database-first, terminal, and tombstone-based so shared history/audit integrity survives Auth deletion.
- Stale JWTs cannot resurrect redacted/deleted state through direct Data API writes.
- External Auth cleanup attempts are recorded for operational follow-up.

### Runtime configuration and health

- Public Supabase runtime configuration has one canonical owner.
- Service-role configuration is isolated behind a server-only owner.
- Browser, server, middleware, CSP, and health paths use the canonical config boundary.
- `/api/health/live` is dependency-independent process liveness.
- `/api/health/ready` proves required config plus the real anonymous Supabase data plane.
- Health probes remain no-store and request-correlated.

### Observability and browser security

- Request IDs are validated/generated and propagated through middleware/redirects.
- Next.js server request errors are emitted as structured production-safe events.
- Production error events strip query strings and omit raw message/stack content.
- Error boundaries exist for App Router and global rendering failures.
- CSP is scoped to the configured Supabase origin, not wildcard projects.
- Production HSTS, anti-framing, content-sniffing, referrer, permissions, and DNS-prefetch controls are present.

### Recovery

- SECURITY starts from a fresh Supabase runtime and replays every migration.
- `scripts/recovery-drill.sh` proves logical `public` application-data recovery through seed -> dump -> destructive rebuild -> transactional restore -> fingerprint verification -> pristine rebuild.
- `docs/PRODUCTION_RECOVERY.md` defines the boundary between repository-owned logical recovery and Supabase/provider recovery.

### Media cleanup

- Dormant media metadata/tables and unused legacy profile media UI were removed.
- The current product does not pretend arbitrary media URLs are a production Storage subsystem.
- A future media feature must own explicit bucket/object ownership, authorization, deletion, and recovery semantics before shipping.

## Current quality rail

Every release candidate must pass on the exact candidate SHA:

1. INSTALL
2. DEPENDENCY AUDIT
3. TYPECHECK
4. LINT
5. UNIT
6. COMPONENT
7. SECURITY
   - fresh Supabase startup
   - clean migration replay
   - logical application-data recovery drill
   - security regression suite
   - generated database types
   - zero schema/type drift
8. NAVIGATION
9. BUILD
10. E2E TRIAL
11. A11Y
12. QUALITY GATE

Evidence from a superseded SHA is historical only.

## Current hardening slice

### Deployment verification + operations

The next repository-owned boundary is operational proof for the actual hosted artifact.

This slice adds:

- immutable release revision metadata on health responses;
- a read-only `scripts/verify-deployment.mjs` deployment verifier;
- a manual GitHub Actions **Deployment Verification** workflow tied to the exact workflow SHA;
- local CI proof that the verifier accepts the correct revision and rejects the wrong one;
- production incident/support/rollback playbooks;
- current-truth README/manifest/architecture/sprint convergence.

This tooling does **not** claim a production environment has been verified until the manual workflow is run against the real hosted target.

## Remaining launch gates after this slice

### Repository governance

- Protect the default branch.
- Require PR-based changes and aggregate `QUALITY GATE` before merge.
- Prevent direct pushes that bypass exact-head evidence.

The current GitHub App connection does not expose repository-administration writes, so branch protection remains an external admin action.

### Actual production deployment evidence

- Run Deployment Verification against the real production origin from the exact deployed revision.
- Ensure the runtime exposes immutable release provenance through `SURROGATE_RELEASE_SHA`, `VERCEL_GIT_COMMIT_SHA`, or `GITHUB_SHA`.
- Verify real outbound password-recovery email/domain delivery with a designated production smoke account.

### Provider recovery

- Record the selected Supabase backup retention/PITR policy.
- Perform a provider-level restore rehearsal into an isolated recovery project.
- Record achieved recovery point/time and any managed Auth/provider limitations.

### Operating organization

- Assign on-call/incident ownership and alert destinations.
- Assign moderation/safety escalation ownership.
- Define approved support/contact channels and organization-specific privacy/compliance procedures.

### Deferred product features

- Messaging stays outside primary navigation until real production behavior is complete.
- Rewards/economic UX stays outside primary navigation until its authority and consumer experience are complete.

Do not add these systems merely to make the product look larger.

## Engineering rules carried forward

1. No mock/demo/sample fallback in production runtime.
2. No duplicate authority paths.
3. No legacy compatibility layer retained as a graveyard.
4. Server/database authority for privileged state.
5. RLS for member-scoped access.
6. Schema changes only through migrations.
7. Generated database types must match the migrated schema.
8. Exact-head green CI before merge/release claims.
9. Hosted release claims require exact deployed-revision evidence.
10. Public/member/admin surface separation remains enforced.
11. Documentation must move with runtime/architecture truth.

## Next engineering decision

After deployment-operations tooling is independently green, do **not** reopen the proven core lifecycle without evidence. The next choice should be driven by the remaining external launch gates above or by a concrete consumer defect, not feature accumulation.
