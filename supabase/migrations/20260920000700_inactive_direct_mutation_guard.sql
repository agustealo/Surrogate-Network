BEGIN;

-- An issued JWT can outlive an account-state change. Direct Data API writes
-- therefore need the same active-member boundary as the application actions.
-- SECURITY INVOKER is intentional: current_user remains `authenticated` for a
-- direct PostgREST mutation, while trusted SECURITY DEFINER RPC cores execute
-- as postgres and can still perform canonical deactivation/deletion work.
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION private.enforce_active_member_direct_mutation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  -- A deletion tombstone is immutable for every normal database role. Use a
  -- JSON projection because this trigger is shared by heterogeneous tables and
  -- only profiles carry trial_deleted_at.
  IF TG_TABLE_NAME = 'profiles'
     AND TG_OP IN ('UPDATE', 'DELETE')
     AND (to_jsonb(OLD)->>'trial_deleted_at') IS NOT NULL THEN
    RAISE EXCEPTION 'Deleted profile tombstones are immutable';
  END IF;

  IF current_user = 'authenticated'
     AND (auth.uid() IS NULL OR NOT public.is_active_member(auth.uid())) THEN
    RAISE EXCEPTION 'Active member required for direct data mutation';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.enforce_active_member_direct_mutation()
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.enforce_active_member_direct_mutation()
  TO postgres;

-- Profiles are retained as stable tombstones; application roles never own
-- destructive profile deletion authority.
REVOKE DELETE ON TABLE public.profiles FROM PUBLIC, anon, authenticated, service_role;
GRANT DELETE ON TABLE public.profiles TO postgres;

DO $$
DECLARE
  v_table text;
BEGIN
  FOREACH v_table IN ARRAY ARRAY[
    'profiles',
    'needs',
    'offers',
    'proposals',
    'surrogacies',
    'surrogacy_participants',
    'moments',
    'exchanges',
    'feedback',
    'media_assets',
    'media_access_requests',
    'media_access_grants',
    'token_transactions',
    'xp_transactions',
    'member_progression',
    'notifications',
    'reports',
    'restrictions',
    'blocks'
  ] LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS active_member_direct_mutation_guard ON public.%I',
      v_table
    );
    EXECUTE format(
      'CREATE TRIGGER active_member_direct_mutation_guard BEFORE INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION private.enforce_active_member_direct_mutation()',
      v_table
    );
  END LOOP;
END;
$$;

COMMIT;
