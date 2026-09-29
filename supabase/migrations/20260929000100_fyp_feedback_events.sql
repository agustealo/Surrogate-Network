BEGIN;

CREATE TABLE public.recommendation_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  viewer_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_type text NOT NULL CHECK (subject_type IN ('need', 'offer')),
  subject_id uuid NOT NULL,
  event_type text NOT NULL CHECK (event_type IN (
    'impression',
    'open',
    'save',
    'unsave',
    'not_interested',
    'proposal_created',
    'proposal_accepted',
    'exchange_completed',
    'feedback_submitted'
  )),
  feed_session_id text,
  ranking_version text,
  rank_position integer CHECK (rank_position IS NULL OR rank_position >= 0),
  score integer CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX recommendation_events_viewer_time_idx
  ON public.recommendation_events(viewer_user_id, occurred_at DESC);
CREATE INDEX recommendation_events_viewer_subject_idx
  ON public.recommendation_events(viewer_user_id, subject_type, subject_id, occurred_at DESC);
CREATE INDEX recommendation_events_subject_idx
  ON public.recommendation_events(subject_type, subject_id, occurred_at DESC);
CREATE UNIQUE INDEX recommendation_events_impression_session_unique
  ON public.recommendation_events(viewer_user_id, subject_type, subject_id, feed_session_id)
  WHERE event_type = 'impression' AND feed_session_id IS NOT NULL;

ALTER TABLE public.recommendation_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read own recommendation events"
ON public.recommendation_events
FOR SELECT
TO authenticated
USING (viewer_user_id = auth.uid());

CREATE POLICY "Members create own recommendation events"
ON public.recommendation_events
FOR INSERT
TO authenticated
WITH CHECK (
  viewer_user_id = auth.uid()
  AND public.is_active_member(viewer_user_id)
);

REVOKE UPDATE, DELETE ON TABLE public.recommendation_events FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.recommendation_events TO authenticated;
GRANT ALL ON TABLE public.recommendation_events TO service_role, postgres;

COMMIT;
