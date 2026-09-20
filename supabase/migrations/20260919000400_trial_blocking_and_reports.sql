BEGIN;

CREATE TABLE IF NOT EXISTS public.blocks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT blocks_distinct_users CHECK (blocker_user_id <> blocked_user_id),
  CONSTRAINT blocks_unique_pair UNIQUE (blocker_user_id, blocked_user_id)
);

CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON public.blocks(blocker_user_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON public.blocks(blocked_user_id);

ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members manage their own blocks" ON public.blocks;
CREATE POLICY "Members manage their own blocks"
ON public.blocks
FOR ALL
TO authenticated
USING (auth.uid() = blocker_user_id)
WITH CHECK (auth.uid() = blocker_user_id);

CREATE OR REPLACE FUNCTION public.are_users_blocked(p_user_a uuid, p_user_b uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT CASE
    WHEN p_user_a IS NULL OR p_user_b IS NULL OR p_user_a = p_user_b THEN false
    ELSE EXISTS (
      SELECT 1
      FROM public.blocks
      WHERE (blocker_user_id = p_user_a AND blocked_user_id = p_user_b)
         OR (blocker_user_id = p_user_b AND blocked_user_id = p_user_a)
    )
  END;
$$;
REVOKE EXECUTE ON FUNCTION public.are_users_blocked(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.are_users_blocked(uuid, uuid) TO authenticated, service_role, postgres;

-- Blocked members must not continue discovering one another through the normal
-- authenticated data plane. Service-role moderation remains able to inspect all
-- records after the human admin has been authorized by the console boundary.
DROP POLICY IF EXISTS "Blocked profile visibility" ON public.profiles;
CREATE POLICY "Blocked profile visibility"
ON public.profiles AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (id = auth.uid() OR NOT public.are_users_blocked(auth.uid(), id));

DROP POLICY IF EXISTS "Blocked Need visibility" ON public.needs;
CREATE POLICY "Blocked Need visibility"
ON public.needs AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR NOT public.are_users_blocked(auth.uid(), user_id));

DROP POLICY IF EXISTS "Blocked Offer visibility" ON public.offers;
CREATE POLICY "Blocked Offer visibility"
ON public.offers AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR NOT public.are_users_blocked(auth.uid(), user_id));

-- Rebuild proposal creation so a block in either direction makes a new pairing
-- impossible even for direct Data API callers.
DROP POLICY IF EXISTS "Users can create valid proposals" ON public.proposals;
CREATE POLICY "Users can create valid proposals"
ON public.proposals
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = proposing_user_id
  AND status = 'pending'
  AND countered_by_user_id IS NULL
  AND proposing_user_id <> receiving_user_id
  AND NOT public.are_users_blocked(proposing_user_id, receiving_user_id)
  AND EXISTS (
    SELECT 1
    FROM public.needs n
    JOIN public.offers o ON o.id = offer_id
    WHERE n.id = need_id
      AND n.status = 'active'
      AND o.status = 'active'
      AND n.user_id <> o.user_id
      AND (
        (n.user_id = auth.uid() AND o.user_id = receiving_user_id)
        OR
        (o.user_id = auth.uid() AND n.user_id = receiving_user_id)
      )
  )
);

-- Reports are immutable evidence for members. They may create and read their
-- own reports, but only the administrative data plane may change workflow state
-- or resolution fields.
REVOKE UPDATE, DELETE ON TABLE public.reports FROM PUBLIC, anon, authenticated;

-- Prevent self-report spam at the database boundary and require an active
-- reporter account. A member can still report any other visible account,
-- including after a relationship problem.
DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
CREATE POLICY "Active members can create reports"
ON public.reports
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = reporter_user_id
  AND reporter_user_id <> reported_user_id
  AND public.is_active_member(reporter_user_id)
);

COMMIT;
