BEGIN;

-- SN-ENG-02B2B2: feedback-specific reward review, never a generic
-- administrator ability to write arbitrary XP. public.reports remains
-- the case owner, public.xp_transactions the ONLY point journal.
ALTER TABLE public.reports
  ADD COLUMN reward_feedback_id uuid REFERENCES public.feedback(id) ON DELETE CASCADE;
ALTER TABLE public.reports
  DROP CONSTRAINT reports_origin_check,
  DROP CONSTRAINT reports_case_ownership_check;
ALTER TABLE public.reports
  ADD CONSTRAINT reports_origin_check CHECK (
    case_origin IN ('member_report', 'exchange_dispute', 'reward_review')
  ),
  ADD CONSTRAINT reports_case_ownership_check CHECK (
    (case_origin = 'member_report'
      AND exchange_id IS NULL AND reward_feedback_id IS NULL
      AND adjudication IS NULL AND adjudicated_by IS NULL
      AND adjudicated_at IS NULL)
    OR
    (case_origin = 'exchange_dispute'
      AND exchange_id IS NOT NULL AND reward_feedback_id IS NULL
      AND (adjudication IS NULL OR adjudication IN ('upheld', 'dismissed'))
      AND ((adjudication IS NULL AND adjudicated_by IS NULL AND adjudicated_at IS NULL)
        OR (adjudication IS NOT NULL AND adjudicated_by IS NOT NULL
          AND adjudicated_at IS NOT NULL)))
    OR
    (case_origin = 'reward_review'
      AND exchange_id IS NULL AND reward_feedback_id IS NOT NULL
      AND (adjudication IS NULL OR adjudication IN ('upheld', 'dismissed'))
      AND ((adjudication IS NULL AND adjudicated_by IS NULL AND adjudicated_at IS NULL)
        OR (adjudication IS NOT NULL AND adjudicated_by IS NOT NULL
          AND adjudicated_at IS NOT NULL)))
  );

CREATE UNIQUE INDEX reports_reward_review_feedback_unique
  ON public.reports(reward_feedback_id) WHERE reward_feedback_id IS NOT NULL;

-- Previously member-only reporting is unchanged. Only the subject of a
-- specific feedback-linked reward-review case can also see that case.
CREATE POLICY "Reward review subject reads their own case"
ON public.reports FOR SELECT TO authenticated
USING (
  case_origin = 'reward_review'
  AND reported_user_id = (SELECT auth.uid())
);

-- Reuse the original named insert guard, and keep the ordinary report
-- column grants exactly as before. Direct Data API callers cannot set
-- system-origin fields; a trusted wrapper alone creates linked reviews.
CREATE OR REPLACE FUNCTION private.guard_exchange_case_report_insert()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF NEW.case_origin = 'member_report' THEN
    IF NEW.exchange_id IS NOT NULL OR NEW.reward_feedback_id IS NOT NULL
       OR NEW.adjudication IS NOT NULL OR NEW.adjudicated_by IS NOT NULL
       OR NEW.adjudicated_at IS NOT NULL THEN
      RAISE EXCEPTION 'Only authorized case authorities can link evidence';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.case_origin = 'reward_review' THEN
    IF auth.uid() IS NULL OR NEW.reporter_user_id <> auth.uid()
       OR NOT public.is_active_member(NEW.reporter_user_id)
       OR NEW.exchange_id IS NOT NULL
       OR NEW.reward_feedback_id IS NULL
       OR NEW.status IS DISTINCT FROM 'pending'
       OR NEW.adjudication IS NOT NULL OR NEW.adjudicated_by IS NOT NULL
       OR NEW.adjudicated_at IS NOT NULL
       OR NOT EXISTS (
         SELECT 1 FROM public.feedback f
         JOIN public.exchanges e ON e.id = f.exchange_id
         JOIN public.surrogacies s ON s.id = f.surrogacy_id
         JOIN private.reward_awards a
           ON a.source_event_type = 'feedback'
          AND a.source_event_id = f.id
          AND a.recipient_user_id = f.from_user_id
          AND a.xp_transaction_id IS NOT NULL
         WHERE f.id = NEW.reward_feedback_id
           AND NEW.reporter_user_id = f.to_user_id
           AND NEW.reported_user_id = f.from_user_id
           AND f.to_user_id <> f.from_user_id
           AND f.from_user_id = ANY(s.partner_ids)
           AND f.to_user_id = ANY(s.partner_ids)
           AND e.surrogacy_id = f.surrogacy_id
           AND e.confirmation_state = 'confirmed'
           AND e.status IN ('completed', 'partial')
       ) THEN
      RAISE EXCEPTION 'Reward review must reference credited, jointly confirmed Feedback of the reporting counterpart';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.case_origin <> 'exchange_dispute'
     OR pg_catalog.pg_trigger_depth() < 2
     OR NEW.exchange_id IS NULL OR NEW.reward_feedback_id IS NOT NULL
     OR NEW.status IS DISTINCT FROM 'pending'
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

-- Do not leak sensitive case creation rights to ordinary report insertion.
-- This RPC is a session-bound user operation and consumes the EXISTING
-- report spam budget.
CREATE OR REPLACE FUNCTION public.open_reward_feedback_review(
  p_feedback_id uuid, p_reason text
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_owner uuid;
  v_id uuid;
  v_reason text := NULLIF(btrim(p_reason), '');
BEGIN
  IF v_actor IS NULL OR NOT public.is_active_member(v_actor) THEN
    RAISE EXCEPTION 'An active reporting member is required';
  END IF;
  IF v_reason IS NULL OR length(v_reason) NOT BETWEEN 20 AND 2000 THEN
    RAISE EXCEPTION 'Describe the evidence for review in 20 to 2000 characters';
  END IF;

  SELECT from_user_id INTO v_owner
  FROM public.feedback
  WHERE id = p_feedback_id AND to_user_id = v_actor;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Only the receiving counterpart may request this feedback review';
  END IF;

  INSERT INTO public.reports(
    reporter_user_id, reported_user_id, type, severity,
    description, status, case_origin, reward_feedback_id
  ) VALUES (
    v_actor, v_owner, 'other', 'medium',
    v_reason, 'pending', 'reward_review', p_feedback_id
  ) RETURNING id INTO v_id;

  INSERT INTO public.audit_events(
    actor_id, action, target_id, target_type, after, timestamp
  ) VALUES (
    v_actor, 'reward_review_opened', v_id::text, 'report',
    jsonb_build_object('feedback_id', p_feedback_id), now()
  );
  RETURN v_id;
END;
$$;
REVOKE ALL ON FUNCTION public.open_reward_feedback_review(uuid, text)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.open_reward_feedback_review(uuid, text)
  TO authenticated;

-- The general moderation action MUST NOT decide reward review cases.
-- Extend only its original conditional guard: remaining logic is preserved.
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

  IF v_report.case_origin <> 'member_report' THEN
    RAISE EXCEPTION 'Linked cases require their own independent adjudication authority';
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



-- Correction rows explain immutable *new* XP journal writes. They are not
-- balances and have no separate points arithmetic or redemption semantics.
CREATE TABLE public.reward_corrections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  feedback_id uuid NOT NULL REFERENCES public.feedback(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('reversed', 'restored')),
  xp_transaction_id uuid NOT NULL UNIQUE
    REFERENCES public.xp_transactions(id) ON DELETE CASCADE,
  reviewer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason text NOT NULL CHECK (length(btrim(reason)) BETWEEN 20 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (feedback_id, action),
  UNIQUE (report_id, action)
);

ALTER TABLE public.reward_corrections ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.reward_corrections
FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON public.reward_corrections TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reward_corrections TO service_role;

CREATE POLICY "Members read only their reward corrections"
ON public.reward_corrections FOR SELECT TO authenticated
USING (member_id = (SELECT auth.uid()));

CREATE OR REPLACE FUNCTION private.active_feedback_reward_credit(p_feedback_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.reward_corrections r
    WHERE r.feedback_id = p_feedback_id AND r.action = 'reversed'
      AND NOT EXISTS (
        SELECT 1 FROM public.reward_corrections t
        WHERE t.feedback_id = r.feedback_id AND t.action = 'restored'
      )
  );
$$;
REVOKE ALL ON FUNCTION private.active_feedback_reward_credit(uuid)
FROM PUBLIC, anon, authenticated, service_role;

-- Credentialed human actions resolve only specific evidence-backed cases.
-- Re-adjudication after an accepted appeal must be by a DIFFERENT admin.
CREATE OR REPLACE FUNCTION public.adjudicate_reward_review_trusted(
  p_report_id uuid, p_admin_id uuid, p_decision text, p_reason text
)
RETURNS text
LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
DECLARE
  v_case public.reports%ROWTYPE;
  v_feedback public.feedback%ROWTYPE;
  v_award private.reward_awards%ROWTYPE;
  v_reason text := NULLIF(btrim(p_reason), '');
  v_original_amount integer;
  v_has_reversal boolean;
  v_has_restoration boolean;
  v_xp_id uuid;
  v_action text;
  v_credited integer;
  v_badge_count integer := 0;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_admin_id
      AND is_admin = true AND is_suspended = false
      AND trial_deactivated_at IS NULL AND trial_deleted_at IS NULL
  ) THEN RAISE EXCEPTION 'An active administrator must review reward evidence'; END IF;
  IF p_decision IS NULL OR p_decision NOT IN ('invalidate', 'dismiss') THEN
    RAISE EXCEPTION 'Select invalidate or dismiss the reward review';
  END IF;
  IF v_reason IS NULL OR length(v_reason) NOT BETWEEN 20 AND 2000 THEN
    RAISE EXCEPTION 'Document a 20 to 2000 character evidence-based rationale';
  END IF;

  SELECT * INTO v_case
  FROM public.reports WHERE id = p_report_id FOR UPDATE;
  IF NOT FOUND OR v_case.case_origin <> 'reward_review'
     OR v_case.reward_feedback_id IS NULL THEN
    RAISE EXCEPTION 'A real feedback-linked reward review case is required';
  END IF;
  IF v_case.status NOT IN ('pending', 'investigating') THEN
    RAISE EXCEPTION 'The review is closed; only a separately accepted appeal can reopen it';
  END IF;
  IF p_admin_id IN (v_case.reporter_user_id, v_case.reported_user_id)
     OR p_admin_id = v_case.adjudicated_by THEN
    RAISE EXCEPTION 'A different independent administrator is required';
  END IF;

  SELECT * INTO v_feedback
  FROM public.feedback WHERE id = v_case.reward_feedback_id FOR UPDATE;
  IF NOT FOUND OR v_feedback.from_user_id <> v_case.reported_user_id
     OR v_feedback.to_user_id <> v_case.reporter_user_id THEN
    RAISE EXCEPTION 'Feedback evidence and case participants disagree';
  END IF;

  SELECT * INTO v_award
  FROM private.reward_awards
  WHERE source_event_type = 'feedback'
    AND source_event_id = v_feedback.id
    AND recipient_user_id = v_feedback.from_user_id
    AND xp_transaction_id IS NOT NULL
  ORDER BY created_at LIMIT 1 FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'A credited XP journal event is required to correct recognition';
  END IF;
  SELECT amount INTO v_original_amount
  FROM public.xp_transactions
  WHERE id = v_award.xp_transaction_id AND user_id = v_feedback.from_user_id;
  IF v_original_amount IS DISTINCT FROM 10 THEN
    RAISE EXCEPTION 'The credit does not match the versioned 10-XP feedback rule';
  END IF;

  -- Reuse the journal projection's own profile row lock, preserving
  -- serialization with normal Feedback and concurrent corrections.
  PERFORM 1 FROM public.profiles
  WHERE id = v_feedback.from_user_id AND trial_deleted_at IS NULL
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Deleted accounts cannot receive corrections'; END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.reward_corrections
    WHERE feedback_id = v_feedback.id AND action = 'reversed'
  ) INTO v_has_reversal;
  SELECT EXISTS (
    SELECT 1 FROM public.reward_corrections
    WHERE feedback_id = v_feedback.id AND action = 'restored'
  ) INTO v_has_restoration;

  IF p_decision = 'invalidate' AND NOT v_has_reversal THEN
    INSERT INTO public.xp_transactions (user_id, amount, source, description)
    VALUES (
      v_feedback.from_user_id, -10, 'feedback',
      'Reward review correction: -10 XP (case ' || p_report_id::text || ')'
    ) RETURNING id INTO v_xp_id;

    INSERT INTO public.reward_corrections (
      report_id, feedback_id, member_id, action,
      xp_transaction_id, reviewer_id, reason
    ) VALUES (
      p_report_id, v_feedback.id, v_feedback.from_user_id,
      'reversed', v_xp_id, p_admin_id, v_reason
    );
    v_action := 'reversed';
  ELSIF p_decision = 'dismiss' AND v_has_reversal AND NOT v_has_restoration THEN
    INSERT INTO public.xp_transactions (user_id, amount, source, description)
    VALUES (
      v_feedback.from_user_id, 10, 'feedback',
      'Reward review correction: +10 XP restored (case ' || p_report_id::text || ')'
    ) RETURNING id INTO v_xp_id;

    INSERT INTO public.reward_corrections (
      report_id, feedback_id, member_id, action,
      xp_transaction_id, reviewer_id, reason
    ) VALUES (
      p_report_id, v_feedback.id, v_feedback.from_user_id,
      'restored', v_xp_id, p_admin_id, v_reason
    );
    v_action := 'restored';
  ELSIF p_decision = 'invalidate' AND v_has_restoration THEN
    RAISE EXCEPTION 'The restoration is final; repeat reversals require a new reviewed policy';
  ELSE
    v_action := 'no_change';
  END IF;

  SELECT count(*)::integer INTO v_credited
  FROM private.reward_awards a
  JOIN public.feedback f ON f.id = a.source_event_id
  JOIN public.exchanges e ON e.id = f.exchange_id
  WHERE a.recipient_user_id = v_feedback.from_user_id
    AND a.source_event_type = 'feedback'
    AND a.xp_transaction_id IS NOT NULL
    AND f.from_user_id = v_feedback.from_user_id
    AND e.surrogacy_id = f.surrogacy_id
    AND e.status IN ('completed', 'partial')
    AND e.confirmation_state = 'confirmed'
    AND private.active_feedback_reward_credit(f.id);

  IF v_action = 'reversed' THEN
    UPDATE public.member_achievements a
    SET status = 'revoked', revoked_at = now(), revoked_by = p_admin_id,
        revocation_reason = 'Reward review case ' || p_report_id::text
    FROM public.achievement_definitions d
    WHERE d.code = a.achievement_code
      AND a.user_id = v_feedback.from_user_id
      AND a.status = 'earned'
      AND (
        d.target > v_credited
        OR a.evidence_feedback_id = v_feedback.id
      );
    GET DIAGNOSTICS v_badge_count = ROW_COUNT;
  ELSIF v_action = 'restored' THEN
    UPDATE public.member_achievements a
    SET status = 'earned', revoked_at = NULL, revoked_by = NULL,
        revocation_reason = NULL
    FROM public.achievement_definitions d
    WHERE d.code = a.achievement_code
      AND a.user_id = v_feedback.from_user_id
      AND a.status = 'revoked'
      AND a.revocation_reason = 'Reward review case ' || p_report_id::text
      AND d.target <= v_credited
      AND (
        a.evidence_feedback_id IS NULL
        OR private.active_feedback_reward_credit(a.evidence_feedback_id)
      );
    GET DIAGNOSTICS v_badge_count = ROW_COUNT;
  END IF;

  UPDATE public.reports
  SET status = CASE WHEN p_decision = 'invalidate'
      THEN 'resolved'::public.report_status ELSE 'dismissed'::public.report_status END,
      adjudication = CASE WHEN p_decision = 'invalidate' THEN 'upheld' ELSE 'dismissed' END,
      adjudicated_by = p_admin_id,
      adjudicated_at = now(),
      action_taken = v_reason,
      resolved_at = now()
  WHERE id = p_report_id;

  INSERT INTO public.audit_events (
    actor_id, action, target_id, target_type, before, after, reason, timestamp
  ) VALUES (
    p_admin_id, 'reward_review_adjudicated', p_report_id::text, 'report',
    jsonb_build_object(
      'previous_status', v_case.status,
      'previous_adjudication', v_case.adjudication
    ),
    jsonb_build_object(
      'feedback_id', v_feedback.id,
      'member_id', v_feedback.from_user_id,
      'outcome', p_decision,
      'correction', v_action,
      'xp_delta', CASE v_action WHEN 'reversed' THEN -10
                                WHEN 'restored' THEN 10 ELSE 0 END,
      'affected_achievements', v_badge_count,
      'credited_feedback_after', v_credited
    ), v_reason, now()
  );

  -- Existing outbox is an integration signal, NOT a fake push notification.
  -- The member's Rewards page reads the persisted correction directly.
  INSERT INTO public.outbox_events (
    event_type, aggregate_type, aggregate_id, payload, occurred_at
  ) VALUES (
    'reward_review_decided', 'report', p_report_id::text,
    jsonb_build_object(
      'reportId', p_report_id,
      'memberId', v_feedback.from_user_id,
      'feedbackId', v_feedback.id,
      'decision', p_decision,
      'correction', v_action
    ), now()
  );

  RETURN v_action;
END;
$$;
REVOKE ALL ON FUNCTION public.adjudicate_reward_review_trusted(uuid, uuid, text, text)
FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.adjudicate_reward_review_trusted(uuid, uuid, text, text)
TO postgres;

CREATE OR REPLACE FUNCTION public.adjudicate_reward_review(
  p_report_id uuid, p_decision text, p_reason text
)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
BEGIN
  IF v_actor IS NULL THEN RAISE EXCEPTION 'Administrator session required'; END IF;
  RETURN public.adjudicate_reward_review_trusted(p_report_id, v_actor, p_decision, p_reason);
END;
$$;
REVOKE ALL ON FUNCTION public.adjudicate_reward_review(uuid, text, text)
FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.adjudicate_reward_review(uuid, text, text)
TO authenticated;

