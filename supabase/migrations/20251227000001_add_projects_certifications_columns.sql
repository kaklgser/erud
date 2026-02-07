/*
  # Add projects_details and certifications_details columns to user_profiles

  1. New Columns
    - `projects_details` (jsonb) - Structured projects information
    - `certifications_details` (jsonb) - Structured certifications information

  2. Purpose
    - Enable storing user's projects and certifications in their profile
    - Support profile management feature for resume optimization
*/

-- Add projects_details column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'projects_details'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN projects_details jsonb;
  END IF;
END $$;

-- Add certifications_details column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'certifications_details'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN certifications_details jsonb;
  END IF;
END $$;

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS user_profiles_projects_idx ON user_profiles USING gin(projects_details);
CREATE INDEX IF NOT EXISTS user_profiles_certifications_idx ON user_profiles USING gin(certifications_details);
