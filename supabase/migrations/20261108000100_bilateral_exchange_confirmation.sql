BEGIN;

-- SN-ENG-02B: a single participant's claimed completion cannot be treated
-- as bilateral evidence. Historical exchanges remain visible with an
-- explicit legacy_unverified state, preserving their recorded feedback.
-- No monetary wallet, payout, trust badge, or portable credential is added.

ALTER TABLE public.exchanges
  ADD COLUMN confirmation_state text NOT NULL DEFAULT 'legacy_unverified',
  ADD COLUMN recorded_by uuid,
  ADD COLUMN confirmed_by uuid,
  ADD COLUMN disputed_by uuid,
  ADD COLUMN confirmed_at timestamptz,
  ADD CONSTRAINT exchanges_confirmation_state_check CHECK (
    confirmation_state IN ('legacy_unverified', 'pending', 'confirmed', 'disputed')
  ),
  ADD CONSTRAINT exchanges_confirmation_evidence_check CHECK (
    (
      confirmation_state = 'legacy_unverified'
      AND recorded_by IS NULL AND confirmed_by IS NULL
      AND disputed_by IS NULL AND confirmed_at IS NULL
    ) OR (
      confirmation_state = 'pending'
      AND recorded_by IS NOT NULL AND confirmed_by IS NULL
      AND disputed_by IS NULL AND confirmed_at IS NULL
      AND status IN ('completed', 'partial')
    ) OR (
      confirmation_state = 'confirmed'
      AND recorded_by IS NOT NULL AND confirmed_by IS NOT NULL
      AND confirmed_by <> recorded_by
      AND disputed_by IS NULL AND confirmed_at IS NOT NULL
      AND status IN ('completed', 'partial')
    ) OR (
      confirmation_state = 'disputed'
      AND recorded_by IS NOT NULL AND disputed_by IS NOT NULL
      AND confirmed_by IS NULL AND confirmed_at IS NULL
      AND status = 'disputed'
    )
  );

COMMENT ON COLUMN public.exchanges.confirmation_state IS
  'Two-party outcome evidence; legacy_unverified means historic single-party records are not jointly attested';
COMMENT ON COLUMN public.exchanges.recorded_by IS
  'Authenticated original outcome reporter; the second member must be distinct';
COMMENT ON COLUMN public.exchanges.confirmed_by IS
  'Authenticated counterparty who agreed with the originally reported outcome';

-- Keep the trusted core and the existing authenticated wrapper, not a new
-- application orchestration path. The wrapper always derives auth.uid().
CREATE OR REPLACE FUNCTION public.complete_moment_for_trial_trusted(
  p_moment_id uuid,
  p_actor_id uuid,
  p_exchange_status public.exchange_status DEFAULT 'completed'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_moment public.moments%ROWTYPE;
  v_surrogacy public.surrogacies%ROWTYPE;
  v_exchange public.exchanges%ROWTYPE;
  v_exchange_id uuid;
  v_confirmation_state text;
BEGIN
  IF p_exchange_status NOT IN ('completed', 'partial', 'disputed') THEN
    RAISE EXCEPTION 'Unsupported exchange status';
  END IF;
  IF NOT public.is_active_member(p_actor_id) THEN
    RAISE EXCEPTION 'Account is not active';
  END IF;

  SELECT * INTO v_moment
  FROM public.moments WHERE id = p_moment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Moment not found'; END IF;

  SELECT * INTO v_surrogacy
  FROM public.surrogacies WHERE id = v_moment.surrogacy_id;
  IF NOT FOUND OR cardinality(v_surrogacy.partner_ids) <> 2
     OR p_actor_id <> ALL(v_surrogacy.partner_ids) THEN
    RAISE EXCEPTION 'Two relationship participants are required';
  END IF;

  SELECT * INTO v_exchange
  FROM public.exchanges WHERE moment_id = p_moment_id;
  IF FOUND THEN
    IF v_exchange.recorded_by = p_actor_id THEN
      RETURN v_exchange.id;
    END IF;
    RAISE EXCEPTION 'The other participant must use exchange confirmation';
  END IF;

  IF v_moment.status NOT IN ('scheduled', 'in_progress') THEN
    RAISE EXCEPTION 'Moment cannot be completed from status %', v_moment.status;
  END IF;
  IF v_moment.scheduled_time > now() + interval '15 minutes' THEN
    RAISE EXCEPTION 'Moment cannot be recorded before its scheduled window';
  END IF;

  v_confirmation_state :=
    CASE WHEN p_exchange_status = 'disputed' THEN 'disputed' ELSE 'pending' END;

  UPDATE public.moments SET status = 'completed' WHERE id = p_moment_id;

  INSERT INTO public.exchanges(
    moment_id, surrogacy_id, completed_at, status,
    confirmation_state, recorded_by, disputed_by
  )
  VALUES (
    p_moment_id, v_moment.surrogacy_id, now(), p_exchange_status,
    v_confirmation_state, p_actor_id,
    CASE WHEN p_exchange_status = 'disputed' THEN p_actor_id ELSE NULL END
  )
  RETURNING id INTO v_exchange_id;

  INSERT INTO public.audit_events(
    actor_id, action, target_id, target_type, after, timestamp
  )
  VALUES (
    p_actor_id, 'exchange_recorded', v_exchange_id::text, 'exchange',
    jsonb_build_object(
      'moment_id', p_moment_id, 'status', p_exchange_status,
      'confirmation_state', v_confirmation_state
    ), now()
  );

  INSERT INTO public.outbox_events(
    event_type, aggregate_type, aggregate_id, payload, occurred_at
  )
  VALUES (
    'exchange_recorded', 'exchange', v_exchange_id::text,
    jsonb_build_object(
      'exchangeId', v_exchange_id, 'momentId', p_moment_id,
      'surrogacyId', v_moment.surrogacy_id,
      'confirmationState', v_confirmation_state
    ), now()
  );

  RETURN v_exchange_id;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_moment_for_trial_trusted(uuid, uuid, public.exchange_status)
FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.complete_moment_for_trial_trusted(uuid, uuid, public.exchange_status)
TO postgres;

-- The original member may not acknowledge their own statement.
-- The accepting peer must be an authenticated participant, and a dispute
-- freezes the exchange rather than silently resolving or rewarding it.
CREATE OR REPLACE FUNCTION public.confirm_exchange_for_trial_trusted(
  p_exchange_id uuid,
  p_actor_id uuid,
  p_decision text
)
RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_exchange public.exchanges%ROWTYPE;
  v_connection public.surrogacies%ROWTYPE;
  v_state text;
BEGIN
  IF p_decision IS NULL OR p_decision NOT IN ('confirm', 'dispute') THEN
    RAISE EXCEPTION 'Confirmation decision must be confirm or dispute';
  END IF;
  IF NOT public.is_active_member(p_actor_id) THEN
    RAISE EXCEPTION 'Account is not active';
  END IF;

  SELECT * INTO v_exchange
  FROM public.exchanges
  WHERE id = p_exchange_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Exchange not found'; END IF;

  SELECT * INTO v_connection
  FROM public.surrogacies WHERE id = v_exchange.surrogacy_id;
  IF NOT FOUND OR cardinality(v_connection.partner_ids) <> 2
     OR p_actor_id <> ALL(v_connection.partner_ids) THEN
    RAISE EXCEPTION 'Actor is not an exchange participant';
  END IF;
  IF v_exchange.recorded_by = p_actor_id THEN
    RAISE EXCEPTION 'A member cannot confirm their own outcome report';
  END IF;

  IF v_exchange.confirmation_state = 'confirmed'
     AND v_exchange.confirmed_by = p_actor_id AND p_decision = 'confirm' THEN
    RETURN 'confirmed';
  END IF;
  IF v_exchange.confirmation_state = 'disputed'
     AND v_exchange.disputed_by = p_actor_id AND p_decision = 'dispute' THEN
    RETURN 'disputed';
  END IF;
  IF v_exchange.confirmation_state <> 'pending' THEN
    RAISE EXCEPTION 'Exchange is no longer awaiting confirmation';
  END IF;

  v_state := CASE WHEN p_decision = 'confirm' THEN 'confirmed' ELSE 'disputed' END;

  IF p_decision = 'confirm' THEN
    UPDATE public.exchanges
    SET confirmation_state = 'confirmed',
        confirmed_by = p_actor_id,
        confirmed_at = now()
    WHERE id = p_exchange_id;
  ELSE
    UPDATE public.exchanges
    SET confirmation_state = 'disputed',
        status = 'disputed',
        disputed_by = p_actor_id
    WHERE id = p_exchange_id;
  END IF;

  INSERT INTO public.audit_events(
    actor_id, action, target_id, target_type, before, after, timestamp
  )
  VALUES (
    p_actor_id, 'exchange_' || v_state, p_exchange_id::text, 'exchange',
    jsonb_build_object(
      'status', v_exchange.status,
      'confirmation_state', v_exchange.confirmation_state
    ),
    jsonb_build_object(
      'status', CASE WHEN v_state = 'disputed' THEN 'disputed' ELSE v_exchange.status::text END,
      'confirmation_state', v_state
    ),
    now()
  );

  INSERT INTO public.outbox_events(
    event_type, aggregate_type, aggregate_id, payload, occurred_at
  )
  VALUES (
    'exchange_' || v_state, 'exchange', p_exchange_id::text,
    jsonb_build_object(
      'exchangeId', p_exchange_id, 'surrogacyId', v_exchange.surrogacy_id,
      'confirmationState', v_state
    ),
    now()
  );

  RETURN v_state;
END;
$$;

REVOKE ALL ON FUNCTION public.confirm_exchange_for_trial_trusted(uuid, uuid, text)
FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.confirm_exchange_for_trial_trusted(uuid, uuid, text)
TO postgres;

CREATE OR REPLACE FUNCTION public.confirm_exchange_for_trial(
  p_exchange_id uuid,
  p_decision text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
BEGIN
  IF v_actor IS NULL THEN RAISE EXCEPTION 'Authenticated member required'; END IF;
  RETURN public.confirm_exchange_for_trial_trusted(p_exchange_id, v_actor, p_decision);
END;
$$;

REVOKE ALL ON FUNCTION public.confirm_exchange_for_trial(uuid, text)
FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.confirm_exchange_for_trial(uuid, text)
TO authenticated;

-- Enforce evidence at the durable feedback write boundary; callers cannot
-- mint XP/achievements by invoking a different feedback writer.
CREATE OR REPLACE FUNCTION private.require_confirmed_exchange_feedback()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.exchanges e
    WHERE e.id = NEW.exchange_id
      AND e.surrogacy_id = NEW.surrogacy_id
      AND e.status IN ('completed', 'partial')
      AND e.confirmation_state = 'confirmed'
  ) THEN
    -- Preserve idempotent retry of already-persisted historical feedback.
    IF EXISTS (
      SELECT 1 FROM public.feedback f
      WHERE f.exchange_id = NEW.exchange_id
        AND f.from_user_id = NEW.from_user_id
    ) THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Feedback requires confirmation by both participants';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.require_confirmed_exchange_feedback()
FROM PUBLIC, anon, authenticated, service_role;

DROP TRIGGER IF EXISTS require_confirmed_exchange_feedback
ON public.feedback;
CREATE TRIGGER require_confirmed_exchange_feedback
BEFORE INSERT ON public.feedback
FOR EACH ROW EXECUTE FUNCTION private.require_confirmed_exchange_feedback();

-- Every new achievement milestone counts only jointly-confirmed Exchanges;
-- existing earned recognition remains preserved but is not re-certified.
CREATE OR REPLACE FUNCTION private.grant_feedback_achievements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_member_id uuid;
  v_eligible_count integer;
  v_definition record;
  v_award_id uuid;
BEGIN
  IF NOT public.is_active_member(NEW.from_user_id) THEN RETURN NEW; END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.exchanges e
    JOIN public.surrogacies s ON s.id = e.surrogacy_id
    WHERE e.id = NEW.exchange_id
      AND e.surrogacy_id = NEW.surrogacy_id
      AND e.status IN ('completed', 'partial')
      AND e.confirmation_state = 'confirmed'
      AND NEW.from_user_id <> NEW.to_user_id
      AND NEW.from_user_id = ANY(s.partner_ids)
      AND NEW.to_user_id = ANY(s.partner_ids)
  ) THEN RETURN NEW; END IF;

  -- Serialize milestones across concurrent feedback submissions so a
  -- threshold is not missed when two unrelated Exchanges complete together.
  SELECT id INTO v_member_id
  FROM public.profiles
  WHERE id = NEW.from_user_id AND trial_deleted_at IS NULL
  FOR UPDATE;
  IF NOT FOUND THEN RETURN NEW; END IF;

  SELECT count(*)::integer INTO v_eligible_count
  FROM public.feedback f
  JOIN public.exchanges e ON e.id = f.exchange_id
  JOIN public.surrogacies s ON s.id = f.surrogacy_id
  WHERE f.from_user_id = NEW.from_user_id
    AND e.surrogacy_id = f.surrogacy_id
    AND e.status IN ('completed', 'partial')
      AND e.confirmation_state = 'confirmed'
    AND f.from_user_id <> f.to_user_id
    AND f.from_user_id = ANY(s.partner_ids)
    AND f.to_user_id = ANY(s.partner_ids);

  FOR v_definition IN
    SELECT code, rule_version
    FROM public.achievement_definitions
    WHERE metric = 'eligible_feedback'
      AND enabled = true
      AND target <= v_eligible_count
    ORDER BY target, code
  LOOP
    v_award_id := NULL;
    INSERT INTO public.member_achievements (
      user_id, achievement_code, rule_version,
      evidence_event_type, evidence_event_id, evidence_feedback_id
    ) VALUES (
      NEW.from_user_id, v_definition.code, v_definition.rule_version,
      'feedback', NEW.id, NEW.id
    )
    ON CONFLICT (user_id, achievement_code) DO NOTHING
    RETURNING id INTO v_award_id;

    IF v_award_id IS NOT NULL THEN
      INSERT INTO public.audit_events (
        actor_id, action, target_id, target_type, after, timestamp
      ) VALUES (
        NEW.from_user_id, 'achievement_earned', v_award_id::text,
        'member_achievement',
        jsonb_build_object(
          'code', v_definition.code,
          'rule_version', v_definition.rule_version,
          'evidence_feedback_id', NEW.id
        ),
        now()
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.grant_feedback_achievements()
FROM PUBLIC, anon, authenticated, service_role;

DO $$
BEGIN
  IF has_function_privilege(
      'anon', 'public.confirm_exchange_for_trial(uuid, text)', 'EXECUTE'
     )
     OR has_function_privilege(
      'authenticated', 'public.confirm_exchange_for_trial_trusted(uuid, uuid, text)', 'EXECUTE'
     )
     OR has_table_privilege('authenticated', 'public.exchanges', 'UPDATE') THEN
    RAISE EXCEPTION 'Exchange confirmation ownership boundary leaked';
  END IF;
END;
$$;

COMMENT ON FUNCTION public.confirm_exchange_for_trial(uuid, text) IS
  'Authenticated peer-only confirmation or dispute of reported Exchange outcomes';

COMMIT;
