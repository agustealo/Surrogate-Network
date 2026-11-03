# Engagement and Commerce: Reuse-First Engineering Contract

Status: SN-ENG-01 implementation candidate, not a consumer-ready release.
Baseline: Surrogate Network master at 905c1346bdb39b6ed2c19ffdebe0a82e980705c7.

## Product boundary

The canonical lifecycle remains:

Need + Offer -> Discovery -> Proposal -> Connection -> Moment -> Exchange -> Feedback.

Members may earn nonmonetary recognition for eligible participation. XP
must not be represented as cash, a transferable balance, a verified safety
credential, or a promise of compensation.

The initial consumer blueprint intentionally excludes an unrestricted paid
marketplace and virtual currency. Compensation requires a separate approved
commercial product scope with permitted categories, seller eligibility,
contracts, consumer protection, payouts, and refunds.

## Existing implementation: retain, do not rebuild

| Domain responsibility | Current owner | Reuse rule |
| --- | --- | --- |
| Authentication and account states | Supabase Auth, member actions, protected SQL functions | Keep one identity/participation authority |
| Member progression | public.member_progression | Keep projection, preserve achievements |
| XP journal | public.xp_transactions | Keep immutable source of reward history |
| Legacy rank cache | public.profiles.xp and public.profiles.rank | Keep synchronized projection, not a second award source |
| Exchange/Feedback lifecycle | Connection actions and trusted SQL RPC wrappers | Recognize only canonical events |
| Event outbox | public.outbox_events | Extend delivery, never introduce a competing event bus |
| Audit | public.audit_events | Reuse for privileged adjustments and moderation |
| Member UI | /rewards and /home | Expand the existing shell and canonical routes |
| Admin UI | /admin and role authorization | Extend the existing admin console |

No Stripe or PayPal packages, provider adapters, checkout/webhook routes,
billing ledgers, seller onboarding, or payout workflows were identified on
the inspected baseline branch and PR history. These are not shipped features.

The old token_transactions table, profile token_balance, and
update_token_balance() function were intentionally retired by
20260928000100_retire_dormant_notification_token_surface.sql. Do not restore
them as a substitute for payment accounting.

## SN-ENG-01 award authority

This branch implements the first verifiable, nonmonetary award rule:

- An eligible, authenticated participant submits Feedback on an existing
  completed or partial Exchange involving both parties.
- The first persisted submission creates exactly one 10-XP award for the
  feedback author. The star rating does not affect the award.
- Feedback already has a unique (from_user_id, exchange_id) constraint.
- private.reward_awards adds a rule-versioned event identity and links it
  to the corresponding XP transaction. It is not exposed through the Data API.
- XP transactions are append-only. Trusted corrections must use an
  additional signed amount instead of altering history.
- The existing server-only update_user_xp function writes the journal;
  the journal trigger derives both profile caches and member_progression
  from the sum of the persisted journal.
- Rank and level follow the legacy rule: rank = floor(total_xp / 100) + 1.
- Migration replays the journal totals to repair existing cached projections,
  skips terminal deletion tombstones, and preserves achievements.
- No automatic award is made merely because one party records an Exchange:
  the current completion flow is unilateral and must not be misrepresented
  as mutual verification.
- XP has no cash redemption or payout pathway.

Reward rule modifications require their own versioned migration and
adversarial replay tests. Reward-awarding model inference is prohibited.

### Current limitations

Feedback remains a participation signal, not objective proof of exchange
quality. Collusion and repeated artificial Exchanges remain possible. Do
not enable high-value prizes, earned commercial privileges, competitive
ranking, or convertible credit before evidence, anti-farming policy, and
participant acknowledgement are complete.

Existing achievement names remain a string-array projection. Structured
achievement definitions, evidence, revocations, consent/privacy controls,
campaign administration, and progression analytics are separate deliverables.

## Commerce domain: provider-neutral future scope

Do not add monetary values to member_progression, xp_transactions, or
private.reward_awards. Commerce requires a separate authoritative domain.

Planned capability boundaries:

- Checkout: provider-neutral order creation, session creation, verified
  payment state, and entitlement fulfillment.
- Billing: products, subscriptions, periods, cancellations, renewals,
  proration and invoice state where a provider supports them.
- Marketplace: eligible seller onboarding and approved compensated service
  categories, independent of community XP.
- Payouts: supported-provider onboarding, eligibility, intent, submission,
  reconciliation, failures and disputes.
- Finance: double-entry journal, immutable entries, reversals, currency
  and minor-unit handling, reconciliation, dispute reserves and reporting.
- Operations: separate financial role permissions, audited privileged
  actions, provider health and incident repair.

Stripe and PayPal adapters must implement explicit capability interfaces.
Neither provider is the domain ledger. Provider-specific webhooks are
cryptographically verified, deduplicated and translated into canonical
business events. Checkout redirects are not payment confirmation.

Provider configuration requires environment-secret separation and
eligibility checks. Never promise cross-provider payout equivalence:
Stripe Connect and PayPal marketplace/payout capabilities have different
supported merchant and regional arrangements.

## Delivery gates

1. SN-ENG-01: Clean migration replay, generated public schema types
   unchanged, immutable XP journal, self/other account privilege tests,
   idempotent Feedback award, and matching profile/member projections.
2. SN-ENG-02: Two-sided Exchange verification, achievement evidence,
   rate/velocity guardrails, award corrections, member experience and admin
   reward governance.
3. SN-COM-01: Domain-first checkout/subscription model, provider adapter
   contracts, sandbox Stripe and PayPal flows, webhooks and entitlements.
4. SN-COM-02: Approved seller onboarding, payouts, reconciliation,
   financial controls, dispute and refund recovery.

Every stage requires exact-head CI plus authenticated browser evidence
before claiming consumer readiness. Migrations are reviewed against the
canonical security/RLS/column-grant model and generated database types.
No unfinished commerce, wallet, token, payout, or earnings route may be
advertised in member navigation.
