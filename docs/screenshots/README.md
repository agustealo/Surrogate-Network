# Runtime documentation screenshots

This directory contains the **exact PNG frames captured by the real Playwright consumer-trial runtime**. They are not mockups, stitched galleries, manually rendered product comps, or recompressed lookalikes.

The committed set is intentionally one file per browser state:

1. `01-public-home.png` — public landing experience.
2. `02-published-need.png` — persisted Need after real creation.
3. `03-incoming-proposal.png` — persisted incoming Proposal between the two trial members.
4. `04-completed-exchange.png` — completed relationship flow after Moment and Feedback.
5. `05-how-it-works.png` — public lifecycle explanation.
6. `06-safety.png` — public safety guidance.
7. `07-member-dashboard.png` — authenticated member dashboard.
8. `08-discovery-marketplace.png` — live Discovery populated by the trial journey.
9. `09-published-offer.png` — persisted Offer after real creation.
10. `10-proposal-composer.png` — proposal composer bound to real Need/Offer records.
11. `11-member-profile-safety.png` — member profile with real block/report controls.
12. `12-active-surrogacy.png` — accepted Proposal promoted into an active Surrogacy.
13. `13-account-privacy-controls.png` — export, deletion, deactivation, and privacy controls.
14. `14-admin-console.png` — authorized Admin Console.
15. `15-moderation-reports.png` — moderation queue containing the report created in the member flow.
16. `16-community-principles.png` — Community Principles / Co-op Charter.

The current committed set was promoted byte-for-byte from the `consumer-visual-evidence` artifact produced by green post-merge CI run **#357** for `master@be859bca5a0639c7f8d2472faaa46c2732bad442`.

Do not hand-author replacement screenshots. Regenerate them through `e2e/smoke.spec.ts`, inspect the exact-head artifact, and promote the individual runtime PNGs only after review. A future UI change should replace the affected shots, not create a collage that hides individual product states.
