BEGIN;

-- SN-ENG-02: verified nonmonetary achievements. Preserve the existing
-- XP journal, immutable reward awards, and legacy member_progression arrays.
-- Achievement configuration is production configuration, not demo member data.
CREATE TABLE public.achievement_definitions (
  code text PRIMARY KEY CHECK (code ~ '^[a-z][a-z0-9_]{2,63}$'),
  title text NOT NULL CHECK (length(btrim(title)) BETWEEN 3 AND 90),
  description text NOT NULL CHECK (length(btrim(description)) BETWEEN 10 AND 320),
  category text NOT NULL DEFAULT 'contribution'
    CHECK (category IN ('contribution', 'community', 'growth')),
  metric text NOT NULL DEFAULT 'eligible_feedback'
    CHECK (metric = 'eligible_feedback'),
  target integer NOT NULL CHECK (target BETWEEN 1 AND 10000),
  enabled boolean NOT NULL DEFAULT true,
  rule_version integer NOT NULL DEFAULT 1 CHECK (rule_version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.member_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_code text NOT NULL REFERENCES public.achievement_definitions(code),
  rule_version integer NOT NULL CHECK (rule_version > 0),
  evidence_event_type text NOT NULL CHECK (evidence_event_type = 'feedback'),
  evidence_event_id uuid NOT NULL,
  evidence_feedback_id uuid REFERENCES public.feedback(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'earned' CHECK (status IN ('earned', 'revoked')),
  earned_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  revoked_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  revocation_reason text,
  UNIQUE (user_id, achievement_code),
  CONSTRAINT member_achievement_revocation_consistency CHECK (
    (status = 'earned' AND revoked_at IS NULL AND revoked_by IS NULL AND revocation_reason IS NULL)
    OR
    (status = 'revoked' AND revoked_at IS NOT NULL AND revocation_reason IS NOT NULL)
  )
);

CREATE INDEX member_achievements_code_status_idx
ON public.member_achievements (achievement_code, status);

ALTER TABLE public.achievement_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_achievements ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.achievement_definitions, public.member_achievements
FROM PUBLIC, anon, authenticated, service_role;

-- Definitions are a readable public catalog only to signed-in members.
-- The only individual award rows visible to ordinary members are their own.
GRANT SELECT ON TABLE public.achievement_definitions, public.member_achievements
TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.achievement_definitions, public.member_achievements
TO service_role;

CREATE POLICY "Authenticated members can read achievement catalog"
ON public.achievement_definitions FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Members can read only their achievements"
ON public.member_achievements FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()));

INSERT INTO public.achievement_definitions
  (code, title, description, category, metric, target, enabled)
VALUES
  (
    'first_reflection', 'First Reflection',
    'Shared feedback after an eligible Exchange. Feedback quality is not scored by its star rating.',
    'growth', 'eligible_feedback', 1, true
  ),
  (
    'thoughtful_participant', 'Thoughtful Participant',
    'Contributed feedback on three distinct eligible Exchanges.',
    'contribution', 'eligible_feedback', 3, true
  ),
  (
    'consistent_reflector', 'Consistent Reflector',
    'Contributed feedback on ten distinct eligible Exchanges.',
    'growth', 'eligible_feedback', 10, true
  );

-- A feedback row qualifies only when the Exchange and both participants
-- still satisfy the canonical relationship evidence. No points or money
-- are awarded for achievements; XP remains entirely in SN-ENG-01.
CREATE OR REPLACE FUNCTION private.grant_feedback_achievements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_member_id uuid;
  v_eligible_count integer;
  v_definition record;
  v_award_id uuid;
BEGIN
  IF NOT public.is_active_member(NEW.from_user_id) THEN RETURN NEW; END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.exchanges e
    JOIN public.surrogacies s ON s.id = e.surrogacy_id
    WHERE e.id = NEW.exchange_id
      AND e.surrogacy_id = NEW.surrogacy_id
      AND e.status IN ('completed', 'partial')
      AND NEW.from_user_id <> NEW.to_user_id
      AND NEW.from_user_id = ANY(s.partner_ids)
      AND NEW.to_user_id = ANY(s.partner_ids)
  ) THEN RETURN NEW; END IF;

  -- Serialize milestones across concurrent feedback submissions so a
  -- threshold is not missed when two unrelated Exchanges complete together.
  SELECT id INTO v_member_id
  FROM public.profiles
  WHERE id = NEW.from_user_id AND trial_deleted_at IS NULL
  FOR UPDATE;
  IF NOT FOUND THEN RETURN NEW; END IF;

  SELECT count(*)::integer INTO v_eligible_count
  FROM public.feedback f
  JOIN public.exchanges e ON e.id = f.exchange_id
  JOIN public.surrogacies s ON s.id = f.surrogacy_id
  WHERE f.from_user_id = NEW.from_user_id
    AND e.surrogacy_id = f.surrogacy_id
    AND e.status IN ('completed', 'partial')
    AND f.from_user_id <> f.to_user_id
    AND f.from_user_id = ANY(s.partner_ids)
    AND f.to_user_id = ANY(s.partner_ids);

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

DROP TRIGGER IF EXISTS zz_feedback_achievement_grants ON public.feedback;
CREATE TRIGGER zz_feedback_achievement_grants
AFTER INSERT ON public.feedback
FOR EACH ROW EXECUTE FUNCTION private.grant_feedback_achievements();

-- Account deletion retains a redacted profile tombstone. Badge records
-- must not survive such deletion merely because the profile FK remains.
CREATE OR REPLACE FUNCTION private.purge_deleted_member_achievements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF OLD.trial_deleted_at IS NULL AND NEW.trial_deleted_at IS NOT NULL THEN
    DELETE FROM public.member_achievements WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.purge_deleted_member_achievements()
FROM PUBLIC, anon, authenticated, service_role;

CREATE TRIGGER purge_member_achievements_on_tombstone
AFTER UPDATE OF trial_deleted_at ON public.profiles
FOR EACH ROW EXECUTE FUNCTION private.purge_deleted_member_achievements();

-- Historical qualifying feedback earns the recognition it actually supports,
-- without minting XP retroactively or altering legacy achievement text.
WITH ranked_feedback AS (
  SELECT
    f.id,
    f.from_user_id,
    COALESCE(f.created_at, e.completed_at, now()) AS evidence_at,
    row_number() OVER (
      PARTITION BY f.from_user_id
      ORDER BY COALESCE(f.created_at, e.completed_at, now()), f.id
    ) AS ordinal
  FROM public.feedback f
  JOIN public.exchanges e ON e.id = f.exchange_id
  JOIN public.surrogacies s ON s.id = f.surrogacy_id
  JOIN public.profiles p ON p.id = f.from_user_id
  WHERE p.trial_deleted_at IS NULL
    AND e.surrogacy_id = f.surrogacy_id
    AND e.status IN ('completed', 'partial')
    AND f.from_user_id <> f.to_user_id
    AND f.from_user_id = ANY(s.partner_ids)
    AND f.to_user_id = ANY(s.partner_ids)
)
INSERT INTO public.member_achievements (
  user_id, achievement_code, rule_version,
  evidence_event_type, evidence_event_id, evidence_feedback_id, earned_at
)
SELECT
  ranked.from_user_id, d.code, d.rule_version,
  'feedback', ranked.id, ranked.id, ranked.evidence_at
FROM ranked_feedback ranked
JOIN public.achievement_definitions d
  ON d.metric = 'eligible_feedback' AND d.target = ranked.ordinal
WHERE d.enabled
ON CONFLICT (user_id, achievement_code) DO NOTHING;

-- This is an admin-only configuration action, not an arbitrary rule editor.
-- Rules remain versioned/migration-owned; operators can pause or resume
-- issuance with a reason and an audit trail. Already-earned badges persist.
CREATE OR REPLACE FUNCTION public.set_achievement_rule_enabled_trusted(
  p_admin_id uuid,
  p_code text,
  p_enabled boolean,
  p_reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_previous public.achievement_definitions%ROWTYPE;
  v_reason text := NULLIF(btrim(p_reason), '');
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_admin_id
      AND is_admin = true
      AND is_suspended = false
      AND trial_deactivated_at IS NULL
      AND trial_deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Administrator authorization is required';
  END IF;

  IF p_enabled IS NULL OR v_reason IS NULL
     OR length(v_reason) NOT BETWEEN 8 AND 240 THEN
    RAISE EXCEPTION 'An explicit state and reason (8-240 characters) are required';
  END IF;

  SELECT * INTO v_previous
  FROM public.achievement_definitions
  WHERE code = p_code
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Unknown achievement rule'; END IF;
  IF v_previous.enabled = p_enabled THEN
    RAISE EXCEPTION 'Achievement rule already has the requested state';
  END IF;

  UPDATE public.achievement_definitions
  SET enabled = p_enabled,
      rule_version = v_previous.rule_version + 1,
      updated_at = now()
  WHERE code = p_code;

  INSERT INTO public.audit_events (
    actor_id, action, target_id, target_type, before, after, reason, timestamp
  )
  VALUES (
    p_admin_id, 'achievement_rule_state_changed', p_code,
    'achievement_definition',
    jsonb_build_object('enabled', v_previous.enabled, 'rule_version', v_previous.rule_version),
    jsonb_build_object('enabled', p_enabled, 'rule_version', v_previous.rule_version + 1),
    v_reason, now()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.set_achievement_rule_enabled_trusted(uuid, text, boolean, text)
FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.set_achievement_rule_enabled_trusted(uuid, text, boolean, text)
TO postgres;

-- Canonical authenticated-actor boundary: a signed-in human cannot pass an
-- arbitrary administrator ID. SECURITY DEFINER is narrowly restricted here,
-- while the trusted core remains callable by postgres only.
CREATE OR REPLACE FUNCTION public.set_achievement_rule_enabled(
  p_code text,
  p_enabled boolean,
  p_reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $
DECLARE
  v_admin uuid := auth.uid();
BEGIN
  IF v_admin IS NULL THEN
    RAISE EXCEPTION 'Authenticated administrator required';
  END IF;

  PERFORM public.set_achievement_rule_enabled_trusted(
    v_admin, p_code, p_enabled, p_reason
  );
END;
$;

REVOKE ALL ON FUNCTION public.set_achievement_rule_enabled(text, boolean, text)
FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.set_achievement_rule_enabled(text, boolean, text)
TO authenticated;

DO $$
BEGIN
  IF has_table_privilege('anon', 'public.member_achievements', 'SELECT')
     OR has_table_privilege('authenticated', 'public.member_achievements', 'INSERT')
     OR has_table_privilege('authenticated', 'public.achievement_definitions', 'UPDATE')
     OR has_function_privilege(
       'authenticated',
       'public.set_achievement_rule_enabled_trusted(uuid, text, boolean, text)',
       'EXECUTE'
     ) THEN
    RAISE EXCEPTION 'Achievement authority leaked to public clients';
  END IF;
END;
$$;

COMMENT ON TABLE public.achievement_definitions
  IS 'Migration-owned nonmonetary achievement definitions and operator issuance state';
COMMENT ON TABLE public.member_achievements
  IS 'Evidence-linked, member-scoped earned recognition; not reputation, currency, or a safety credential';

COMMIT;
