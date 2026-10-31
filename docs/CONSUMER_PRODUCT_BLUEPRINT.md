# Surrogate Network: Canonical Consumer Product Blueprint

Status: proposed product/experience contract, not a claim of implemented functionality  
Date: 2026-10-31  
Baseline: `master@b971531c5925422372444b3c8dbb62c5bfa3437f`  
Owners: product and engineering  
Related authority: [Project Manifest](PROJECT_MANIFEST.md), [Consumer Acceptance Trial](CONSUMER_ACCEPTANCE_TRIAL.md), [Architecture](ARCHITECTURE.md), [issue #38](https://github.com/agustealo/Surrogate-Network/issues/38), [issue #11](https://github.com/agustealo/Surrogate-Network/issues/11).

## 1. Product definition

**Surrogate Network is a needs-based human connection platform.** Its purpose is to let adults express a permitted Need or Offer, discover compatible people, negotiate voluntary participation, form a bounded Connection, coordinate Moments, record Exchanges, and provide contextual Feedback.

**Promise:** Find someone who can help. Be someone who can help. Build meaningful connections.

**Core outcome:** A consent-based, safely completed human Exchange. Impressions, dwell time, ranking scores, XP, and feature count are supporting measurements, not the product's objective.

**Canonical lifecycle:** Need + Offer → Discovery → Proposal → Surrogacy (consumer label: Connection) → Moment → Exchange → Feedback.

The two participant modes, seeking and contributing, are fluid. A member can do both. The platform is not a dating app, unrestricted labor marketplace, emergency service, substitute for licensed care, or AI companion replacing human relationships.

## 2. Audience and initial scope

Initial test cohorts should focus on consenting adults participating in bounded, nonregulated exchanges, including shared activities, general skill exchange, practical community assistance, and interest-based collaboration. Categories require explicit safety review before release. Do not silently enable childcare, licensed medical or legal services, emergency interventions, adult services, or hazardous/regulated work.

No paid/token economy is part of this blueprint. Existing XP/rewards recognize genuine participation; they must not be interpreted as a safety credential.

## 3. Jobs to be done

| Member intent | Product job | Observable success |
| --- | --- | --- |
| I need support or companionship | Express an actionable Need and find a compatible Offer | Member can submit, discover, and propose without guidance |
| I can contribute | Express a truthful Offer and respond to an eligible Need | Offer persists and can produce an authorized Proposal |
| I want to decide safely | Understand compatibility, boundaries, and next steps | No invented match certainty; clear accept/decline/counter |
| We want to participate | Understand the Connection and coordinate a Moment | Both parties see accurate relationship state |
| We participated | Record an Exchange and contextual Feedback | Completion and Feedback are bound to authorized lifecycle |
| I want control | Block, report, adjust preferences, export, pause, or delete | Controls persist and have transparent consequences |

## 4. Explicit feature inventory and boundaries

**Documented shipped foundations:** authentication/recovery, profiles, Needs, Offers, discovery, save/hide recommendation controls, Proposals, Connections, Moments, Exchanges, Feedback, rewards/XP, block/report/moderation, account and privacy lifecycle. Treat this inventory as documentation-grounded, not proof of human usability or hosted deployment.

**Not shipped:** member messaging, generic notifications, media storage, autonomous compatibility prediction, token economy. Do not show placeholder routes or claim these functions exist. Future communication requires persisted conversation ownership, block/report enforcement, retention, deletion, access controls, and abuse-aware operations. Future prediction must not invent certainty.

**Source findings on this baseline:**
- `src/app/(member)/home/page.tsx` surfaces counts of Needs/Offers/Connections plus rank/XP and generic shortcuts. It does not render a prioritized, real-data pending-action or upcoming-Moment queue.
- `src/app/(member)/discover/page.tsx` separates recommended Needs and Offers into card lists, shows a `score/100` and reason badges, and exposes recommendation controls. An exact-looking score needs validated meaning and truthful explanation; do not infer the score is a calibrated probability.
- `src/app/(member)/surrogacies/[id]/page.tsx` renders relationship/Need/Offer details, Moment scheduling, Exchange history and Feedback. It does not currently present an explicit member-facing next-step timeline or acknowledgement of agreement boundaries.
- `src/navigation/index.ts` is the canonical navigation registry. Desktop and mobile present different groupings; preserve accessibility and route parity while auditing labels.
- Do not create duplicate home state, recommendation ranking, or navigation ownership in a redesigned UI.

## 5. Experience architecture

**Home: the relationship command center.** First show the next *real* actionable item, when one exists: pending Proposal, accepted Connection requiring scheduling, scheduled Moment, eligible completion/Feedback, or a newly appropriate discovery action. Preserve the current first-use Need/Offer/Discover choices. An item must derive from authorized persisted state. Never manufacture a pending action, urgency, participant, or count.

**Discover: intent-aware Need/Offer matching.** Make it clear whether the member wants to find help, offer help, or explore. Preserve the canonical `FypRecommendationService`; candidate retrieval eligibility, blocks, preferences, de-duplication, location evidence, saved/hidden state and experiment/shadow consistency remain authoritative. Recommendations show reasons grounded in actual inputs. Clearly distinguish heuristic scores from verified compatibility.

**Proposals: explicit decisions.** Explain what is requested, proposed terms, what acceptance creates, and available accept/decline/counter/withdraw transitions. Never turn a click or a recommendation into consent.

**Connections: relationship workspace.** Prioritize purpose, counterpart, mutually understood expectations, current state and next Moment. Show history progressively. If agreement fields are insufficient, first determine whether the existing `agreement` contract can be extended safely; do not introduce parallel agreement stores.

**Profile and settings: trust and control.** Separate public self-description from sensitive account settings; clarify what is verified versus self-reported, and make discovery preferences, blocks, account export/deactivation/deletion understandable and recoverable.

**Navigation:** desktop/mobile affordances may differ, but canonical routes, labels and action outcomes must not. An active route is not a separate business model.

## 6. Required interaction contract

Every material control must have discoverable intent, actionable affordance, keyboard and touch operation, loading/disabled states, success confirmation, persistence proof, failure/retry behavior and honest empty states. Destructive or relationship-changing actions need contextual explanation and confirmation when warranted. Accessibility tests include 375px mobile, keyboard, screen reader, focus return and reduced motion.

A user must never see a simulated success when a mutation fails. Public/member/admin boundaries, RLS, column grants and server authority are nonnegotiable.

## 7. Prioritized work packages

### P0: Consumer truth and journey repair
**CX-01 First-use comprehension**: audit public entry, consent, onboarding and the first Need/Offer/Discover action. Test unprompted product understanding and task completion. No speculative welcome-state metrics.

**CX-02 Home next-action projection**: design a *single read-only projection* from canonical Proposals, Connections, Moments and Exchange/Feedback eligibility. Do not persist a duplicate task list or fabricate notifications. Show actionable state and meaningful empty/blocked states. Acceptance includes cross-user isolation, deterministic priority, stale states and authorization.

**CX-03 Lifecycle language and status**: harmonize the words Need, Offer, Proposal, Connection, Moment, Exchange, Feedback throughout routes and accessibility labels. Add explanatory microcopy rather than renaming database entities.

**CX-04 Recommendation truth**: audit whether displayed `score/100` claims unjustified certainty, whether reasons match actual signals, and whether saved/hidden/restored choices remain consistent across browser navigation and refresh. Reuse the current ranking authority and preserve issue #29's retrieval/location integrity constraints.

**CX-05 Human acceptance**: execute existing issue #38 tasks with consenting real participants and record unassisted, assisted, failed and blocked results. Automated Playwright and screenshots do not replace this evidence.

### P1: Coordination and relationship depth
**CX-06 Connection next-action experience**: foreground mutually understood purpose, agreement visibility, future Moment, cancellation/status and Feedback eligibility. Preserve current transactional lifecycle.

**CX-07 Contextual communication RFC**: write permissions, participants, retention, abuse reporting, moderation, blocking, deletion and delivery contracts before implementation. Messaging remains absent from navigation until complete.

**CX-08 Relevant event awareness RFC**: event-driven notification/digest design using real authoritative changes and explicit delivery policy. No fake bell or unread counts.

### P2: Distinctive intelligence
**CX-09 Explainable compatibility**: explicit user intent, boundaries, capability and availability signals with strict unknown/neutral handling and falsifiable recommendation explanations. Start deterministic and measurable; no unproven ML score.

**CX-10 Guided creation**: help express a Need or Offer with category-specific constraints, preview and explicit final user submission. Optional AI may draft but never commit or assert credentials/verification.

### P3: Community expansion
Group Moments, support circles, recurring collaborations and organizations only after focused one-to-one exchanges show genuine demand, validated safety and stable operations.

## 8. Acceptance and measurement

**North Star:** meaningful completed Exchanges, qualified by legitimate participants and monitored for safety and quality; raw volume is not success by itself.

Observe: first-session comprehension, time to first valid Need/Offer, Proposal creation, accepted Connection to completed Exchange, opt-in repeat participation, feedback quality, reasons for abandonment, adverse events and reporting completion. Use human evidence with denominators. Set thresholds from a real baseline; do not invent success rates.

P0 release blockers: critical privacy/safety bypass, misleading consent or destructive actions, inaccessible canonical journeys, unrepairable first-session failures, or false success. Other usability findings must have owner, severity and retest SHA.

## 9. Engineering and release rules

Respect `src/domain` → `src/application` → `src/repositories` contracts implemented by infrastructure; UI never directly mutates privileged state. Migrations own schema and API grants, including RLS and column authority. Maintain clean migration replay, generated types, testing, visual evidence from actual runtime, exact-head QUALITY GATE, and hosted SHA verification.

There are **three independent bars**: engineering readiness, human consumer readiness, and external/operational market readiness. Existing issue #38 owns observed usability evidence; issue #11 owns launch certification. A green CI run must not be described as a public-release or human-acceptance pass.

## 10. Product decision filter

Every proposed product feature must answer:
1. Which legitimate Need, Offer, Proposal, Connection, Moment or Exchange does it improve?
2. What user-visible outcome changes and how can it be measured?
3. What authority, privacy, safety, accessibility and failure contracts must exist?
4. Can we extend a canonical owner rather than creating duplicate storage, navigation or intelligence?
5. What evidence permits consumers to see it, and what would block shipment?

If those questions cannot be answered, the feature is not ready for the primary roadmap.

## 11. Next slice

Begin with CX-01 through CX-05. Inspect live routes and human experience before implementing CX-06 through CX-10. Prioritize Home next actions and Connection clarity only after validating the surrounding user journey and authorization. Keep the existing relationship state machine intact, and do not re-open completed FYP integrity work without a concrete regression.
