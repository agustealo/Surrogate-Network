BEGIN;

-- SN-ENG-02B2A: genuine Feedback remains a human record even when it does
-- not qualify for nonmonetary XP. Reuse the existing authoritative XP journal,
-- reward_awards event IDs, and achievement engine. No money is introduced.
-- Version 2 pilot policy: 10 credits/member and 4 credits/pair in any rolling
-- 7 days, across *all* Connections formed by the same two account IDs.
-- Versioned policy changes require a reviewed migration and adversarial tests.

CREATE TABLE private.reward_credit_exclusions (
  feedback_id uuid PRIMARY KEY REFERENCES public.feedback(id) ON DELETE CASCADE,
  policy_version integer NOT NULL CHECK (policy_version > 0),
  exclusion_reason text NOT NULL
    CHECK (exclusion_reason IN ('member_weekly_limit', 'pair_weekly_limit')),
  member_window_count integer NOT NULL CHECK (member_window_count >= 0),
  pair_window_count integer NOT NULL CHECK (pair_window_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE private.reward_credit_exclusions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE private.reward_credit_exclusions
FROM PUBLIC, anon, authenticated, service_role;

CREATE INDEX reward_awards_weekly_member_idx
ON private.reward_awards (recipient_user_id, created_at)
WHERE source_event_type = 'feedback' AND xp_transaction_id IS NOT NULL;

CREATE INDEX reward_awards_weekly_pair_idx
ON private.reward_awards (created_at)
WHERE source_event_type = 'feedback' AND xp_transaction_id IS NOT NULL;

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

  v_exclusion_reason := CASE
    WHEN v_pair_count >= 4 THEN 'pair_weekly_limit'
    WHEN v_member_count >= 10 THEN 'member_weekly_limit'
    ELSE NULL
  END;

  IF v_exclusion_reason IS NOT NULL THEN
    INSERT INTO private.reward_credit_exclusions (
      feedback_id, policy_version, exclusion_reason,
      member_window_count, pair_window_count
    )
    VALUES (NEW.id, 2, v_exclusion_reason, v_member_count, v_pair_count)
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
          'policy_version', 2,
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
  VALUES (NEW.from_user_id, 'feedback', NEW.id, 2)
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

-- The existing AFTER INSERT milestone trigger follows
-- eligible_feedback_xp_award by trigger name order. It is now strictly
-- keyed to a real credited journal event, rather than raw feedback volume.
CREATE OR REPLACE FUNCTION private.grant_feedback_achievements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_eligible_count integer;
  v_definition record;
  v_award_id uuid;
BEGIN
  IF NOT public.is_active_member(NEW.from_user_id) THEN RETURN NEW; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM private.reward_awards a
    WHERE a.recipient_user_id = NEW.from_user_id
      AND a.source_event_type = 'feedback'
      AND a.source_event_id = NEW.id
      AND a.xp_transaction_id IS NOT NULL
  ) THEN
    RETURN NEW;
  END IF;

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
  ) THEN RETURN NEW; END IF;

  -- Already serialized by the XP-awarding trigger's profile/pair locks.
  SELECT count(*)::integer INTO v_eligible_count
  FROM private.reward_awards a
  JOIN public.feedback f ON f.id = a.source_event_id
  JOIN public.exchanges e ON e.id = f.exchange_id
  WHERE a.recipient_user_id = NEW.from_user_id
    AND a.source_event_type = 'feedback'
    AND a.xp_transaction_id IS NOT NULL
    AND f.from_user_id = NEW.from_user_id
    AND e.surrogacy_id = f.surrogacy_id
    AND e.status IN ('completed', 'partial')
    AND e.confirmation_state = 'confirmed';

  FOR v_definition IN
    SELECT code, rule_version
    FROM public.achievement_definitions
    WHERE metric = 'eligible_feedback'
      AND enabled = true
      AND target <= v_eligible_count
    ORDER BY target, code
  LOOP
    v_award_id := NULL;
    INSERT INTO public.member_achievements (
      user_id, achievement_code, rule_version,
      evidence_event_type, evidence_event_id, evidence_feedback_id
    ) VALUES (
      NEW.from_user_id, v_definition.code, v_definition.rule_version,
      'feedback', NEW.id, NEW.id
    )
    ON CONFLICT (user_id, achievement_code) DO NOTHING
    RETURNING id INTO v_award_id;

    IF v_award_id IS NOT NULL THEN
      INSERT INTO public.audit_events (
        actor_id, action, target_id, target_type, after, timestamp
      ) VALUES (
        NEW.from_user_id, 'achievement_earned', v_award_id::text,
        'member_achievement',
        jsonb_build_object(
          'code', v_definition.code,
          'rule_version', v_definition.rule_version,
          'evidence_feedback_id', NEW.id
        ),
        now()
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.grant_feedback_achievements()
FROM PUBLIC, anon, authenticated, service_role;

-- A member can read only aggregated credit outcomes, not the private
-- exclusion evidence nor the counts or identities of other members.
CREATE OR REPLACE FUNCTION public.get_my_reward_credit_summary()
RETURNS TABLE (
  credited_count integer,
  excluded_count integer,
  member_seven_day_limit integer,
  pair_seven_day_limit integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Authenticated member required';
  END IF;

  RETURN QUERY
  SELECT
    (
      SELECT count(*)::integer
      FROM private.reward_awards a
      JOIN public.feedback f ON f.id = a.source_event_id
      JOIN public.exchanges e ON e.id = f.exchange_id
      WHERE a.recipient_user_id = v_actor
        AND a.source_event_type = 'feedback'
        AND a.xp_transaction_id IS NOT NULL
        AND f.from_user_id = v_actor
        AND e.surrogacy_id = f.surrogacy_id
        AND e.status IN ('completed', 'partial')
        AND e.confirmation_state = 'confirmed'
    ),
    (
      SELECT count(*)::integer
      FROM private.reward_credit_exclusions x
      JOIN public.feedback f ON f.id = x.feedback_id
      WHERE f.from_user_id = v_actor
    ),
    10,
    4;
END;
$$;

REVOKE ALL ON FUNCTION public.get_my_reward_credit_summary()
FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.get_my_reward_credit_summary()
TO authenticated;

-- Private operational evidence must not survive a terminal member tombstone.
-- Shared Feedback and historic journal projections retain their existing
-- account-lifecycle ownership; do not change those deletion semantics here.
CREATE OR REPLACE FUNCTION private.purge_deleted_member_reward_exclusions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF OLD.trial_deleted_at IS NULL AND NEW.trial_deleted_at IS NOT NULL THEN
    DELETE FROM private.reward_credit_exclusions x
    USING public.feedback f
    WHERE x.feedback_id = f.id
      AND (f.from_user_id = NEW.id OR f.to_user_id = NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.purge_deleted_member_reward_exclusions()
FROM PUBLIC, anon, authenticated, service_role;

CREATE TRIGGER purge_member_reward_exclusions_on_tombstone
AFTER UPDATE OF trial_deleted_at ON public.profiles
FOR EACH ROW EXECUTE FUNCTION private.purge_deleted_member_reward_exclusions();

DO $$
BEGIN
  IF has_table_privilege('authenticated', 'private.reward_credit_exclusions', 'SELECT')
     OR has_function_privilege('anon', 'public.get_my_reward_credit_summary()', 'EXECUTE')
     OR has_function_privilege('service_role', 'private.award_eligible_feedback_xp()', 'EXECUTE') THEN
    RAISE EXCEPTION 'Reward credit policy leaked authority beyond the canonical boundary';
  END IF;
END;
$$;

COMMENT ON TABLE private.reward_credit_exclusions IS
  'Private, nonpunitive evidence of XP/achievement exclusions after eligible Feedback; not a fraud verdict or financial hold';
COMMENT ON FUNCTION public.get_my_reward_credit_summary() IS
  'Session-bound aggregate of credited and noncredited participation; no caller-supplied member identity';

COMMIT;
