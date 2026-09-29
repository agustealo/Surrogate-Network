BEGIN;

CREATE POLICY "Active members create own recommendation events"
ON public.audit_events
FOR INSERT
TO authenticated
WITH CHECK (
  actor_id = auth.uid()
  AND public.is_active_member(actor_id)
  AND action IN (
    'fyp.impression',
    'fyp.open',
    'fyp.save',
    'fyp.unsave',
    'fyp.not_interested',
    'fyp.proposal_created',
    'fyp.proposal_accepted',
    'fyp.exchange_completed',
    'fyp.feedback_submitted'
  )
  AND target_type IN ('need', 'offer')
  AND target_id IS NOT NULL
);

COMMIT;
