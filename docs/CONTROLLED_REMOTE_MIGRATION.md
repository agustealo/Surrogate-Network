# Controlled Remote Supabase Migration

This document concerns the **dedicated, empty, nonpublic Surrogate Network trial database** in the Supabase organization **Zeus Dev**. It does not authorize migration of unrelated projects or production traffic.

- Target ref: `ylutogygxpbpqgfnovpe` (US East / Ohio).
- Source authority: `supabase/migrations/*.sql`, currently 31 canonical timestamped files.
- Target owner: `docs/OPERATIONS_RUNBOOK.md` and launch tracking issue #11.
- Workflow: `.github/workflows/controlled-supabase-migration.yml`.

## Hard prerequisites

1. Protect `master` in GitHub and activate a ruleset requiring PR merges plus the aggregate `QUALITY GATE`. The workflow refuses execution while `master` is unprotected or no ruleset is configured.
2. Configure the GitHub **controlled-trial** environment with required reviewer approval and restrict deployments to protected `master`. Do not add administrative bypasses for ordinary use.
3. Store a dedicated, least-privilege Supabase management token as environment secret `SUPABASE_ACCESS_TOKEN` and the dedicated project's database password as `SUPABASE_DB_PASSWORD`. Configure those in GitHub's encrypted environment secrets, not in repository files, issue comments, workflow inputs, or conversation text.
4. Confirm in Supabase that the target project is the new, unused `surrogate-network` database. If any application data or existing migrations appear, stop and reassess, rather than force a reset.
5. Review the exact `master` commit and its fully successful `QUALITY GATE` run. The workflow's `expected_revision` input must match its own checkout revision exactly.

## Execution

Start the manual **Controlled Supabase Migration** workflow from **Actions**, choosing protected `master`, project ref `ylutogygxpbpqgfnovpe`, and its full reviewed 40-character commit SHA.

- First invocation: `apply=false`. It checks branch governance, validates that all 31 canonical migration filenames are uniquely versioned, links the **specific** remote project, prints the remote migration list and runs the official Supabase CLI `db push --linked --dry-run` without writing the schema.
- Review the dry run for the exact 31 pending migrations and any unexpected drop/revoke operations. **Do not** assume provider PostgreSQL 17 behaves identically to local PostgreSQL 15; stop on a discrepancy.
- Second invocation (only after reviewing the first): `apply=true`, with the same target and an exact, green `master` revision. The CLI applies migrations in timestamp order, records their **original** versions in `supabase_migrations.schema_migrations`, and verifies the 31 source versions appear remotely.

If any apply fails, preserve logs, inspect the partial migration history and schema, and perform a source-owned forward repair after review. **Never** silently mark a migration applied, rebase remote migration history, or reset a valuable remote database.

## Post-migration acceptance (separate evidence)

A successful schema push is **not** equivalent to a secure deployment. Independently verify:

- all 31 versions in remote migration history and no unexpected versions;
- actual public-schema tables, RLS enabled and correct grants, security and performance advisors, exposed view/function privileges and authenticated-versus-anonymous access;
- the canonical schema/type contract against generated database types, plus cross-member isolation and auth integration with real controlled users;
- Supabase Auth redirect URLs, signup confirmation, SMTP and provider backup/PITR policy;
- secure server-only use of `SUPABASE_SERVICE_ROLE_KEY`, deployment variables, and correct exact-SHA release metadata in Vercel;
- hosted verification via the repository's **Deployment Verification** workflow, then human acceptance under issue #38.

Do not create public consumer traffic or declare a hosted release ready until all independent issue #11 and #38 gates are supported by evidence. The Supabase local stack is never a substitute for hosted security and recovery verification.
