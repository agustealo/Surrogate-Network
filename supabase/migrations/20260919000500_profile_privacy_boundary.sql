BEGIN;

-- The original hardening migration accidentally left this broad SELECT policy
-- behind. PostgreSQL RLS is row-level, not column-level, so a policy cannot
-- claim to expose only public fields while still returning a profiles row.
DROP POLICY IF EXISTS "Users can view public profile fields excluding email" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view basic profile information" ON public.profiles;
DROP POLICY IF EXISTS "Users can view public profile fields of other users" ON public.profiles;

-- Private profile rows are self-only through the authenticated Data API.
DROP POLICY IF EXISTS "Users can view their own full profile" ON public.profiles;
CREATE POLICY "Users can view their own full profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Cross-member and anonymous profile reads use a deliberately projected view.
-- The view contains no email, balances, XP, admin/suspension flags, or other
-- private/authoritative columns. As an owner-executed view it can expose these
-- safe columns without reopening the base profiles table.
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_barrier = true)
AS
SELECT
  id,
  name,
  avatar_url,
  bio,
  location,
  availability,
  boundaries,
  rank,
  created_at,
  updated_at
FROM public.profiles
WHERE is_suspended = false;

REVOKE ALL ON public.public_profiles FROM PUBLIC;
GRANT SELECT ON public.public_profiles TO anon, authenticated;

COMMENT ON VIEW public.public_profiles IS
  'Public profile projection. Intentionally excludes email, balances, XP, verification/admin/suspension state, and other private fields.';

COMMIT;
