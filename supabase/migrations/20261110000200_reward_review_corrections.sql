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


