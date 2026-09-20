BEGIN;

-- Trial lifecycle authority: user-facing reads remain RLS scoped, while state
-- transitions that create relationships or mutate authoritative counters are
-- only available to the trusted server role.

ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS countered_by_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

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
  );
$$;
REVOKE EXECUTE ON FUNCTION public.is_active_member(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_active_member(uuid) TO authenticated, service_role, postgres;

-- A suspended account must not continue operating through the Data API even if
-- it bypasses the web UI. Profiles/restrictions/reports remain readable through
-- their existing policies so account state and safety reporting stay available.
DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'needs', 'offers', 'proposals', 'surrogacies', 'surrogacy_participants',
    'moments', 'exchanges', 'feedback', 'media_assets',
    'media_access_requests', 'media_access_grants', 'token_transactions',
    'xp_transactions', 'member_progression', 'notifications',
    'command_idempotency'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Active members only', table_name);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT public.is_active_member(auth.uid()))) WITH CHECK ((SELECT public.is_active_member(auth.uid())))',
      'Active members only', table_name
    );
  END LOOP;
END $$;

-- Proposal creation must represent a real active Need/Offer pair owned by two
-- different people. The caller can only propose as themselves and the receiver
-- is derived from the opposite side of the pair.
DROP POLICY IF EXISTS "Users can create proposals they're involved in" ON public.proposals;
CREATE POLICY "Users can create valid proposals"
ON public.proposals
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = proposing_user_id
  AND status = 'pending'
  AND countered_by_user_id IS NULL
  AND proposing_user_id <> receiving_user_id
  AND EXISTS (
    SELECT 1
    FROM public.needs n
    JOIN public.offers o ON o.id = offer_id
    WHERE n.id = need_id
      AND n.status = 'active'
      AND o.status = 'active'
      AND n.user_id <> o.user_id
      AND (
        (n.user_id = auth.uid() AND o.user_id = receiving_user_id)
        OR
        (o.user_id = auth.uid() AND n.user_id = receiving_user_id)
      )
  )
);

-- No end-user JWT may mutate proposal rows directly. All transitions go through
-- the server actions and the service-role-only RPCs below.
REVOKE UPDATE ON TABLE public.proposals FROM PUBLIC, anon, authenticated;

-- Offer capacity/reputation are authoritative. Keep ordinary owners able to
-- create and edit descriptive fields, but remove client write access to the
-- counters and reputation columns.
REVOKE INSERT, UPDATE ON TABLE public.offers FROM anon, authenticated;
GRANT INSERT (
  title, description, category, location_mode, timing, boundaries, capacity,
  user_id, user_name, user_avatar
) ON TABLE public.offers TO authenticated;
GRANT UPDATE (
  title, description, category, location_mode, timing, boundaries, capacity,
  user_name, user_avatar
) ON TABLE public.offers TO authenticated;

-- Feedback must belong to a completed exchange inside a relationship containing
-- both the reviewer and the reviewed member.
DROP POLICY IF EXISTS "Users can create feedback they're the reviewer in" ON public.feedback;
CREATE POLICY "Participants can create valid exchange feedback"
ON public.feedback
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = from_user_id
  AND from_user_id <> to_user_id
  AND EXISTS (
    SELECT 1
    FROM public.exchanges e
    JOIN public.surrogacies s ON s.id = e.surrogacy_id
    WHERE e.id = exchange_id
      AND e.surrogacy_id = surrogacy_id
      AND e.status IN ('completed', 'partial')
      AND from_user_id = ANY(s.partner_ids)
      AND to_user_id = ANY(s.partner_ids)
  )
);

CREATE OR REPLACE FUNCTION public.transition_proposal_for_trial(
  p_proposal_id uuid,
  p_actor_id uuid,
  p_new_status proposal_status,
  p_message text DEFAULT NULL,
  p_proposed_date text DEFAULT NULL,
  p_duration text DEFAULT NULL,
  p_frequency text DEFAULT NULL,
  p_location_method text DEFAULT NULL
)
RETURNS proposal_status
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_proposal public.proposals%ROWTYPE;
  v_expected_actor uuid;
BEGIN
  IF p_new_status NOT IN ('declined', 'countered', 'withdrawn') THEN
    RAISE EXCEPTION 'Unsupported proposal transition: %', p_new_status;
  END IF;

  IF NOT public.is_active_member(p_actor_id) THEN
    RAISE EXCEPTION 'Account is not active';
  END IF;

  SELECT * INTO v_proposal
  FROM public.proposals
  WHERE id = p_proposal_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Proposal not found';
  END IF;

  IF p_actor_id <> v_proposal.proposing_user_id
     AND p_actor_id <> v_proposal.receiving_user_id THEN
    RAISE EXCEPTION 'Actor is not a proposal participant';
  END IF;

  IF v_proposal.status NOT IN ('pending', 'countered') THEN
    RAISE EXCEPTION 'Proposal is already final';
  END IF;

  IF p_new_status = 'withdrawn' THEN
    IF p_actor_id <> v_proposal.proposing_user_id THEN
      RAISE EXCEPTION 'Only the proposer may withdraw';
    END IF;
  ELSIF v_proposal.status = 'pending' THEN
    IF p_actor_id <> v_proposal.receiving_user_id THEN
      RAISE EXCEPTION 'Only the recipient may respond to a pending proposal';
    END IF;
  ELSE
    v_expected_actor := CASE
      WHEN v_proposal.countered_by_user_id = v_proposal.proposing_user_id
        THEN v_proposal.receiving_user_id
      ELSE v_proposal.proposing_user_id
    END;
    IF v_proposal.countered_by_user_id IS NULL OR p_actor_id <> v_expected_actor THEN
      RAISE EXCEPTION 'Only the other participant may respond to the counter';
    END IF;
  END IF;

  UPDATE public.proposals
  SET status = p_new_status,
      message = CASE WHEN p_new_status = 'countered' THEN COALESCE(p_message, message) ELSE message END,
      proposed_date = CASE WHEN p_new_status = 'countered' THEN COALESCE(p_proposed_date, proposed_date) ELSE proposed_date END,
      duration = CASE WHEN p_new_status = 'countered' THEN COALESCE(p_duration, duration) ELSE duration END,
      frequency = CASE WHEN p_new_status = 'countered' THEN COALESCE(p_frequency, frequency) ELSE frequency END,
      location_method = CASE WHEN p_new_status = 'countered' THEN COALESCE(p_location_method, location_method) ELSE location_method END,
      countered_by_user_id = CASE WHEN p_new_status = 'countered' THEN p_actor_id ELSE countered_by_user_id END,
      updated_at = now()
  WHERE id = p_proposal_id;

  INSERT INTO public.audit_events(actor_id, action, target_id, target_type, before, after, timestamp)
  VALUES (
    p_actor_id,
    'proposal_' || p_new_status::text,
    p_proposal_id::text,
    'proposal',
    jsonb_build_object('status', v_proposal.status),
    jsonb_build_object('status', p_new_status),
    now()
  );

  INSERT INTO public.outbox_events(event_type, aggregate_type, aggregate_id, payload, occurred_at)
  VALUES (
    'proposal_' || p_new_status::text,
    'proposal',
    p_proposal_id::text,
    jsonb_build_object('proposalId', p_proposal_id, 'actorId', p_actor_id),
    now()
  );

  RETURN p_new_status;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.transition_proposal_for_trial(uuid, uuid, proposal_status, text, text, text, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.transition_proposal_for_trial(uuid, uuid, proposal_status, text, text, text, text, text)
  TO service_role, postgres;

CREATE OR REPLACE FUNCTION public.accept_proposal_for_trial(
  p_proposal_id uuid,
  p_actor_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_proposal public.proposals%ROWTYPE;
  v_offer public.offers%ROWTYPE;
  v_surrogacy_id uuid;
  v_expected_actor uuid;
BEGIN
  IF NOT public.is_active_member(p_actor_id) THEN
    RAISE EXCEPTION 'Account is not active';
  END IF;

  SELECT * INTO v_proposal
  FROM public.proposals
  WHERE id = p_proposal_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Proposal not found';
  END IF;

  IF v_proposal.status = 'accepted' THEN
    SELECT id INTO v_surrogacy_id
    FROM public.surrogacies
    WHERE agreement->>'proposal_id' = p_proposal_id::text
    ORDER BY started_at ASC
    LIMIT 1;
    IF v_surrogacy_id IS NOT NULL THEN
      RETURN v_surrogacy_id;
    END IF;
    RAISE EXCEPTION 'Accepted proposal has no relationship record';
  END IF;

  IF v_proposal.status NOT IN ('pending', 'countered') THEN
    RAISE EXCEPTION 'Proposal cannot be accepted from status %', v_proposal.status;
  END IF;

  IF v_proposal.status = 'pending' THEN
    v_expected_actor := v_proposal.receiving_user_id;
  ELSE
    v_expected_actor := CASE
      WHEN v_proposal.countered_by_user_id = v_proposal.proposing_user_id
        THEN v_proposal.receiving_user_id
      ELSE v_proposal.proposing_user_id
    END;
  END IF;

  IF p_actor_id <> v_expected_actor THEN
    RAISE EXCEPTION 'Actor is not authorized to accept this proposal';
  END IF;

  IF NOT public.is_active_member(v_proposal.proposing_user_id)
     OR NOT public.is_active_member(v_proposal.receiving_user_id) THEN
    RAISE EXCEPTION 'Both participants must have active accounts';
  END IF;

  PERFORM 1 FROM public.needs
  WHERE id = v_proposal.need_id AND status = 'active'
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Need is no longer active';
  END IF;

  SELECT * INTO v_offer
  FROM public.offers
  WHERE id = v_proposal.offer_id
  FOR UPDATE;
  IF NOT FOUND OR v_offer.status <> 'active' THEN
    RAISE EXCEPTION 'Offer is no longer active';
  END IF;
  IF v_offer.capacity IS NOT NULL
     AND COALESCE(v_offer.current_capacity, 0) >= v_offer.capacity THEN
    RAISE EXCEPTION 'Offer has reached capacity';
  END IF;

  UPDATE public.proposals
  SET status = 'accepted', updated_at = now()
  WHERE id = p_proposal_id;

  UPDATE public.offers
  SET current_capacity = COALESCE(current_capacity, 0) + 1,
      status = CASE
        WHEN capacity IS NOT NULL AND COALESCE(current_capacity, 0) + 1 >= capacity
          THEN 'full'::offer_status
        ELSE status
      END
  WHERE id = v_proposal.offer_id;

  UPDATE public.needs
  SET status = 'fulfilled'
  WHERE id = v_proposal.need_id;

  INSERT INTO public.surrogacies(need_id, offer_id, partner_ids, status, agreement)
  VALUES (
    v_proposal.need_id,
    v_proposal.offer_id,
    ARRAY[v_proposal.proposing_user_id, v_proposal.receiving_user_id],
    'active',
    jsonb_build_object('proposal_id', p_proposal_id)
  )
  RETURNING id INTO v_surrogacy_id;

  INSERT INTO public.surrogacy_participants(surrogacy_id, user_id, role)
  VALUES
    (v_surrogacy_id, v_proposal.proposing_user_id, 'proposer'),
    (v_surrogacy_id, v_proposal.receiving_user_id, 'recipient');

  INSERT INTO public.audit_events(actor_id, action, target_id, target_type, before, after, timestamp)
  VALUES (
    p_actor_id,
    'proposal_accepted',
    p_proposal_id::text,
    'proposal',
    jsonb_build_object('status', v_proposal.status),
    jsonb_build_object('status', 'accepted', 'surrogacy_id', v_surrogacy_id),
    now()
  );

  INSERT INTO public.outbox_events(event_type, aggregate_type, aggregate_id, payload, occurred_at)
  VALUES (
    'proposal_accepted',
    'proposal',
    p_proposal_id::text,
    jsonb_build_object(
      'proposalId', p_proposal_id,
      'surrogacyId', v_surrogacy_id,
      'acceptedBy', p_actor_id
    ),
    now()
  );

  RETURN v_surrogacy_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.accept_proposal_for_trial(uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accept_proposal_for_trial(uuid, uuid)
  TO service_role, postgres;

COMMIT;
