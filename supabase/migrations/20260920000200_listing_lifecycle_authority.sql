BEGIN;

-- Needs and Offers anchor Proposals and Surrogacies. Member hard-delete would
-- cascade through relationship history, so trial members may never delete these
-- records directly. Lifecycle closure is a state transition, not data erasure.
REVOKE DELETE ON TABLE public.needs FROM PUBLIC, anon, authenticated;
REVOKE DELETE ON TABLE public.offers FROM PUBLIC, anon, authenticated;

-- Need lifecycle states such as fulfilled/expired are authoritative. Creation
-- gets the database default ('active'); member edits are descriptive only.
REVOKE INSERT, UPDATE ON TABLE public.needs FROM anon, authenticated;
GRANT INSERT (
  title, description, category, tags, location_mode, timing, boundaries, urgency,
  user_id, user_name, user_avatar, expires_at
) ON TABLE public.needs TO authenticated;
GRANT UPDATE (
  title, description, category, tags, location_mode, timing, boundaries, urgency,
  user_name, user_avatar, expires_at
) ON TABLE public.needs TO authenticated;

-- Reassert the Offer write surface so this migration is a complete declaration
-- of member-owned listing fields. Database defaults own status/utilization and
-- feedback owns reputation.
REVOKE INSERT, UPDATE ON TABLE public.offers FROM anon, authenticated;
GRANT INSERT (
  title, description, category, location_mode, timing, boundaries, capacity,
  user_id, user_name, user_avatar
) ON TABLE public.offers TO authenticated;
GRANT UPDATE (
  title, description, category, location_mode, timing, boundaries, capacity,
  user_name, user_avatar
) ON TABLE public.offers TO authenticated;

COMMIT;
