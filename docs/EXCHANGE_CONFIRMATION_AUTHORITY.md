# Exchange Outcome Integrity: Two-Participant Confirmation

Scope: SN-ENG-02B1, built upon PR #52 (XP authority) and PR #55
(achievement authority). A single member's claim about an Exchange is
not mutual attestation, a trust/safety credential, or proof of payment.

## Authoritative lifecycle

Need + Offer -> Discovery -> Proposal -> Connection -> Moment ->
Outcome reported -> Peer confirms OR disputes -> Eligible Feedback.

The existing public.exchanges row remains the lifecycle owner. A schema
migration adds confirmation_state, recorded_by, confirmed_by, disputed_by,
and confirmed_at. No second exchange tracker, wallet, or event bus is added.

| State | Who recorded it | Can new Feedback be created? | New XP and achievements |
| --- | --- | --- | --- |
| pending | One authenticated participant | No | No |
| confirmed | A different active participant accepted the reported completed/partial outcome | Yes | Eligible |
| disputed | Reporter or peer contested the outcome | No | No |
| legacy_unverified | Historical Exchange without joint evidence | Not for new submissions | Existing records preserved, no new awards |

The reporter may choose completed, partial, or disputed. If completed or
partial, the result is pending until the **other** participant confirms.
No decision is silently inferred from inactivity, page visits, automated
models, time passing, or another person controlling the same session.

Peer confirmation and dispute operations are authenticated RPC wrappers
that derive identity from auth.uid() and call postgres-only trusted cores.
The Exchange row is locked before deciding the next state, so concurrent
or repeated calls cannot mint extra rewards. A repeated identical decision
by the same peer returns its stable result. Conflicting or out-of-order
decisions are rejected. The original reporter cannot self-confirm; users
not in the Connection cannot access the action. Privileged row updates
are not available to ordinary member clients.

An independent BEFORE INSERT trigger blocks **all new** Feedback inserts
for Exchanges without confirmed bilateral evidence, even if a caller
attempts to bypass the main UI or the existing Feedback RPC. Already
persisted historical feedback may still be retried idempotently, but does
not issue a new XP transaction or a replacement achievement. The existing
Feedback, XP journal and achievement engines remain canonical.

The member Connection detail, member dashboard actions, and direct
Feedback page honor these states. The confirmation control is displayed
only to the member other than the reporter. A pending Exchange is labeled
as a reported outcome, not a mutually completed interaction.

All transitions append an existing audit event and outbox event with
the confirmation state. The existing exchange_recorded event is retained
for compatibility, but its payload says pending or disputed. Consumers
must not treat exchange_recorded as independent peer confirmation.
exchange_confirmed is the distinct new positive attestation event.

## Historical compatibility

Exchanges recorded before this migration are classified
legacy_unverified. Their recorded outcomes, XP journal, already submitted
Feedback, and existing achievement entries are **not erased** or silently
reclassified as jointly verified.

Historic badges awarded using the previous feedback rule remain as
historical recognition; do not use them as proof of a two-party Exchange
or offer them as a safety credential. New milestone counting filters
for Exchange confirmation_state = confirmed.

Do not fabricate a reporter identity for historic Exchanges. A future
appeals/adjudication policy must explicitly define any re-verification
of legacy evidence.

## Risk, compliance, and unshipped functionality

Two-party confirmation is necessary but not sufficient to stop collusion.
One person can coordinate multiple accounts or voluntarily verify
fabricated activity. High-value rewards remain disabled. The next
separate engineering slices add the versioned rolling member and pair
reward-credit limits described in REWARD_CREDIT_VELOCITY.md, while
fraud-review adjudication, timed dispute escalation, authorized
revocation, member appeals, and compensating reward accounting remain
unimplemented. Reward limits do not prohibit Feedback or identify fraud.

A disputed Exchange is frozen, not magically resolved. The current
existing member report and moderation controls remain available; there
is no claim that a bespoke Exchange arbitration UI exists in this slice.

Do not introduce Stripe/PayPal, monetization, portable trust badges,
points exchangeability, payout promises, or paid prizes until that
separate commerce and fraud governance scope is approved.

## Verification

The merge gate requires clean Supabase schema replay, recovery drill,
generated database type parity, authenticated two-person security tests,
self/outsider/forged-actor denial, dispute and replay proof, proof that
pending feedback earns no XP or badge, production build, full canonical
Playwright journey, accessibility checks, and aggregate exact-head CI.

Passing local source checks does not certify a hosted deployment.
