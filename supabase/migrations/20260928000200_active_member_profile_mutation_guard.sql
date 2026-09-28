BEGIN;

-- Direct profile edits are allowed only for active authenticated members.
-- Column grants decide which profile fields a member may edit; this policy
-- independently prevents a stale session from mutating a deactivated or
-- deleted account after account-state authority has changed.
DROP POLICY IF EXISTS "Active members can update their own profile" ON public.profiles;

CREATE POLICY "Active members can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  auth.uid() = id
  AND public.is_active_member(auth.uid())
)
WITH CHECK (
  auth.uid() = id
  AND public.is_active_member(auth.uid())
);

COMMIT;
