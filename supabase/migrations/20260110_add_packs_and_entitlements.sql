-- Migration: Add Emergency Pack and Court Certification support
-- Date: 2026-01-10
-- Description: Adds columns for one-time packs that stack with subscriptions

-- Emergency Pack columns
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS emergency_credits INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS has_emergency_pack BOOLEAN DEFAULT FALSE;

-- Court Certification columns
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS has_court_certification BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS court_certified_at TIMESTAMPTZ;

-- Plan tracking (if not exists)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'starter',
ADD COLUMN IF NOT EXISTS plan_updated_at TIMESTAMPTZ;

-- Entitlements JSON for future flexibility
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS entitlements JSONB DEFAULT '{}';

-- Function to grant Emergency Pack (stackable - adds 10 credits each time)
CREATE OR REPLACE FUNCTION grant_emergency_pack(user_id_input UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET
    emergency_credits = COALESCE(emergency_credits, 0) + 10,
    has_emergency_pack = TRUE
  WHERE id = user_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to use emergency credits
CREATE OR REPLACE FUNCTION use_emergency_credit(user_id_input UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_credits INT;
BEGIN
  SELECT emergency_credits INTO current_credits
  FROM profiles
  WHERE id = user_id_input;
  
  IF current_credits > 0 THEN
    UPDATE profiles
    SET emergency_credits = emergency_credits - 1
    WHERE id = user_id_input;
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON profiles(plan);
CREATE INDEX IF NOT EXISTS idx_profiles_has_court_certification ON profiles(has_court_certification);
CREATE INDEX IF NOT EXISTS idx_profiles_has_emergency_pack ON profiles(has_emergency_pack);

-- Comment for documentation
COMMENT ON COLUMN profiles.emergency_credits IS 'Number of emergency recording credits remaining (stackable, purchased via Emergency Pack)';
COMMENT ON COLUMN profiles.has_emergency_pack IS 'Whether user has ever purchased an Emergency Pack';
COMMENT ON COLUMN profiles.has_court_certification IS 'Whether user has court-ready PDF generation capability';
COMMENT ON COLUMN profiles.court_certified_at IS 'When court certification was granted';
COMMENT ON COLUMN profiles.entitlements IS 'JSON object of feature flags and capabilities';
