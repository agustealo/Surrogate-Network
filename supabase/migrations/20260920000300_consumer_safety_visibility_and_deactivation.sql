BEGIN;

-- Authenticated members may ask whether they are blocked with another member,
-- but may not use the helper to inspect block relationships between unrelated
-- people. Service/postgres callers remain available for trusted moderation and
-- database-owned invariants.
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

REVOKE EXECUTE ON FUNCTION public.are_users_blocked(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.are_users_blocked(uuid, uuid) TO authenticated, service_role, postgres;

-- public_profiles is intentionally owner-executed so it can project safe fields
-- while the base profiles table remains self-only. Because owner-executed views
-- bypass base-table RLS, block/deactivation visibility must be explicit here.
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
  AND (
    auth.uid() IS NULL
    OR id = auth.uid()
    OR NOT public.are_users_blocked(auth.uid(), id)
  );

REVOKE ALL ON public.public_profiles FROM PUBLIC;
GRANT SELECT ON public.public_profiles TO anon, authenticated;

COMMENT ON VIEW public.public_profiles IS
  'Public profile projection. Excludes private/authoritative fields and suppresses suspended, deactivated, and mutually blocked profiles for authenticated discovery.';

-- Deactivation is an operational boundary, not merely a profile flag. Remove
-- active marketplace exposure and close open proposals atomically. Reactivation
-- restores account participation only; previously paused listings remain paused
-- and require a fresh deliberate publication path rather than silent revival.
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

-- Existing relationships remain historical records after deactivation, but no
-- new Moment may be created unless every participant is currently active. The
-- same trigger continues to enforce mutual blocking.
CREATE OR REPLACE FUNCTION public.enforce_unblocked_moment_creation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_partner_ids uuid[];
BEGIN
  SELECT partner_ids INTO v_partner_ids
  FROM public.surrogacies
  WHERE id = NEW.surrogacy_id;

  IF EXISTS (
    SELECT 1
    FROM unnest(v_partner_ids) AS partner_id
    WHERE NOT public.is_active_member(partner_id)
  ) THEN
    RAISE EXCEPTION 'All relationship participants must be active to schedule new Moments';
  END IF;

  IF array_length(v_partner_ids, 1) = 2
     AND public.are_users_blocked(v_partner_ids[1], v_partner_ids[2]) THEN
    RAISE EXCEPTION 'Blocked members cannot schedule new Moments';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_unblocked_moment_creation()
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.enforce_unblocked_moment_creation()
  TO postgres;

COMMIT;
