BEGIN;

-- Consumer-trial abuse budgets live in Postgres so direct Data API callers and
-- server-action callers cross the same boundary. Service-role/postgres fixture
-- and moderation work is intentionally excluded; only authenticated member
-- traffic consumes these budgets.
CREATE TABLE IF NOT EXISTS public.trial_action_rate_limits (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_key text NOT NULL,
  window_started_at timestamptz NOT NULL,
  action_count integer NOT NULL CHECK (action_count >= 0),
  PRIMARY KEY (user_id, action_key)
);

ALTER TABLE public.trial_action_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.trial_action_rate_limits FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.trial_action_rate_limits TO service_role, postgres;

CREATE OR REPLACE FUNCTION public.consume_trial_action_budget(
  p_user_id uuid,
  p_action_key text,
  p_limit integer,
  p_window interval
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_now timestamptz := clock_timestamp();
  v_window_started_at timestamptz;
  v_action_count integer;
BEGIN
  -- Trusted service/system work does not consume human action budgets.
  IF COALESCE(auth.role(), '') <> 'authenticated' THEN
    RETURN;
  END IF;

  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Authenticated actor mismatch for rate limit';
  END IF;

  IF p_limit < 1 OR p_window <= interval '0 seconds' THEN
    RAISE EXCEPTION 'Invalid rate-limit configuration';
  END IF;

  -- Serialize only this member/action bucket so concurrent requests cannot race
  -- past the limit while unrelated members continue independently.
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_user_id::text || ':' || p_action_key, 0)
  );

  SELECT window_started_at, action_count
    INTO v_window_started_at, v_action_count
  FROM public.trial_action_rate_limits
  WHERE user_id = p_user_id
    AND action_key = p_action_key
  FOR UPDATE;

  IF NOT FOUND OR v_window_started_at + p_window <= v_now THEN
    INSERT INTO public.trial_action_rate_limits(user_id, action_key, window_started_at, action_count)
    VALUES (p_user_id, p_action_key, v_now, 1)
    ON CONFLICT (user_id, action_key)
    DO UPDATE SET window_started_at = EXCLUDED.window_started_at,
                  action_count = EXCLUDED.action_count;
    RETURN;
  END IF;

  IF v_action_count >= p_limit THEN
    RAISE EXCEPTION 'Trial action rate limit exceeded for %', p_action_key;
  END IF;

  UPDATE public.trial_action_rate_limits
  SET action_count = action_count + 1
  WHERE user_id = p_user_id
    AND action_key = p_action_key;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.consume_trial_action_budget(uuid, text, integer, interval)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.consume_trial_action_budget(uuid, text, integer, interval)
  TO postgres;

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

REVOKE EXECUTE ON FUNCTION public.enforce_trial_insert_rate_limit()
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.enforce_trial_insert_rate_limit() TO postgres;

DROP TRIGGER IF EXISTS needs_trial_rate_limit ON public.needs;
CREATE TRIGGER needs_trial_rate_limit
BEFORE INSERT ON public.needs
FOR EACH ROW
EXECUTE FUNCTION public.enforce_trial_insert_rate_limit();

DROP TRIGGER IF EXISTS offers_trial_rate_limit ON public.offers;
CREATE TRIGGER offers_trial_rate_limit
BEFORE INSERT ON public.offers
FOR EACH ROW
EXECUTE FUNCTION public.enforce_trial_insert_rate_limit();

DROP TRIGGER IF EXISTS proposals_trial_rate_limit ON public.proposals;
CREATE TRIGGER proposals_trial_rate_limit
BEFORE INSERT ON public.proposals
FOR EACH ROW
EXECUTE FUNCTION public.enforce_trial_insert_rate_limit();

DROP TRIGGER IF EXISTS reports_trial_rate_limit ON public.reports;
CREATE TRIGGER reports_trial_rate_limit
BEFORE INSERT ON public.reports
FOR EACH ROW
EXECUTE FUNCTION public.enforce_trial_insert_rate_limit();

COMMIT;
