-- Odds Locking Migration
-- Generated: 2026-03-20
-- Description: Add locked_odds column to user_picks for accurate profit calculation

-- ============================================
-- PART 1: ODDS LOCKING SYSTEM
-- ============================================

-- Add lockedOdds column to user_picks table
ALTER TABLE user_picks 
ADD COLUMN IF NOT EXISTS locked_odds TEXT;

-- Add comment for documentation
COMMENT ON COLUMN user_picks.locked_odds IS 'American odds locked at pick submission time (e.g., "+200", "-150"). Used for accurate profit calculation regardless of odds movement.';

-- Create index for faster odds-based queries (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_user_picks_locked_odds 
ON user_picks(locked_odds);

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
