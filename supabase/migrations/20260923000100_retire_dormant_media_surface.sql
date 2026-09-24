BEGIN;

-- The media subsystem shipped only as database metadata and unused presentation
-- components. No canonical Supabase Storage bucket, object ownership contract,
-- upload path, signed-access path, or persisted request/grant workflow exists.
-- Remove the dormant surface rather than carrying arbitrary URL metadata into
-- production as if it were a real media authority.

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

DROP TABLE IF EXISTS public.media_access_grants;
DROP TABLE IF EXISTS public.media_access_requests;
DROP TABLE IF EXISTS public.media_assets;

DROP TYPE IF EXISTS public.media_grant_status;
DROP TYPE IF EXISTS public.media_access_level;
DROP TYPE IF EXISTS public.media_type;

COMMIT;
