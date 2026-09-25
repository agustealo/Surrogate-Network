# Consumer Trial and Market-Readiness Sprint

## Current status

**Current production line:** `master@2355e23d5a2833843c5f7c2378ba5ae4c962161a`

**Latest post-merge evidence:** Surrogate Network CI run **#336** completed successfully on September 25, 2026.

That run passed the full repository quality rail on the exact merge commit, including immutable workflow dependency verification, logical application-data recovery, SECURITY, zero schema/type drift, BUILD, the canonical two-member E2E trial, 16-frame runtime visual-evidence generation/upload, deployment-verifier proof, A11Y, and QUALITY GATE.

PR **#13**, “Refresh premium runtime screenshot evidence,” merged from exact green head `1f7954bd26773f98028ff32755add95430c7ad6a` after run **#335** passed the same full release rail. The slice expanded the runtime evidence contract to 16 real product states and closed screenshot-discovered presentation defects without changing canonical authorization authority. There are currently no open code PRs.

The remaining unrestricted-launch blockers are tracked in **issue #11, “Launch certification: hosted verification and operating controls.”** They are deployment, provider, repository-governance, and human-operations gates rather than missing core application architecture.

This file is the current engineering status sheet. Historical candidate SHAs remain useful evidence, but a superseded SHA is never used to certify a newer candidate.

## Product objective

Surrogate Network is centered on one canonical consumer lifecycle:

```text
Need + Offer -> Discovery -> Proposal -> Surrogacy -> Moment -> Exchange -> Feedback
```

The engineering rule remains strict: visible controls execute real persisted behavior, or they remain absent/truthfully unavailable.

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
- Public/member profile safety actions render inside the correct product shell and provide visible success feedback.

### Account lifecycle

- Password recovery uses real Supabase email + PKCE callback exchange in the local integration rail.
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
- Health responses expose immutable release provenance when deployment metadata is configured.

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

### Hosted-release verification tooling

- `scripts/verify-deployment.mjs` provides a read-only hosted-runtime verifier.
- Verification is same-origin/no-redirect and HTTPS-only for hosted certification.
- Liveness, readiness, security headers, public auth/recovery surfaces, request correlation, and exact release revision are checked.
- The manual **Deployment Verification** workflow expects the exact `${{ github.sha }}` revision.
- CI proves the verifier accepts the correct revision and rejects an incorrect revision against the exact local production build.

This tooling does **not** claim a production environment has been verified until it runs against the actual hosted production origin.

### Release reproducibility

- External GitHub Actions used by the release workflows are pinned to immutable commit SHAs.
- Supabase CLI installs in CI are pinned to an exact version.
- `scripts/verify-workflow-pins.mjs` rejects mutable external action refs and unpinned Supabase CLI installs.
- Local composite actions are recursively inspected so mutable dependencies cannot hide behind `./...` action references.

### Visual/documentation evidence

- Canonical brand assets live under `docs/assets/`.
- The README includes the branded Surrogate Network header/banner.
- Real product screenshots originate from the same Playwright + Supabase consumer-trial lifecycle used for release proof.
- The runtime capture contract now produces 16 real frames covering public entry, How It Works, Safety, Community Principles, member dashboard, Discovery, Need detail, Offer detail, proposal composition, incoming proposal, member profile safety/reporting, active Surrogacy, completed Exchange/Feedback, account privacy/data controls, Admin Console, and moderation reports.
- The moderation screenshot is backed by a report submitted through the real member flow; admin capture runs only in the disposable local CI station with synthetic identities.
- Source PNG captures are uploaded as the `consumer-visual-evidence` artifact for exact-run review.
- Reviewed, web-optimized WebP derivatives are committed under `docs/screenshots/` for README/manuscript use, including a compact showcase grid for the wider product tour.
- Screenshot capture excludes production member data, provider credentials, service-role configuration, recovery links, and secrets.
- The visual burn exposed and closed false admin search chrome, duplicate Admin Console heading ownership, shell-less profile presentation, missing report-success feedback, stale brand metadata, and account-control framing defects before publication.

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
    - canonical two-member consumer lifecycle
    - 16-frame source screenshot evidence generation
    - visual-evidence file assertions/upload
    - real member report -> moderation queue path
    - disposable local Admin Console proof
    - local production deployment-verifier proof
11. A11Y
12. QUALITY GATE

Evidence from a superseded SHA is historical only.

## Remaining launch gates

The remaining launch work is tracked by **issue #11** and should not be converted into speculative feature work.

### 1. Repository governance

- Protect `master`.
- Require PR-based changes and aggregate `QUALITY GATE` before merge.
- Prevent direct pushes that bypass exact-head evidence except explicitly authorized emergency administration.

**Current state:** GitHub reports `master` as `protected: false` with no enforced required checks. The current ChatGPT GitHub action set exposes branch protection as a read but does not expose the repository-administration write needed to enable it.

### 2. Actual production deployment evidence

- Deploy an explicitly certified release SHA to the real production origin.
- Run **Deployment Verification** against that HTTPS origin from the exact deployed revision.
- Record the production origin, workflow run, and exact deployed SHA.
- Ensure the runtime exposes release provenance through `SURROGATE_RELEASE_SHA`, `VERCEL_GIT_COMMIT_SHA`, or `GITHUB_SHA`.

**Current state:** repository metadata still has no homepage, GitHub Pages is disabled, and no canonical production origin was surfaced by external discovery. No hosted verification claim is being made.

### 3. Real production password-recovery delivery

- Use an approved production smoke account.
- Prove provider-delivered recovery email receipt.
- Complete the production callback/PKCE exchange and password change.
- Prove the old credential no longer authenticates.
- Keep tokens/recovery links out of public logs and documentation.

### 4. Provider recovery

- Record the production Supabase backup retention/PITR policy.
- Perform a provider-level restore rehearsal into an isolated recovery project.
- Validate managed Auth plus application-owned relational data.
- Record measured RPO/RTO and provider limits.

### 5. Operating organization

Assign and record ownership for:

- on-call / incident command;
- external alert destination and monitoring;
- moderation/safety escalation;
- support channel;
- privacy/compliance requests;
- deployment and rollback authority.

Test the escalation path once before unrestricted launch.

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
12. Product screenshots used by documentation must originate from real runtime evidence and be reviewed before durable promotion.

## Next engineering decision

Do **not** reopen the proven core lifecycle without a concrete defect or consumer-trial finding.

The next work should come from issue #11 in this order:

1. protect `master` and require `QUALITY GATE`;
2. deploy an exact certified revision and run hosted Deployment Verification;
3. prove real production password-recovery email delivery;
4. run the Supabase provider-level restore/PITR rehearsal;
5. assign and test the human operating/escalation layer.

Until those gates are closed, additional feature accumulation is not release progress.
