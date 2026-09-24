# Visual Evidence and Brand Assets

Surrogate Network documentation uses two classes of visual asset, and they must never be confused.

## Brand assets

Canonical documentation identity lives in `docs/assets/`:

- `surrogate-network-mark.svg` — reusable logo mark.
- `surrogate-network-banner.svg` — README/documentation header.

These assets use the same brand colors already defined by the application UI: royal violet (`#A049DF`), vibrant pink (`#F25A99`), supporting violet (`#CC99E6`), and the neutral product background (`#F9F9FB`).

## Runtime screenshots

Canonical screenshots live in `docs/screenshots/` and are generated only from the real Playwright consumer-trial runtime. They are not mockups, design comps, seeded marketing renders, or manually fabricated screens.

The capture contract is embedded in `e2e/smoke.spec.ts` and currently covers:

1. `01-public-home.png` — public entry surface.
2. `02-published-need.png` — a persisted Need after real creation.
3. `03-incoming-proposal.png` — a persisted incoming Proposal between two real trial accounts.
4. `04-completed-exchange.png` — the Surrogacy lifecycle after Moment completion and submitted Feedback.

CI must fail the visual-evidence check if any required screenshot is absent or empty. The E2E workflow uploads the screenshots as a dedicated artifact so they can be reviewed before they are promoted into the repository.

## Documentation usage

Use the banner once at the top of the README or a long-form project manuscript. Use screenshots only where they explain a real product state or workflow. Do not repeat screenshots decoratively and do not use a screenshot to imply a feature that is not actually exercised by the exact E2E path that produced it.

For release or manuscript publication, prefer the repository-committed screenshots tied to a green exact-head E2E run. If the UI changes materially, regenerate and review the screenshots rather than retaining stale visuals.

## Privacy and safety boundary

Screenshot capture must use synthetic trial identities only. Do not capture production member data, secrets, service-role configuration, recovery links, raw tokens, internal error payloads, or provider credentials. Public documentation screenshots should show product behavior, not operational secrets.
