# Production Recovery Runbook

This runbook defines the recovery boundary for Surrogate Network. It deliberately separates the recovery proof owned by this repository from Supabase-managed project recovery so we do not claim coverage we do not have.

## Recovery layers

### 1. Supabase platform backup / PITR

Use Supabase-managed backups as the primary full-project recovery mechanism in production. Before public launch, the deployed project must be on a plan/configuration with an acceptable backup retention window for the product's recovery objectives. If the business requires a tighter recovery-point objective than daily backups provide, enable Point-in-Time Recovery.

Provider recovery is responsible for managed database state that a normal `public` schema dump does not fully represent, including Supabase-managed Auth state and platform-managed schemas. Supabase Storage database metadata is not the same thing as the stored objects themselves, so object recovery must be handled as a separate storage concern.

Official references:
- https://supabase.com/docs/guides/platform/backups
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

## Restore procedure

Prefer restoring into a new/recovery project first instead of destructively overwriting the only production copy. During an incident:

1. identify the recovery point and record the incident timestamp;
2. put the application into maintenance/read-only mode at the deployment edge if available;
3. restore using Supabase platform backup/PITR, or follow the current Supabase CLI restore process for the selected backup type;
4. confirm the migration history and deployed application revision correspond to the recovered schema;
5. verify `/api/health/live` and `/api/health/ready`;
6. run authentication and password-recovery smoke checks;
7. verify representative Needs, Offers, Proposals, Surrogacies, Moments, Exchanges, Feedback, reports, and account tombstones;
8. verify RLS/security behavior before reopening traffic;
9. verify Storage objects independently if the incident involved Storage;
10. document the actual recovery point, data loss window, and any follow-up reconciliation required.

## Release boundary

A green `scripts/recovery-drill.sh` proves application-data recoverability against the local canonical migration chain. It does **not** prove the production provider's backup retention, PITR configuration, remote restore permissions, Storage object recovery, or final recovery time objective.

Before unrestricted production launch, the deployment owner must record the selected Supabase backup/PITR policy and perform at least one provider-level restore rehearsal into an isolated recovery project. Do not infer those provider settings from repository CI.
