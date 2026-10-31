BEGIN;

-- The explicit Data API privilege migration revoked inherited audit_events
-- INSERT access. The RLS recommendation-event policies remain authoritative,
-- but require this narrow column grant to accept member-owned FYP events.
-- All server-owned audit metadata and identifiers remain database-owned.
GRANT INSERT (
  action,
  actor_id,
  target_type,
  target_id,
  reason,
  after
) ON TABLE public.audit_events TO authenticated;

DO $$
BEGIN
  IF NOT has_column_privilege('authenticated', 'public.audit_events', 'action', 'INSERT')
    OR NOT has_column_privilege('authenticated', 'public.audit_events', 'actor_id', 'INSERT')
    OR NOT has_column_privilege('authenticated', 'public.audit_events', 'after', 'INSERT')
    OR has_column_privilege('authenticated', 'public.audit_events', 'id', 'INSERT')
    OR has_column_privilege('authenticated', 'public.audit_events', 'before', 'INSERT')
    OR has_column_privilege('authenticated', 'public.audit_events', 'timestamp', 'INSERT')
    OR has_table_privilege('anon', 'public.audit_events', 'INSERT') THEN
    RAISE EXCEPTION 'FYP audit event Data API grant contract is invalid';
  END IF;
END;
$$;

COMMIT;
