-- Confidence Flag System + Raffle Pool Migration
-- Generated: 2026-03-20
-- Description: Add confidence flags to picks, flag tracking to users, and raffle pool tables

-- ============================================
-- PART 1: CONFIDENCE FLAG SYSTEM
-- ============================================

-- Add confidenceFlag column to user_picks table
ALTER TABLE user_picks 
ADD COLUMN IF NOT EXISTS confidence_flag TEXT NOT NULL DEFAULT 'none',
ADD CONSTRAINT check_confidence_flag CHECK (confidence_flag IN ('none', 'yellow', 'red', 'green'));

-- Add index for filtering by confidence flag (performance optimization)
CREATE INDEX IF NOT EXISTS idx_user_picks_confidence_flag 
ON user_picks(confidence_flag);

-- Create composite index for ranking calculations (userId + fightId + confidenceFlag)
CREATE INDEX IF NOT EXISTS idx_user_picks_confidence_lookup 
ON user_picks(user_id, fight_id, confidence_flag) WHERE confidence_flag IN ('none', 'green');

-- ============================================
-- PART 2: USER EVENT STATS TRACKING
-- ============================================

-- Add flag tracking columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS yellow_red_flags_used INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS flag_budget INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_event_id UUID REFERENCES events(id),
ADD COLUMN IF NOT EXISTS last_flag_reset_at TIMESTAMP DEFAULT NULL;

-- Add indexes for flag tracking
CREATE INDEX IF NOT EXISTS idx_users_current_event 
ON users(current_event_id) WHERE current_event_id IS NOT NULL;

-- ============================================
-- PART 3: RAFFLE POOL SYSTEM
-- ============================================

-- Create raffle_pool table for subscriber contributions
CREATE TABLE IF NOT EXISTS raffle_pool (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contribution_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- Create index for efficient raffle pool queries
CREATE INDEX IF NOT EXISTS idx_raffle_pool_event 
ON raffle_pool(event_id);

-- Create index for user lookup
CREATE INDEX IF NOT EXISTS idx_raffle_pool_user 
ON raffle_pool(user_id);

-- Create raffle_draws table for winner selection
CREATE TABLE IF NOT EXISTS raffle_draws (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    winner_user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pool_total DECIMAL(10, 2) NOT NULL,
    total_tickets INTEGER NOT NULL,
    drawn_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notified BOOLEAN NOT NULL DEFAULT FALSE
);

-- Create index for event lookup
CREATE INDEX IF NOT EXISTS idx_raffle_draws_event 
ON raffle_draws(event_id);

-- Create index for winner lookup
CREATE INDEX IF NOT EXISTS idx_raffle_draws_winner 
ON raffle_draws(winner_user_id);

-- ============================================
-- PART 4: KEY SYSTEM COMPLETION
-- ============================================

-- Add prize alert tracking to user_keys table
ALTER TABLE user_keys 
ADD COLUMN IF NOT EXISTS prize_claimed BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS prize_amount DECIMAL(10, 2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS admin_notified_at TIMESTAMP DEFAULT NULL;

-- Add index for unclaimed keys
CREATE INDEX IF NOT EXISTS idx_user_keys_unclaimed 
ON user_keys(prize_claimed) WHERE prize_claimed = FALSE;

-- ============================================
-- PART 5: COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON COLUMN user_picks.confidence_flag IS 'Confidence flag: none=standard pick, yellow=caution, red=not on record, green=high confidence. Only none+green count toward ranking/stars.';
COMMENT ON COLUMN users.yellow_red_flags_used IS 'Combined count of yellow and red flags used in current event';
COMMENT ON COLUMN users.flag_budget IS 'Maximum yellow+red flags allowed for current event based on participation formula';
COMMENT ON COLUMN users.current_event_id IS 'Reference to current active event for flag tracking';
COMMENT ON TABLE raffle_pool IS 'Tracks subscriber contributions to event raffle pools. $0.50 default per subscriber per event.';
COMMENT ON TABLE raffle_draws IS 'Records raffle draw results when event closes. Admin handles payout manually.';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
