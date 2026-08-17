-- Core Schema for Surrogate Companion
-- This migration creates the initial database structure with RLS policies

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Custom types
CREATE TYPE boundary AS ENUM ('platonic', 'romantic', 'physical', 'virtual', 'one-off', 'recurring');
CREATE TYPE surrogate_category AS ENUM ('personal', 'utilitarian_business', 'casual');
CREATE TYPE location_mode AS ENUM ('remote', 'local', 'either');
CREATE TYPE urgency AS ENUM ('low', 'medium', 'high');
CREATE TYPE need_status AS ENUM ('active', 'fulfilled', 'paused', 'expired');
CREATE TYPE offer_status AS ENUM ('active', 'paused', 'full');
CREATE TYPE proposal_status AS ENUM ('pending', 'accepted', 'declined', 'countered', 'withdrawn');
CREATE TYPE surrogacy_status AS ENUM ('active', 'paused', 'ended', 'completed');
CREATE TYPE moment_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled', 'missed');
CREATE TYPE exchange_status AS ENUM ('completed', 'partial', 'disputed');
CREATE TYPE media_type AS ENUM ('image', 'video', 'audio', 'document');
CREATE TYPE media_access_level AS ENUM ('public', 'private', 'request_required');
CREATE TYPE media_grant_status AS ENUM ('pending', 'granted', 'denied', 'expired');
CREATE TYPE transaction_type AS ENUM ('earned', 'spent', 'granted', 'penalty');
CREATE TYPE reference_type AS ENUM ('exchange', 'feedback', 'proposal', 'grant', 'penalty');
CREATE TYPE xp_source AS ENUM ('exchange', 'feedback', 'login', 'profile_completion', 'referral', 'achievement');
CREATE TYPE notification_type AS ENUM ('message', 'proposal', 'surrogacy', 'schedule', 'media', 'feedback', 'token', 'rank', 'reward', 'moderation', 'system');
CREATE TYPE report_type AS ENUM ('harassment', 'inappropriate_content', 'boundary_violation', 'spam', 'impersonation', 'other');
CREATE TYPE severity AS ENUM ('low', 'medium', 'high');
CREATE TYPE report_status AS ENUM ('pending', 'investigating', 'resolved', 'dismissed');
CREATE TYPE restriction_type AS ENUM ('suspension', 'temporary_ban', 'feature_restriction', 'posting_ban');
CREATE TYPE verification_status AS ENUM ('unverified', 'email_verified', 'phone_verified', 'photo_verified', 'identity_verified', 'fully_verified');

-- Profiles table (references auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT NOT NULL DEFAULT '',
  location TEXT,
  availability TEXT,
  boundaries boundary[] DEFAULT '{}',
  rank INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  token_balance INTEGER DEFAULT 0,
  verification_status verification_status DEFAULT 'unverified',
  is_suspended BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Needs table
CREATE TABLE needs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category surrogate_category NOT NULL,
  tags TEXT[] DEFAULT '{}',
  location_mode location_mode NOT NULL DEFAULT 'either',
  timing TEXT,
  boundaries boundary[] NOT NULL DEFAULT '{}',
  urgency urgency,
  status need_status DEFAULT 'active',
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Offers table
CREATE TABLE offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category surrogate_category NOT NULL,
  location_mode location_mode NOT NULL DEFAULT 'either',
  timing TEXT,
  boundaries boundary[] NOT NULL DEFAULT '{}',
  capacity INTEGER,
  current_capacity INTEGER DEFAULT 0,
  status offer_status DEFAULT 'active',
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  rating DECIMAL(2,1),
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Proposals table
CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  need_id UUID NOT NULL REFERENCES needs(id) ON DELETE CASCADE,
  offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  proposing_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiving_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  proposed_date TEXT,
  duration TEXT,
  frequency TEXT,
  location_method TEXT,
  message TEXT,
  status proposal_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Surrogacies table
CREATE TABLE surrogacies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  need_id UUID NOT NULL REFERENCES needs(id) ON DELETE CASCADE,
  offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  partner_ids UUID[] NOT NULL,
  status surrogacy_status DEFAULT 'active',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  agreement JSONB
);

-- Surrogacy participants (for many-to-many)
CREATE TABLE surrogacy_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  surrogacy_id UUID NOT NULL REFERENCES surrogacies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'participant',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(surrogacy_id, user_id)
);

-- Moments table
CREATE TABLE moments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  surrogacy_id UUID NOT NULL REFERENCES surrogacies(id) ON DELETE CASCADE,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER NOT NULL,
  status moment_status DEFAULT 'scheduled',
  location TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exchanges table
CREATE TABLE exchanges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  moment_id UUID NOT NULL REFERENCES moments(id) ON DELETE CASCADE,
  surrogacy_id UUID NOT NULL REFERENCES surrogacies(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status exchange_status DEFAULT 'completed'
);

-- Feedback table
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exchange_id UUID NOT NULL REFERENCES exchanges(id) ON DELETE CASCADE,
  surrogacy_id UUID NOT NULL REFERENCES surrogacies(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  breakdown JSONB NOT NULL,
  comments TEXT,
  skill_endorsements TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(from_user_id, exchange_id)
);

-- Media assets table
CREATE TABLE media_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type media_type NOT NULL,
  url TEXT NOT NULL,
  access_level media_access_level DEFAULT 'private',
  alt_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Media access requests table
CREATE TABLE media_access_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  media_id UUID NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status media_grant_status DEFAULT 'pending',
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(media_id, from_user_id)
);

-- Media access grants table
CREATE TABLE media_access_grants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  media_id UUID NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status media_grant_status DEFAULT 'granted',
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(media_id, to_user_id)
);

-- Token transactions table
CREATE TABLE token_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type transaction_type NOT NULL,
  reason TEXT NOT NULL,
  reference_id TEXT,
  reference_type reference_type,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- XP transactions table
CREATE TABLE xp_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  source xp_source NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Member progression table
CREATE TABLE member_progression (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  current_rank INTEGER DEFAULT 1,
  total_xp INTEGER DEFAULT 0,
  achievements TEXT[] DEFAULT '{}',
  level INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reports table
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reported_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reporter_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type report_type NOT NULL,
  severity severity NOT NULL,
  description TEXT NOT NULL,
  status report_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  action_taken TEXT
);

-- Restrictions table
CREATE TABLE restrictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type restriction_type NOT NULL,
  reason TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit events table
CREATE TABLE audit_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_id TEXT,
  target_type TEXT,
  before JSONB,
  after JSONB,
  reason TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE needs ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE surrogacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE surrogacy_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_access_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_progression ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE restrictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Public profiles are readable by all authenticated users" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Needs RLS Policies
CREATE POLICY "Users can view all needs" ON needs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create their own needs" ON needs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own needs" ON needs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own needs" ON needs
  FOR DELETE USING (auth.uid() = user_id);

-- Offers RLS Policies
CREATE POLICY "Users can view all offers" ON offers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create their own offers" ON offers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own offers" ON offers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own offers" ON offers
  FOR DELETE USING (auth.uid() = user_id);

-- Proposals RLS Policies
CREATE POLICY "Users can view their own proposals" ON proposals
  FOR SELECT USING (auth.uid() = proposing_user_id OR auth.uid() = receiving_user_id);

CREATE POLICY "Users can create proposals they're involved in" ON proposals
  FOR INSERT WITH CHECK (auth.uid() = proposing_user_id);

CREATE POLICY "Users can update their own proposals" ON proposals
  FOR UPDATE USING (auth.uid() = proposing_user_id);

-- Surrogacies RLS Policies
CREATE POLICY "Users can view surrogacies they're involved in" ON surrogacies
  FOR SELECT USING (auth.uid() = ANY(partner_ids));

CREATE POLICY "Users can view surrogacy participants they're involved in" ON surrogacy_participants
  FOR SELECT USING (auth.uid() = user_id);

-- Moments RLS Policies
CREATE POLICY "Users can view moments for their surrogacies" ON moments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM surrogacies 
      WHERE surrogacies.id = moments.surrogacy_id 
      AND auth.uid() = ANY(surrogacies.partner_ids)
    )
  );

-- Exchanges RLS Policies
CREATE POLICY "Users can view exchanges for their surrogacies" ON exchanges
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM surrogacies 
      WHERE surrogacies.id = exchanges.surrogacy_id 
      AND auth.uid() = ANY(surrogacies.partner_ids)
    )
  );

-- Feedback RLS Policies
CREATE POLICY "Users can view feedback they're involved in" ON feedback
  FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can create feedback they're the reviewer in" ON feedback
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

-- Media Assets RLS Policies
CREATE POLICY "Users can view their own media" ON media_assets
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can create their own media" ON media_assets
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own media" ON media_assets
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own media" ON media_assets
  FOR DELETE USING (auth.uid() = owner_id);

-- Media Access Requests RLS Policies
CREATE POLICY "Users can view their media requests" ON media_access_requests
  FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can create media requests" ON media_access_requests
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

-- Media Access Grants RLS Policies
CREATE POLICY "Users can view media grants they're involved in" ON media_access_grants
  FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Token Transactions RLS Policies
CREATE POLICY "Users can view their own token transactions" ON token_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- XP Transactions RLS Policies
CREATE POLICY "Users can view their own XP transactions" ON xp_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Member Progression RLS Policies
CREATE POLICY "Users can view their own progression" ON member_progression
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own progression" ON member_progression
  FOR UPDATE USING (auth.uid() = user_id);

-- Notifications RLS Policies
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Reports RLS Policies
CREATE POLICY "Users can view reports they created" ON reports
  FOR SELECT USING (auth.uid() = reporter_user_id);

CREATE POLICY "Users can create reports" ON reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_user_id);

-- Restrictions RLS Policies
CREATE POLICY "Users can view their own restrictions" ON restrictions
  FOR SELECT USING (auth.uid() = user_id);

-- Audit Events RLS Policies
CREATE POLICY "Users can view their own audit events" ON audit_events
  FOR SELECT USING (auth.uid() = actor_id);

-- Create helpful indexes
CREATE INDEX idx_needs_user_id ON needs(user_id);
CREATE INDEX idx_needs_category ON needs(category);
CREATE INDEX idx_needs_status ON needs(status);
CREATE INDEX idx_offers_user_id ON offers(user_id);
CREATE INDEX idx_offers_category ON offers(category);
CREATE INDEX idx_offers_status ON offers(status);
CREATE INDEX idx_proposals_need_id ON proposals(need_id);
CREATE INDEX idx_proposals_offer_id ON proposals(offer_id);
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_surrogacies_partner_ids ON surrogacies USING GIN(partner_ids);
CREATE INDEX idx_surrogacies_status ON surrogacies(status);
CREATE INDEX idx_moments_surrogacy_id ON moments(surrogacy_id);
CREATE INDEX idx_moments_scheduled_time ON moments(scheduled_time);
CREATE INDEX idx_moments_status ON moments(status);
CREATE INDEX idx_feedback_surrogacy_id ON feedback(surrogacy_id);
CREATE INDEX idx_feedback_from_user_id ON feedback(from_user_id);
CREATE INDEX idx_feedback_to_user_id ON feedback(to_user_id);
CREATE INDEX idx_media_assets_owner_id ON media_assets(owner_id);
CREATE INDEX idx_media_access_requests_media_id ON media_access_requests(media_id);
CREATE INDEX idx_media_access_grants_media_id ON media_access_grants(media_id);
CREATE INDEX idx_token_transactions_user_id ON token_transactions(user_id);
CREATE INDEX idx_xp_transactions_user_id ON xp_transactions(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_reports_reported_user_id ON reports(reported_user_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_restrictions_user_id ON restrictions(user_id);
CREATE INDEX idx_audit_events_actor_id ON audit_events(actor_id);
CREATE INDEX idx_audit_events_timestamp ON audit_events(timestamp);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON proposals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_member_progression_updated_at BEFORE UPDATE ON member_progression
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle profile creation from auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, bio)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
    NEW.email,
    ''
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();