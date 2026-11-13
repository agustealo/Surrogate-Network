BEGIN;

-- SN-ENG-02B2C: version 3 conservative nonmonetary recognition screening.
-- The presence of a directed three-account credit cycle is a reason to
-- withhold the *new* XP event for manual review, not proof of collusion.
-- Never reject submitted Feedback or restrict abuse reporting.
ALTER TABLE private.reward_credit_exclusions
  DROP CONSTRAINT IF EXISTS reward_credit_exclusions_exclusion_reason_check;
ALTER TABLE private.reward_credit_exclusions
  ADD CONSTRAINT reward_credit_exclusions_exclusion_reason_check
  CHECK (exclusion_reason IN (
    'member_weekly_limit', 'pair_weekly_limit', 'reciprocal_cycle_review'
  ));

CREATE OR REPLACE FUNCTION private.award_eligible_feedback_xp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_member_count integer;
  v_pair_count integer;
  v_exclusion_reason text;
  v_reciprocal_cycle boolean;
  v_award_id uuid;
  v_transaction_id uuid;
BEGIN
  IF NOT public.is_active_member(NEW.from_user_id) THEN RETURN NEW; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.exchanges e
    JOIN public.surrogacies s ON s.id = e.surrogacy_id
    WHERE e.id = NEW.exchange_id
      AND e.surrogacy_id = NEW.surrogacy_id
      AND e.status IN ('completed', 'partial')
      AND e.confirmation_state = 'confirmed'
      AND NEW.from_user_id <> NEW.to_user_id
      AND NEW.from_user_id = ANY(s.partner_ids)
      AND NEW.to_user_id = ANY(s.partner_ids)
  ) THEN
    RETURN NEW;
  END IF;

  -- Preserve one credit per persisted event even across policy versions.
  IF EXISTS (
    SELECT 1 FROM private.reward_awards a
    WHERE a.recipient_user_id = NEW.from_user_id
      AND a.source_event_type = 'feedback'
      AND a.source_event_id = NEW.id
  ) THEN
    RETURN NEW;
  END IF;

  -- Serialize all reward decisions for one member. This also synchronizes
  -- correctly with the XP projection's existing profile row lock.
  PERFORM 1 FROM public.profiles
  WHERE id = NEW.from_user_id AND trial_deleted_at IS NULL
  FOR UPDATE;
  IF NOT FOUND THEN RETURN NEW; END IF;

  -- Serialize both directions of the same pair, including across distinct
  -- Connections. UUID ordering gives both participants the same lock key.
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'reward:pair:'
      || LEAST(NEW.from_user_id, NEW.to_user_id)::text || ':'
      || GREATEST(NEW.from_user_id, NEW.to_user_id)::text,
      0
    )
  );

  SELECT count(*)::integer INTO v_member_count
  FROM private.reward_awards a
  WHERE a.recipient_user_id = NEW.from_user_id
    AND a.source_event_type = 'feedback'
    AND a.xp_transaction_id IS NOT NULL
    AND a.created_at >= now() - interval '7 days';

  SELECT count(*)::integer INTO v_pair_count
  FROM private.reward_awards a
  JOIN public.feedback f ON f.id = a.source_event_id
  WHERE a.source_event_type = 'feedback'
    AND a.xp_transaction_id IS NOT NULL
    AND a.created_at >= now() - interval '7 days'
    AND (
      (f.from_user_id = NEW.from_user_id AND f.to_user_id = NEW.to_user_id)
      OR
      (f.from_user_id = NEW.to_user_id AND f.to_user_id = NEW.from_user_id)
    );

  -- Review the third qualifying edge of a three-member reciprocity cycle.
  -- This is only a nonpunitive XP eligibility decision, never a fraud finding.
  -- Both earlier directed edges must represent actually credited Feedback.
  SELECT EXISTS (
    SELECT 1
    FROM private.reward_awards a1
    JOIN public.feedback f1 ON f1.id = a1.source_event_id
    JOIN private.reward_awards a2
      ON a2.source_event_type = 'feedback'
     AND a2.xp_transaction_id IS NOT NULL
     AND a2.created_at >= now() - interval '7 days'
    JOIN public.feedback f2 ON f2.id = a2.source_event_id
    WHERE a1.source_event_type = 'feedback'
      AND a1.xp_transaction_id IS NOT NULL
      AND a1.created_at >= now() - interval '7 days'
      AND f1.from_user_id = NEW.to_user_id
      AND f1.to_user_id = f2.from_user_id
      AND f2.to_user_id = NEW.from_user_id
      AND f1.to_user_id <> NEW.from_user_id
      AND f1.to_user_id <> NEW.to_user_id
  ) INTO v_reciprocal_cycle;

  v_exclusion_reason := CASE
    WHEN v_pair_count >= 4 THEN 'pair_weekly_limit'
    WHEN v_member_count >= 10 THEN 'member_weekly_limit'
    WHEN v_reciprocal_cycle THEN 'reciprocal_cycle_review'
    ELSE NULL
  END;

  IF v_exclusion_reason IS NOT NULL THEN
    INSERT INTO private.reward_credit_exclusions (
      feedback_id, policy_version, exclusion_reason,
      member_window_count, pair_window_count
    )
    VALUES (NEW.id, 3, v_exclusion_reason, v_member_count, v_pair_count)
    ON CONFLICT (feedback_id) DO NOTHING;

    IF FOUND THEN
      INSERT INTO public.audit_events (
        actor_id, action, target_id, target_type,
        reason, after, timestamp
      )
      VALUES (
        NEW.from_user_id, 'reward_credit_excluded', NEW.id::text,
        'feedback', v_exclusion_reason,
        jsonb_build_object(
          'policy_version', 3,
          'member_window_count', v_member_count,
          'pair_window_count', v_pair_count,
          'member_limit', 10,
          'pair_limit', 4,
          'window_days', 7,
          'source_event_type', 'feedback'
        ),
        now()
      );
    END IF;
    RETURN NEW;
  END IF;

  INSERT INTO private.reward_awards (
    recipient_user_id, source_event_type, source_event_id, rule_version
  )
  VALUES (NEW.from_user_id, 'feedback', NEW.id, 3)
  ON CONFLICT (recipient_user_id, source_event_type, source_event_id, rule_version)
    DO NOTHING
  RETURNING id INTO v_award_id;

  IF v_award_id IS NULL THEN RETURN NEW; END IF;

  INSERT INTO public.xp_transactions (user_id, amount, source, description)
  VALUES (
    NEW.from_user_id, 10, 'feedback',
    'Shared eligible Feedback on a jointly confirmed Exchange'
  )
  RETURNING id INTO v_transaction_id;

  UPDATE private.reward_awards
  SET xp_transaction_id = v_transaction_id
  WHERE id = v_award_id;

  RETURN NEW;
END;
$$;


REVOKE ALL ON FUNCTION private.award_eligible_feedback_xp()
FROM PUBLIC, anon, authenticated, service_role;

COMMENT ON FUNCTION private.award_eligible_feedback_xp() IS
  'Version 3: nonmonetary credits capped per member/pair and screened for three-member reciprocal cycles; retained Feedback never becomes a fraud verdict';

COMMIT;
