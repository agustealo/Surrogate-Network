BEGIN;

CREATE POLICY "Active members restore recommendation interest"
ON public.audit_events
FOR INSERT
TO authenticated
WITH CHECK (
  actor_id = auth.uid()
  AND public.is_active_member(actor_id)
  AND action = 'fyp.restore_interest'
  AND target_type IN ('need', 'offer')
  AND target_id IS NOT NULL
);

COMMIT;
