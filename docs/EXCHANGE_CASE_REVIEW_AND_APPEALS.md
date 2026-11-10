# Exchange Dispute Cases and Independent Appeals (SN-ENG-02B2B1)

## Canonical ownership

Disputed Exchanges retain their original state and evidence in
public.exchanges. One linked moderation case per Exchange is stored in
the **existing** public.reports table. There is no second queue, case
runtime, reward ledger, payment engine or mutable confirmation substitute.

A database trigger automatically opens an Exchange-origin report when a
participant records a disputed outcome or rejects a previously reported
outcome. It creates a neutral report, not an accusation of wrongdoing.
Historical disputed Exchanges are backfilled into cases without altering
their original Exchange timelines.

The existing protected /admin/reports queue now handles both ordinary
member reports and Exchange cases. General moderation RPCs are prohibited
from changing Exchange cases: those require a distinct, authenticated,
independent decision. Active administrators must be outside the two
participants. Every determination requires 12 to 2000 characters of
rationale, emits an existing audit and outbox event, and closes the case
as upheld or dismissed.

A case outcome does **not** rewrite the Exchange from disputed to
confirmed, imply both parties agreed, issue Feedback, grant XP, or change
earned achievements. A dismissed case means the case disposition was
not upheld; it is not retroactive bilateral consent.

## Member appeals

Only the two real participants may appeal a decided linked Exchange
case. The appeal deadline is 30 days after the case decision. Each
participant may file at most one appeal against a case. A required
explanation is stored in public.report_appeals, linked to the existing
report and accessible only to that appellant or authorized operators.

Review requires a separate active administrator, not the person who
issued the most recent case decision. Accepting an appeal reopens that
report as investigating without erasing the original disposition or
reviewer provenance. A different administrator must independently
adjudicate again; denying an appeal leaves the case closed. No appeal
decision automatically compensates XP or changes Exchange confirmation.

The member Connection page shows only the relevant Exchange case,
case outcome, review rationale, and that member's own appeal status.
The existing admin Reports queue shows the full review evidence.
No member may insert forged system-origin cases, directly edit case
status or appeals, or call trusted admin cores.

## Security and retention

- Session-bound RPC wrappers derive the actor from auth.uid(), never
  accept caller-supplied actor/admin IDs.
- Postgres-only trusted cores verify profile/admin status, pair
  membership, reviewer independence and allowed transitions under
  row locks.
- New report fields do not expand ordinary member Reports privileges.
  A before-insert guard rejects forged Exchange-case origins; a later
  report-spam budget exemption applies only after the guard.
- Appeals have explicit RLS, grants and service-only mutation through
  authenticated wrappers.
- An original member can still file ordinary safety reports through
  the preexisting moderation path.
- The account deletion tombstone purges the deleted member's appeal
  narrative without manufacturing a new outcome or altering an XP journal.

## Explicitly out of scope

SN-ENG-02B2B2 must implement policy-governed achievement revocations,
reinstatement, and append-only compensating XP journal entries with
member notification, reversal-proof evidence, appeals and fraud
adjudication. Do not reinterpret a case dismissal as entitlement to XP.
Collusion and offline truth remain outside what two-party confirmation
and per-pair credit limits can prove.

## Exact-head verification requirements

Test the actual auth/member/admin RPCs with a real database. Prove a
member dispute opens exactly one case, including repeat submissions,
both initial disputed and peer disputed flows, direct forged report
insertion denial, normal report moderation bypass denial, closed-case
idempotency, non-admin/party/service-core denial, distinct-actor appeal,
duplicate appeal rejection, original reviewer conflict, reopened case
reviewer conflict, profile deletion, and unchanged Exchange/XP state.

Require clean migration, recovery, exact generated types, regression
SECURITY, TypeScript, lint, production build, member/admin browser
journey, accessibility and aggregate Quality Gate at exact PR head.
Hosted deployment revision attestation remains separate from CI.
