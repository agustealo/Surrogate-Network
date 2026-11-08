# Achievement Authority and Operator Governance

Scope: SN-ENG-02 first evidence-backed achievement slice.
Baseline: SN-ENG-01, merged as PR #52.
Commercial status: no payments, wallets, point redemption, or seller earnings.

## What the member can actually earn

| Code | Name | Required evidence |
| --- | --- | --- |
| first_reflection | First Reflection | 1 distinct eligible Feedback submission |
| thoughtful_participant | Thoughtful Participant | 3 distinct eligible Feedback submissions |
| consistent_reflector | Consistent Reflector | 10 distinct eligible Feedback submissions |

All **new** milestones require Feedback recorded against a jointly confirmed
completed or partial Exchange, with two distinct authenticated participants
and the reviewer/recipient present in the owning Connection.
Feedback already permits only one submission per participant and Exchange.
The user's star rating is never an achievement factor.

The existing XP reward remains 10 XP per eligible Feedback submission,
governed by SN-ENG-01. Achievements do not add XP, money, exchange privileges,
safety credentials, licensure, or seller eligibility. These initial badges
are participation recognition, not a substitute for quality and anti-abuse
verification.

## Canonical ownership

- public.achievement_definitions is the versioned award catalog. Stable
  criteria are migration-owned; the admin UI can only pause/resume future
  issuance. Existing rows are not converted into arbitrary editor scripts.
- public.member_achievements is the authoritative member award journal,
  with eligibility evidence identity, rule version, earned/revoked status,
  and earning date.
- public.member_progression.achievements remains untouched legacy recognition.
  The member UI displays it separately, marked as not independently verified.
- private.grant_feedback_achievements responds only to persisted canonical
  Feedback inserts and serializes evaluation by member.
- public.set_achievement_rule_enabled is the authenticated wrapper that
  derives the operator from auth.uid(). It calls the postgres-only trusted
  core, public.set_achievement_rule_enabled_trusted, which verifies an
  active authorized admin in SQL, bumps the rule version, and atomically
  writes an audit record with the required justification.
- Human server actions use the session-scoped Supabase client, never the
  service role or caller-supplied actor identity.
- Existing XP, Exchange, Feedback, auth, audit and account deletion authority
  remains the sole owner of those respective lifecycles.

## Operator rules

An operator may pause or resume new badge issuance through
/admin/achievements. A required 8–240 character reason is persisted to
public.audit_events. This does not delete historic earned records, alter XP,
or retroactively award paused milestones. Upon resume, the next eligible
Feedback event may satisfy a milestone with the new rule version.

Operators cannot edit rule criteria in place through the UI. Rule definition
changes require a reviewed versioned migration, adversarial tests and
rollout policy.

Award revocation status is represented in the persistence model and UI,
but a dedicated adjudication/review/appeals workflow is NOT yet shipped.
No frontend may offer fake appeals or arbitrary moderation grants.

## Privacy and recovery

- Signed-in members can read the catalog and their own earned badges only.
- Client-side attempts to change rules, mint badges or call the admin RPC
  are rejected at SQL privilege boundaries.
- The privileged admin screen requires existing requireAdmin authorization
  and performs its global reads server-side only.
- When an account becomes a terminal deletion tombstone, its evidence-linked
  award records are purged. Cross-member profile data is not included in
  member badge cards.
- Historical qualifying Feedback is backfilled into badges from real
  Exchange evidence without minting XP retroactively. Legacy achievement
  names remain visible without fabricated verification claims.

## Risk limits and follow-up

The current Exchange outcome flow requires confirmation by both participants
for **new** Feedback and achievement milestones. It does not eliminate
collusion: cooperating members can still fabricate a series of Exchanges. Therefore these badges are low-stakes and
nonmonetary. They cannot enable payouts, material privileges, trust badges
or high-value competitions.

Before high-value rewards, add dispute timing and adjudication,
per-connection velocity limits, suspicious-account review, policy appeals,
and independent adverse-event evaluation. Keep this follow-up within
SN-ENG-02; do not mix it into SN-COM-01 Stripe/PayPal checkout.

## Verification contract

Required: clean local Supabase migration replay, generated types parity,
member RLS and admin SQL boundary tests, duplicate Feedback replay, paused
and resumed issuance with exact rule versions, member terminal deletion,
production build, two-member Playwright journey with admin controls,
accessibility checks and aggregate exact-head QUALITY GATE.

A merged pull request is not evidence of a hosted deployment revision.
