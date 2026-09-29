BEGIN;

CREATE POLICY "Active members create own recommendation events"
ON public.audit_events
FOR INSERT
TO authenticated
WITH CHECK (
  actor_id = auth.uid()
  AND public.is_active_member(actor_id)
  AND action IN (
    'fyp.impression',
    'fyp.open',
    'fyp.save',
    'fyp.unsave',
    'fyp.not_interested',
    'fyp.proposal_created',
    'fyp.proposal_accepted',
    'fyp.exchange_completed',
    'fyp.feedback_submitted'
  )
  AND target_type IN ('need', 'offer')
  AND target_id IS NOT NULL
);

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.fyp_counterpart_subject(
  p_actor_id uuid,
  p_need_id uuid,
  p_offer_id uuid
)
RETURNS TABLE(subject_type text, subject_id uuid)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT CASE WHEN n.user_id = p_actor_id THEN 'offer' ELSE 'need' END,
         CASE WHEN n.user_id = p_actor_id THEN o.id ELSE n.id END
  FROM public.needs n
  JOIN public.offers o ON o.id = p_offer_id
  WHERE n.id = p_need_id
    AND p_actor_id IN (n.user_id, o.user_id)
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION private.record_fyp_proposal_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor_id uuid;
  v_action text;
  v_subject_type text;
  v_subject_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_actor_id := NEW.proposing_user_id;
    v_action := 'fyp.proposal_created';
  ELSIF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'accepted' THEN
    v_actor_id := NEW.receiving_user_id;
    v_action := 'fyp.proposal_accepted';
  ELSE
    RETURN NEW;
  END IF;

  SELECT subject_type, subject_id
  INTO v_subject_type, v_subject_id
  FROM private.fyp_counterpart_subject(v_actor_id, NEW.need_id, NEW.offer_id);

  IF v_subject_id IS NOT NULL THEN
    INSERT INTO public.audit_events(action, actor_id, target_type, target_id, after)
    VALUES (
      v_action,
      v_actor_id,
      v_subject_type,
      v_subject_id,
      jsonb_build_object('proposalId', NEW.id, 'needId', NEW.need_id, 'offerId', NEW.offer_id)
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS proposals_fyp_attribution ON public.proposals;
CREATE TRIGGER proposals_fyp_attribution
AFTER INSERT OR UPDATE OF status ON public.proposals
FOR EACH ROW EXECUTE FUNCTION private.record_fyp_proposal_event();

CREATE OR REPLACE FUNCTION private.record_fyp_exchange_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor_id uuid := auth.uid();
  v_need_id uuid;
  v_offer_id uuid;
  v_subject_type text;
  v_subject_id uuid;
BEGIN
  IF v_actor_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT need_id, offer_id INTO v_need_id, v_offer_id
  FROM public.surrogacies
  WHERE id = NEW.surrogacy_id;

  SELECT subject_type, subject_id
  INTO v_subject_type, v_subject_id
  FROM private.fyp_counterpart_subject(v_actor_id, v_need_id, v_offer_id);

  IF v_subject_id IS NOT NULL THEN
    INSERT INTO public.audit_events(action, actor_id, target_type, target_id, after)
    VALUES (
      'fyp.exchange_completed',
      v_actor_id,
      v_subject_type,
      v_subject_id,
      jsonb_build_object('exchangeId', NEW.id, 'surrogacyId', NEW.surrogacy_id, 'status', NEW.status)
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS exchanges_fyp_attribution ON public.exchanges;
CREATE TRIGGER exchanges_fyp_attribution
AFTER INSERT ON public.exchanges
FOR EACH ROW EXECUTE FUNCTION private.record_fyp_exchange_event();

CREATE OR REPLACE FUNCTION private.record_fyp_feedback_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_need_id uuid;
  v_offer_id uuid;
  v_subject_type text;
  v_subject_id uuid;
BEGIN
  SELECT need_id, offer_id INTO v_need_id, v_offer_id
  FROM public.surrogacies
  WHERE id = NEW.surrogacy_id;

  SELECT subject_type, subject_id
  INTO v_subject_type, v_subject_id
  FROM private.fyp_counterpart_subject(NEW.from_user_id, v_need_id, v_offer_id);

  IF v_subject_id IS NOT NULL THEN
    INSERT INTO public.audit_events(action, actor_id, target_type, target_id, after)
    VALUES (
      'fyp.feedback_submitted',
      NEW.from_user_id,
      v_subject_type,
      v_subject_id,
      jsonb_build_object(
        'feedbackId', NEW.id,
        'exchangeId', NEW.exchange_id,
        'surrogacyId', NEW.surrogacy_id,
        'rating', NEW.rating
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS feedback_fyp_attribution ON public.feedback;
CREATE TRIGGER feedback_fyp_attribution
AFTER INSERT ON public.feedback
FOR EACH ROW EXECUTE FUNCTION private.record_fyp_feedback_event();

COMMIT;
