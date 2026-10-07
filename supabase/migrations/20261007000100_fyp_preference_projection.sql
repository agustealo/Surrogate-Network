BEGIN;

CREATE TABLE public.recommendation_preferences (
  actor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('need', 'offer')),
  target_id text NOT NULL,
  preference text NOT NULL CHECK (preference IN ('saved', 'hidden')),
  source_event_id uuid NOT NULL,
  source_timestamp timestamptz NOT NULL,
  PRIMARY KEY (actor_id, target_type, target_id)
);

ALTER TABLE public.recommendation_preferences ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.recommendation_preferences FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.recommendation_preferences TO authenticated;

CREATE POLICY "Members read own recommendation preference projection"
ON public.recommendation_preferences
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = actor_id);

WITH latest AS (
  SELECT DISTINCT ON (actor_id, target_type, target_id)
    actor_id,
    target_type,
    target_id,
    action,
    id AS source_event_id,
    COALESCE(timestamp, now()) AS source_timestamp
  FROM public.audit_events
  WHERE actor_id IS NOT NULL
    AND target_type IN ('need', 'offer')
    AND target_id IS NOT NULL
    AND action IN (
      'fyp.save',
      'fyp.unsave',
      'fyp.not_interested',
      'fyp.restore_interest'
    )
  ORDER BY actor_id, target_type, target_id, timestamp DESC NULLS LAST, id DESC
)
INSERT INTO public.recommendation_preferences (
  actor_id,
  target_type,
  target_id,
  preference,
  source_event_id,
  source_timestamp
)
SELECT
  actor_id,
  target_type,
  target_id,
  CASE action
    WHEN 'fyp.save' THEN 'saved'
    WHEN 'fyp.not_interested' THEN 'hidden'
  END,
  source_event_id,
  source_timestamp
FROM latest
WHERE action IN ('fyp.save', 'fyp.not_interested');

CREATE INDEX idx_audit_events_fyp_preferences_latest
ON public.audit_events (actor_id, target_type, target_id, timestamp DESC, id DESC)
WHERE action IN (
  'fyp.save',
  'fyp.unsave',
  'fyp.not_interested',
  'fyp.restore_interest'
);

CREATE INDEX idx_audit_events_fyp_recent_impressions
ON public.audit_events (actor_id, timestamp DESC)
WHERE action = 'fyp.impression';

CREATE OR REPLACE FUNCTION private.project_fyp_recommendation_preference()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.actor_id IS NULL
     OR NEW.target_type NOT IN ('need', 'offer')
     OR NEW.target_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.action = 'fyp.save' THEN
    INSERT INTO public.recommendation_preferences (
      actor_id,
      target_type,
      target_id,
      preference,
      source_event_id,
      source_timestamp
    )
    VALUES (
      NEW.actor_id,
      NEW.target_type,
      NEW.target_id,
      'saved',
      NEW.id,
      COALESCE(NEW.timestamp, now())
    )
    ON CONFLICT (actor_id, target_type, target_id)
    DO UPDATE SET
      preference = EXCLUDED.preference,
      source_event_id = EXCLUDED.source_event_id,
      source_timestamp = EXCLUDED.source_timestamp;
  ELSIF NEW.action = 'fyp.not_interested' THEN
    INSERT INTO public.recommendation_preferences (
      actor_id,
      target_type,
      target_id,
      preference,
      source_event_id,
      source_timestamp
    )
    VALUES (
      NEW.actor_id,
      NEW.target_type,
      NEW.target_id,
      'hidden',
      NEW.id,
      COALESCE(NEW.timestamp, now())
    )
    ON CONFLICT (actor_id, target_type, target_id)
    DO UPDATE SET
      preference = EXCLUDED.preference,
      source_event_id = EXCLUDED.source_event_id,
      source_timestamp = EXCLUDED.source_timestamp;
  ELSIF NEW.action IN ('fyp.unsave', 'fyp.restore_interest') THEN
    DELETE FROM public.recommendation_preferences
    WHERE actor_id = NEW.actor_id
      AND target_type = NEW.target_type
      AND target_id = NEW.target_id;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.project_fyp_recommendation_preference() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS audit_events_project_fyp_recommendation_preference ON public.audit_events;
CREATE TRIGGER audit_events_project_fyp_recommendation_preference
AFTER INSERT ON public.audit_events
FOR EACH ROW
WHEN (
  NEW.action IN (
    'fyp.save',
    'fyp.unsave',
    'fyp.not_interested',
    'fyp.restore_interest'
  )
)
EXECUTE FUNCTION private.project_fyp_recommendation_preference();

COMMIT;
