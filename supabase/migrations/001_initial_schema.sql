-- WalkToGive Database Schema
-- This migration creates all necessary tables and Row Level Security policies

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PROFILES TABLE
-- =====================================================
-- Extends auth.users with additional profile information
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    display_name TEXT,
    invite_code TEXT UNIQUE NOT NULL,
    min_reward INTEGER DEFAULT 1 CHECK (min_reward > 0),
    max_reward INTEGER DEFAULT 5 CHECK (max_reward >= min_reward),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can delete their own profile"
    ON public.profiles FOR DELETE
    USING (auth.uid() = id);

-- Function to generate unique invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    result TEXT := 'WALK';
    i INTEGER;
BEGIN
    FOR i IN 1..6 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_invite_code TEXT;
BEGIN
    -- Generate unique invite code
    LOOP
        new_invite_code := generate_invite_code();
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE invite_code = new_invite_code);
    END LOOP;

    INSERT INTO public.profiles (id, display_name, invite_code)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        new_invite_code
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- WORKOUTS TABLE
-- =====================================================
CREATE TABLE public.workouts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, date)
);

CREATE INDEX idx_workouts_user_id ON public.workouts(user_id);
CREATE INDEX idx_workouts_date ON public.workouts(date);
CREATE INDEX idx_workouts_user_date ON public.workouts(user_id, date);

-- RLS Policies for workouts
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own workouts"
    ON public.workouts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view friends' workouts"
    ON public.workouts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.friendships
            WHERE (user_id = auth.uid() AND friend_id = workouts.user_id AND status = 'accepted')
               OR (friend_id = auth.uid() AND user_id = workouts.user_id AND status = 'accepted')
        )
    );

CREATE POLICY "Users can insert their own workouts"
    ON public.workouts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workouts"
    ON public.workouts FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workouts"
    ON public.workouts FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- WEEKLY REWARDS TABLE
-- =====================================================
CREATE TABLE public.weekly_rewards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    week_number INTEGER NOT NULL CHECK (week_number >= 1 AND week_number <= 6),
    amount INTEGER NOT NULL CHECK (amount > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, year, month, week_number)
);

CREATE INDEX idx_weekly_rewards_user_id ON public.weekly_rewards(user_id);

-- RLS Policies for weekly_rewards
ALTER TABLE public.weekly_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own rewards"
    ON public.weekly_rewards FOR SELECT
    USING (auth.uid() = user_id);

-- Weekly rewards are inserted via database function (no direct INSERT policy)

-- =====================================================
-- FRIENDSHIPS TABLE
-- =====================================================
CREATE TABLE public.friendships (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, friend_id),
    CHECK (user_id != friend_id)
);

CREATE INDEX idx_friendships_user_id ON public.friendships(user_id);
CREATE INDEX idx_friendships_friend_id ON public.friendships(friend_id);
CREATE INDEX idx_friendships_status ON public.friendships(status);

-- RLS Policies for friendships
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own friendships"
    ON public.friendships FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friendship requests"
    ON public.friendships FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update friendships they're part of"
    ON public.friendships FOR UPDATE
    USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete their own friendships"
    ON public.friendships FOR DELETE
    USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- =====================================================
-- CHEERS TABLE
-- =====================================================
CREATE TABLE public.cheers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    from_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    to_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    workout_id UUID REFERENCES public.workouts(id) ON DELETE CASCADE,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CHECK (from_user_id != to_user_id)
);

CREATE INDEX idx_cheers_from_user ON public.cheers(from_user_id);
CREATE INDEX idx_cheers_to_user ON public.cheers(to_user_id);

-- RLS Policies for cheers
ALTER TABLE public.cheers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view cheers they sent or received"
    ON public.cheers FOR SELECT
    USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can send cheers to friends"
    ON public.cheers FOR INSERT
    WITH CHECK (
        auth.uid() = from_user_id AND
        EXISTS (
            SELECT 1 FROM public.friendships
            WHERE ((user_id = from_user_id AND friend_id = to_user_id)
                OR (user_id = to_user_id AND friend_id = from_user_id))
              AND status = 'accepted'
        )
    );

-- =====================================================
-- MOVEMENTS TABLE
-- =====================================================
CREATE TABLE public.movements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    charity TEXT NOT NULL,
    creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CHECK (end_date >= start_date)
);

CREATE INDEX idx_movements_creator ON public.movements(creator_id);
CREATE INDEX idx_movements_dates ON public.movements(start_date, end_date);

-- RLS Policies for movements
ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Movements are viewable by everyone"
    ON public.movements FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create movements"
    ON public.movements FOR INSERT
    WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = creator_id);

CREATE POLICY "Creators can update their movements"
    ON public.movements FOR UPDATE
    USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete their movements"
    ON public.movements FOR DELETE
    USING (auth.uid() = creator_id);

-- =====================================================
-- MOVEMENT MEMBERS TABLE
-- =====================================================
CREATE TABLE public.movement_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    movement_id UUID REFERENCES public.movements(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(movement_id, user_id)
);

CREATE INDEX idx_movement_members_movement ON public.movement_members(movement_id);
CREATE INDEX idx_movement_members_user ON public.movement_members(user_id);

-- RLS Policies for movement_members
ALTER TABLE public.movement_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Movement members are viewable by everyone"
    ON public.movement_members FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can join movements"
    ON public.movement_members FOR INSERT
    WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Users can leave movements"
    ON public.movement_members FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- MOVEMENT CONTRIBUTIONS TABLE
-- =====================================================
CREATE TABLE public.movement_contributions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    movement_id UUID REFERENCES public.movements(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    week_key TEXT NOT NULL,
    amount INTEGER NOT NULL CHECK (amount > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_movement_contributions_movement ON public.movement_contributions(movement_id);
CREATE INDEX idx_movement_contributions_user ON public.movement_contributions(user_id);

-- RLS Policies for movement_contributions
ALTER TABLE public.movement_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Movement contributions are viewable by everyone"
    ON public.movement_contributions FOR SELECT
    USING (true);

-- Contributions are added via database function

-- =====================================================
-- BADGES TABLE
-- =====================================================
CREATE TABLE public.badges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    badge_key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    requirement_type TEXT NOT NULL CHECK (requirement_type IN ('days', 'weeks', 'streak', 'earnings', 'movements', 'friends')),
    requirement_value INTEGER NOT NULL CHECK (requirement_value > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies for badges
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Badges are viewable by everyone"
    ON public.badges FOR SELECT
    USING (true);

-- =====================================================
-- USER BADGES TABLE
-- =====================================================
CREATE TABLE public.user_badges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, badge_id)
);

CREATE INDEX idx_user_badges_user ON public.user_badges(user_id);
CREATE INDEX idx_user_badges_badge ON public.user_badges(badge_id);

-- RLS Policies for user_badges
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own badges"
    ON public.user_badges FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view friends' badges"
    ON public.user_badges FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.friendships
            WHERE ((user_id = auth.uid() AND friend_id = user_badges.user_id)
                OR (friend_id = auth.uid() AND user_id = user_badges.user_id))
              AND status = 'accepted'
        )
    );

-- User badges are awarded via database function

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to calculate if a week is complete
CREATE OR REPLACE FUNCTION check_week_completion(
    p_user_id UUID,
    p_year INTEGER,
    p_month INTEGER,
    p_week_number INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    workouts_count INTEGER;
BEGIN
    -- This is simplified - in practice, you'd calculate exact days in the week
    SELECT COUNT(*)
    INTO workouts_count
    FROM public.workouts
    WHERE user_id = p_user_id
      AND completed = true
      AND EXTRACT(YEAR FROM date) = p_year
      AND EXTRACT(MONTH FROM date) = p_month;

    RETURN workouts_count >= 7;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to award weekly reward
CREATE OR REPLACE FUNCTION award_weekly_reward(
    p_user_id UUID,
    p_year INTEGER,
    p_month INTEGER,
    p_week_number INTEGER
)
RETURNS INTEGER AS $$
DECLARE
    reward_amount INTEGER;
    user_min_reward INTEGER;
    user_max_reward INTEGER;
BEGIN
    -- Get user's reward range
    SELECT min_reward, max_reward
    INTO user_min_reward, user_max_reward
    FROM public.profiles
    WHERE id = p_user_id;

    -- Generate random reward in range
    reward_amount := floor(random() * (user_max_reward - user_min_reward + 1) + user_min_reward)::INTEGER;

    -- Insert the reward
    INSERT INTO public.weekly_rewards (user_id, year, month, week_number, amount)
    VALUES (p_user_id, p_year, p_month, p_week_number, reward_amount)
    ON CONFLICT (user_id, year, month, week_number) DO NOTHING;

    RETURN reward_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_friendships_updated_at
    BEFORE UPDATE ON public.friendships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_movements_updated_at
    BEFORE UPDATE ON public.movements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- REALTIME SETUP
-- =====================================================
-- Enable realtime for specific tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.workouts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cheers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.movement_contributions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_badges;
