# Production Operations and Incident Runbook

This runbook is the repository-owned operating procedure for Surrogate Network. It is intentionally limited to controls the application and repository can define. Hosting-provider access, Supabase organization access, support staffing, and external status/communication systems remain deployment-owner responsibilities.

## Operating principles

1. Preserve member safety and data integrity before availability.
2. Do not bypass RLS, moderation, account tombstones, or lifecycle authority to restore service faster.
3. Freeze unrelated deployments during an active incident.
4. Record timestamps, deployed revision, request IDs, affected surfaces, and every destructive action.
5. Never place passwords, access tokens, service-role keys, production dumps, private messages, or unnecessary PII in tickets, logs, screenshots, or chat rooms.
6. Prefer rollback to a previously proven application revision when the schema is still compatible. Never manually reverse a production migration by editing tables in the dashboard.

## Deployment verification

A deployment is not certified merely because the hosting platform reports a successful build.

### Release provenance

Health endpoints expose a sanitized immutable git revision when one of these values is available, in priority order:

1. `SURROGATE_RELEASE_SHA`
2. `VERCEL_GIT_COMMIT_SHA`
3. `GITHUB_SHA`

If the production platform does not provide one of the provider variables, configure `SURROGATE_RELEASE_SHA` to the exact deployed commit. Do not put secrets in this value.

### Repository workflow

Run **Deployment Verification** from GitHub Actions on the exact revision intended to be live and provide the deployment origin, for example `https://app.example.com`.

The workflow fails unless the hosted target:

- serves over HTTPS;
- reports `/api/health/live` as alive;
- reports `/api/health/ready` as ready with runtime config and Supabase checks green;
- reports the exact workflow git revision;
- preserves request-correlation headers;
- keeps health responses `no-store` and free of session cookies;
- serves the public home, login, signup, and password-recovery surfaces;
- sends the expected CSP, anti-framing, content-sniffing, referrer, permissions, and HSTS headers;
- does not advertise wildcard Supabase projects or localhost/insecure CSP sources.

The same verifier can be run manually:

```bash
npm run verify:deployment -- https://app.example.com <exact-git-sha>
```

`--allow-http` exists only for the CI/local production-runtime proof. Do not use it to certify a public deployment.

A successful verification proves the HTTP/runtime contract for that exact target and revision. It does not prove provider backup policy, outbound email delivery, moderation staffing, or every third-party control.

## Health semantics

### `/api/health/live`

Liveness answers only whether the application process can serve requests. It intentionally does not require Supabase.

Use it to distinguish an application-process failure from an upstream dependency failure.

### `/api/health/ready`

Readiness validates required server runtime configuration and the real anonymous Supabase data plane. A `503` means the instance should not receive normal production traffic.

Never change readiness to return `200` merely to satisfy a hosting health check. Configure the host to use the correct endpoint for its intended liveness/readiness behavior.

## Incident severity

### SEV-1: critical

Examples:

- unauthorized cross-member data exposure;
- service-role credential exposure;
- destructive or widespread data corruption;
- account-deletion/tombstone bypass that restores deleted member authority;
- widespread authentication failure with no safe workaround;
- moderation/safety controls unavailable during an active safety event.

Response: freeze deploys, restrict traffic if needed, preserve evidence, involve the deployment owner immediately, and prioritize containment over uptime.

### SEV-2: major

Examples:

- readiness is failing for a significant portion of traffic;
- Needs/Offers/Proposals/Connections cannot complete for many members;
- password recovery delivery or account lifecycle controls are broadly failing;
- admin moderation queue is unavailable without evidence of active exploitation.

Response: stop unrelated changes, identify the failing dependency/revision, rollback when safe, and communicate affected functionality.

### SEV-3: limited

Examples:

- isolated UI failure with a working retry;
- one member workflow fails without data-integrity or safety impact;
- non-primary Messaging/Rewards unavailable-state regressions.

Response: capture evidence, prioritize normally, and avoid emergency production mutation.

## First 15 minutes

1. Record incident start time and current UTC/local time.
2. Record the target URL and deployed revision from `/api/health/live`.
3. Check `/api/health/live` and `/api/health/ready` separately.
4. Capture one or more `x-request-id` values from failing requests.
5. Confirm whether the problem began immediately after a deployment.
6. Check hosting-provider and Supabase status/metrics using authorized operator access.
7. Freeze further deploys if the incident is SEV-1/SEV-2 or revision-related.
8. Do not rotate/delete data or credentials until evidence required for containment and recovery is recorded.

## Log and evidence handling

Production request errors are structured and correlated by `x-request-id`. Production logs intentionally omit raw exception messages/stacks from the application error event because those fields can contain sensitive data.

Use these fields first:

- request ID;
- route/path without query string;
- method;
- route/render context;
- error digest;
- stable error fingerprint;
- deployed revision;
- incident time window.

Do not ask a member to send authentication cookies, reset links, passwords, access tokens, or service-role credentials.

## Playbook: application process unavailable

Symptoms: liveness fails or the hosting edge cannot reach the Next.js process.

1. Confirm the exact deployed revision in the hosting platform.
2. Inspect process startup/configuration failures.
3. Verify the three required Supabase runtime variables exist without printing their values.
4. If failure followed a deployment and the previous revision is schema-compatible, rollback at the deployment platform.
5. Re-run Deployment Verification against the rolled-back target before reopening traffic.

## Playbook: Supabase/data-plane unavailable

Symptoms: liveness is green but readiness is `503`, or authenticated/database workflows fail broadly.

1. Confirm `/api/health/live` remains green.
2. Record `/api/health/ready` state and request ID.
3. Check Supabase project status and network reachability.
4. Do not switch to mock, cached, or fabricated consumer data.
5. Do not bypass RLS with service-role reads to keep member pages alive.
6. Restore traffic only after readiness is green and representative authenticated flows are verified.

## Playbook: authentication or password recovery

1. Separate sign-in/session failure from outbound recovery-email delivery failure.
2. Verify the deployed Supabase Auth redirect configuration matches the production origin.
3. Confirm the recovery callback and reset page are reachable.
4. Use a designated non-production/test account approved for production smoke testing if an end-to-end email check is required.
5. Never inspect or share the recovery token itself.
6. Record the provider delivery result separately from application callback behavior.

The repository CI proves recovery against local Supabase/Mailpit. A real production mail-provider delivery check remains a deployment-specific launch requirement.

## Playbook: account deletion cleanup

Application deletion is database-first: the profile becomes a permanent tombstone and direct content is redacted before external Auth cleanup is attempted.

If external Auth deletion fails:

1. confirm the application tombstone remains present and the member cannot reactivate;
2. inspect the deletion-job operational record using authorized server/database access;
3. retry provider cleanup through an approved operator path;
4. never remove the retained tombstone/shared relationship history simply to clear the job;
5. document the final Auth deletion result.

## Playbook: data integrity or recovery

Follow [`PRODUCTION_RECOVERY.md`](PRODUCTION_RECOVERY.md).

Repository CI proves logical application-data recovery for the `public` schema. It does not prove full Supabase Auth/provider/PITR recovery. For suspected corruption:

1. stop writes or restrict traffic when continued writes can worsen damage;
2. identify the last known-good revision and recovery point;
3. restore into an isolated recovery project first when possible;
4. validate migrations, security, account tombstones, representative lifecycle records, and health;
5. document any data-loss window before reopening traffic.

## Playbook: safety/moderation incident

1. Preserve the report, audit evidence, request IDs, and relevant lifecycle identifiers.
2. Use the admin moderation surface and canonical moderation authority only.
3. Do not alter member rows directly to manufacture a moderation outcome.
4. If the admin surface is unavailable during an active safety event, restrict affected participation/traffic through an approved emergency operational control and record the action for reconciliation.
5. Keep private reporter/member information out of general incident channels.

## Rollback rules

Application rollback is appropriate when:

- the previous revision is known green;
- the current failure is application-level;
- the current database schema remains compatible with the previous code.

Do not rollback application code across an incompatible migration boundary without an explicit recovery plan. Prefer a forward fix or database recovery over ad hoc reverse SQL.

After rollback, run Deployment Verification against the exact rolled-back revision.

## Incident closure

Do not close a SEV-1/SEV-2 incident until:

- liveness and readiness are stable;
- the deployed revision is known;
- the affected canonical workflow has been rechecked;
- security/data-integrity impact is understood;
- any temporary traffic restriction is removed deliberately;
- follow-up work has an owner outside the incident channel;
- a concise incident record captures timeline, impact, root cause, remediation, and prevention.

## Remaining deployment-owner controls

The repository cannot prove these without access to the actual production organization/platform:

- default-branch protection/rulesets requiring `QUALITY GATE`;
- Supabase production backup retention/PITR settings and provider-level restore rehearsal;
- real outbound recovery-email delivery/domain configuration;
- hosting rollback/traffic-management permissions;
- external alerting destinations and on-call/support ownership;
- final privacy/compliance/support processes required by the operating organization.

These are launch gates, not reasons to add fake application substitutes.
