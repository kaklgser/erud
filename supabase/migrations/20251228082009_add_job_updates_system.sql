/*
  # Job Updates System

  ## Overview
  This migration adds support for job market updates, news, and announcements.
  Admins can create/edit updates with rich metadata stored as JSON.
  Users can browse latest updates on the jobs page.

  ## New Tables

  ### `job_updates`
  Stores job market updates and news:
  - `id` (uuid, primary key)
  - `title` (text) - Update title
  - `description` (text) - Short description
  - `content` (text) - Full content/details
  - `category` (text) - e.g., "market_trend", "hiring_news", "industry_update", "platform_update"
  - `source_platform` (text) - e.g., "LinkedIn", "Indeed", "Naukri", "Manual"
  - `metadata` (jsonb) - Flexible JSON data (tags, links, stats, etc.)
  - `image_url` (text) - Optional image
  - `external_link` (text) - Link to original source
  - `is_featured` (boolean) - Show on homepage
  - `is_active` (boolean) - Published or draft
  - `published_at` (timestamptz) - Publication date
  - `created_by` (uuid, foreign key to auth.users)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - RLS enabled
  - Public read access to active updates
  - Admin-only write access

  ## Indexes
  - Index on `is_active` and `published_at` for fast queries
  - Index on `category` for filtering
*/

-- Create job_updates table
CREATE TABLE IF NOT EXISTS job_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  content text NOT NULL,
  category text NOT NULL DEFAULT 'industry_update',
  source_platform text,
  metadata jsonb DEFAULT '{}'::jsonb,
  image_url text,
  external_link text,
  is_featured boolean DEFAULT false,
  is_active boolean DEFAULT true,
  published_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_updates_active_published ON job_updates(is_active, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_updates_category ON job_updates(category);
CREATE INDEX IF NOT EXISTS idx_job_updates_featured ON job_updates(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_job_updates_source_platform ON job_updates(source_platform);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_job_updates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_job_updates_updated_at_trigger ON job_updates;
CREATE TRIGGER update_job_updates_updated_at_trigger
  BEFORE UPDATE ON job_updates
  FOR EACH ROW
  EXECUTE FUNCTION update_job_updates_updated_at();

-- Enable RLS
ALTER TABLE job_updates ENABLE ROW LEVEL SECURITY;

-- Public read access to active updates
CREATE POLICY "Anyone can view active job updates"
  ON job_updates FOR SELECT
  USING (is_active = true);

-- Admins can view all updates (including drafts)
CREATE POLICY "Admins can view all job updates"
  ON job_updates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role' = 'admin' 
           OR auth.users.raw_app_meta_data->>'role' = 'admin')
    )
  );

-- Admins can insert job updates
CREATE POLICY "Admins can insert job updates"
  ON job_updates FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role' = 'admin' 
           OR auth.users.raw_app_meta_data->>'role' = 'admin')
    )
  );

-- Admins can update job updates
CREATE POLICY "Admins can update job updates"
  ON job_updates FOR UPDATE
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

-- Admins can delete job updates
CREATE POLICY "Admins can delete job updates"
  ON job_updates FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role' = 'admin' 
           OR auth.users.raw_app_meta_data->>'role' = 'admin')
    )
  );