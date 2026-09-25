# Production Recovery Runbook

This runbook defines the recovery boundary for Surrogate Network. It deliberately separates the recovery proof owned by this repository from Supabase-managed project recovery so we do not claim coverage we do not have.

## Recovery layers

### 1. Supabase platform backup / PITR

Use Supabase-managed backups as the primary provider-level recovery mechanism for the production database and Supabase-managed Auth state. Do not describe a database restore as a complete platform-project restore.

Before public launch, the deployed project must be on a plan/configuration with an acceptable backup retention window for the product's recovery objectives. Supabase-managed daily backups are available on paid plans. If the business requires a tighter recovery-point objective than daily backups provide, enable Point-in-Time Recovery (PITR) on a supported paid configuration before relying on it operationally.

For an isolated rehearsal, prefer Supabase's **Restore to a New Project** path when it is available for the source project. That path requires a paid source project with physical backups enabled. Review the provider-displayed cost before starting because the restored project is an independent project with its own ongoing resource cost.

A restore-to-new-project operation transfers database-owned state, including:

- database schemas, tables, views, procedures, indexes, and data;
- database roles and permissions;
- Supabase Auth user records stored in the database, including authentication records and password hashes.

It does **not** by itself recreate the entire platform configuration. Recovery must separately inventory and verify, as applicable:

- Storage objects and bucket/object settings;
- Auth project settings, redirect configuration, providers, SMTP settings, and API keys;
- Edge Functions and their secrets/configuration;
- Realtime project settings;
- project-level database/network/compute configuration that is not part of the restored database state;
- read replicas and other provider resources.

Storage metadata in the database is not the same thing as the stored objects themselves. Restoring an older database backup does not recreate Storage objects that are absent from object storage.

After an isolated restore, disable or review any extension or scheduled integration capable of external side effects before testing the recovered project. Examples include `pg_net`, `pg_cron`, wrappers, webhooks, or other database-driven integrations that could contact production systems or users.

Do not use a free-tier logical export as evidence that the provider-level backup/PITR launch gate has been satisfied. Logical exports remain valuable as a separate recovery layer, but they do not prove managed provider backup retention, Auth/project restoration, or PITR capability.

Official references:
- https://supabase.com/docs/guides/platform/backups
- https://supabase.com/docs/guides/platform/clone-project
- https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore

### 2. Repository-owned logical application-data recovery

The repository owns a deterministic CI drill for the application's `public` schema data:

```bash
bash scripts/recovery-drill.sh
```

The drill:

1. starts from the already-running local Supabase database;
2. writes a relational recovery sentinel (`profiles -> needs`);
3. creates a Supabase CLI logical data dump for the `public` schema;
4. destroys and rebuilds the database from committed migrations;
5. restores the logical data dump in one PostgreSQL transaction;
6. verifies the restored relational sentinel byte-for-byte at the selected fields;
7. rebuilds the database again so downstream security tests receive a pristine state.

This is proof that canonical migrations plus a logical application-data dump can recover the app-owned relational dataset. It is **not** proof of a complete Supabase project restore.

## Production logical backup procedure

For an operator-created logical backup, use the Supabase CLI rather than raw `pg_dump` so Supabase-specific filtering is applied. Follow the current Supabase backup/restore documentation for the exact production project and connection mode.

A complete manual migration-style backup generally requires separate artifacts for:

- roles;
- schema;
- application data;
- migration history if it must be preserved;
- any custom changes under managed `auth` or `storage` schemas;
- Storage objects themselves, outside the database dump.

Never commit a production dump, database password, access token, service-role key, or Storage export to this repository.

## Restore rehearsal procedure

Prefer restoring into a new/recovery project first instead of destructively overwriting the only production copy. A launch-certification rehearsal should:

1. identify the exact source production project and record its backup/PITR policy;
2. record the selected source backup or PITR timestamp before starting;
3. review the provider-displayed cost and create the isolated recovery target through the supported provider path;
4. prevent external side effects from the recovery project before exercising recovered data;
5. confirm expected Auth users and representative application data exist in the restored project;
6. verify migrations, RLS/security behavior, account tombstones, and representative Needs, Offers, Proposals, Surrogacies, Moments, Exchanges, Feedback, and reports;
7. separately recreate or verify Auth project settings, API keys, SMTP/redirect configuration, Storage objects/settings, Edge Functions, Realtime settings, and other non-database resources that the application actually depends on;
8. verify `/api/health/live` and `/api/health/ready` against an application instance intentionally configured for the recovery target;
9. run authentication and password-recovery smoke checks with designated test identities only;
10. record observed recovery point, data-loss window/RPO, time to usable recovery/RTO, provider limitations, and any manual reconfiguration required;
11. clean up the isolated recovery project when evidence has been captured and the recovery owner approves deletion.

A production incident may require a different path, including in-place provider restore. During an incident, follow provider guidance, preserve evidence, and account for downtime/data-loss risk before destructive recovery actions.

## Release boundary

A green `scripts/recovery-drill.sh` proves application-data recoverability against the local canonical migration chain. It does **not** prove the production provider's backup retention, PITR configuration, remote restore permissions, Storage object recovery, Auth/project configuration recovery, or final recovery objectives.

Before unrestricted production launch, the deployment owner must identify the real production Supabase project, record the selected provider backup/PITR policy, and perform at least one provider-level restore rehearsal into an isolated recovery project. The rehearsal must verify both restored database/Auth data and the separate non-database recovery responsibilities listed above. Do not infer those provider settings from repository CI.
