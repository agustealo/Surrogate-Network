BEGIN;

-- Progression and reputation are authoritative outcomes, not client-editable
-- profile decoration.
DROP POLICY IF EXISTS "Users can update own progression" ON public.member_progression;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.member_progression FROM PUBLIC, anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.token_transactions FROM PUBLIC, anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.xp_transactions FROM PUBLIC, anon, authenticated;

-- A member may acknowledge a notification but may not rewrite its content or
-- move it to another account.
REVOKE UPDATE ON TABLE public.notifications FROM anon, authenticated;
GRANT UPDATE (read) ON TABLE public.notifications TO authenticated;

-- Feedback drives reputation, so all writes go through the server-authoritative
-- transaction below rather than direct Data API inserts.
REVOKE INSERT, UPDATE, DELETE ON TABLE public.feedback FROM PUBLIC, anon, authenticated;

CREATE UNIQUE INDEX IF NOT EXISTS exchanges_one_per_moment_idx
  ON public.exchanges(moment_id);

CREATE OR REPLACE FUNCTION public.create_moment_for_trial(
  p_surrogacy_id uuid,
  p_actor_id uuid,
  p_scheduled_time timestamptz,
  p_duration integer,
  p_location text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_surrogacy public.surrogacies%ROWTYPE;
  v_moment_id uuid;
BEGIN
  IF NOT public.is_active_member(p_actor_id) THEN
    RAISE EXCEPTION 'Account is not active';
  END IF;

  SELECT * INTO v_surrogacy
  FROM public.surrogacies
  WHERE id = p_surrogacy_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Relationship not found';
  END IF;
  IF p_actor_id <> ALL(v_surrogacy.partner_ids) THEN
    RAISE EXCEPTION 'Actor is not a relationship participant';
  END IF;
  IF v_surrogacy.status <> 'active' THEN
    RAISE EXCEPTION 'Relationship is not active';
  END IF;
  IF p_duration < 15 OR p_duration > 1440 THEN
    RAISE EXCEPTION 'Duration must be between 15 and 1440 minutes';
  END IF;
  IF p_scheduled_time < now() - interval '15 minutes' THEN
    RAISE EXCEPTION 'Scheduled time cannot be in the past';
  END IF;

  INSERT INTO public.moments(surrogacy_id, scheduled_time, duration, status, location, notes)
  VALUES (p_surrogacy_id, p_scheduled_time, p_duration, 'scheduled', NULLIF(trim(p_location), ''), NULLIF(trim(p_notes), ''))
  RETURNING id INTO v_moment_id;

  INSERT INTO public.audit_events(actor_id, action, target_id, target_type, after, timestamp)
  VALUES (
    p_actor_id,
    'moment_created',
    v_moment_id::text,
    'moment',
    jsonb_build_object('surrogacy_id', p_surrogacy_id, 'scheduled_time', p_scheduled_time, 'duration', p_duration),
    now()
  );

  INSERT INTO public.outbox_events(event_type, aggregate_type, aggregate_id, payload, occurred_at)
  VALUES (
    'moment_created',
    'moment',
    v_moment_id::text,
    jsonb_build_object('momentId', v_moment_id, 'surrogacyId', p_surrogacy_id, 'actorId', p_actor_id),
    now()
  );

  RETURN v_moment_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.create_moment_for_trial(uuid, uuid, timestamptz, integer, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_moment_for_trial(uuid, uuid, timestamptz, integer, text, text)
  TO service_role, postgres;

CREATE OR REPLACE FUNCTION public.cancel_moment_for_trial(
  p_moment_id uuid,
  p_actor_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_moment public.moments%ROWTYPE;
  v_surrogacy public.surrogacies%ROWTYPE;
BEGIN
  SELECT * INTO v_moment FROM public.moments WHERE id = p_moment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Moment not found'; END IF;

  SELECT * INTO v_surrogacy FROM public.surrogacies WHERE id = v_moment.surrogacy_id;
  IF p_actor_id <> ALL(v_surrogacy.partner_ids) THEN RAISE EXCEPTION 'Actor is not a relationship participant'; END IF;
  IF v_moment.status <> 'scheduled' THEN RAISE EXCEPTION 'Only scheduled moments can be cancelled'; END IF;

  UPDATE public.moments SET status = 'cancelled' WHERE id = p_moment_id;
  INSERT INTO public.audit_events(actor_id, action, target_id, target_type, before, after, timestamp)
  VALUES (p_actor_id, 'moment_cancelled', p_moment_id::text, 'moment', jsonb_build_object('status', v_moment.status), jsonb_build_object('status', 'cancelled'), now());
END;
$$;
REVOKE EXECUTE ON FUNCTION public.cancel_moment_for_trial(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_moment_for_trial(uuid, uuid) TO service_role, postgres;

CREATE OR REPLACE FUNCTION public.complete_moment_for_trial(
  p_moment_id uuid,
  p_actor_id uuid,
  p_exchange_status exchange_status DEFAULT 'completed'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_moment public.moments%ROWTYPE;
  v_surrogacy public.surrogacies%ROWTYPE;
  v_exchange_id uuid;
BEGIN
  IF p_exchange_status NOT IN ('completed', 'partial', 'disputed') THEN
    RAISE EXCEPTION 'Unsupported exchange status';
  END IF;
  IF NOT public.is_active_member(p_actor_id) THEN
    RAISE EXCEPTION 'Account is not active';
  END IF;

  SELECT * INTO v_moment FROM public.moments WHERE id = p_moment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Moment not found'; END IF;

  SELECT * INTO v_surrogacy FROM public.surrogacies WHERE id = v_moment.surrogacy_id;
  IF p_actor_id <> ALL(v_surrogacy.partner_ids) THEN RAISE EXCEPTION 'Actor is not a relationship participant'; END IF;

  SELECT id INTO v_exchange_id FROM public.exchanges WHERE moment_id = p_moment_id LIMIT 1;
  IF v_exchange_id IS NOT NULL THEN RETURN v_exchange_id; END IF;

  IF v_moment.status NOT IN ('scheduled', 'in_progress') THEN
    RAISE EXCEPTION 'Moment cannot be completed from status %', v_moment.status;
  END IF;
  IF v_moment.scheduled_time > now() + interval '15 minutes' THEN
    RAISE EXCEPTION 'Moment cannot be completed before its scheduled window';
  END IF;

  UPDATE public.moments SET status = 'completed' WHERE id = p_moment_id;

  INSERT INTO public.exchanges(moment_id, surrogacy_id, completed_at, status)
  VALUES (p_moment_id, v_moment.surrogacy_id, now(), p_exchange_status)
  RETURNING id INTO v_exchange_id;

  INSERT INTO public.audit_events(actor_id, action, target_id, target_type, after, timestamp)
  VALUES (
    p_actor_id,
    'exchange_recorded',
    v_exchange_id::text,
    'exchange',
    jsonb_build_object('moment_id', p_moment_id, 'status', p_exchange_status),
    now()
  );

  INSERT INTO public.outbox_events(event_type, aggregate_type, aggregate_id, payload, occurred_at)
  VALUES (
    'exchange_recorded',
    'exchange',
    v_exchange_id::text,
    jsonb_build_object('exchangeId', v_exchange_id, 'momentId', p_moment_id, 'surrogacyId', v_moment.surrogacy_id),
    now()
  );

  RETURN v_exchange_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.complete_moment_for_trial(uuid, uuid, exchange_status)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_moment_for_trial(uuid, uuid, exchange_status)
  TO service_role, postgres;

CREATE OR REPLACE FUNCTION public.submit_feedback_for_trial(
  p_exchange_id uuid,
  p_actor_id uuid,
  p_to_user_id uuid,
  p_rating integer,
  p_breakdown jsonb,
  p_comments text DEFAULT NULL,
  p_skill_endorsements text[] DEFAULT ARRAY[]::text[]
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_exchange public.exchanges%ROWTYPE;
  v_surrogacy public.surrogacies%ROWTYPE;
  v_feedback_id uuid;
  v_offer_owner uuid;
  v_rating numeric;
  v_review_count integer;
BEGIN
  IF p_rating < 1 OR p_rating > 5 THEN RAISE EXCEPTION 'Rating must be between 1 and 5'; END IF;
  IF NOT public.is_active_member(p_actor_id) THEN RAISE EXCEPTION 'Account is not active'; END IF;
  IF p_actor_id = p_to_user_id THEN RAISE EXCEPTION 'Members cannot review themselves'; END IF;

  SELECT * INTO v_exchange FROM public.exchanges WHERE id = p_exchange_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Exchange not found'; END IF;
  IF v_exchange.status NOT IN ('completed', 'partial') THEN RAISE EXCEPTION 'This exchange is not eligible for feedback'; END IF;

  SELECT * INTO v_surrogacy FROM public.surrogacies WHERE id = v_exchange.surrogacy_id;
  IF p_actor_id <> ALL(v_surrogacy.partner_ids) OR p_to_user_id <> ALL(v_surrogacy.partner_ids) THEN
    RAISE EXCEPTION 'Feedback participants must belong to the relationship';
  END IF;

  INSERT INTO public.feedback(exchange_id, surrogacy_id, from_user_id, to_user_id, rating, breakdown, comments, skill_endorsements)
  VALUES (
    p_exchange_id,
    v_exchange.surrogacy_id,
    p_actor_id,
    p_to_user_id,
    p_rating,
    COALESCE(p_breakdown, '{}'::jsonb),
    NULLIF(trim(p_comments), ''),
    COALESCE(p_skill_endorsements, ARRAY[]::text[])
  )
  ON CONFLICT (from_user_id, exchange_id) DO NOTHING
  RETURNING id INTO v_feedback_id;

  IF v_feedback_id IS NULL THEN
    SELECT id INTO v_feedback_id FROM public.feedback WHERE from_user_id = p_actor_id AND exchange_id = p_exchange_id;
    RETURN v_feedback_id;
  END IF;

  SELECT user_id INTO v_offer_owner FROM public.offers WHERE id = v_surrogacy.offer_id;
  IF v_offer_owner = p_to_user_id THEN
    SELECT round(avg(rating)::numeric, 2), count(*)::integer
      INTO v_rating, v_review_count
    FROM public.feedback f
    JOIN public.surrogacies s ON s.id = f.surrogacy_id
    WHERE s.offer_id = v_surrogacy.offer_id
      AND f.to_user_id = p_to_user_id;

    UPDATE public.offers
    SET rating = v_rating,
        review_count = v_review_count
    WHERE id = v_surrogacy.offer_id;
  END IF;

  INSERT INTO public.audit_events(actor_id, action, target_id, target_type, after, timestamp)
  VALUES (p_actor_id, 'feedback_submitted', v_feedback_id::text, 'feedback', jsonb_build_object('exchange_id', p_exchange_id, 'to_user_id', p_to_user_id, 'rating', p_rating), now());

  INSERT INTO public.outbox_events(event_type, aggregate_type, aggregate_id, payload, occurred_at)
  VALUES ('feedback_submitted', 'feedback', v_feedback_id::text, jsonb_build_object('feedbackId', v_feedback_id, 'exchangeId', p_exchange_id, 'fromUserId', p_actor_id, 'toUserId', p_to_user_id), now());

  RETURN v_feedback_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.submit_feedback_for_trial(uuid, uuid, uuid, integer, jsonb, text, text[])
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_feedback_for_trial(uuid, uuid, uuid, integer, jsonb, text, text[])
  TO service_role, postgres;

COMMIT;
