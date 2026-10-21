# Consumer Acceptance Trial Protocol

**Owner:** Consumer trial facilitator and designated release owner  
**Tracking:** [Issue #38](https://github.com/agustealo/Surrogate-Network/issues/38)  
**Scope:** Shipped consumer experience, especially the UX/Settings changes merged in PR #37.  
**Status:** Protocol ready for review; **no human sessions or outcomes are claimed**.

This is a **moderated usability study**, not a replacement for the canonical automated Playwright two-member test (`e2e/smoke.spec.ts`) or hosted deployment certification (#11). Findings can inform changes; only authorized operators can approve a public release.

## 1. Before participants join

- Record the **exact deployed SHA and origin**. Verify deployment with the existing runbook. If deployment verification cannot pass, use a safe local trial environment and explicitly label results **local-only**; do not present it as a hosted acceptance pass.
- Confirm testing runs against the app's **real persisted logic** and a controlled trial database. Do not add fake listings or seeded presentation results to make the experience appear populated.
- Use **synthetic accounts and listings** for directed pair tasks; isolate test users from unrelated real member content.
- Obtain informed participation and recording consent, describe how notes are used, and offer a no-recording option. Do not collect credentials, recovery tokens, private messages, safety allegations, or personally identifying screenshots.
- Verify a moderator/safety escalation contact and a way to immediately stop the session for distress, policy or privacy concerns.
- Capture devices, browser versions, viewport size, network context, and whether assistive technology is used. Test both desktop and narrow mobile, plus keyboard-only and a screen-reader pass.
- Prepare two trial members for the collaboration task, one acting as requester and one as provider. Use the real signup/onboarding flow for at least one person.

## 2. Facilitator script

> "This is a test of the product, not of you. Please say what you expect will happen and what you're looking for as you go. I won't explain where the controls are during a task. If you're stuck, I'll note it and may give one neutral hint. You can skip or stop at any point."

Never coach a participant toward the desired screen, point out a hidden control, or treat an assisted success as an unassisted success. Read the goal only. Ask neutral probes afterward: "What did you expect?", "What made that unclear?", "What would you do next?"

## 3. Test tasks

Keep tasks in this order to observe the first-use mental model. For privacy-sensitive actions, use synthetic trial records and never require irreversible deletion of a participant's own account.

| ID | Participant-facing task | Observe without prompting | Evidence / outcome |
|---|---|---|---|
| T01 | "Looking at this page, tell me what this service helps people do and what you'd try first." | Explains Need vs Offer; distinguishes Proposal from Connection; understands that exchanges require two people | Capture words, first click, uncertainty |
| T02 | "Create an account and get to where you can take part." | Email confirmation, trial consent, onboarding, recovery from validation errors, visible next action | Completion or precise stopping point |
| T03 | "Ask the community for help planning your week." | Finds Need creation, describes expectations, submits and locates persisted Need | Need URL/test record ID only |
| T04 | "Offer planning support to someone." | Differentiates Offer from Need, submits Offer, finds it afterward | Offer URL/test record ID only |
| T05 | "Find a relevant person and decide whether to save or hide their listing." | Discovers filters/recommendations; understands saved/hidden behavior and empty results | Selection and explanation |
| T06 | "Suggest helping with the other person's request." | Selects matching Offer, creates Proposal, understands pending state | Proposal state from UI |
| T07 | "As the other member, respond to the proposal and arrange a session." | Recognizes accept/decline/counter; creates Connection and Moment without accidental consent | Actual resulting state |
| T08 | "Finish the session and give feedback." | Completes Moment, Exchange and Feedback; understands irreversible/shared effects | End-state observed |
| T09 | "Find a way to prevent this test member from contacting or matching with you, then reverse it." | Finds block, blocked-member settings, unblock; verifies consequences | No unintended access |
| T10 | "Locate your privacy controls, download your data, and pause participation without deleting your account." | Finds Settings, distinguishes deactivation vs deletion; can cancel; export works | Download observed; no real deletion |
| T11 | "Try again when an action fails or a session expires." | Clear error, no false success, safe retry, reauthentication without data leakage | Error and recovery behavior |
| T12 | "Find how to report a safety concern." | Reporting control, expectations and safe escalation | Record route and clarity, no fabricated report against real member |

The separate authorized moderator should additionally verify report triage, auditability, and member/admin isolation. These operator tasks must never be presented inside the consumer navigation.

## 4. Accessibility and responsive passes

Repeat T02, T03, T05, T09 and T10 using keyboard-only navigation. Check predictable focus order, focus visible, logical heading order, form labels/error association, modal focus return, expanded-state announcements, current-page announcements, and no keyboard trap. Repeat representative tasks at **375 px** width. An assistive-technology user or evaluator should repeat onboarding, Discover, Proposal, and Settings with an actual screen reader. Automated A11Y passing does not count as this human evidence.

## 5. Recording template (copy for each task)

```text
Session code (non-identifying):
Date / facilitator:
Deployed SHA and origin (or LOCAL-ONLY):
Device / browser / viewport / assistive technology:
Task ID and task goal:
Outcome: UNASSISTED_SUCCESS | ASSISTED_SUCCESS | FAILED | BLOCKED | NOT_RUN
Elapsed time:
Number of hints:
First intended action and actual first action:
Wrong turns / backtracks:
Confusing wording or controls (redacted):
Error state / recovery (if any):
Privacy or safety concern:
Evidence reference (redacted; never secrets or account credentials):
Defect issue / severity / owner:
Retest outcome and revision:
```

Do not infer time-to-complete or task-success percentages from test automation. For any summary, report the **number of human participants and denominator per task**. Keep skipped/blocked tasks visible.

### Severity

- **P0 / stop:** privacy disclosure, unauthorized access, misleading irreversible action, safety-control bypass, or inability to control participant exposure. Halt affected testing and escalate.
- **P1 / release blocker:** a core journey cannot be completed, major inaccessible barrier, broken consent, or destructive action without meaningful confirmation.
- **P2 / major usability:** repeated wrong turns, ambiguous terms, confusing state/feedback, or need for facilitator hint.
- **P3 / polish:** cosmetic/low-impact issue with an accessible effective path.

## 6. Trial summary and release decision

```text
Evaluation revision / deployment:
Participants and consent evidence reference:
Human tasks run: [IDs and participant counts per task]
Unassisted / assisted / failed / blocked / not run (by task):
Mobile / desktop / keyboard-only / screen reader evidence:
P0 / P1 / P2 / P3 open findings:
Changes applied and exact-head retest evidence:
Hosted deployment verification (#11): PASS / FAIL / NOT_RUN
Decision: GO / CONDITIONAL_GO / NO_GO
Decision-maker and date:
Conditions and retest owner:
```

**Never record GO solely because CI is green.** Minimum acceptance: all core journeys have human observations; no unresolved P0/P1; actionable defects are triaged and retested; deployment and operational prerequisites under #11 are separately satisfied for a hosted release; and an accountable human explicitly records the decision. A conditional go must identify precise restrictions, owners and a review deadline.

## 7. Source-of-truth links

- [Human acceptance tracker](https://github.com/agustealo/Surrogate-Network/issues/38)
- [Hosted launch certification](https://github.com/agustealo/Surrogate-Network/issues/11)
- [FYP retrieval and location integrity](https://github.com/agustealo/Surrogate-Network/issues/29)
- `docs/PROJECT_MANIFEST.md` for shipped domain rules and methodology
- `docs/OPERATIONS_RUNBOOK.md` for deployment revision verification and incident handling
- `docs/VISUAL_EVIDENCE.md` for **automated** runtime evidence (not human UX evidence)
