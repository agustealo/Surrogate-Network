BEGIN;

-- Account deletion is a terminal application state. Keep the profile UUID as a
-- tombstone so relationship, safety, and audit foreign keys survive removal of
-- the Supabase Auth principal instead of cascading away shared history.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS trial_deleted_at timestamptz;

REVOKE UPDATE (trial_deleted_at)
  ON TABLE public.profiles FROM PUBLIC, anon, authenticated;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_id_fkey;

COMMENT ON COLUMN public.profiles.trial_deleted_at IS
  'Terminal deletion tombstone. A deleted profile is retained only to preserve referential integrity for shared/safety history after the auth.users row is removed.';

CREATE TABLE IF NOT EXISTS public.account_deletion_jobs (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  requested_at timestamptz NOT NULL DEFAULT now(),
  prepared_at timestamptz NOT NULL DEFAULT now(),
  auth_deleted_at timestamptz,
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  last_error text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.account_deletion_jobs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.account_deletion_jobs FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.account_deletion_jobs TO service_role, postgres;

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
      AND trial_deleted_at IS NULL
  );
$$;
REVOKE EXECUTE ON FUNCTION public.is_active_member(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_active_member(uuid) TO authenticated, service_role, postgres;

CREATE OR REPLACE VIEW public.public_profiles
WITH (security_barrier = true)
AS
SELECT
  id,
  name,
  avatar_url,
  bio,
  location,
  availability,
  boundaries,
  rank,
  created_at,
  updated_at
FROM public.profiles
WHERE is_suspended = false
  AND trial_deactivated_at IS NULL
  AND trial_deleted_at IS NULL
  AND (
    auth.uid() IS NULL
    OR id = auth.uid()
    OR NOT public.are_users_blocked(auth.uid(), id)
  );

REVOKE ALL ON public.public_profiles FROM PUBLIC;
GRANT SELECT ON public.public_profiles TO anon, authenticated;

COMMENT ON VIEW public.public_profiles IS
  'Public profile projection. Excludes private/authoritative fields and suppresses suspended, deactivated, deleted, and mutually blocked profiles.';

-- Preserve reversible deactivation, but never allow a deletion tombstone to be
-- reactivated. Deactivation remains responsible for pausing listings and
-- closing open proposals before deletion-specific redaction runs.
CREATE OR REPLACE FUNCTION public.set_trial_account_participation_trusted(
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
  v_now timestamptz := now();
  v_deactivated_at timestamptz;
  v_paused_needs integer := 0;
  v_paused_offers integer := 0;
  v_closed_proposals integer := 0;
BEGIN
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member profile not found';
  END IF;

  IF v_profile.trial_deleted_at IS NOT NULL THEN
    IF p_active THEN
      RAISE EXCEPTION 'A deleted account cannot be reactivated';
    END IF;
    RETURN;
  END IF;

  IF p_active AND v_profile.is_suspended THEN
    RAISE EXCEPTION 'A suspended account cannot reactivate itself';
  END IF;

  v_deactivated_at := CASE
    WHEN p_active THEN NULL
    ELSE COALESCE(v_profile.trial_deactivated_at, v_now)
  END;

  UPDATE public.profiles
  SET trial_deactivated_at = v_deactivated_at
  WHERE id = p_user_id;

  IF NOT p_active THEN
    UPDATE public.needs
    SET status = 'paused'::public.need_status
    WHERE user_id = p_user_id
      AND status = 'active'::public.need_status;
    GET DIAGNOSTICS v_paused_needs = ROW_COUNT;

    UPDATE public.offers
    SET status = 'paused'::public.offer_status
    WHERE user_id = p_user_id
      AND status = 'active'::public.offer_status;
    GET DIAGNOSTICS v_paused_offers = ROW_COUNT;

    UPDATE public.proposals
    SET status = CASE
          WHEN proposing_user_id = p_user_id THEN 'withdrawn'::public.proposal_status
          ELSE 'declined'::public.proposal_status
        END,
        updated_at = v_now
    WHERE status IN ('pending'::public.proposal_status, 'countered'::public.proposal_status)
      AND (proposing_user_id = p_user_id OR receiving_user_id = p_user_id);
    GET DIAGNOSTICS v_closed_proposals = ROW_COUNT;
  END IF;

  INSERT INTO public.audit_events(
    actor_id, action, target_id, target_type, before, after, timestamp
  ) VALUES (
    p_user_id,
    CASE WHEN p_active THEN 'trial_account_reactivated' ELSE 'trial_account_deactivated' END,
    p_user_id::text,
    'profile',
    jsonb_build_object('trial_deactivated_at', v_profile.trial_deactivated_at),
    jsonb_build_object(
      'trial_deactivated_at', v_deactivated_at,
      'paused_needs', v_paused_needs,
      'paused_offers', v_paused_offers,
      'closed_proposals', v_closed_proposals
    ),
    v_now
  );

  INSERT INTO public.outbox_events(event_type, aggregate_type, aggregate_id, payload, occurred_at)
  VALUES (
    CASE WHEN p_active THEN 'trial_account_reactivated' ELSE 'trial_account_deactivated' END,
    'profile',
    p_user_id::text,
    jsonb_build_object(
      'userId', p_user_id,
      'pausedNeeds', v_paused_needs,
      'pausedOffers', v_paused_offers,
      'closedProposals', v_closed_proposals
    ),
    v_now
  );
END;
$$;

REVOKE ALL ON FUNCTION public.set_trial_account_participation_trusted(uuid, boolean)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.set_trial_account_participation_trusted(uuid, boolean)
  TO postgres;

CREATE OR REPLACE FUNCTION public.prepare_trial_account_deletion_trusted(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_profile public.profiles%ROWTYPE;
  v_now timestamptz := now();
  v_deleted_email text := 'deleted+' || replace(p_user_id::text, '-', '') || '@deleted.invalid';
BEGIN
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member profile not found';
  END IF;

  IF v_profile.trial_deleted_at IS NOT NULL THEN
    RETURN;
  END IF;

  PERFORM public.set_trial_account_participation_trusted(p_user_id, false);

  -- Remove member-authored/free-form profile and marketplace content while
  -- preserving stable record IDs needed by shared relationship history.
  UPDATE public.needs
  SET title = 'Deleted member need',
      description = '',
      tags = ARRAY[]::text[],
      timing = NULL,
      boundaries = ARRAY[]::public.boundary[],
      urgency = NULL,
      status = 'paused'::public.need_status,
      user_name = 'Deleted member',
      user_avatar = NULL,
      expires_at = NULL
  WHERE user_id = p_user_id;

  UPDATE public.offers
  SET title = 'Deleted member offer',
      description = '',
      timing = NULL,
      boundaries = ARRAY[]::public.boundary[],
      capacity = NULL,
      current_capacity = 0,
      status = 'paused'::public.offer_status,
      user_name = 'Deleted member',
      user_avatar = NULL
  WHERE user_id = p_user_id;

  UPDATE public.proposals
  SET message = NULL,
      proposed_date = NULL,
      duration = NULL,
      frequency = NULL,
      location_method = NULL,
      updated_at = v_now
  WHERE proposing_user_id = p_user_id OR receiving_user_id = p_user_id;

  UPDATE public.feedback
  SET comments = NULL,
      skill_endorsements = ARRAY[]::text[]
  WHERE from_user_id = p_user_id;

  DELETE FROM public.notifications WHERE user_id = p_user_id;
  DELETE FROM public.token_transactions WHERE user_id = p_user_id;
  DELETE FROM public.xp_transactions WHERE user_id = p_user_id;
  DELETE FROM public.member_progression WHERE user_id = p_user_id;
  DELETE FROM public.trial_action_rate_limits WHERE user_id = p_user_id;
  DELETE FROM public.command_idempotency WHERE actor_id = p_user_id;
  DELETE FROM public.blocks WHERE blocker_user_id = p_user_id OR blocked_user_id = p_user_id;
  DELETE FROM public.media_access_requests WHERE from_user_id = p_user_id OR to_user_id = p_user_id;
  DELETE FROM public.media_access_grants WHERE from_user_id = p_user_id OR to_user_id = p_user_id;
  DELETE FROM public.media_assets WHERE owner_id = p_user_id;

  UPDATE public.profiles
  SET name = 'Deleted member',
      email = v_deleted_email,
      avatar_url = NULL,
      bio = '',
      location = NULL,
      availability = NULL,
      boundaries = ARRAY[]::public.boundary[],
      rank = 1,
      xp = 0,
      token_balance = 0,
      verification_status = 'unverified'::public.verification_status,
      is_admin = false,
      trial_terms_version = NULL,
      trial_terms_accepted_at = NULL,
      trial_privacy_version = NULL,
      trial_privacy_accepted_at = NULL,
      trial_age_confirmed_at = NULL,
      trial_deactivated_at = COALESCE(trial_deactivated_at, v_now),
      trial_deleted_at = v_now,
      updated_at = v_now
  WHERE id = p_user_id;

  -- Audit rows remain for integrity, but the former actor identifier is removed.
  UPDATE public.audit_events
  SET actor_id = NULL
  WHERE actor_id = p_user_id;

  INSERT INTO public.audit_events(
    actor_id, action, target_id, target_type, before, after, timestamp
  ) VALUES (
    NULL,
    'trial_account_deletion_prepared',
    p_user_id::text,
    'profile',
    jsonb_build_object('profile_existed', true),
    jsonb_build_object('trial_deleted_at', v_now),
    v_now
  );

  INSERT INTO public.account_deletion_jobs(
    user_id, requested_at, prepared_at, updated_at
  ) VALUES (
    p_user_id, v_now, v_now, v_now
  )
  ON CONFLICT (user_id) DO UPDATE
  SET prepared_at = EXCLUDED.prepared_at,
      auth_deleted_at = NULL,
      last_error = NULL,
      updated_at = EXCLUDED.updated_at;

  INSERT INTO public.outbox_events(event_type, aggregate_type, aggregate_id, payload, occurred_at)
  VALUES (
    'trial_account_deletion_prepared',
    'profile',
    p_user_id::text,
    jsonb_build_object('userId', p_user_id),
    v_now
  );
END;
$$;

REVOKE ALL ON FUNCTION public.prepare_trial_account_deletion_trusted(uuid)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.prepare_trial_account_deletion_trusted(uuid)
  TO postgres;

CREATE OR REPLACE FUNCTION public.prepare_trial_account_deletion()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Authenticated member required';
  END IF;

  PERFORM public.prepare_trial_account_deletion_trusted(v_actor);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.prepare_trial_account_deletion()
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.prepare_trial_account_deletion()
  TO authenticated;

-- This system-only function records the external Supabase Auth deletion attempt.
-- It does not decide who is being deleted; the user ID must already have a
-- prepared deletion tombstone.
CREATE OR REPLACE FUNCTION public.record_trial_auth_deletion_attempt(
  p_user_id uuid,
  p_auth_deleted boolean,
  p_error text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id AND trial_deleted_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Account deletion has not been prepared';
  END IF;

  UPDATE public.account_deletion_jobs
  SET attempt_count = attempt_count + 1,
      auth_deleted_at = CASE WHEN p_auth_deleted THEN now() ELSE auth_deleted_at END,
      last_error = CASE WHEN p_auth_deleted THEN NULL ELSE NULLIF(p_error, '') END,
      updated_at = now()
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Account deletion job not found';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.record_trial_auth_deletion_attempt(uuid, boolean, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_trial_auth_deletion_attempt(uuid, boolean, text)
  TO service_role, postgres;

COMMIT;
