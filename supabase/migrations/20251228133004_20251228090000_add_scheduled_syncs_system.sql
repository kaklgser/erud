/*
  # Add Scheduled Syncs System

  1. New Tables
    - `apify_scheduled_syncs`
      - `id` (uuid, primary key)
      - `config_id` (uuid, foreign key to job_fetch_configs)
      - `schedule_name` (text, e.g., "Weekly Monday Sync")
      - `cron_expression` (text, e.g., "0 9 * * 1" for every Monday at 9 AM)
      - `timezone` (text, default 'UTC')
      - `is_active` (boolean, default true)
      - `next_run_at` (timestamptz, calculated from cron)
      - `last_run_at` (timestamptz, nullable)
      - `created_at` (timestamptz)
      - `created_by` (uuid, foreign key to users)

  2. Security
    - Enable RLS on `apify_scheduled_syncs` table
    - Add policy for admins to manage scheduled syncs

  3. Enhancements
    - Add duration_seconds to job_sync_logs for performance tracking
    - Create view for sync performance metrics
*/

-- Create scheduled syncs table
CREATE TABLE IF NOT EXISTS apify_scheduled_syncs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id uuid NOT NULL REFERENCES job_fetch_configs(id) ON DELETE CASCADE,
  schedule_name text NOT NULL,
  cron_expression text NOT NULL,
  timezone text DEFAULT 'UTC',
  is_active boolean DEFAULT true,
  next_run_at timestamptz,
  last_run_at timestamptz,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  CONSTRAINT valid_cron CHECK (cron_expression ~ '^[0-9*,/-]+ [0-9*,/-]+ [0-9*,/-]+ [0-9*,/-]+ [0-9*,/-]+$')
);

-- Enable RLS
ALTER TABLE apify_scheduled_syncs ENABLE ROW LEVEL SECURITY;

-- Admin policies for scheduled syncs
CREATE POLICY "Admins can view scheduled syncs"
  ON apify_scheduled_syncs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert scheduled syncs"
  ON apify_scheduled_syncs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update scheduled syncs"
  ON apify_scheduled_syncs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete scheduled syncs"
  ON apify_scheduled_syncs FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_scheduled_syncs_next_run ON apify_scheduled_syncs(next_run_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_scheduled_syncs_config ON apify_scheduled_syncs(config_id);

-- Add duration_seconds column to job_sync_logs for trend analysis
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'job_sync_logs' AND column_name = 'duration_seconds'
  ) THEN
    ALTER TABLE job_sync_logs ADD COLUMN duration_seconds integer;
  END IF;
END $$;

-- Create view for sync performance metrics
CREATE OR REPLACE VIEW apify_sync_metrics AS
SELECT
  jsc.platform_name,
  jsc.id as config_id,
  COUNT(jsl.id) as total_syncs,
  COUNT(CASE WHEN jsl.status = 'success' THEN 1 END) as successful_syncs,
  COUNT(CASE WHEN jsl.status = 'failed' THEN 1 END) as failed_syncs,
  ROUND(AVG(jsl.jobs_fetched), 2) as avg_jobs_fetched,
  ROUND(AVG(jsl.jobs_created), 2) as avg_jobs_created,
  ROUND(AVG(jsl.duration_seconds), 2) as avg_duration_seconds,
  MAX(jsl.created_at) as last_sync_at
FROM job_fetch_configs jsc
LEFT JOIN job_sync_logs jsl ON jsc.id = jsl.config_id
WHERE jsl.created_at >= now() - interval '30 days'
GROUP BY jsc.platform_name, jsc.id;

-- Grant access to view
GRANT SELECT ON apify_sync_metrics TO authenticated;