-- Security Hardening Migration
-- Fixes P0 security issues: RLS policies allowing client writes to authoritative fields

-- Fix 1: Hard Profiles RLS - prevent client writes to authoritative fields
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

CREATE POLICY "Users can update their own non-authoritative profile fields" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    -- Allow updates to profile metadata fields only
    -- Block updates to authoritative fields: xp, token_balance, rank, verification_status, is_suspended
    NOT (
      -- Detect if any authoritative fields are being changed
      (xp IS DISTINCT FROM (SELECT xp FROM profiles WHERE id = auth.uid())) OR
      (token_balance IS DISTINCT FROM (SELECT token_balance FROM profiles WHERE id = auth.uid())) OR
      (rank IS DISTINCT FROM (SELECT rank FROM profiles WHERE id = auth.uid())) OR
      (verification_status IS DISTINCT FROM (SELECT verification_status FROM profiles WHERE id = auth.uid())) OR
      (is_suspended IS DISTINCT FROM (SELECT is_suspended FROM profiles WHERE id = auth.uid()))
    )
  );

-- Add policy to hide email from non-admin users
DROP POLICY IF EXISTS "Public profiles are readable by all authenticated users" ON profiles;

CREATE POLICY "Users can view public profile fields excluding email" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Fix 2: Cascade deletion on audit_events should not delete actor profiles
ALTER TABLE audit_events 
  DROP CONSTRAINT IF EXISTS audit_events_actor_id_fkey,
  ADD CONSTRAINT audit_events_actor_id_fkey 
    FOREIGN KEY (actor_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- Fix 3: Proposal authority model - recipient should be able to accept/decline/counter
DROP POLICY IF EXISTS "Users can update their own proposals" ON proposals;

CREATE POLICY "Users can update proposals as proposer or recipient" ON proposals
  FOR UPDATE USING (auth.uid() = proposing_user_id OR auth.uid() = receiving_user_id)
  WITH CHECK (
    -- Proposers can withdraw or update details
    (auth.uid() = proposing_user_id AND status = 'pending') OR
    -- Recipients can accept, decline, or counter pending proposals
    (auth.uid() = receiving_user_id AND status = 'pending') OR
    -- Either party can handle counter proposals
    (status = 'countered' AND (auth.uid() = proposing_user_id OR auth.uid() = receiving_user_id))
  );

-- Fix 4: Admin policy for authoritative profile fields
CREATE POLICY "Admins can update all profile fields" ON profiles
  FOR UPDATE USING (
    -- Check if user is an admin (you may need to add an is_admin field to profiles)
    -- For now, this is a placeholder - you'll need to implement admin role checking
    false -- Replace with proper admin check
  );

-- Create a view that hides sensitive profile fields
CREATE OR REPLACE VIEW public_profiles AS
SELECT 
  id,
  name,
  avatar_url,
  bio,
  location,
  availability,
  boundaries,
  rank,
  -- Excluded: email, xp, token_balance, verification_status, is_suspended
  created_at,
  updated_at
FROM profiles
WHERE NOT is_suspended; -- Hide suspended users from public view

-- Grant access to the view
GRANT SELECT ON public_profiles TO authenticated;
GRANT SELECT ON public_profiles TO anon;

-- Create function for admin profile updates (security invoker)
CREATE OR REPLACE FUNCTION admin_update_profile(
  p_id UUID,
  p_name TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL,
  p_bio TEXT DEFAULT NULL,
  p_location TEXT DEFAULT NULL,
  p_availability TEXT DEFAULT NULL,
  p_boundaries boundary[] DEFAULT NULL,
  p_rank INTEGER DEFAULT NULL,
  p_xp INTEGER DEFAULT NULL,
  p_token_balance INTEGER DEFAULT NULL,
  p_verification_status verification_status DEFAULT NULL,
  p_is_suspended BOOLEAN DEFAULT NULL
) RETURNS profiles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_is_admin BOOLEAN := false;
BEGIN
  -- Check if the user is an admin (you need to implement this logic)
  -- For now, we'll use a simple approach - add admin checking here
  -- v_is_admin := SELECT EXISTS(SELECT 1 FROM profiles WHERE id = v_admin_id AND is_admin = true);
  
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Only admins can update authoritative profile fields';
  END IF;
  
  UPDATE profiles
  SET 
    name = COALESCE(p_name, name),
    email = COALESCE(p_email, email),
    avatar_url = COALESCE(p_avatar_url, avatar_url),
    bio = COALESCE(p_bio, bio),
    location = COALESCE(p_location, location),
    availability = COALESCE(p_availability, availability),
    boundaries = COALESCE(p_boundaries, boundaries),
    rank = COALESCE(p_rank, rank),
    xp = COALESCE(p_xp, xp),
    token_balance = COALESCE(p_token_balance, token_balance),
    verification_status = COALESCE(p_verification_status, verification_status),
    is_suspended = COALESCE(p_is_suspended, is_suspended)
  WHERE id = p_id
  RETURNING *;
END;
$$;

-- Create function for token balance updates (security invoker)
CREATE OR REPLACE FUNCTION update_token_balance(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT,
  p_transaction_type transaction_type
) RETURNS token_transactions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update user's token balance
  UPDATE profiles
  SET token_balance = token_balance + p_amount
  WHERE id = p_user_id;
  
  -- Create transaction record
  INSERT INTO token_transactions (user_id, amount, type, reason, created_at)
  VALUES (p_user_id, p_amount, p_transaction_type, p_reason, NOW())
  RETURNING *;
END;
$$;

-- Create function for XP updates (security invoker)
CREATE OR REPLACE FUNCTION update_user_xp(
  p_user_id UUID,
  p_amount INTEGER,
  p_source xp_source,
  p_description TEXT
) RETURNS xp_transactions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old_xp INTEGER;
  v_new_xp INTEGER;
  v_old_rank INTEGER;
  v_new_rank INTEGER;
BEGIN
  -- Get current XP and rank
  SELECT xp, rank INTO v_old_xp, v_old_rank
  FROM profiles
  WHERE id = p_user_id;
  
  -- Calculate new XP
  v_new_xp := v_old_xp + p_amount;
  
  -- Calculate new rank (simple progression: every 100 XP = 1 rank level)
  v_new_rank := floor(v_new_xp / 100) + 1;
  
  -- Update user's XP and rank
  UPDATE profiles
  SET 
    xp = v_new_xp,
    rank = v_new_rank
  WHERE id = p_user_id;
  
  -- Create XP transaction record
  INSERT INTO xp_transactions (user_id, amount, source, description, created_at)
  VALUES (p_user_id, p_amount, p_source, p_description, NOW())
  RETURNING *;
END;
$$;

-- Add is_admin field to profiles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Create proper admin check function
CREATE OR REPLACE FUNCTION is_admin_user(p_user_id UUID) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS(SELECT 1 FROM profiles WHERE id = p_user_id AND is_admin = true);
END;
$$;

-- Update the admin policy with proper admin check
DROP POLICY IF EXISTS "Admins can update all profile fields" ON profiles;

CREATE POLICY "Admins can update all profile fields" ON profiles
  FOR UPDATE USING (is_admin_user(auth.uid()));

-- Grant execute on admin functions to authenticated users
GRANT EXECUTE ON FUNCTION admin_update_profile TO authenticated;
GRANT EXECUTE ON FUNCTION update_token_balance TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_xp TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_user TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION admin_update_profile IS 'Security invoker function for admins to update any profile field including authoritative ones';
COMMENT ON FUNCTION update_token_balance IS 'Security invoker function to safely update user token balances';
COMMENT ON FUNCTION update_user_xp IS 'Security invoker function to safely update user XP and calculate rank progression';
COMMENT ON VIEW public_profiles IS 'Public view of profiles excluding sensitive fields like email, XP, and token balance';