-- Seed data for development and testing
-- This should only be used in development environments

SET session_replication_role = replica;

-- Insert sample profiles
INSERT INTO profiles (id, name, email, avatar_url, bio, location, availability, boundaries, rank, xp, token_balance, verification_status) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Alice Johnson', 'alice@example.com', 'https://i.pravatar.cc/150?img=1', 'Experienced companion specializing in personal development and meaningful conversations.', 'San Francisco, CA', 'Weekends', ARRAY['platonic'::boundary, 'virtual'::boundary], 3, 1500, 250, 'identity_verified'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Bob Smith', 'bob@example.com', 'https://i.pravatar.cc/150?img=2', 'Business professional looking to expand social connections and share experiences.', 'New York, NY', 'Evenings', ARRAY['platonic'::boundary, 'one-off'::boundary, 'virtual'::boundary], 2, 800, 175, 'email_verified'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Carol Williams', 'carol@example.com', 'https://i.pravatar.cc/150?img=3', 'Creative spirit passionate about art, music, and cultural exchange.', 'Los Angeles, CA', 'Flexible', ARRAY['platonic'::boundary, 'physical'::boundary, 'recurring'::boundary], 4, 2200, 350, 'fully_verified'),
  ('550e8400-e29b-41d4-a716-446655440004', 'David Brown', 'david@example.com', 'https://i.pravatar.cc/150?img=4', 'Tech enthusiast and entrepreneur. Always happy to discuss ideas and collaborate.', 'Seattle, WA', 'Weekdays', ARRAY['platonic'::boundary, 'virtual'::boundary, 'one-off'::boundary], 2, 650, 120, 'phone_verified'),
  ('550e8400-e29b-41d4-a716-446655440005', 'Eva Martinez', 'eva@example.com', 'https://i.pravatar.cc/150?img=5', 'Language teacher and culture lover. Open to diverse interactions.', 'Chicago, IL', 'Flexible', ARRAY['platonic'::boundary, 'virtual'::boundary, 'recurring'::boundary], 3, 1200, 200, 'photo_verified');

-- Insert sample needs
INSERT INTO needs (title, description, category, tags, location_mode, timing, boundaries, urgency, status, user_id, user_name, user_avatar) VALUES
  ('Conversation Partner for Career Advice', 'Looking for someone with tech industry experience to discuss career development and opportunities.', 'utilitarian_business', ARRAY['career', 'tech', 'mentoring'], 'remote', 'Weekend evenings', ARRAY['platonic'::boundary, 'virtual'::boundary], 'medium', 'active', '550e8400-e29b-41d4-a716-446655440002', 'Bob Smith', 'https://i.pravatar.cc/150?img=2'),
  ('Local Guide for Art Galleries', 'New to the area and want to explore local art scene with someone knowledgeable.', 'personal', ARRAY['art', 'culture', 'local'], 'local', 'Weekends', ARRAY['platonic'::boundary, 'physical'::boundary, 'one-off'::boundary], 'low', 'active', '550e8400-e29b-41d4-a716-446655440004', 'David Brown', 'https://i.pravatar.cc/150?img=4'),
  ('Language Exchange Partner', 'Native English speaker looking to practice Spanish. Can help with English in return.', 'casual', ARRAY['language', 'exchange', 'learning'], 'either', 'Flexible', ARRAY['platonic'::boundary, 'virtual'::boundary, 'recurring'::boundary], 'medium', 'active', '550e8400-e29b-41d4-a716-446655440005', 'Eva Martinez', 'https://i.pravatar.cc/150?img=5'),
  ('Business Networking Companion', 'Need someone to accompany me to local tech meetups and networking events.', 'utilitarian_business', ARRAY['networking', 'business', 'professional'], 'local', 'Evenings', ARRAY['platonic'::boundary, 'physical'::boundary, 'one-off'::boundary], 'high', 'active', '550e8400-e29b-41d4-a716-446655440001', 'Alice Johnson', 'https://i.pravatar.cc/150?img=1');

-- Insert sample offers
INSERT INTO offers (title, description, category, location_mode, timing, boundaries, capacity, current_capacity, status, user_id, user_name, user_avatar, rating, review_count) VALUES
  ('Personal Development Coaching', '5 years experience in personal growth coaching. Happy to help with goal setting and life planning.', 'personal', 'remote', 'Flexible', ARRAY['platonic'::boundary, 'virtual'::boundary], 5, 2, 'active', '550e8400-e29b-41d4-a716-446655440001', 'Alice Johnson', 'https://i.pravatar.cc/150?img=1', 4.8, 12),
  ('Business Strategy Discussion', 'Former startup founder available for business idea discussions and strategy sessions.', 'utilitarian_business', 'remote', 'Weekends', ARRAY['platonic'::boundary, 'virtual'::boundary], 3, 1, 'active', '550e8400-e29b-41d4-a716-446655440002', 'Bob Smith', 'https://i.pravatar.cc/150?img=2', 4.5, 8),
  ('Art Gallery Tours', 'Local art enthusiast offering guided tours of neighborhood galleries and museums.', 'personal', 'local', 'Weekends', ARRAY['platonic'::boundary, 'physical'::boundary, 'one-off'::boundary], 4, 3, 'active', '550e8400-e29b-41d4-a716-446655440003', 'Carol Williams', 'https://i.pravatar.cc/150?img=3', 4.9, 15),
  ('Tech Industry Insights', 'Software engineer available for discussions about tech trends, career advice, and coding help.', 'utilitarian_business', 'either', 'Evenings', ARRAY['platonic'::boundary, 'virtual'::boundary], 6, 4, 'active', '550e8400-e29b-41d4-a716-446655440004', 'David Brown', 'https://i.pravatar.cc/150?img=4', 4.6, 9),
  ('Language Practice Sessions', 'Language teacher available for conversation practice in multiple languages.', 'casual', 'remote', 'Flexible', ARRAY['platonic'::boundary, 'virtual'::boundary, 'recurring'::boundary], 8, 6, 'active', '550e8400-e29b-41d4-a716-446655440005', 'Eva Martinez', 'https://i.pravatar.cc/150?img=5', 4.7, 20);

SET session_replication_role = DEFAULT;

-- Insert sample member progression
INSERT INTO member_progression (user_id, current_rank, total_xp, achievements, level) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 3, 1500, ARRAY['early_adopter', 'quality_companion', 'consistent_participant'], 5),
  ('550e8400-e29b-41d4-a716-446655440002', 2, 800, ARRAY['early_adopter'], 3),
  ('550e8400-e29b-41d4-a716-446655440003', 4, 2200, ARRAY['early_adopter', 'quality_companion', 'consistent_participant', 'helpful_community_member'], 7),
  ('550e8400-e29b-41d4-a716-446655440004', 2, 650, ARRAY['early_adopter'], 2),
  ('550e8400-e29b-41d4-a716-446655440005', 3, 1200, ARRAY['early_adopter', 'quality_companion'], 4);

-- Insert sample notifications
INSERT INTO notifications (user_id, type, title, body, data, read) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'proposal', 'New Proposal Received', 'You have received a new proposal for your need "Business Networking Companion"', '{"proposal_id": "123", "from_user": "Bob Smith"}', false),
  ('550e8400-e29b-41d4-a716-446655440002', 'feedback', 'New Feedback Received', 'You have received new feedback from Alice Johnson', '{"feedback_id": "456", "rating": 5}', true),
  ('550e8400-e29b-41d4-a716-446655440003', 'token', 'Tokens Earned', 'You earned 25 tokens for completing an exchange', '{"amount": 25, "reason": "exchange_completion"}', false);