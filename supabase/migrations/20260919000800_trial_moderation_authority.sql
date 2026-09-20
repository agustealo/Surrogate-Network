BEGIN;

CREATE OR REPLACE FUNCTION public.moderate_report_for_trial(
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

REVOKE EXECUTE ON FUNCTION public.moderate_report_for_trial(uuid, uuid, report_status, text, boolean)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.moderate_report_for_trial(uuid, uuid, report_status, text, boolean)
  TO service_role, postgres;

COMMIT;
