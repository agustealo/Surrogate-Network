BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS trial_deactivated_at timestamptz;

REVOKE UPDATE (trial_deactivated_at)
  ON TABLE public.profiles FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.is_active_member(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = p_user_id
      AND is_suspended = false
      AND trial_deactivated_at IS NULL
  );
$$;
REVOKE EXECUTE ON FUNCTION public.is_active_member(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_active_member(uuid) TO authenticated, service_role, postgres;

CREATE OR REPLACE FUNCTION public.set_trial_account_participation(
  p_user_id uuid,
  p_active boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_profile public.profiles%ROWTYPE;
BEGIN
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member profile not found';
  END IF;

  IF p_active AND v_profile.is_suspended THEN
    RAISE EXCEPTION 'A suspended account cannot reactivate itself';
  END IF;

  UPDATE public.profiles
  SET trial_deactivated_at = CASE WHEN p_active THEN NULL ELSE now() END
  WHERE id = p_user_id;

  INSERT INTO public.audit_events(
    actor_id,
    action,
    target_id,
    target_type,
    before,
    after,
    timestamp
  )
  VALUES (
    p_user_id,
    CASE WHEN p_active THEN 'trial_account_reactivated' ELSE 'trial_account_deactivated' END,
    p_user_id::text,
    'profile',
    jsonb_build_object('trial_deactivated_at', v_profile.trial_deactivated_at),
    jsonb_build_object('trial_deactivated_at', CASE WHEN p_active THEN NULL ELSE now() END),
    now()
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_trial_account_participation(uuid, boolean)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_trial_account_participation(uuid, boolean)
  TO service_role, postgres;

COMMIT;
