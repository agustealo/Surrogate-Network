-- SC-00.4 Security Fix: Remove authenticated access to security-definer functions
-- This addresses P0-2: SECURITY DEFINER functions should not be executable by normal authenticated clients

-- Revoke authenticated access to sensitive mutation functions
REVOKE EXECUTE ON FUNCTION update_token_balance FROM authenticated;
REVOKE EXECUTE ON FUNCTION update_token_balance FROM anon;
REVOKE EXECUTE ON FUNCTION update_user_xp FROM authenticated;
REVOKE EXECUTE ON FUNCTION update_user_xp FROM anon;
REVOKE EXECUTE ON FUNCTION admin_update_profile FROM authenticated;
REVOKE EXECUTE ON FUNCTION admin_update_profile FROM anon;

-- Only service role should have access to these functions
-- Note: In production, these should be called through server-side commands only
GRANT EXECUTE ON FUNCTION update_token_balance TO postgres;
GRANT EXECUTE ON FUNCTION update_user_xp TO postgres;
GRANT EXECUTE ON FUNCTION admin_update_profile TO postgres;

-- Fix proposal authority RLS - remove generic update capability
DROP POLICY IF EXISTS "Users can update proposals as proposer or recipient" ON proposals;

-- Replace with explicit state transition policies
CREATE POLICY "Proposers can withdraw pending proposals" ON proposals
  FOR UPDATE 
  USING (auth.uid() = proposing_user_id AND status = 'pending')
  WITH CHECK (auth.uid() = proposing_user_id AND status = 'withdrawn');

CREATE POLICY "Recipients can accept pending proposals" ON proposals
  FOR UPDATE 
  USING (auth.uid() = receiving_user_id AND status = 'pending')
  WITH CHECK (auth.uid() = receiving_user_id AND status = 'accepted');

CREATE POLICY "Recipients can decline pending proposals" ON proposals
  FOR UPDATE 
  USING (auth.uid() = receiving_user_id AND status = 'pending')
  WITH CHECK (auth.uid() = receiving_user_id AND status = 'declined');

CREATE POLICY "Both parties can counter pending proposals" ON proposals
  FOR UPDATE 
  USING ((auth.uid() = proposing_user_id OR auth.uid() = receiving_user_id) AND status = 'pending')
  WITH CHECK ((auth.uid() = proposing_user_id OR auth.uid() = receiving_user_id) AND status = 'countered');

-- Fix audit_events.actor_id to be nullable (P0-4 + P1)
ALTER TABLE audit_events 
  ALTER COLUMN actor_id DROP NOT NULL;

-- Fix profile email privacy by removing broad access to profiles table
DROP POLICY IF EXISTS "Public profiles are readable by all authenticated users" ON profiles;

-- Replace with restricted access
CREATE POLICY "Users can view their own full profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view public profile fields of other users" ON profiles
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    auth.uid() != id AND
    -- Only allow viewing public fields
    -- This is enforced through the public_profiles view for safety
    false
  );

-- Make public_profiles the primary access point
GRANT SELECT ON public_profiles TO authenticated;
GRANT SELECT ON public_profiles TO anon;

-- Add admin role verification function
CREATE OR REPLACE FUNCTION verify_admin_role(p_user_id UUID) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS(SELECT 1 FROM profiles WHERE id = p_user_id AND is_admin = true);
END;
$$;

-- Fix admin_update_profile to actually work (P1)
DROP FUNCTION IF EXISTS admin_update_profile(
  p_id UUID,
  p_name TEXT,
  p_email TEXT,
  p_avatar_url TEXT,
  p_bio TEXT,
  p_location TEXT,
  p_availability TEXT,
  p_boundaries boundary[],
  p_rank INTEGER,
  p_xp INTEGER,
  p_token_balance INTEGER,
  p_verification_status verification_status,
  p_is_suspended BOOLEAN
);

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
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_is_admin BOOLEAN := verify_admin_role(v_admin_id);
BEGIN
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

-- Add security comment
COMMENT ON FUNCTION verify_admin_role IS 'Security function to verify admin role - used by security-definer functions';
COMMENT ON FUNCTION admin_update_profile IS 'Security-definer function for admins to update any profile field - calls verify_admin_role for authorization';

-- Create command execution infrastructure table
CREATE TABLE IF NOT EXISTS command_idempotency (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  actor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  command_type TEXT NOT NULL,
  aggregate_id TEXT,
  result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create index on command_idempotency
CREATE INDEX idx_command_idempotency_key ON command_idempotency(key);
CREATE INDEX idx_command_idempotency_actor_id ON command_idempotency(actor_id);
CREATE INDEX idx_command_idempotency_expires_at ON command_idempotency(expires_at);

-- Enable RLS on command_idempotency
ALTER TABLE command_idempotency ENABLE ROW LEVEL SECURITY;

-- RLS policies for command_idempotency
CREATE POLICY "Users can view their own command history" ON command_idempotency
  FOR SELECT USING (auth.uid() = actor_id);

CREATE POLICY "Users can create their own commands" ON command_idempotency
  FOR INSERT WITH CHECK (auth.uid() = actor_id);

-- Create outbox events table
CREATE TABLE IF NOT EXISTS outbox_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  aggregate_type TEXT NOT NULL,
  aggregate_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  attempt_count INTEGER DEFAULT 0,
  last_error TEXT,
  processing_until TIMESTAMP WITH TIME ZONE
);

-- Create indexes for outbox events
CREATE INDEX idx_outbox_events_processed ON outbox_events(processed_at) WHERE processed_at IS NULL;
CREATE INDEX idx_outbox_events_aggregate ON outbox_events(aggregate_type, aggregate_id);
CREATE INDEX idx_outbox_events_event_type ON outbox_events(event_type);

-- Enable RLS on outbox_events
ALTER TABLE outbox_events ENABLE ROW LEVEL SECURITY;

-- Only system processes should interact with outbox
CREATE POLICY "System processes can access outbox events" ON outbox_events
  FOR ALL USING (false);

-- Add helpful comments
COMMENT ON TABLE command_idempotency IS 'Idempotency tracking for commands to prevent duplicate processing';
COMMENT ON TABLE outbox_events IS 'Event outbox pattern for reliable event delivery';

-- Clean up expired idempotency entries periodically
CREATE OR REPLACE FUNCTION cleanup_expired_idempotency() RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM command_idempotency 
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION cleanup_expired_idempotency IS 'Cleanup function for expired idempotency entries - should be called periodically';