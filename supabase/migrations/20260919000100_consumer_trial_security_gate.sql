BEGIN;

-- Consumer-trial security gate.
-- PostgreSQL grants EXECUTE on new functions to PUBLIC by default. Sensitive
-- RPCs therefore revoke PUBLIC explicitly instead of assuming role-specific
-- revokes close the Data API surface.

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM anon, authenticated;

-- Ledger mutation is trusted-server authority only.
REVOKE EXECUTE ON FUNCTION public.update_token_balance(uuid, integer, text, transaction_type)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_user_xp(uuid, integer, xp_source, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_token_balance(uuid, integer, text, transaction_type)
  TO service_role, postgres;
GRANT EXECUTE ON FUNCTION public.update_user_xp(uuid, integer, xp_source, text)
  TO service_role, postgres;

-- admin_update_profile performs its own authenticated-admin verification.
-- Keep it available to authenticated admins, but never to PUBLIC or anon.
REVOKE EXECUTE ON FUNCTION public.admin_update_profile(
  uuid, text, text, text, text, text, text, boundary[], integer, integer,
  integer, verification_status, boolean
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_profile(
  uuid, text, text, text, text, text, text, boundary[], integer, integer,
  integer, verification_status, boolean
) TO authenticated, postgres;

-- Maintenance mutates command history globally and is server-only.
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_idempotency()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_idempotency()
  TO service_role, postgres;

-- The admin predicate is referenced by RLS and the admin mutation RPC. Pin its
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

-- Internal admin verifier is not a public RPC surface. SECURITY DEFINER admin
-- functions execute it as the function owner, so authenticated callers do not
-- need direct EXECUTE permission.
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
