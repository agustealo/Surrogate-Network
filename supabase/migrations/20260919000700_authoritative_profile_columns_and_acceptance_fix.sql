BEGIN;

-- Row policies cannot reliably distinguish old and new values for every column
-- mutation path. Make column privileges the hard boundary: members may edit
-- descriptive profile fields only. Trusted SECURITY DEFINER/service-role paths
-- retain authority over rank, XP, balances, verification, suspension and admin.
REVOKE UPDATE ON TABLE public.profiles FROM authenticated;
GRANT UPDATE (
  name,
  avatar_url,
  bio,
  location,
  availability,
  boundaries
) ON TABLE public.profiles TO authenticated;

-- Keep the acceptance function on an empty search_path and fully qualify the
-- enum cast that previously failed at runtime under the hardened search path.
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

  PERFORM 1
  FROM public.needs
  WHERE id = v_proposal.need_id
    AND status = 'active'
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
  SET status = 'accepted',
      updated_at = now()
  WHERE id = p_proposal_id;

  UPDATE public.offers
  SET current_capacity = COALESCE(current_capacity, 0) + 1,
      status = CASE
        WHEN capacity IS NOT NULL
         AND COALESCE(current_capacity, 0) + 1 >= capacity
          THEN 'full'::public.offer_status
        ELSE status
      END
  WHERE id = v_proposal.offer_id;

  UPDATE public.needs
  SET status = 'fulfilled'
  WHERE id = v_proposal.need_id;

  INSERT INTO public.surrogacies(
    need_id,
    offer_id,
    partner_ids,
    status,
    agreement
  )
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
    p_actor_id,
    'proposal_accepted',
    p_proposal_id::text,
    'proposal',
    jsonb_build_object('status', v_proposal.status),
    jsonb_build_object('status', 'accepted', 'surrogacy_id', v_surrogacy_id),
    now()
  );

  INSERT INTO public.outbox_events(
    event_type,
    aggregate_type,
    aggregate_id,
    payload,
    occurred_at
  )
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
