BEGIN;

-- Cross-language release contract. The web application exports the same value
-- as TRIAL_POLICY_VERSION in src/lib/trialPolicy.ts.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS trial_terms_version text,
  ADD COLUMN IF NOT EXISTS trial_terms_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS trial_privacy_version text,
  ADD COLUMN IF NOT EXISTS trial_privacy_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS trial_age_confirmed_at timestamptz;

-- Consent fields are authoritative account state and are never directly
-- writable by an authenticated Data API client.
REVOKE UPDATE (
  trial_terms_version,
  trial_terms_accepted_at,
  trial_privacy_version,
  trial_privacy_accepted_at,
  trial_age_confirmed_at
) ON TABLE public.profiles FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_terms_version text := NEW.raw_user_meta_data->>'trial_terms_version';
  v_privacy_version text := NEW.raw_user_meta_data->>'trial_privacy_version';
  v_age_confirmed boolean := COALESCE((NEW.raw_user_meta_data->>'trial_age_confirmed')::boolean, false);
  v_acceptance_valid boolean;
BEGIN
  v_acceptance_valid :=
    v_terms_version = '2026-09-20'
    AND v_privacy_version = '2026-09-20'
    AND v_age_confirmed = true;

  INSERT INTO public.profiles (
    id,
    name,
    email,
    bio,
    trial_terms_version,
    trial_terms_accepted_at,
    trial_privacy_version,
    trial_privacy_accepted_at,
    trial_age_confirmed_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
    NEW.email,
    '',
    CASE WHEN v_acceptance_valid THEN v_terms_version ELSE NULL END,
    CASE WHEN v_acceptance_valid THEN now() ELSE NULL END,
    CASE WHEN v_acceptance_valid THEN v_privacy_version ELSE NULL END,
    CASE WHEN v_acceptance_valid THEN now() ELSE NULL END,
    CASE WHEN v_acceptance_valid THEN now() ELSE NULL END
  );

  IF v_acceptance_valid THEN
    INSERT INTO public.audit_events(
      actor_id,
      action,
      target_id,
      target_type,
      after,
      timestamp
    )
    VALUES (
      NEW.id,
      'trial_policy_accepted',
      NEW.id::text,
      'profile',
      jsonb_build_object(
        'terms_version', v_terms_version,
        'privacy_version', v_privacy_version,
        'age_confirmed', true
      ),
      now()
    );
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;

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
      AND trial_terms_version = '2026-09-20'
      AND trial_terms_accepted_at IS NOT NULL
      AND trial_privacy_version = '2026-09-20'
      AND trial_privacy_accepted_at IS NOT NULL
      AND trial_age_confirmed_at IS NOT NULL
  );
$$;
REVOKE EXECUTE ON FUNCTION public.is_active_member(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_active_member(uuid) TO authenticated, service_role, postgres;

CREATE OR REPLACE FUNCTION public.accept_current_trial_policy(
  p_user_id uuid,
  p_terms_version text,
  p_privacy_version text,
  p_age_confirmed boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF p_terms_version <> '2026-09-20'
     OR p_privacy_version <> '2026-09-20'
     OR p_age_confirmed IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Current trial terms, privacy notice, and age confirmation are required';
  END IF;

  UPDATE public.profiles
  SET trial_terms_version = p_terms_version,
      trial_terms_accepted_at = now(),
      trial_privacy_version = p_privacy_version,
      trial_privacy_accepted_at = now(),
      trial_age_confirmed_at = now()
  WHERE id = p_user_id
    AND is_suspended = false;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Eligible member profile not found';
  END IF;

  INSERT INTO public.audit_events(
    actor_id,
    action,
    target_id,
    target_type,
    after,
    timestamp
  )
  VALUES (
    p_user_id,
    'trial_policy_accepted',
    p_user_id::text,
    'profile',
    jsonb_build_object(
      'terms_version', p_terms_version,
      'privacy_version', p_privacy_version,
      'age_confirmed', true
    ),
    now()
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.accept_current_trial_policy(uuid, text, text, boolean)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accept_current_trial_policy(uuid, text, text, boolean)
  TO service_role, postgres;

COMMIT;
