-- Seed data for WalkToGive
-- This file populates the database with initial badge definitions

-- =====================================================
-- BADGES SEED DATA
-- =====================================================

INSERT INTO public.badges (badge_key, name, description, icon, requirement_type, requirement_value) VALUES
-- Days-based badges
('first_day', 'First Step', 'Complete your first workout', '🌱', 'days', 1),
('month_master', 'Month Master', 'Complete 30 total days', '📅', 'days', 30),
('hundred_club', '100 Club', 'Complete 100 total days', '💯', 'days', 100),
('year_long', 'Year-Long Warrior', 'Complete 365 days', '👑', 'days', 365),

-- Week-based badges
('week_warrior', 'Week Warrior', 'Complete your first full week', '💪', 'weeks', 1),

-- Streak-based badges
('streak_starter', 'Streak Starter', 'Maintain a 3-week streak', '🔥', 'streak', 3),
('consistent_champion', 'Consistent Champion', 'Maintain a 6-week streak', '⭐', 'streak', 6),
('unstoppable', 'Unstoppable Force', 'Maintain a 12-week streak', '🚀', 'streak', 12),

-- Earnings-based badges
('charity_champion', 'Charity Champion', 'Earn $50 for charity', '❤️', 'earnings', 50),
('generous_giver', 'Generous Giver', 'Earn $100 for charity', '🎁', 'earnings', 100),

-- Social badges
('movement_maker', 'Movement Maker', 'Create your first Movement', '🌟', 'movements', 1),
('social_butterfly', 'Social Butterfly', 'Add 5 friends', '🦋', 'friends', 5)

ON CONFLICT (badge_key) DO NOTHING;

-- =====================================================
-- SAMPLE WORKOUT DEFINITIONS (for reference)
-- =====================================================
-- These workout definitions are stored in the frontend code
-- This is just documentation of what workouts are available

/*
Day 1 (Sunday): Mobility & Stretching
- Sun Salutation Flow
- Dynamic Lunges
- Arm Circles & Shoulder Rolls
- Morning Stretch Hold

Day 2 (Monday): Cardio Blast
- Jumping Jacks Pyramid
- High Knees Intervals
- Burpee Challenge
- Cool Down Walk & Breathe

Day 3 (Tuesday): Core Strength
- Plank Variations
- Bicycle Crunches
- Dead Bug Exercise
- Cat-Cow to Child's Pose

Day 4 (Wednesday): Lower Body
- Bodyweight Squat Pyramid
- Reverse Lunges
- Single-Leg Glute Bridges
- Wall Sit Hold

Day 5 (Thursday): Flexibility & Flow
- Hip Mobility Circuit
- Shoulder Mobility Flow
- Yoga Flow Sequence
- Deep Stretching Finale

Day 6 (Friday): Upper Body
- Push-up Variations
- Tricep Dips Ladder
- Plank to Down Dog
- Arm Circles with Resistance

Day 7 (Saturday): Active Recovery
- Gentle Walking Intervals
- Foam Rolling Routine
- Yin Yoga Poses
- Breathing & Meditation
*/
