BEGIN;

-- Supabase is moving public-schema Data API exposure from implicit grants to an
-- opt-in model. Surrogate Network must not depend on provider defaults for
-- browser/server Supabase clients, fresh installs, or recovery environments.
--
-- Keep public schema usage available to Data API roles, but never let those
-- roles create database objects.
REVOKE CREATE ON SCHEMA public FROM PUBLIC, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- New public objects are private until the migration that creates them grants
-- the exact API surface they need. This mirrors the secure Supabase platform
-- default and keeps future migrations deterministic across old/new projects.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLES
  FROM anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE USAGE, SELECT ON SEQUENCES
  FROM anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS
  FROM PUBLIC, anon, authenticated, service_role;

-- Converge existing projects and fresh installs onto one repository-owned ACL
-- contract instead of preserving whatever automatic grants happened to exist
-- when the project was created.
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public
  FROM PUBLIC, anon, authenticated, service_role;

-- Trusted server/system access. service_role still bypasses RLS, so it is only
-- used by narrowly scoped server-side infrastructure and never shipped to the
-- browser.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.account_deletion_jobs,
  public.audit_events,
  public.blocks,
  public.command_idempotency,
  public.exchanges,
  public.feedback,
  public.member_progression,
  public.moments,
  public.needs,
  public.notifications,
  public.offers,
  public.outbox_events,
  public.profiles,
  public.proposals,
  public.reports,
  public.restrictions,
  public.surrogacies,
  public.surrogacy_participants,
  public.token_transactions,
  public.trial_action_rate_limits,
  public.xp_transactions
TO service_role;
GRANT SELECT ON TABLE public.public_profiles TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Signed-out traffic sees only the intentionally safe profile projection.
GRANT SELECT ON TABLE public.public_profiles TO anon;

-- Signed-in read surface. RLS remains the row-level authority; these grants
-- decide which relations are reachable through PostgREST/Supabase clients at
-- all.
GRANT SELECT ON TABLE
  public.audit_events,
  public.blocks,
  public.command_idempotency,
  public.exchanges,
  public.feedback,
  public.member_progression,
  public.moments,
  public.needs,
  public.notifications,
  public.offers,
  public.profiles,
  public.proposals,
  public.public_profiles,
  public.reports,
  public.restrictions,
  public.surrogacies,
  public.surrogacy_participants,
  public.token_transactions,
  public.xp_transactions
TO authenticated;

-- Member-owned direct writes. Authoritative lifecycle/status/reputation fields
-- remain unavailable at the table ACL layer and are changed only by the trusted
-- RPC/trigger paths declared in earlier migrations.
GRANT INSERT (
  title, description, category, tags, location_mode, timing, boundaries, urgency,
  user_id, user_name, user_avatar, expires_at
) ON TABLE public.needs TO authenticated;
GRANT UPDATE (
  title, description, category, tags, location_mode, timing, boundaries, urgency,
  user_name, user_avatar, expires_at
) ON TABLE public.needs TO authenticated;

GRANT INSERT (
  title, description, category, location_mode, timing, boundaries, capacity,
  user_id, user_name, user_avatar
) ON TABLE public.offers TO authenticated;
GRANT UPDATE (
  title, description, category, location_mode, timing, boundaries, capacity,
  user_name, user_avatar
) ON TABLE public.offers TO authenticated;

GRANT INSERT ON TABLE public.proposals TO authenticated;
GRANT INSERT, DELETE ON TABLE public.blocks TO authenticated;
GRANT INSERT ON TABLE public.reports TO authenticated;
GRANT INSERT ON TABLE public.command_idempotency TO authenticated;

GRANT UPDATE (
  name, avatar_url, bio, location, availability, boundaries
) ON TABLE public.profiles TO authenticated;
GRANT UPDATE (read) ON TABLE public.notifications TO authenticated;

-- Assert the high-value ACL boundaries while the migration is applied. These
-- checks make a clean rebuild fail immediately if the declared contract drifts.
DO $$
BEGIN
  IF NOT has_table_privilege('anon', 'public.public_profiles', 'SELECT')
     OR has_table_privilege('anon', 'public.profiles', 'SELECT')
     OR has_table_privilege('anon', 'public.needs', 'SELECT') THEN
    RAISE EXCEPTION 'Anonymous Data API privilege contract is invalid';
  END IF;

  IF NOT has_table_privilege('authenticated', 'public.needs', 'SELECT')
     OR NOT has_column_privilege('authenticated', 'public.needs', 'title', 'INSERT')
     OR has_column_privilege('authenticated', 'public.needs', 'status', 'UPDATE')
     OR has_table_privilege('authenticated', 'public.needs', 'DELETE') THEN
    RAISE EXCEPTION 'Need Data API privilege contract is invalid';
  END IF;

  IF NOT has_table_privilege('authenticated', 'public.offers', 'SELECT')
     OR NOT has_column_privilege('authenticated', 'public.offers', 'title', 'INSERT')
     OR has_column_privilege('authenticated', 'public.offers', 'current_capacity', 'UPDATE')
     OR has_table_privilege('authenticated', 'public.offers', 'DELETE') THEN
    RAISE EXCEPTION 'Offer Data API privilege contract is invalid';
  END IF;

  IF NOT has_table_privilege('authenticated', 'public.proposals', 'INSERT')
     OR has_table_privilege('authenticated', 'public.proposals', 'UPDATE')
     OR has_table_privilege('authenticated', 'public.proposals', 'DELETE') THEN
    RAISE EXCEPTION 'Proposal Data API privilege contract is invalid';
  END IF;

  IF NOT has_column_privilege('authenticated', 'public.profiles', 'name', 'UPDATE')
     OR has_column_privilege('authenticated', 'public.profiles', 'xp', 'UPDATE')
     OR has_column_privilege('authenticated', 'public.profiles', 'is_admin', 'UPDATE') THEN
    RAISE EXCEPTION 'Profile Data API privilege contract is invalid';
  END IF;

  IF NOT has_column_privilege('authenticated', 'public.notifications', 'read', 'UPDATE')
     OR has_column_privilege('authenticated', 'public.notifications', 'title', 'UPDATE')
     OR has_table_privilege('authenticated', 'public.feedback', 'INSERT')
     OR has_table_privilege('authenticated', 'public.member_progression', 'UPDATE') THEN
    RAISE EXCEPTION 'Authoritative outcome Data API privilege contract is invalid';
  END IF;

  IF has_table_privilege('authenticated', 'public.account_deletion_jobs', 'SELECT')
     OR has_table_privilege('authenticated', 'public.outbox_events', 'SELECT')
     OR has_table_privilege('authenticated', 'public.trial_action_rate_limits', 'SELECT') THEN
    RAISE EXCEPTION 'Internal table Data API privilege contract is invalid';
  END IF;

  IF NOT has_table_privilege('service_role', 'public.profiles', 'SELECT')
     OR NOT has_table_privilege('service_role', 'public.profiles', 'UPDATE')
     OR NOT has_table_privilege('service_role', 'public.account_deletion_jobs', 'UPDATE') THEN
    RAISE EXCEPTION 'Service-role Data API privilege contract is invalid';
  END IF;
END;
$$;

COMMIT;
