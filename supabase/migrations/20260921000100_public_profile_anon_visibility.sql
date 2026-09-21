BEGIN;

-- public_profiles is intentionally readable by anon, but its block filter calls
-- are_users_blocked(). The helper previously revoked anon EXECUTE entirely,
-- causing the public view itself to fail for unauthenticated callers.
--
-- Permit only the null-requester shape required by the view. Anonymous callers
-- that supply two concrete member IDs must not be able to inspect block state.
CREATE OR REPLACE FUNCTION public.are_users_blocked(p_user_a uuid, p_user_b uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
DECLARE
  v_requester uuid := auth.uid();
  v_role text := COALESCE(auth.role(), '');
BEGIN
  IF p_user_a IS NULL OR p_user_b IS NULL OR p_user_a = p_user_b THEN
    RETURN false;
  END IF;

  IF v_role = 'anon' THEN
    RAISE EXCEPTION 'Anonymous callers may not inspect member block state';
  END IF;

  IF v_role = 'authenticated'
     AND v_requester IS NOT NULL
     AND v_requester <> p_user_a
     AND v_requester <> p_user_b THEN
    RAISE EXCEPTION 'Block state may only be checked for the authenticated member';
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.blocks
    WHERE (blocker_user_id = p_user_a AND blocked_user_id = p_user_b)
       OR (blocker_user_id = p_user_b AND blocked_user_id = p_user_a)
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.are_users_blocked(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.are_users_blocked(uuid, uuid)
  TO anon, authenticated, service_role, postgres;

COMMENT ON FUNCTION public.are_users_blocked(uuid, uuid) IS
  'Returns mutual block state. Anonymous execution is limited to null-requester calls used by public_profiles; concrete anonymous pair probes fail closed.';

COMMIT;
