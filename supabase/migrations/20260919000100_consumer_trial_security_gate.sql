BEGIN;

-- Consumer-trial security gate.
-- Supabase/Postgres functions are executable by PUBLIC by default. Sensitive
-- SECURITY DEFINER functions must therefore explicitly revoke PUBLIC in
-- addition to anon/authenticated, then grant only the trusted server roles.

-- Prevent future functions created by the migration owner from silently
-- becoming Data API callable. Explicit grants remain possible per function.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM anon, authenticated;

-- Sensitive authoritative mutation RPCs are server-only.
REVOKE EXECUTE ON FUNCTION public.update_token_balance(uuid, integer, text, transaction_type)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_user_xp(uuid, integer, xp_source, text)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_update_profile(
  uuid, text, text, text, text, text, text, boundary[], integer, integer,
  integer, verification_status, boolean
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.update_token_balance(uuid, integer, text, transaction_type)
  TO service_role, postgres;
GRANT EXECUTE ON FUNCTION public.update_user_xp(uuid, integer, xp_source, text)
  TO service_role, postgres;
GRANT EXECUTE ON FUNCTION public.admin_update_profile(
  uuid, text, text, text, text, text, text, boundary[], integer, integer,
  integer, verification_status, boolean
) TO service_role, postgres;

-- Maintenance is privileged too. It mutates command history globally and must
-- never be callable through an end-user JWT.
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_idempotency()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_idempotency()
  TO service_role, postgres;

-- The legacy admin predicate is still referenced by a profile RLS policy.
-- Keep it callable by authenticated users for policy evaluation, but pin the
-- search path and schema-qualify its relation so SECURITY DEFINER cannot be
-- redirected through attacker-controlled objects.
CREATE OR REPLACE FUNCTION public.is_admin_user(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = p_user_id
      AND is_admin = true
      AND is_suspended = false
  );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.is_admin_user(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin_user(uuid) TO authenticated, service_role, postgres;

-- Internal admin verifier is not a public RPC surface.
CREATE OR REPLACE FUNCTION public.verify_admin_role(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = p_user_id
      AND is_admin = true
      AND is_suspended = false
  );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.verify_admin_role(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_admin_role(uuid)
  TO service_role, postgres;

-- Profile bootstrap is trigger-only. Pin its search path and remove direct
-- client execution rights.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, bio)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
    NEW.email,
    ''
  );
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;

COMMIT;
