BEGIN;

-- Blocking must hold at the database boundary even when trusted server RPCs use
-- service-role credentials. This trigger guards proposal state transitions after
-- a block was created, while still allowing decline/withdraw for cleanup.
CREATE OR REPLACE FUNCTION public.enforce_unblocked_proposal_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.status IN ('pending', 'countered', 'accepted')
     AND public.are_users_blocked(NEW.proposing_user_id, NEW.receiving_user_id) THEN
    RAISE EXCEPTION 'Blocked members cannot create or advance proposals';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS proposals_unblocked_transition_guard ON public.proposals;
CREATE TRIGGER proposals_unblocked_transition_guard
BEFORE INSERT OR UPDATE OF status ON public.proposals
FOR EACH ROW
EXECUTE FUNCTION public.enforce_unblocked_proposal_transition();

REVOKE EXECUTE ON FUNCTION public.enforce_unblocked_proposal_transition()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enforce_unblocked_proposal_transition()
  TO postgres;

-- Existing relationships remain visible as history after a block, but no new
-- Moment may be scheduled between blocked participants. Cancellation and
-- completion of already-existing Moments remain available for safe cleanup and
-- accurate records.
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

  IF array_length(v_partner_ids, 1) = 2
     AND public.are_users_blocked(v_partner_ids[1], v_partner_ids[2]) THEN
    RAISE EXCEPTION 'Blocked members cannot schedule new Moments';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS moments_unblocked_creation_guard ON public.moments;
CREATE TRIGGER moments_unblocked_creation_guard
BEFORE INSERT ON public.moments
FOR EACH ROW
EXECUTE FUNCTION public.enforce_unblocked_moment_creation();

REVOKE EXECUTE ON FUNCTION public.enforce_unblocked_moment_creation()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enforce_unblocked_moment_creation()
  TO postgres;

COMMIT;
