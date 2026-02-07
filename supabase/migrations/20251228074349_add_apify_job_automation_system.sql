/*
  # Apify Job Automation System

  ## Overview
  This migration adds comprehensive support for automated job fetching from Apify.
  It enables admins to configure multiple job platforms, store API credentials,
  and automatically sync job listings every 8 hours.

  ## New Tables

  ### 1. `job_fetch_configs`
  Stores configuration for each job platform connected via Apify.
  - `id` (uuid, primary key)
  - `platform_name` (text) - e.g., "LinkedIn", "Indeed", "Naukri"
  - `apify_api_token` (text, encrypted) - API token for Apify
  - `actor_id` (text) - Apify actor ID for this platform
  - `search_config` (jsonb) - Search parameters (keywords, location, etc.)
  - `is_active` (boolean) - Whether this config is currently active
  - `sync_frequency_hours` (integer) - How often to sync (default 8)
  - `last_sync_at` (timestamptz) - Last successful sync timestamp
  - `created_by` (uuid, foreign key to auth.users)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `job_sync_logs`
  Audit trail for all job sync operations.
  - `id` (uuid, primary key)
  - `config_id` (uuid, foreign key to job_fetch_configs)
  - `platform_name` (text)
  - `sync_started_at` (timestamptz)
  - `sync_completed_at` (timestamptz)
  - `status` (text) - "success", "failed", "partial"
  - `jobs_fetched` (integer) - Total jobs fetched from Apify
  - `jobs_created` (integer) - New jobs created
  - `jobs_updated` (integer) - Existing jobs updated
  - `jobs_skipped` (integer) - Duplicate jobs skipped
  - `error_message` (text) - Error details if failed
  - `sync_metadata` (jsonb) - Additional sync details
  - `created_at` (timestamptz)

  ## Table Alterations

  ### `job_listings`
  - Add `apify_job_id` (text, unique) - External ID from Apify
  - Add `source_platform` (text) - e.g., "LinkedIn", "Indeed"
  - Add `last_synced_at` (timestamptz) - Last update from Apify

  ## Security
  - All tables have RLS enabled
  - Only admins can read/write job_fetch_configs
  - Only admins can read job_sync_logs
  - job_listings policies remain unchanged (existing RLS)

  ## Indexes
  - Index on `apify_job_id` for fast lookups
  - Index on `source_platform` for filtering
  - Index on `last_synced_at` for sync queries
*/

-- Create job_fetch_configs table
CREATE TABLE IF NOT EXISTS job_fetch_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_name text NOT NULL,
  apify_api_token text NOT NULL,
  actor_id text NOT NULL,
  search_config jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  sync_frequency_hours integer DEFAULT 8,
  last_sync_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create job_sync_logs table
CREATE TABLE IF NOT EXISTS job_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id uuid REFERENCES job_fetch_configs(id) ON DELETE CASCADE,
  platform_name text NOT NULL,
  sync_started_at timestamptz NOT NULL DEFAULT now(),
  sync_completed_at timestamptz,
  status text NOT NULL DEFAULT 'running',
  jobs_fetched integer DEFAULT 0,
  jobs_created integer DEFAULT 0,
  jobs_updated integer DEFAULT 0,
  jobs_skipped integer DEFAULT 0,
  error_message text,
  sync_metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Alter job_listings table to add Apify-related columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'job_listings' AND column_name = 'apify_job_id'
  ) THEN
    ALTER TABLE job_listings ADD COLUMN apify_job_id text UNIQUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'job_listings' AND column_name = 'source_platform'
  ) THEN
    ALTER TABLE job_listings ADD COLUMN source_platform text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'job_listings' AND column_name = 'last_synced_at'
  ) THEN
    ALTER TABLE job_listings ADD COLUMN last_synced_at timestamptz;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_listings_apify_job_id ON job_listings(apify_job_id);
CREATE INDEX IF NOT EXISTS idx_job_listings_source_platform ON job_listings(source_platform);
CREATE INDEX IF NOT EXISTS idx_job_listings_last_synced_at ON job_listings(last_synced_at);
CREATE INDEX IF NOT EXISTS idx_job_fetch_configs_is_active ON job_fetch_configs(is_active);
CREATE INDEX IF NOT EXISTS idx_job_sync_logs_config_id ON job_sync_logs(config_id);
CREATE INDEX IF NOT EXISTS idx_job_sync_logs_created_at ON job_sync_logs(created_at DESC);

-- Add updated_at trigger for job_fetch_configs
CREATE OR REPLACE FUNCTION update_job_fetch_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_job_fetch_configs_updated_at_trigger ON job_fetch_configs;
CREATE TRIGGER update_job_fetch_configs_updated_at_trigger
  BEFORE UPDATE ON job_fetch_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_job_fetch_configs_updated_at();

-- Enable RLS on new tables
ALTER TABLE job_fetch_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for job_fetch_configs (admin-only access)
CREATE POLICY "Admins can view all job fetch configs"
  ON job_fetch_configs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role' = 'admin' 
           OR auth.users.raw_app_meta_data->>'role' = 'admin')
    )
  );

CREATE POLICY "Admins can insert job fetch configs"
  ON job_fetch_configs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role' = 'admin' 
           OR auth.users.raw_app_meta_data->>'role' = 'admin')
    )
  );

CREATE POLICY "Admins can update job fetch configs"
  ON job_fetch_configs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role' = 'admin' 
           OR auth.users.raw_app_meta_data->>'role' = 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role' = 'admin' 
           OR auth.users.raw_app_meta_data->>'role' = 'admin')
    )
  );

CREATE POLICY "Admins can delete job fetch configs"
  ON job_fetch_configs FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role' = 'admin' 
           OR auth.users.raw_app_meta_data->>'role' = 'admin')
    )
  );

-- RLS Policies for job_sync_logs (admin read-only)
CREATE POLICY "Admins can view all job sync logs"
  ON job_sync_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role' = 'admin' 
           OR auth.users.raw_app_meta_data->>'role' = 'admin')
    )
  );

-- Service role can insert sync logs (for edge functions)
CREATE POLICY "Service role can insert sync logs"
  ON job_sync_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update sync logs"
  ON job_sync_logs FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);