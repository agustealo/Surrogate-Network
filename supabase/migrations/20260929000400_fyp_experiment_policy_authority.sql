-- Governed FYP experiment policy authority.
-- Policy changes are immutable audit events. Members may read only the policy
-- events needed to resolve assignment; only active admins may create them.

CREATE INDEX IF NOT EXISTS idx_audit_events_fyp_policy
  ON public.audit_events (action, timestamp DESC)
  WHERE action = 'fyp.experiment_policy';

DROP POLICY IF EXISTS "Authenticated users can read FYP experiment policy" ON public.audit_events;
CREATE POLICY "Authenticated users can read FYP experiment policy"
  ON public.audit_events
  FOR SELECT
  TO authenticated
  USING (action = 'fyp.experiment_policy');

DROP POLICY IF EXISTS "Admins can create FYP experiment policy" ON public.audit_events;
CREATE POLICY "Admins can create FYP experiment policy"
  ON public.audit_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    action = 'fyp.experiment_policy'
    AND actor_id = (SELECT auth.uid())
    AND public.is_admin_user((SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Admins can evaluate recommendation audit evidence" ON public.audit_events;
CREATE POLICY "Admins can evaluate recommendation audit evidence"
  ON public.audit_events
  FOR SELECT
  TO authenticated
  USING (public.is_admin_user((SELECT auth.uid())));
