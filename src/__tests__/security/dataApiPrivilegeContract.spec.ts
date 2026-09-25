import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from '@jest/globals'

const migration = readFileSync(
  join(process.cwd(), 'supabase/migrations/20260925000100_explicit_data_api_privileges.sql'),
  'utf8',
)

describe('Supabase Data API privilege contract', () => {
  it('removes implicit current and future public-schema exposure', () => {
    expect(migration).toContain('REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public')
    expect(migration).toContain('REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public')
    expect(migration).toContain('ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public')
    expect(migration).toContain('REVOKE EXECUTE ON FUNCTIONS')
    expect(migration).toContain('REVOKE CREATE ON SCHEMA public FROM PUBLIC, anon, authenticated, service_role')
  })

  it('keeps anonymous Data API access on the safe public profile projection', () => {
    expect(migration).toContain('GRANT SELECT ON TABLE public.public_profiles TO anon')
    expect(migration).toContain("has_table_privilege('anon', 'public.profiles', 'SELECT')")
    expect(migration).toContain("has_table_privilege('anon', 'public.needs', 'SELECT')")
  })

  it('keeps initial workflow and authoritative outcome fields out of member table authority', () => {
    expect(migration).toContain("has_column_privilege('authenticated', 'public.proposals', 'status', 'INSERT')")
    expect(migration).toContain("has_column_privilege('authenticated', 'public.reports', 'status', 'INSERT')")
    expect(migration).toContain("has_column_privilege('authenticated', 'public.profiles', 'xp', 'UPDATE')")
    expect(migration).toContain("has_table_privilege('authenticated', 'public.feedback', 'INSERT')")
    expect(migration).toContain("has_table_privilege('authenticated', 'public.member_progression', 'UPDATE')")
  })

  it('keeps internal tables outside the authenticated Data API surface', () => {
    for (const table of ['account_deletion_jobs', 'outbox_events', 'trial_action_rate_limits']) {
      expect(migration).toContain(`has_table_privilege('authenticated', 'public.${table}', 'SELECT')`)
    }
  })

  it('retains explicit trusted service-role DML for server operations', () => {
    expect(migration).toContain("has_table_privilege('service_role', 'public.profiles', 'UPDATE')")
    expect(migration).toContain("has_table_privilege('service_role', 'public.account_deletion_jobs', 'UPDATE')")
  })
})
