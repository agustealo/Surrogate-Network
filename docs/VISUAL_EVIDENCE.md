# Visual Evidence and Brand Assets

Surrogate Network documentation uses two classes of visual asset, and they must never be confused.

## Brand assets

Canonical documentation identity lives in `docs/assets/`:

- `surrogate-network-mark.svg` — reusable logo mark.
- `surrogate-network-banner.svg` — README/documentation header.

These assets use the same brand colors already defined by the application UI: royal violet (`#A049DF`), vibrant pink (`#F25A99`), supporting violet (`#CC99E6`), and the neutral product background (`#F9F9FB`).

## Runtime screenshots

The source evidence is generated only by the real Playwright consumer-trial runtime. It is not a mockup, design comp, seeded marketing render, or manually fabricated screen.

The capture contract is embedded in `e2e/smoke.spec.ts` and currently produces 16 PNG evidence frames:

1. `01-public-home.png` — public entry surface.
2. `02-published-need.png` — a persisted Need after real creation.
3. `03-incoming-proposal.png` — a persisted incoming Proposal between two real trial accounts.
4. `04-completed-exchange.png` — the Surrogacy lifecycle after Moment completion and submitted Feedback.
5. `05-how-it-works.png` — public product explanation.
6. `06-safety.png` — public Safety surface.
7. `07-member-dashboard.png` — authenticated member dashboard.
8. `08-discovery-marketplace.png` — live Discovery marketplace populated by the trial journey.
9. `09-published-offer.png` — a persisted Offer after real creation.
10. `10-proposal-composer.png` — proposal composer populated against real Need/Offer records.
11. `11-member-profile-safety.png` — authenticated member profile with real report/block controls.
12. `12-active-surrogacy.png` — active Surrogacy/Connection after proposal acceptance.
13. `13-account-privacy-controls.png` — real export, deletion, deactivation, and privacy controls.
14. `14-admin-console.png` — authorized Admin Console operational dashboard.
15. `15-moderation-reports.png` — moderation queue containing the report created through the member flow.
16. `16-community-principles.png` — Community Principles / Co-op Charter.

CI fails if required source screenshots are absent or empty. The E2E workflow uploads the complete PNG set as the `consumer-visual-evidence` artifact so the exact-head runtime can be reviewed before publication.

## Reviewed documentation derivatives

Repository documentation intentionally promotes a smaller set of WebP derivatives rather than duplicating the entire CI artifact:

- `01-public-home.webp`
- `02-published-need.webp`
- `03-incoming-proposal.webp`
- `04-completed-exchange.webp`
- `05-showcase-grid.webp` — a compact reviewed gallery covering Discovery, member safety, account controls, Admin Console, moderation reports, and Community Principles.

The WebP files are documentation derivatives of reviewed runtime captures, not a separate screenshot source of truth. The GitHub Actions artifact remains the authoritative exact-capture evidence for the run that produced them.

The current showcase grid was promoted from the fully green run **#334** artifact generated from `a67f0252d5a57f460716a7107ff0aed74901d739`. That run passed the complete `QUALITY GATE`, including SECURITY, BUILD, E2E TRIAL, A11Y, recovery, schema/type drift checks, and exact local deployment verification. The subsequent documentation commit must earn its own exact-head gate before merge.

## Documentation usage

Use the banner once at the top of the README or a long-form project manuscript. Use screenshots only where they explain a real product state or workflow. Do not repeat screenshots decoratively and do not use a screenshot to imply a feature that is not actually exercised by the exact E2E path that produced it.

For release or manuscript publication, prefer repository-committed WebP derivatives tied to a reviewed green E2E run. If the UI changes materially, regenerate the source PNGs, review them, and promote new derivatives rather than retaining stale visuals.

## Privacy and safety boundary

Screenshot capture must use synthetic trial identities only. Do not capture production member data, secrets, service-role configuration, recovery links, raw tokens, internal error payloads, or provider credentials. Public documentation screenshots should show product behavior, not operational secrets.
