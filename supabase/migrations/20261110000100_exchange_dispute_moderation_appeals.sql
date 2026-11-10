BEGIN;

-- SN-ENG-02B2B1: reuse public.reports as the moderation-case owner.
-- The exchange's recorded dispute and the report's outcome are distinct
-- facts. An admin decision is NEVER peer confirmation and NEVER mints XP.
ALTER TABLE public.reports
  ADD COLUMN exchange_id uuid REFERENCES public.exchanges(id) ON DELETE CASCADE,
  ADD COLUMN case_origin text NOT NULL DEFAULT 'member_report',
  ADD COLUMN adjudication text,
  ADD COLUMN adjudicated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN adjudicated_at timestamptz,
  ADD CONSTRAINT reports_origin_check CHECK (
    case_origin IN ('member_report', 'exchange_dispute')
  ),
  ADD CONSTRAINT reports_case_ownership_check CHECK (
    (case_origin = 'member_report'
     AND exchange_id IS NULL
     AND adjudication IS NULL
     AND adjudicated_by IS NULL
     AND adjudicated_at IS NULL)
    OR
    (case_origin = 'exchange_dispute'
     AND exchange_id IS NOT NULL
     AND (adjudication IS NULL OR adjudication IN ('upheld', 'dismissed'))
     AND (
       (adjudication IS NULL AND adjudicated_by IS NULL AND adjudicated_at IS NULL)
       OR
       (adjudication IS NOT NULL AND adjudicated_by IS NOT NULL AND adjudicated_at IS NOT NULL)
     ))
  );

CREATE UNIQUE INDEX reports_exchange_dispute_one_per_exchange
ON public.reports (exchange_id) WHERE exchange_id IS NOT NULL;

-- This trigger executes before reports_trial_rate_limit alphabetically.
-- A Data API member must not be able to forge an exchange-origin case or
-- abuse the budget exception below to bypass member-report rate limits.
CREATE OR REPLACE FUNCTION private.guard_exchange_case_report_insert()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF NEW.case_origin <> 'exchange_dispute' THEN
    IF NEW.exchange_id IS NOT NULL OR NEW.adjudication IS NOT NULL
       OR NEW.adjudicated_by IS NOT NULL OR NEW.adjudicated_at IS NOT NULL THEN
      RAISE EXCEPTION 'Only the exchange case authority may set moderation linkage';
    END IF;
    RETURN NEW;
  END IF;

  IF pg_catalog.pg_trigger_depth() < 2
     OR NEW.exchange_id IS NULL OR NEW.status IS DISTINCT FROM 'pending'
     OR NEW.adjudication IS NOT NULL OR NEW.adjudicated_by IS NOT NULL
     OR NEW.adjudicated_at IS NOT NULL
     OR NOT EXISTS (
       SELECT 1 FROM public.exchanges e
       JOIN public.surrogacies s ON s.id = e.surrogacy_id
       WHERE e.id = NEW.exchange_id
         AND e.confirmation_state = 'disputed'
         AND e.disputed_by = NEW.reporter_user_id
         AND cardinality(s.partner_ids) = 2
         AND NEW.reporter_user_id = ANY(s.partner_ids)
         AND NEW.reported_user_id = ANY(s.partner_ids)
         AND NEW.reported_user_id <> NEW.reporter_user_id
     ) THEN
    RAISE EXCEPTION 'Only a real disputed Exchange can create a linked case';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.guard_exchange_case_report_insert()
FROM PUBLIC, anon, authenticated, service_role;

CREATE TRIGGER a_guard_exchange_case_report_insert
BEFORE INSERT ON public.reports
FOR EACH ROW EXECUTE FUNCTION private.guard_exchange_case_report_insert();

-- Original report-spam budgets stay intact for human safety reports.
CREATE OR REPLACE FUNCTION public.enforce_trial_insert_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_row jsonb := to_jsonb(NEW);
  v_actor uuid;
  v_action_key text;
  v_limit integer;
  v_window interval;
BEGIN
  -- Trusted exchange-trigger cases must never be blocked by report-spam
  -- budgets. An earlier named INSERT guard rejects member-forged cases.
  IF TG_TABLE_NAME = 'reports'
     AND v_row->>'case_origin' = 'exchange_dispute' THEN
    RETURN NEW;
  END IF;
  IF COALESCE(auth.role(), '') <> 'authenticated' THEN
    RETURN NEW;
  END IF;

  CASE TG_TABLE_NAME
    WHEN 'needs' THEN
      v_actor := (v_row->>'user_id')::uuid;
      v_action_key := 'need_create';
      v_limit := 12;
      v_window := interval '1 hour';
    WHEN 'offers' THEN
      v_actor := (v_row->>'user_id')::uuid;
      v_action_key := 'offer_create';
      v_limit := 12;
      v_window := interval '1 hour';
    WHEN 'proposals' THEN
      v_actor := (v_row->>'proposing_user_id')::uuid;
      v_action_key := 'proposal_create';
      v_limit := 30;
      v_window := interval '1 hour';
    WHEN 'reports' THEN
      v_actor := (v_row->>'reporter_user_id')::uuid;
      v_action_key := 'report_create';
      v_limit := 10;
      v_window := interval '24 hours';
    ELSE
      RAISE EXCEPTION 'Unsupported rate-limited table: %', TG_TABLE_NAME;
  END CASE;

  PERFORM public.consume_trial_action_budget(v_actor, v_action_key, v_limit, v_window);
  RETURN NEW;
END;
$$;


-- The original member's disputed report and the counterparty's disputed
-- confirmation both pass through the same exchange-row trigger. Locking
-- and the unique report/exchange ID ensure one moderation case.
CREATE OR REPLACE FUNCTION private.open_disputed_exchange_case()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_pair uuid[];
  v_other uuid;
  v_case_id uuid;
BEGIN
  IF NEW.confirmation_state <> 'disputed' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.confirmation_state = 'disputed' THEN RETURN NEW; END IF;

  SELECT partner_ids INTO v_pair
  FROM public.surrogacies WHERE id = NEW.surrogacy_id;
  IF cardinality(v_pair) IS DISTINCT FROM 2 OR NEW.disputed_by IS NULL
     OR NEW.disputed_by <> ALL(v_pair) THEN
    RAISE EXCEPTION 'A dispute requires two actual Connection participants';
  END IF;
  SELECT partner INTO v_other
  FROM unnest(v_pair) AS partner
  WHERE partner <> NEW.disputed_by LIMIT 1;

  INSERT INTO public.reports (
    reporter_user_id, reported_user_id, type, severity, status,
    description, exchange_id, case_origin
  )
  VALUES (
    NEW.disputed_by, v_other, 'other', 'medium', 'pending',
    'An Exchange outcome was disputed. The dispute is not a misconduct finding.',
    NEW.id, 'exchange_dispute'
  )
  ON CONFLICT (exchange_id) WHERE exchange_id IS NOT NULL DO NOTHING
  RETURNING id INTO v_case_id;

  IF v_case_id IS NOT NULL THEN
    INSERT INTO public.audit_events (
      actor_id, action, target_id, target_type, after, timestamp
    ) VALUES (
      NEW.disputed_by, 'exchange_dispute_case_opened',
      v_case_id::text, 'report',
      jsonb_build_object(
        'exchange_id', NEW.id,
        'surrogacy_id', NEW.surrogacy_id,
        'confirmation_state', NEW.confirmation_state
      ), now()
    );
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.open_disputed_exchange_case()
FROM PUBLIC, anon, authenticated, service_role;

CREATE TRIGGER open_disputed_exchange_case
AFTER INSERT OR UPDATE OF confirmation_state ON public.exchanges
FOR EACH ROW EXECUTE FUNCTION private.open_disputed_exchange_case();

-- Reuse the existing moderation RPC for ordinary safety reports, but
-- prohibit editing exchange-case outcomes through that generic path.
CREATE OR REPLACE FUNCTION public.moderate_report_for_trial_trusted(
  p_report_id uuid,
  p_admin_id uuid,
  p_status report_status,
  p_action_taken text DEFAULT NULL,
  p_suspend_reported_user boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_report public.reports%ROWTYPE;
  v_is_admin boolean;
  v_action text := NULLIF(trim(p_action_taken), '');
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = p_admin_id
      AND is_admin = true
      AND is_suspended = false
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Administrator authorization is required';
  END IF;

  IF p_status NOT IN ('investigating', 'resolved', 'dismissed') THEN
    RAISE EXCEPTION 'Unsupported moderation status';
  END IF;

  IF p_status IN ('resolved', 'dismissed') AND v_action IS NULL THEN
    RAISE EXCEPTION 'A moderation outcome is required before closing a report';
  END IF;

  SELECT * INTO v_report
  FROM public.reports
  WHERE id = p_report_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Report not found';
  END IF;

  IF v_report.case_origin = 'exchange_dispute' THEN
    RAISE EXCEPTION 'Exchange dispute cases require the independent adjudication action';
  END IF;

  UPDATE public.reports
  SET status = p_status,
      action_taken = v_action,
      resolved_at = CASE
        WHEN p_status IN ('resolved', 'dismissed') THEN now()
        ELSE NULL
      END
  WHERE id = p_report_id;

  IF p_suspend_reported_user THEN
    UPDATE public.profiles
    SET is_suspended = true
    WHERE id = v_report.reported_user_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Reported member profile is unavailable';
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM public.restrictions
      WHERE user_id = v_report.reported_user_id
        AND type = 'suspension'
        AND active = true
    ) THEN
      INSERT INTO public.restrictions(user_id, type, reason, active)
      VALUES (
        v_report.reported_user_id,
        'suspension',
        COALESCE(v_action, 'Suspended through report moderation'),
        true
      );
    END IF;
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
    p_admin_id,
    'report_moderated',
    p_report_id::text,
    'report',
    jsonb_build_object(
      'status', v_report.status,
      'action_taken', v_report.action_taken
    ),
    jsonb_build_object(
      'status', p_status,
      'action_taken', v_action,
      'reported_user_suspended', p_suspend_reported_user
    ),
    now()
  );
END;
$$;


CREATE OR REPLACE FUNCTION public.adjudicate_exchange_dispute_trusted(
  p_report_id uuid,
  p_admin_id uuid,
  p_decision text,
  p_reason text
)
RETURNS text
LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
DECLARE
  v_report public.reports%ROWTYPE;
  v_exchange public.exchanges%ROWTYPE;
  v_reason text := NULLIF(btrim(p_reason), '');
  v_status public.report_status;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_admin_id AND is_admin = true
      AND is_suspended = false AND trial_deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Active administrator authorization required';
  END IF;
  IF p_decision IS NULL OR p_decision NOT IN ('uphold', 'dismiss') THEN
    RAISE EXCEPTION 'Choose uphold or dismiss for the disputed outcome';
  END IF;
  IF v_reason IS NULL OR length(v_reason) < 12 OR length(v_reason) > 2000 THEN
    RAISE EXCEPTION 'A case decision requires 12 to 2000 characters of rationale';
  END IF;

  SELECT * INTO v_report
  FROM public.reports WHERE id = p_report_id FOR UPDATE;
  IF NOT FOUND OR v_report.case_origin <> 'exchange_dispute' THEN
    RAISE EXCEPTION 'Exchange dispute case not found';
  END IF;
  IF v_report.status NOT IN ('pending', 'investigating') THEN
    RAISE EXCEPTION 'This case was already decided';
  END IF;
  IF p_admin_id IN (v_report.reporter_user_id, v_report.reported_user_id)
     OR p_admin_id = v_report.adjudicated_by THEN
    RAISE EXCEPTION 'An independent administrator is required';
  END IF;

  SELECT * INTO v_exchange
  FROM public.exchanges WHERE id = v_report.exchange_id FOR UPDATE;
  IF NOT FOUND OR v_exchange.confirmation_state <> 'disputed' THEN
    RAISE EXCEPTION 'The original Exchange dispute evidence is unavailable';
  END IF;

  v_status := CASE WHEN p_decision = 'uphold' THEN 'resolved'::public.report_status
                   ELSE 'dismissed'::public.report_status END;

  UPDATE public.reports
  SET status = v_status,
      action_taken = v_reason,
      adjudication = CASE WHEN p_decision = 'uphold' THEN 'upheld' ELSE 'dismissed' END,
      adjudicated_by = p_admin_id,
      adjudicated_at = now(),
      resolved_at = now()
  WHERE id = p_report_id;

  INSERT INTO public.audit_events (
    actor_id, action, target_id, target_type, before, after, reason, timestamp
  )
  VALUES (
    p_admin_id, 'exchange_dispute_adjudicated', p_report_id::text, 'report',
    jsonb_build_object(
      'status', v_report.status,
      'adjudication', v_report.adjudication,
      'adjudicated_by', v_report.adjudicated_by
    ),
    jsonb_build_object(
      'status', v_status,
      'adjudication', CASE WHEN p_decision = 'uphold' THEN 'upheld' ELSE 'dismissed' END,
      'exchange_id', v_report.exchange_id,
      'exchange_state', v_exchange.confirmation_state
    ),
    v_reason, now()
  );

  INSERT INTO public.outbox_events (
    event_type, aggregate_type, aggregate_id, payload, occurred_at
  )
  VALUES (
    'exchange_dispute_adjudicated', 'report', p_report_id::text,
    jsonb_build_object(
      'caseId', p_report_id,
      'exchangeId', v_report.exchange_id,
      'decision', p_decision,
      'exchangeState', 'disputed'
    ), now()
  );
  RETURN p_decision;
END;
$$;

REVOKE ALL ON FUNCTION public.adjudicate_exchange_dispute_trusted(uuid, uuid, text, text)
FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.adjudicate_exchange_dispute_trusted(uuid, uuid, text, text)
TO postgres;

CREATE OR REPLACE FUNCTION public.adjudicate_exchange_dispute(
  p_report_id uuid, p_decision text, p_reason text
)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_admin uuid := auth.uid();
BEGIN
  IF v_admin IS NULL THEN RAISE EXCEPTION 'Authenticated administrator required'; END IF;
  RETURN public.adjudicate_exchange_dispute_trusted(p_report_id, v_admin, p_decision, p_reason);
END;
$$;

REVOKE ALL ON FUNCTION public.adjudicate_exchange_dispute(uuid, text, text)
FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.adjudicate_exchange_dispute(uuid, text, text)
TO authenticated;

-- A single appeal by each real participant for each closed Exchange case.
-- Not a parallel moderation system; this is reviewed evidence underneath
-- the same public.reports case owner and the same admin queue.
CREATE TABLE public.report_appeals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  appellant_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (length(btrim(reason)) BETWEEN 12 AND 2000),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'denied')),
  reviewer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  decision_reason text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (report_id, appellant_user_id),
  CONSTRAINT report_appeal_resolution_consistency CHECK (
    (status = 'pending' AND reviewer_id IS NULL
       AND decision_reason IS NULL AND reviewed_at IS NULL)
    OR
    (status IN ('accepted', 'denied') AND reviewer_id IS NOT NULL
       AND decision_reason IS NOT NULL AND reviewed_at IS NOT NULL)
  )
);

CREATE INDEX report_appeals_case_status_idx
ON public.report_appeals(report_id, status);

ALTER TABLE public.report_appeals ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.report_appeals
FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON TABLE public.report_appeals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.report_appeals TO service_role;
CREATE POLICY "Members view only their own case appeals"
ON public.report_appeals FOR SELECT TO authenticated
USING (appellant_user_id = (SELECT auth.uid()));

CREATE OR REPLACE FUNCTION public.submit_exchange_case_appeal_trusted(
  p_report_id uuid, p_actor_id uuid, p_reason text
)
RETURNS uuid
LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
DECLARE
  v_report public.reports%ROWTYPE;
  v_reason text := NULLIF(btrim(p_reason), '');
  v_id uuid;
BEGIN
  IF v_reason IS NULL OR length(v_reason) NOT BETWEEN 12 AND 2000 THEN
    RAISE EXCEPTION 'Appeal rationale must contain 12 to 2000 characters';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_actor_id AND trial_deleted_at IS NULL
  ) THEN RAISE EXCEPTION 'Active account identity required for appeal'; END IF;

  SELECT * INTO v_report
  FROM public.reports WHERE id = p_report_id FOR UPDATE;
  IF NOT FOUND OR v_report.case_origin <> 'exchange_dispute'
     OR p_actor_id NOT IN (v_report.reporter_user_id, v_report.reported_user_id) THEN
    RAISE EXCEPTION 'Only an affected participant can appeal this Exchange case';
  END IF;
  IF v_report.status NOT IN ('resolved', 'dismissed')
     OR v_report.resolved_at IS NULL
     OR v_report.resolved_at < now() - interval '30 days' THEN
    RAISE EXCEPTION 'Only a recently decided case may be appealed';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.exchanges e
    JOIN public.surrogacies s ON s.id = e.surrogacy_id
    WHERE e.id = v_report.exchange_id
      AND e.confirmation_state = 'disputed'
      AND p_actor_id = ANY(s.partner_ids)
  ) THEN RAISE EXCEPTION 'Exchange evidence is unavailable for appeal'; END IF;

  INSERT INTO public.report_appeals(report_id, appellant_user_id, reason)
  VALUES (p_report_id, p_actor_id, v_reason)
  RETURNING id INTO v_id;

  INSERT INTO public.audit_events (
    actor_id, action, target_id, target_type, after, timestamp
  ) VALUES (
    p_actor_id, 'exchange_case_appeal_submitted', v_id::text, 'report_appeal',
    jsonb_build_object('report_id', p_report_id, 'exchange_id', v_report.exchange_id),
    now()
  );
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_exchange_case_appeal_trusted(uuid, uuid, text)
FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.submit_exchange_case_appeal_trusted(uuid, uuid, text)
TO postgres;

CREATE OR REPLACE FUNCTION public.submit_exchange_case_appeal(
  p_report_id uuid, p_reason text
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
BEGIN
  IF v_actor IS NULL THEN RAISE EXCEPTION 'Authenticated participant required'; END IF;
  RETURN public.submit_exchange_case_appeal_trusted(p_report_id, v_actor, p_reason);
END;
$$;

REVOKE ALL ON FUNCTION public.submit_exchange_case_appeal(uuid, text)
FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.submit_exchange_case_appeal(uuid, text)
TO authenticated;

CREATE OR REPLACE FUNCTION public.review_exchange_case_appeal_trusted(
  p_appeal_id uuid, p_admin_id uuid, p_decision text, p_reason text
)
RETURNS text
LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
DECLARE
  v_appeal public.report_appeals%ROWTYPE;
  v_report public.reports%ROWTYPE;
  v_reason text := NULLIF(btrim(p_reason), '');
  v_state text;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_admin_id AND is_admin = true
      AND is_suspended = false AND trial_deleted_at IS NULL
  ) THEN RAISE EXCEPTION 'Active administrator required'; END IF;
  IF p_decision IS NULL OR p_decision NOT IN ('accept', 'deny') THEN
    RAISE EXCEPTION 'Appeal decision must be accept or deny';
  END IF;
  IF v_reason IS NULL OR length(v_reason) NOT BETWEEN 12 AND 2000 THEN
    RAISE EXCEPTION 'Independent appeal review requires an explicit rationale';
  END IF;

  SELECT * INTO v_appeal
  FROM public.report_appeals WHERE id = p_appeal_id FOR UPDATE;
  IF NOT FOUND OR v_appeal.status <> 'pending' THEN
    RAISE EXCEPTION 'Appeal is missing or already decided';
  END IF;
  SELECT * INTO v_report
  FROM public.reports WHERE id = v_appeal.report_id FOR UPDATE;
  IF NOT FOUND OR v_report.case_origin <> 'exchange_dispute'
     OR v_report.status NOT IN ('resolved', 'dismissed') THEN
    RAISE EXCEPTION 'Appeal case is not currently reviewable';
  END IF;
  IF p_admin_id IN (v_report.reporter_user_id, v_report.reported_user_id)
     OR p_admin_id = v_report.adjudicated_by
     OR p_admin_id = v_appeal.appellant_user_id THEN
    RAISE EXCEPTION 'Appeals require an independent administrator';
  END IF;

  v_state := CASE WHEN p_decision = 'accept' THEN 'accepted' ELSE 'denied' END;

  UPDATE public.report_appeals
  SET status = v_state, reviewer_id = p_admin_id,
      decision_reason = v_reason, reviewed_at = now()
  WHERE id = p_appeal_id;

  IF p_decision = 'accept' THEN
    -- Preserve previous adjudicator and decision as provenance, including
    -- in the case audit; a DIFFERENT administrator must re-adjudicate.
    UPDATE public.reports
    SET status = 'investigating', resolved_at = NULL,
        action_taken = 'Case reopened for independent review after appeal'
    WHERE id = v_report.id;
  END IF;

  INSERT INTO public.audit_events (
    actor_id, action, target_id, target_type, before, after, reason, timestamp
  ) VALUES (
    p_admin_id, 'exchange_case_appeal_reviewed', p_appeal_id::text, 'report_appeal',
    jsonb_build_object('case_status', v_report.status, 'adjudication', v_report.adjudication),
    jsonb_build_object(
      'appeal_status', v_state, 'report_id', v_report.id,
      'case_status', CASE WHEN v_state = 'accepted' THEN 'investigating' ELSE v_report.status::text END
    ),
    v_reason, now()
  );
  RETURN v_state;
END;
$$;

REVOKE ALL ON FUNCTION public.review_exchange_case_appeal_trusted(uuid, uuid, text, text)
FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.review_exchange_case_appeal_trusted(uuid, uuid, text, text)
TO postgres;

CREATE OR REPLACE FUNCTION public.review_exchange_case_appeal(
  p_appeal_id uuid, p_decision text, p_reason text
)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_admin uuid := auth.uid();
BEGIN
  IF v_admin IS NULL THEN RAISE EXCEPTION 'Authenticated administrator required'; END IF;
  RETURN public.review_exchange_case_appeal_trusted(
    p_appeal_id, v_admin, p_decision, p_reason
  );
END;
$$;

REVOKE ALL ON FUNCTION public.review_exchange_case_appeal(uuid, text, text)
FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.review_exchange_case_appeal(uuid, text, text)
TO authenticated;

-- Terminal deletion purges personal appeal narratives without silently
-- reversing independent case decisions or manufacturing reward evidence.
CREATE OR REPLACE FUNCTION private.purge_deleted_member_case_appeals()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF OLD.trial_deleted_at IS NULL AND NEW.trial_deleted_at IS NOT NULL THEN
    DELETE FROM public.report_appeals WHERE appellant_user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.purge_deleted_member_case_appeals()
FROM PUBLIC, anon, authenticated, service_role;

CREATE TRIGGER purge_deleted_member_case_appeals
AFTER UPDATE OF trial_deleted_at ON public.profiles
FOR EACH ROW EXECUTE FUNCTION private.purge_deleted_member_case_appeals();

DO $$
BEGIN
  IF has_table_privilege('authenticated', 'public.report_appeals', 'INSERT')
     OR has_table_privilege('authenticated', 'public.report_appeals', 'UPDATE')
     OR has_function_privilege('service_role', 'public.adjudicate_exchange_dispute(uuid, text, text)', 'EXECUTE')
     OR has_function_privilege('service_role', 'public.review_exchange_case_appeal(uuid, text, text)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.adjudicate_exchange_dispute_trusted(uuid, uuid, text, text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Dispute adjudication or appeal authority leaked';
  END IF;
END;
$$;

COMMENT ON TABLE public.report_appeals IS
  'Owned member appeals of independently adjudicated Exchange dispute cases; no financial reward mutations';
COMMENT ON FUNCTION public.adjudicate_exchange_dispute(uuid, text, text) IS
  'Session-authorized independent moderation of a disputed Exchange case without fabricating bilateral confirmation';

COMMIT;
