/*
  # Complete Job System - Tables, Functions, Automation

  This migration creates all job-related tables that were previously missing:

  1. New Tables
    - `job_listings` - Main job listings with skills, referral, and sync columns
    - `optimized_resumes` - User-optimized resumes for specific jobs
    - `manual_apply_logs` - Manual application tracking
    - `auto_apply_logs` - Auto-apply tracking
    - `job_fetch_configs` - Apify scraper configs for automated job syncing
    - `job_sync_logs` - Audit trail for sync operations
    - `job_notification_subscriptions` - User digest subscription preferences
    - `job_notification_logs` - Track which jobs were sent to which users
    - `email_logs` - Email sending audit log
    - `email_preferences` - User email preference settings
    - `job_updates` - Admin-managed job market news/updates
    - `apify_scheduled_syncs` - Scheduled sync configurations

  2. Functions
    - `is_current_user_admin()` - Check if current user is admin
    - `get_jobs_for_daily_digest(uuid)` - Get unsent matching jobs for a user
    - `log_notification_send(uuid, uuid, text, text)` - Log notification delivery
    - `update_subscription_last_sent(uuid)` - Update last sent timestamp
    - `extract_skills_from_text(text)` - Extract skills from job descriptions
    - Commission and referral triggers on job_listings

  3. Security
    - RLS enabled on ALL tables
    - Admin-only policies for config and sync tables
    - User-scoped policies for personal data
    - Public read for active job listings and updates

  4. Automation
    - pg_cron jobs for automatic sync (every 8 hours) and digest processing (every 8 hours)
    - Uses pg_net to call edge functions on schedule

  5. Important Notes
    - Also adds missing columns to user_profiles (role, phone, resumes_created_count)
    - Creates profile creation trigger on auth.users
*/

-- ============================================================================
-- PREREQUISITES: Ensure user_profiles has required columns
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN role text DEFAULT 'client' NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN phone text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'resumes_created_count'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN resumes_created_count integer DEFAULT 0 NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS user_profiles_role_idx ON user_profiles(role);

-- Admin check function
CREATE OR REPLACE FUNCTION is_current_user_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION is_current_user_admin() TO authenticated;

-- ============================================================================
-- JOB LISTINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS job_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  company_logo_url text,
  company_website text,
  company_description text,
  role_title text NOT NULL,
  package_amount integer,
  package_type text CHECK (package_type IN ('CTC', 'stipend', 'hourly')),
  domain text NOT NULL,
  location_type text NOT NULL CHECK (location_type IN ('Remote', 'Onsite', 'Hybrid')),
  location_city text,
  experience_required text NOT NULL,
  qualification text NOT NULL,
  eligible_years text,
  short_description text NOT NULL,
  description text NOT NULL,
  full_description text NOT NULL,
  application_link text NOT NULL,
  posted_date timestamptz DEFAULT now() NOT NULL,
  source_api text DEFAULT 'manual' NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  skills jsonb DEFAULT '[]'::jsonb,
  referral_person_name text,
  referral_email text,
  referral_code text,
  referral_link text,
  referral_bonus_amount numeric(10, 2),
  referral_terms text,
  has_referral boolean DEFAULT false,
  commission_percentage numeric(5, 2) DEFAULT 0,
  test_requirements text,
  has_coding_test boolean DEFAULT false,
  has_aptitude_test boolean DEFAULT false,
  has_technical_interview boolean DEFAULT false,
  has_hr_interview boolean DEFAULT false,
  test_duration_minutes integer,
  ai_polished boolean DEFAULT false,
  ai_polished_at timestamptz,
  original_description text,
  apify_job_id text UNIQUE,
  source_platform text,
  last_synced_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE job_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active job listings"
  ON job_listings FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage all job listings"
  ON job_listings FOR ALL TO authenticated
  USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());

CREATE INDEX IF NOT EXISTS idx_job_listings_domain ON job_listings(domain);
CREATE INDEX IF NOT EXISTS idx_job_listings_location ON job_listings(location_type);
CREATE INDEX IF NOT EXISTS idx_job_listings_active ON job_listings(is_active, posted_date DESC);
CREATE INDEX IF NOT EXISTS idx_job_listings_skills ON job_listings USING GIN (skills);
CREATE INDEX IF NOT EXISTS idx_job_listings_referral ON job_listings(has_referral) WHERE has_referral = true;
CREATE INDEX IF NOT EXISTS idx_job_listings_apify_job_id ON job_listings(apify_job_id);
CREATE INDEX IF NOT EXISTS idx_job_listings_source_platform ON job_listings(source_platform);
CREATE INDEX IF NOT EXISTS idx_job_listings_last_synced_at ON job_listings(last_synced_at);

-- ============================================================================
-- OPTIMIZED RESUMES
-- ============================================================================

CREATE TABLE IF NOT EXISTS optimized_resumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  job_listing_id uuid REFERENCES job_listings(id) ON DELETE CASCADE NOT NULL,
  resume_content jsonb NOT NULL,
  pdf_url text,
  docx_url text,
  optimization_score integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE optimized_resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own resumes"
  ON optimized_resumes FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own resumes"
  ON optimized_resumes FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_optimized_resumes_user ON optimized_resumes(user_id);

-- ============================================================================
-- APPLICATION LOGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS manual_apply_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  job_listing_id uuid REFERENCES job_listings(id) ON DELETE CASCADE NOT NULL,
  optimized_resume_id uuid REFERENCES optimized_resumes(id) ON DELETE CASCADE NOT NULL,
  application_date timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'submitted', 'failed')),
  redirect_url text NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE manual_apply_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own manual logs"
  ON manual_apply_logs FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own manual logs"
  ON manual_apply_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS auto_apply_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  job_listing_id uuid REFERENCES job_listings(id) ON DELETE CASCADE NOT NULL,
  optimized_resume_id uuid REFERENCES optimized_resumes(id) ON DELETE CASCADE NOT NULL,
  application_date timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'submitted', 'failed')),
  screenshot_url text,
  form_data_snapshot jsonb,
  error_message text,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE auto_apply_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own auto logs"
  ON auto_apply_logs FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own auto logs"
  ON auto_apply_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- JOB FETCH CONFIGS (Apify automation)
-- ============================================================================

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

ALTER TABLE job_fetch_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view job fetch configs"
  ON job_fetch_configs FOR SELECT TO authenticated
  USING (is_current_user_admin());

CREATE POLICY "Admins can insert job fetch configs"
  ON job_fetch_configs FOR INSERT TO authenticated
  WITH CHECK (is_current_user_admin());

CREATE POLICY "Admins can update job fetch configs"
  ON job_fetch_configs FOR UPDATE TO authenticated
  USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());

CREATE POLICY "Admins can delete job fetch configs"
  ON job_fetch_configs FOR DELETE TO authenticated
  USING (is_current_user_admin());

CREATE INDEX IF NOT EXISTS idx_job_fetch_configs_active ON job_fetch_configs(is_active);

-- ============================================================================
-- JOB SYNC LOGS
-- ============================================================================

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

ALTER TABLE job_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view sync logs"
  ON job_sync_logs FOR SELECT TO authenticated
  USING (is_current_user_admin());

CREATE POLICY "Service role can insert sync logs"
  ON job_sync_logs FOR INSERT TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update sync logs"
  ON job_sync_logs FOR UPDATE TO service_role
  USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_job_sync_logs_config ON job_sync_logs(config_id);
CREATE INDEX IF NOT EXISTS idx_job_sync_logs_created ON job_sync_logs(created_at DESC);

-- ============================================================================
-- JOB NOTIFICATION SUBSCRIPTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS job_notification_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  is_subscribed boolean DEFAULT true NOT NULL,
  preferred_domains text[] DEFAULT '{}',
  notification_frequency text DEFAULT 'daily' NOT NULL CHECK (notification_frequency IN ('daily', 'weekly')),
  last_sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE job_notification_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON job_notification_subscriptions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own subscription"
  ON job_notification_subscriptions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own subscription"
  ON job_notification_subscriptions FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_notification_subs_user ON job_notification_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_subs_active ON job_notification_subscriptions(is_subscribed) WHERE is_subscribed = true;

-- ============================================================================
-- JOB NOTIFICATION LOGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS job_notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  job_id uuid REFERENCES job_listings(id) ON DELETE CASCADE NOT NULL,
  notification_type text DEFAULT 'daily_digest' NOT NULL,
  email_status text DEFAULT 'sent' NOT NULL,
  sent_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, job_id, notification_type)
);

ALTER TABLE job_notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification logs"
  ON job_notification_logs FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role can insert notification logs"
  ON job_notification_logs FOR INSERT TO service_role
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_notification_logs_user ON job_notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_job ON job_notification_logs(job_id);

-- ============================================================================
-- EMAIL LOGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email_type text NOT NULL,
  recipient_email text NOT NULL,
  subject text NOT NULL,
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'queued', 'bounced')),
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view email logs"
  ON email_logs FOR SELECT TO authenticated
  USING (is_current_user_admin());

CREATE POLICY "Service role can insert email logs"
  ON email_logs FOR INSERT TO service_role
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_email_logs_type ON email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created ON email_logs(created_at DESC);

-- ============================================================================
-- EMAIL PREFERENCES
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  job_alerts boolean DEFAULT true,
  weekly_digest boolean DEFAULT true,
  admin_announcements boolean DEFAULT true,
  blog_updates boolean DEFAULT false,
  webinar_reminders boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own email preferences"
  ON email_preferences FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own email preferences"
  ON email_preferences FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own email preferences"
  ON email_preferences FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- JOB UPDATES (admin news/announcements)
-- ============================================================================

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

ALTER TABLE job_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active job updates"
  ON job_updates FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage job updates"
  ON job_updates FOR ALL TO authenticated
  USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());

CREATE INDEX IF NOT EXISTS idx_job_updates_active ON job_updates(is_active, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_updates_category ON job_updates(category);

-- ============================================================================
-- APIFY SCHEDULED SYNCS
-- ============================================================================

CREATE TABLE IF NOT EXISTS apify_scheduled_syncs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id uuid REFERENCES job_fetch_configs(id) ON DELETE CASCADE NOT NULL,
  schedule_name text NOT NULL,
  cron_expression text NOT NULL,
  timezone text DEFAULT 'Asia/Kolkata',
  is_active boolean DEFAULT true,
  next_run_at timestamptz,
  last_run_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE apify_scheduled_syncs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view scheduled syncs"
  ON apify_scheduled_syncs FOR SELECT TO authenticated
  USING (is_current_user_admin());

CREATE POLICY "Admins can manage scheduled syncs"
  ON apify_scheduled_syncs FOR ALL TO authenticated
  USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get matching jobs for daily digest
CREATE OR REPLACE FUNCTION get_jobs_for_daily_digest(p_user_id uuid)
RETURNS TABLE (
  job_id uuid,
  company_name text,
  company_logo_url text,
  role_title text,
  domain text,
  application_link text,
  posted_date timestamptz,
  location_type text,
  package_amount integer
) AS $$
DECLARE
  v_preferred_domains text[];
  v_last_sent timestamptz;
BEGIN
  SELECT preferred_domains, last_sent_at INTO v_preferred_domains, v_last_sent
  FROM job_notification_subscriptions
  WHERE user_id = p_user_id AND is_subscribed = true;

  RETURN QUERY
  SELECT
    j.id as job_id,
    j.company_name,
    j.company_logo_url,
    j.role_title,
    j.domain,
    j.application_link,
    j.posted_date,
    j.location_type,
    j.package_amount
  FROM job_listings j
  WHERE j.is_active = true
    AND j.posted_date >= COALESCE(v_last_sent, CURRENT_TIMESTAMP - INTERVAL '24 hours')
    AND (v_preferred_domains IS NULL OR array_length(v_preferred_domains, 1) IS NULL OR j.domain = ANY(v_preferred_domains))
    AND NOT EXISTS (
      SELECT 1 FROM job_notification_logs
      WHERE user_id = p_user_id AND job_id = j.id
    )
  ORDER BY j.posted_date DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION get_jobs_for_daily_digest(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_jobs_for_daily_digest(uuid) TO service_role;

-- Log notification send
CREATE OR REPLACE FUNCTION log_notification_send(
  p_user_id uuid,
  p_job_id uuid,
  p_email_status text,
  p_notification_type text DEFAULT 'daily_digest'
)
RETURNS void AS $$
BEGIN
  INSERT INTO job_notification_logs (user_id, job_id, notification_type, email_status)
  VALUES (p_user_id, p_job_id, p_notification_type, p_email_status)
  ON CONFLICT (user_id, job_id, notification_type) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION log_notification_send(uuid, uuid, text, text) TO service_role;

-- Update subscription last sent
CREATE OR REPLACE FUNCTION update_subscription_last_sent(p_user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE job_notification_subscriptions
  SET last_sent_at = now(), updated_at = now()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION update_subscription_last_sent(uuid) TO service_role;

-- Skill extraction function
CREATE OR REPLACE FUNCTION extract_skills_from_text(text_content text)
RETURNS jsonb AS $$
DECLARE
  common_skills text[] := ARRAY[
    'Python', 'Java', 'JavaScript', 'TypeScript', 'C++', 'C#', 'Go', 'Rust', 'Ruby', 'PHP',
    'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask', 'Spring',
    'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQL', 'NoSQL',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Git', 'CI/CD',
    'Machine Learning', 'ML', 'AI', 'Deep Learning', 'Data Science',
    'REST API', 'GraphQL', 'Microservices', 'Agile',
    'HTML', 'CSS', 'Tailwind', 'Bootstrap',
    'TensorFlow', 'PyTorch', 'Pandas', 'NumPy',
    'Linux', 'Bash'
  ];
  skill text;
  found_skills jsonb := '[]'::jsonb;
  lower_text text;
BEGIN
  lower_text := LOWER(text_content);
  FOREACH skill IN ARRAY common_skills
  LOOP
    IF lower_text LIKE '%' || LOWER(skill) || '%' THEN
      found_skills := found_skills || jsonb_build_array(skill);
    END IF;
  END LOOP;
  RETURN found_skills;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Commission calculation trigger
CREATE OR REPLACE FUNCTION calculate_commission_percentage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_bonus_amount IS NOT NULL AND NEW.referral_bonus_amount > 0 THEN
    IF NEW.package_amount IS NOT NULL AND NEW.package_amount > 0 THEN
      NEW.commission_percentage := LEAST(
        ROUND((NEW.referral_bonus_amount::numeric / NEW.package_amount::numeric) * 100, 2),
        30.00
      );
    ELSE
      NEW.commission_percentage := 20.00;
    END IF;
  ELSE
    NEW.commission_percentage := 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_commission ON job_listings;
CREATE TRIGGER trigger_calculate_commission
  BEFORE INSERT OR UPDATE OF referral_bonus_amount, package_amount ON job_listings
  FOR EACH ROW
  EXECUTE FUNCTION calculate_commission_percentage();

-- Auto-update has_referral flag
CREATE OR REPLACE FUNCTION update_job_referral_status()
RETURNS TRIGGER AS $$
BEGIN
  NEW.has_referral := (
    NEW.referral_person_name IS NOT NULL OR
    NEW.referral_email IS NOT NULL OR
    NEW.referral_code IS NOT NULL OR
    NEW.referral_link IS NOT NULL
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_referral_status ON job_listings;
CREATE TRIGGER trigger_update_referral_status
  BEFORE INSERT OR UPDATE ON job_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_job_referral_status();

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_job_listings_updated_at ON job_listings;
CREATE TRIGGER update_job_listings_updated_at
  BEFORE UPDATE ON job_listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_job_fetch_configs_updated_at ON job_fetch_configs;
CREATE TRIGGER update_job_fetch_configs_updated_at
  BEFORE UPDATE ON job_fetch_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_job_updates_updated_at ON job_updates;
CREATE TRIGGER update_job_updates_updated_at
  BEFORE UPDATE ON job_updates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notification_subs_updated_at ON job_notification_subscriptions;
CREATE TRIGGER update_notification_subs_updated_at
  BEFORE UPDATE ON job_notification_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Profile creation trigger (safe, checks if function needed)
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id, full_name, email_address, role, is_active
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    email_address = NEW.email,
    profile_updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;
CREATE TRIGGER create_profile_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- ============================================================================
-- PG_CRON AUTOMATION: Auto-trigger sync and digest every 8 hours
-- ============================================================================

-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Cron job: Trigger job sync every 8 hours (at 00:00, 08:00, 16:00 IST = 18:30, 02:30, 10:30 UTC)
SELECT cron.schedule(
  'auto-job-sync',
  '30 2,10,18 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url', true) || '/functions/v1/apify-cron-scheduler',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Cron job: Process job digest emails every 8 hours (offset by 1 hour after sync)
SELECT cron.schedule(
  'auto-job-digest',
  '30 3,11,19 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url', true) || '/functions/v1/process-daily-job-digest',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
  $$
);
