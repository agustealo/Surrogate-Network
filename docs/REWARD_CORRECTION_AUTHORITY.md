# Reward Review, Compensating XP and Achievement Governance

SN-ENG-02B2B2. These controls apply only to **nonmonetary** participation
recognition. No payment, wallet, exchange entitlement, identity verification,
or trust credential is introduced.

## Principle

Feedback is an individual's account of an Exchange. A negative rating,
relationship dispute, or free-text administrator note is not automatically
proof of an illegitimate XP credit. The original Feedback and bilateral
confirmation records must remain unchanged.

Only a member who **received** Feedback from a jointly confirmed Exchange
may request review of that counterpart's credited reward. The request must
identify the exact persisted Feedback row and explain the evidence.
The existing authenticated Reports authority owns the case, now marked
`reward_review`. Its unique feedback link prevents duplicate cases.
Unrelated reports cannot be used to modify a reward.

A different active, authenticated administrator, who is not either Exchange
participant, must adjudicate. A reason of 20 to 2000 characters is required.
General report moderation cannot bypass this decision. All mutations are
session-scoped PostgreSQL functions; callers cannot submit actor/admin IDs.

## Decision, journal and badge semantics

| Case decision | Effect |
| --- | --- |
| Initial dismiss | Closes the review, no XP or badge changes |
| Initial invalidate | Appends a -10 XP journal entry, revokes unsupported badge projections |
| Accepted appeal | Reopens the original case for different-administrator adjudication, no automatic XP |
| Reconsidered dismiss after invalidation | Appends a +10 XP restoration, restores eligible previously revoked badges |
| Reconsidered invalidate | Preserves the prior reversal without double-deducting XP |

Each Feedback has at most one `reversed` and one `restored` compensation
under this policy version. After restoration, a second reversal is rejected
rather than silently cycling credits. A new reviewed policy would be
needed to support further adjudication rounds.

The **existing** `public.xp_transactions` is the sole point journal.
The original +10 entry is never updated or removed. Negative and positive
adjustments are actual journal entries and automatically update the
existing profile and member progression projections.

The narrowly scoped `public.reward_corrections` contains evidence that
links each compensating journal entry to an exact Feedback, original
Reports case, administrative reviewer and rationale. It is **not** an
alternative balance or scoring authority. Only the affected member
can read their correction records, and only a privileged, independently
verified case decision can create them.

`public.member_achievements` remains the source of recognition status.
Invalidating a credit revokes earned badges whose original supporting
Feedback was invalidated or whose required credited milestone is no
longer met. A case-linked reason, reviewer and revocation timestamp
are retained on the projection. Restoring that credit reinstates only
badges revoked by the same case and still supported by effective credit
history. Other revocations are never bypassed.

`get_my_reward_credit_summary` and the achievement milestone trigger
count only effective credited Feedback, excluding reversals that have
not been restored. The versioned pair/member velocity guard still
counts original issuance history so corrections cannot be abused
to restart a weekly farming allowance.

## Member and moderator experience

A receiving counterpart can request evidence review from the relevant
Connection. The subject of a review sees its actual case status,
decision rationale, correction rows, and independent appeal action on
`/rewards`. A member has one appeal per case, filed within 30 days
of the decision. The existing `public.report_appeals` is reused with
its ownership RLS and administrator review trail.

Accepting an appeal requires a second administrator and opens a new
decision step; the first adjudicator cannot rule again on that case.
Denied appeals preserve the original disposition. The same review
history is visible to authorized staff within `/admin/reports`.

No notification center exists in the current consumer architecture.
The durable, authenticated Rewards page is the in-app notice and
review location. The existing `outbox_events` receives a decision
signal for integrations, but this does **not** claim push, email, or
delivered notifications. A separately verified delivery mechanism
would be required to claim those channels.

## Safety and limits

- No Data API INSERT, UPDATE or DELETE for ordinary members on
  compensation evidence, badges or the XP journal.
- Evidence is checked again under row locks at adjudication, rather
  than trusting a report's free-form description.
- Case decisions and corrections are atomic. If an XP write fails,
  the case cannot close without its associated entries.
- Repeated, outsider, service-role and caller-supplied-admin-ID
  attempts must fail.
- Account tombstones purge correction evidence according to the
  existing account deletion and XP lifecycle.
- A case is a documented review of participation recognition, **not**
  a finding of harassment, identity fraud or financial liability.

## Acceptance

Run genuine two-member, two-independent-administrator flows covering
credited Feedback, case request, one -10 correction, badge revocation,
XP/rank reconciliation, appeal submission, reviewer independence, one
+10 restoration, badge reinstatement, audit provenance and immutable
original XP history. Verify direct forged cases, other-member reads,
generic moderation bypass and private trusted core calls are denied.

Require clean Supabase migration, recovery, generated types parity,
security tests, typecheck/lint, production build, accessibility,
canonical two-member browser test and exact-head aggregate Quality
Gate before merge. Hosted revision attestation remains independent.
