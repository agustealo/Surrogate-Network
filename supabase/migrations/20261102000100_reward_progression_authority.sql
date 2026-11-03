BEGIN;

-- SN-ENG-01: reuse the existing XP journal and the private server authority.
-- No paid currency, wallet, payout table, or payment-provider implementation
-- is introduced by this migration.

CREATE OR REPLACE FUNCTION private.reconcile_member_progression(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_profile_id uuid;
  v_total bigint;
  v_rank integer;
BEGIN
  -- Serialize all journal projection changes for a member. Reading the sum
  -- after acquiring this lock ensures committed concurrent awards are seen.
  SELECT id INTO v_profile_id
  FROM public.profiles
  WHERE id = p_user_id AND trial_deleted_at IS NULL
  FOR UPDATE;

  -- Account deletion can remove XP rows after the profile is tombstoned.
  IF NOT FOUND THEN RETURN; END IF;

  SELECT COALESCE(sum(amount), 0)::bigint INTO v_total
  FROM public.xp_transactions
  WHERE user_id = p_user_id;

  IF v_total < 0 OR v_total > 2147483647 THEN
    RAISE EXCEPTION 'XP journal total is out of range for member %', p_user_id;
  END IF;

  -- Existing rank rule is one rank for each completed 100 XP.
  v_rank := (v_total / 100)::integer + 1;

  UPDATE public.profiles
  SET xp = v_total::integer,
      rank = v_rank
  WHERE id = p_user_id;

  INSERT INTO public.member_progression (user_id, total_xp, current_rank, level)
  VALUES (p_user_id, v_total::integer, v_rank, v_rank)
  ON CONFLICT (user_id) DO UPDATE
  SET total_xp = EXCLUDED.total_xp,
      current_rank = EXCLUDED.current_rank,
      level = EXCLUDED.level;
  -- Deliberately preserve existing achievement history.
END;
$$;

REVOKE ALL ON FUNCTION private.reconcile_member_progression(uuid)
  FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION private.on_xp_transaction_changed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM private.reconcile_member_progression(NEW.user_id);
    RETURN NEW;
  END IF;

  -- Physical deletes are reserved for account lifecycle cleanup. Ordinary
  -- corrections should be new compensating journal entries instead.
  PERFORM private.reconcile_member_progression(OLD.user_id);
  RETURN OLD;
END;
$$;

REVOKE ALL ON FUNCTION private.on_xp_transaction_changed()
  FROM PUBLIC, anon, authenticated, service_role;

DROP TRIGGER IF EXISTS xp_transaction_projection ON public.xp_transactions;
CREATE TRIGGER xp_transaction_projection
AFTER INSERT OR DELETE ON public.xp_transactions
FOR EACH ROW
EXECUTE FUNCTION private.on_xp_transaction_changed();

CREATE OR REPLACE FUNCTION private.prevent_xp_transaction_rewrite()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION 'XP transactions are append-only; use a compensating entry';
END;
$$;

REVOKE ALL ON FUNCTION private.prevent_xp_transaction_rewrite()
  FROM PUBLIC, anon, authenticated, service_role;

DROP TRIGGER IF EXISTS xp_transactions_immutable ON public.xp_transactions;
CREATE TRIGGER xp_transactions_immutable
BEFORE UPDATE ON public.xp_transactions
FOR EACH ROW
EXECUTE FUNCTION private.prevent_xp_transaction_rewrite();

-- Retain the existing server-only update_user_xp RPC for legacy trusted
-- callers, but make it a journal writer, not a competing rank calculator.
CREATE OR REPLACE FUNCTION public.update_user_xp(
  p_user_id uuid,
  p_amount integer,
  p_source public.xp_source,
  p_description text
)
RETURNS public.xp_transactions
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_transaction public.xp_transactions%ROWTYPE;
BEGIN
  IF p_user_id IS NULL
     OR p_amount IS NULL
     OR p_amount = 0
     OR p_source IS NULL
     OR NULLIF(btrim(p_description), '') IS NULL THEN
    RAISE EXCEPTION 'Valid member, nonzero XP, source and description required';
  END IF;

  INSERT INTO public.xp_transactions (user_id, amount, source, description)
  VALUES (p_user_id, p_amount, p_source, btrim(p_description))
  RETURNING * INTO v_transaction;

  RETURN v_transaction;
END;
$$;

REVOKE ALL ON FUNCTION public.update_user_xp(uuid, integer, public.xp_source, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_xp(uuid, integer, public.xp_source, text)
  TO service_role, postgres;

-- Event identity is private and separate from the public XP history schema.
-- It prevents repeated lifecycle deliveries from awarding a second time.
CREATE TABLE IF NOT EXISTS private.reward_awards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source_event_type text NOT NULL,
  source_event_id uuid NOT NULL,
  rule_version integer NOT NULL CHECK (rule_version > 0),
  xp_transaction_id uuid UNIQUE REFERENCES public.xp_transactions(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (recipient_user_id, source_event_type, source_event_id, rule_version)
);

ALTER TABLE private.reward_awards ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE private.reward_awards
  FROM PUBLIC, anon, authenticated, service_role;

-- Feedback is already restricted to an eligible Exchange, an actual
-- participant, and one submission per participant per Exchange.
-- Award for participation in feedback, never for a particular star rating.
CREATE OR REPLACE FUNCTION private.award_eligible_feedback_xp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_award_id uuid;
  v_transaction_id uuid;
BEGIN
  IF NOT public.is_active_member(NEW.from_user_id) THEN
    RETURN NEW;
  END IF;

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
  ) THEN
    RETURN NEW;
  END IF;

  INSERT INTO private.reward_awards (
    recipient_user_id, source_event_type, source_event_id, rule_version
  )
  VALUES (NEW.from_user_id, 'feedback', NEW.id, 1)
  ON CONFLICT (recipient_user_id, source_event_type, source_event_id, rule_version)
    DO NOTHING
  RETURNING id INTO v_award_id;

  IF v_award_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.xp_transactions (user_id, amount, source, description)
  VALUES (
    NEW.from_user_id, 10, 'feedback',
    'Shared feedback on a completed Exchange'
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

DROP TRIGGER IF EXISTS eligible_feedback_xp_award ON public.feedback;
CREATE TRIGGER eligible_feedback_xp_award
AFTER INSERT ON public.feedback
FOR EACH ROW
EXECUTE FUNCTION private.award_eligible_feedback_xp();

-- One-time deterministic reconciliation from the existing journal. Historical
-- unbacked cached balances are not treated as newly earned XP. Deleted profile
-- tombstones remain immutable.
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  FOR v_user_id IN
    SELECT id FROM public.profiles
    WHERE trial_deleted_at IS NULL
    ORDER BY id
  LOOP
    PERFORM private.reconcile_member_progression(v_user_id);
  END LOOP;
END;
$$;

DO $$
BEGIN
  IF has_function_privilege(
       'authenticated',
       'public.update_user_xp(uuid, integer, public.xp_source, text)',
       'EXECUTE'
     )
     OR has_schema_privilege('authenticated', 'private', 'USAGE')
     OR has_table_privilege('authenticated', 'private.reward_awards', 'SELECT') THEN
    RAISE EXCEPTION 'Reward authority leaked to the authenticated role';
  END IF;
END;
$$;

COMMENT ON FUNCTION public.update_user_xp(uuid, integer, public.xp_source, text)
  IS 'Server-only legacy XP journal writer; projection is maintained by the journal trigger';
COMMENT ON TABLE private.reward_awards
  IS 'Private deduplication evidence for nonmonetary XP awards; not a currency or payout ledger';

COMMIT;
