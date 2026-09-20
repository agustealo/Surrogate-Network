BEGIN;

-- Human-driven privileged mutations must derive identity from the authenticated
-- database session. The trusted cores keep the existing transaction logic but
-- are no longer callable by application service-role clients.

ALTER FUNCTION public.transition_proposal_for_trial(uuid, uuid, proposal_status, text, text, text, text, text)
  RENAME TO transition_proposal_for_trial_trusted;
ALTER FUNCTION public.accept_proposal_for_trial(uuid, uuid)
  RENAME TO accept_proposal_for_trial_trusted;
ALTER FUNCTION public.create_moment_for_trial(uuid, uuid, timestamptz, integer, text, text)
  RENAME TO create_moment_for_trial_trusted;
ALTER FUNCTION public.cancel_moment_for_trial(uuid, uuid)
  RENAME TO cancel_moment_for_trial_trusted;
ALTER FUNCTION public.complete_moment_for_trial(uuid, uuid, exchange_status)
  RENAME TO complete_moment_for_trial_trusted;
ALTER FUNCTION public.submit_feedback_for_trial(uuid, uuid, uuid, integer, jsonb, text, text[])
  RENAME TO submit_feedback_for_trial_trusted;
ALTER FUNCTION public.moderate_report_for_trial(uuid, uuid, report_status, text, boolean)
  RENAME TO moderate_report_for_trial_trusted;
ALTER FUNCTION public.accept_current_trial_policy(uuid, text, text, boolean)
  RENAME TO accept_current_trial_policy_trusted;
ALTER FUNCTION public.set_trial_account_participation(uuid, boolean)
  RENAME TO set_trial_account_participation_trusted;

REVOKE ALL ON FUNCTION public.transition_proposal_for_trial_trusted(uuid, uuid, proposal_status, text, text, text, text, text)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.accept_proposal_for_trial_trusted(uuid, uuid)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.create_moment_for_trial_trusted(uuid, uuid, timestamptz, integer, text, text)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.cancel_moment_for_trial_trusted(uuid, uuid)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.complete_moment_for_trial_trusted(uuid, uuid, exchange_status)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.submit_feedback_for_trial_trusted(uuid, uuid, uuid, integer, jsonb, text, text[])
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.moderate_report_for_trial_trusted(uuid, uuid, report_status, text, boolean)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.accept_current_trial_policy_trusted(uuid, text, text, boolean)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.set_trial_account_participation_trusted(uuid, boolean)
  FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.transition_proposal_for_trial_trusted(uuid, uuid, proposal_status, text, text, text, text, text) TO postgres;
GRANT EXECUTE ON FUNCTION public.accept_proposal_for_trial_trusted(uuid, uuid) TO postgres;
GRANT EXECUTE ON FUNCTION public.create_moment_for_trial_trusted(uuid, uuid, timestamptz, integer, text, text) TO postgres;
GRANT EXECUTE ON FUNCTION public.cancel_moment_for_trial_trusted(uuid, uuid) TO postgres;
GRANT EXECUTE ON FUNCTION public.complete_moment_for_trial_trusted(uuid, uuid, exchange_status) TO postgres;
GRANT EXECUTE ON FUNCTION public.submit_feedback_for_trial_trusted(uuid, uuid, uuid, integer, jsonb, text, text[]) TO postgres;
GRANT EXECUTE ON FUNCTION public.moderate_report_for_trial_trusted(uuid, uuid, report_status, text, boolean) TO postgres;
GRANT EXECUTE ON FUNCTION public.accept_current_trial_policy_trusted(uuid, text, text, boolean) TO postgres;
GRANT EXECUTE ON FUNCTION public.set_trial_account_participation_trusted(uuid, boolean) TO postgres;

CREATE OR REPLACE FUNCTION public.transition_proposal_for_trial(
  p_proposal_id uuid,
  p_new_status proposal_status,
  p_message text DEFAULT NULL,
  p_proposed_date text DEFAULT NULL,
  p_duration text DEFAULT NULL,
  p_frequency text DEFAULT NULL,
  p_location_method text DEFAULT NULL
)
RETURNS proposal_status
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
BEGIN
  IF v_actor IS NULL THEN RAISE EXCEPTION 'Authenticated member required'; END IF;
  RETURN public.transition_proposal_for_trial_trusted(
    p_proposal_id, v_actor, p_new_status, p_message, p_proposed_date,
    p_duration, p_frequency, p_location_method
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_proposal_for_trial(p_proposal_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
BEGIN
  IF v_actor IS NULL THEN RAISE EXCEPTION 'Authenticated member required'; END IF;
  RETURN public.accept_proposal_for_trial_trusted(p_proposal_id, v_actor);
END;
$$;

CREATE OR REPLACE FUNCTION public.create_moment_for_trial(
  p_surrogacy_id uuid,
  p_scheduled_time timestamptz,
  p_duration integer,
  p_location text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
BEGIN
  IF v_actor IS NULL THEN RAISE EXCEPTION 'Authenticated member required'; END IF;
  RETURN public.create_moment_for_trial_trusted(
    p_surrogacy_id, v_actor, p_scheduled_time, p_duration, p_location, p_notes
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_moment_for_trial(p_moment_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
BEGIN
  IF v_actor IS NULL THEN RAISE EXCEPTION 'Authenticated member required'; END IF;
  PERFORM public.cancel_moment_for_trial_trusted(p_moment_id, v_actor);
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_moment_for_trial(
  p_moment_id uuid,
  p_exchange_status exchange_status DEFAULT 'completed'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
BEGIN
  IF v_actor IS NULL THEN RAISE EXCEPTION 'Authenticated member required'; END IF;
  RETURN public.complete_moment_for_trial_trusted(p_moment_id, v_actor, p_exchange_status);
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_feedback_for_trial(
  p_exchange_id uuid,
  p_to_user_id uuid,
  p_rating integer,
  p_breakdown jsonb,
  p_comments text DEFAULT NULL,
  p_skill_endorsements text[] DEFAULT ARRAY[]::text[]
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
BEGIN
  IF v_actor IS NULL THEN RAISE EXCEPTION 'Authenticated member required'; END IF;
  RETURN public.submit_feedback_for_trial_trusted(
    p_exchange_id, v_actor, p_to_user_id, p_rating, p_breakdown,
    p_comments, p_skill_endorsements
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.moderate_report_for_trial(
  p_report_id uuid,
  p_status report_status,
  p_action_taken text DEFAULT NULL,
  p_suspend_reported_user boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_admin uuid := auth.uid();
BEGIN
  IF v_admin IS NULL THEN RAISE EXCEPTION 'Authenticated administrator required'; END IF;
  PERFORM public.moderate_report_for_trial_trusted(
    p_report_id, v_admin, p_status, p_action_taken, p_suspend_reported_user
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_current_trial_policy(
  p_terms_version text,
  p_privacy_version text,
  p_age_confirmed boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
BEGIN
  IF v_actor IS NULL THEN RAISE EXCEPTION 'Authenticated member required'; END IF;
  PERFORM public.accept_current_trial_policy_trusted(
    v_actor, p_terms_version, p_privacy_version, p_age_confirmed
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.set_trial_account_participation(p_active boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
BEGIN
  IF v_actor IS NULL THEN RAISE EXCEPTION 'Authenticated member required'; END IF;
  PERFORM public.set_trial_account_participation_trusted(v_actor, p_active);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.transition_proposal_for_trial(uuid, proposal_status, text, text, text, text, text) FROM PUBLIC, anon, service_role;
REVOKE EXECUTE ON FUNCTION public.accept_proposal_for_trial(uuid) FROM PUBLIC, anon, service_role;
REVOKE EXECUTE ON FUNCTION public.create_moment_for_trial(uuid, timestamptz, integer, text, text) FROM PUBLIC, anon, service_role;
REVOKE EXECUTE ON FUNCTION public.cancel_moment_for_trial(uuid) FROM PUBLIC, anon, service_role;
REVOKE EXECUTE ON FUNCTION public.complete_moment_for_trial(uuid, exchange_status) FROM PUBLIC, anon, service_role;
REVOKE EXECUTE ON FUNCTION public.submit_feedback_for_trial(uuid, uuid, integer, jsonb, text, text[]) FROM PUBLIC, anon, service_role;
REVOKE EXECUTE ON FUNCTION public.moderate_report_for_trial(uuid, report_status, text, boolean) FROM PUBLIC, anon, service_role;
REVOKE EXECUTE ON FUNCTION public.accept_current_trial_policy(text, text, boolean) FROM PUBLIC, anon, service_role;
REVOKE EXECUTE ON FUNCTION public.set_trial_account_participation(boolean) FROM PUBLIC, anon, service_role;

GRANT EXECUTE ON FUNCTION public.transition_proposal_for_trial(uuid, proposal_status, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_proposal_for_trial(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_moment_for_trial(uuid, timestamptz, integer, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_moment_for_trial(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_moment_for_trial(uuid, exchange_status) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_feedback_for_trial(uuid, uuid, integer, jsonb, text, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.moderate_report_for_trial(uuid, report_status, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_current_trial_policy(text, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_trial_account_participation(boolean) TO authenticated;

COMMIT;
