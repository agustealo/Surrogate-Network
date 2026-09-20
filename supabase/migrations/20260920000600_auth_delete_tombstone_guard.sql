BEGIN;

-- A direct Supabase Auth deletion must never leave an active orphan profile or
-- bypass the application's redaction/audit invariants. Prepare the application
-- tombstone before auth.users disappears, whether deletion came from the normal
-- account flow or an out-of-band administrative action.
CREATE OR REPLACE FUNCTION public.handle_trial_auth_user_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = OLD.id
      AND trial_deleted_at IS NULL
  ) THEN
    PERFORM public.prepare_trial_account_deletion_trusted(OLD.id);
  END IF;

  RETURN OLD;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_trial_auth_user_delete()
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_trial_auth_user_delete()
  TO postgres;

DROP TRIGGER IF EXISTS trial_auth_user_delete_tombstone ON auth.users;
CREATE TRIGGER trial_auth_user_delete_tombstone
BEFORE DELETE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_trial_auth_user_delete();

COMMIT;
