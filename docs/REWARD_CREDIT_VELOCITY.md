# Reward-Credit Velocity Authority (SN-ENG-02B2A)

Status: Versioned, nonmonetary XP and achievement rule using the existing
private.award_eligible_feedback_xp() and
private.grant_feedback_achievements() triggers. No new currency,
reputation score, or payment ledger exists.

## Principle

Members must be able to share truthful Feedback about a jointly confirmed
Exchange, including after reward-credit limits are reached. These limits
never reject Feedback, suppress reports, punish accounts, infer fraud,
block safety actions or invalidate the original Exchange.

Award eligibility, NOT the ability to participate, is rate-limited.

## Versioned pilot thresholds

Policy version **2** is enforced at the canonical XP journal boundary:

| Window | Allowance | Scope |
| --- | --- | --- |
| Rolling seven days | 4 credited Feedback submissions | Unordered pair of member IDs, including multiple Connections and both directions |
| Rolling seven days | 10 credited Feedback submissions | One member across all peers and Connections |

A new qualifying Feedback submission earns 10 XP until either limit
is reached. Once limited, the member's Feedback is stored normally,
but no XP or new milestone is credited. Existing XP and achievements
are preserved. The star rating is never a reward factor.

The rolling window counts linked and persisted reward_awards rows
with real XP transactions and their server-written creation timestamps,
not raw Feedback rows or client-supplied dates. Policy is migration-owned
and cannot be silently modified by a client or an operator.

## Canonical evidence owners

- public.feedback holds the member's recorded experience.
- private.reward_awards remains the canonical immutable link to
  actual XP transactions. No second issuance ledger is created.
- private.reward_credit_exclusions records *nonissuance evidence*
  unique by Feedback ID, policy version, reason and window counts.
  These are not fraud accusations and never have financial value.
- public.xp_transactions remains the journal; excluded submissions
  create no new XP transaction.
- public.member_achievements counts only Feedback linked to credited
  XP events from jointly confirmed Exchanges.
- public.audit_events now includes reward_credit_excluded events
  with policy evidence, visible to authorized administrators.
- public.get_my_reward_credit_summary() returns only the current
  authenticated member's aggregate counts and policy limits.

The existing eligible_feedback_xp_award trigger runs before
zz_feedback_achievement_grants, allowing the latter to verify
real credit evidence within the same transaction.

A member's profile row is locked to serialize all member credits,
and a deterministic unordered-pair advisory lock serializes both
member directions across every Connection. Counters are read after
locks, preventing concurrent writes from overshooting either limit.

## Member and operator experience

The Rewards page shows credited feedback progress and total saved
submissions that did not earn XP. Its copy explains the seven-day
window and both caps without implying dishonest conduct.

The protected admin Achievement Governance page shows the existing
audit stream's recent reward-credit exclusions and the policy cause.
It offers no fake appeal, fraud verdict, automatic remedy, or credit
override button.

## Privacy and account lifecycle

The private exclusion table is RLS-enabled and has no grants to
PUBLIC, anon, authenticated or service_role. Members can only
call the strictly session-bound summary; neither another member's
identity nor private exclusion rows can be supplied or retrieved.

When either participant becomes a terminal deletion tombstone,
private exclusion evidence for their shared Feedback is purged.
Existing shared Feedback/Exchange deletion policies remain unchanged.

## Limitations and follow-up

Pair/member velocity guards deter but cannot eliminate coordinated
multi-account collusion. They do not constitute identity, safety, or
service verification. Neither XP nor badges grant money, access rights
or trust credentials.

SN-ENG-02B2B remains for dispute adjudication, member appeals,
rule-driven badge revocation and compensating XP corrections.
Any correction must be explicitly adjudicated and audited, never
implemented as silent changes to the historical ledger.

## Exact-head acceptance

With genuine authenticated participants and jointly confirmed Exchanges
prove: four credited events for a pair across different Connections;
no fifth credit; ten credits/member across multiple pairs; no eleventh
credit; durable Feedback under exclusion; concurrent two-direction
writes serialize correctly; idempotent retry; privacy denial for
other users; correct aggregate counts and audit evidence; existing
progression and browser journeys remain functional.

Require clean Supabase migrations, recovery, generated type parity,
security tests, production build, accessibility, canonical two-member
browser tests, exact-head aggregate Quality Gate and separate deployed
revision attestation.
