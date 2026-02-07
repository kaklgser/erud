/*
  # Enhanced Email Notification System

  ## Overview
  This migration enhances the email notification system with:
  - Additional email types for admin notifications
  - Email preference management for users
  - Enhanced tracking capabilities
  - Email bounce and complaint tracking
  - Email delivery status improvements

  ## Changes

  1. **Extended email_logs table**
     - Add support for new email types (admin notifications, payment updates, etc.)
     - Add metadata field for additional tracking data
     - Add template_used field to track which template was used

  2. **New email_preferences table**
     - User-specific email notification preferences
     - Granular control over notification types
     - Frequency settings and quiet hours

  3. **New email_bounces table**
     - Track bounced emails and complaints
     - Prevent sending to problematic addresses
     - Support for temporary and permanent bounces

  4. **Enhanced functions**
     - Check if email should be sent based on preferences
     - Get user email preferences
     - Mark email address as bounced

  ## Security
  - RLS enabled on all new tables
  - Users can manage their own preferences
  - Admins have full access to bounce tracking
*/

-- ============================================================================
-- EXTEND email_logs table with new email types
-- ============================================================================

-- Drop the old CHECK constraint on email_type
DO $$
BEGIN
  ALTER TABLE email_logs DROP CONSTRAINT IF EXISTS email_logs_email_type_check;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Add new CHECK constraint with extended email types
ALTER TABLE email_logs ADD CONSTRAINT email_logs_email_type_check
CHECK (email_type IN (
  'welcome',
  'job_digest',
  'notification',
  'webinar_confirmation',
  'webinar_reminder',
  'redemption',
  'payment_success',
  'payment_failed',
  'subscription_expiry',
  'subscription_renewal',
  'application_status',
  'profile_completion',
  'referral_reward',
  'admin_job_update',
  'admin_blog_post',
  'admin_notification',
  'wallet_transaction',
  'interview_reminder',
  'resume_optimization_complete',
  'other'
));

-- Add new columns to email_logs
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS template_used text;
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS bounce_type text;

-- Create index on metadata for JSONB queries
CREATE INDEX IF NOT EXISTS idx_email_logs_metadata ON email_logs USING GIN (metadata);

-- ============================================================================
-- EMAIL PREFERENCES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Global email settings
  email_enabled boolean DEFAULT true NOT NULL,
  marketing_emails boolean DEFAULT true NOT NULL,

  -- Specific notification types
  welcome_emails boolean DEFAULT true NOT NULL,
  job_digest_emails boolean DEFAULT true NOT NULL,
  job_digest_frequency text DEFAULT 'daily' CHECK (job_digest_frequency IN ('immediate', 'daily', 'weekly', 'disabled')) NOT NULL,
  webinar_notifications boolean DEFAULT true NOT NULL,
  payment_notifications boolean DEFAULT true NOT NULL,
  subscription_notifications boolean DEFAULT true NOT NULL,
  application_updates boolean DEFAULT true NOT NULL,
  profile_reminders boolean DEFAULT true NOT NULL,
  referral_notifications boolean DEFAULT true NOT NULL,
  wallet_notifications boolean DEFAULT true NOT NULL,
  interview_reminders boolean DEFAULT true NOT NULL,
  resume_notifications boolean DEFAULT true NOT NULL,
  admin_announcements boolean DEFAULT true NOT NULL,

  -- Quiet hours (UTC)
  quiet_hours_enabled boolean DEFAULT false NOT NULL,
  quiet_hours_start time,
  quiet_hours_end time,
  quiet_hours_timezone text DEFAULT 'UTC' NOT NULL,

  -- Digest settings
  daily_digest_time time DEFAULT '09:00:00' NOT NULL,
  weekly_digest_day integer DEFAULT 1 CHECK (weekly_digest_day BETWEEN 0 AND 6), -- 0 = Sunday

  -- Tracking
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,

  UNIQUE(user_id)
);

ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own email preferences"
  ON email_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email preferences"
  ON email_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own email preferences"
  ON email_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all email preferences"
  ON email_preferences FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_email_prefs_user ON email_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_email_prefs_enabled ON email_preferences(email_enabled) WHERE email_enabled = true;

-- ============================================================================
-- EMAIL BOUNCES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_bounces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_address text NOT NULL,
  bounce_type text NOT NULL CHECK (bounce_type IN ('hard', 'soft', 'complaint', 'unsubscribe')) NOT NULL,
  bounce_subtype text,
  bounce_reason text,
  bounced_at timestamptz DEFAULT now() NOT NULL,
  email_log_id uuid REFERENCES email_logs(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true NOT NULL,
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE email_bounces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view email bounces"
  ON email_bounces FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage email bounces"
  ON email_bounces FOR ALL
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

CREATE INDEX IF NOT EXISTS idx_email_bounces_address ON email_bounces(email_address);
CREATE INDEX IF NOT EXISTS idx_email_bounces_type ON email_bounces(bounce_type);
CREATE INDEX IF NOT EXISTS idx_email_bounces_active ON email_bounces(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_email_bounces_created ON email_bounces(bounced_at DESC);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if email should be sent based on user preferences
CREATE OR REPLACE FUNCTION should_send_email(
  p_user_id uuid,
  p_email_type text,
  p_recipient_email text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_prefs record;
  v_current_time time;
  v_is_bounced boolean;
BEGIN
  -- Check if email address is bounced
  SELECT EXISTS (
    SELECT 1 FROM email_bounces
    WHERE email_address = p_recipient_email
    AND is_active = true
    AND bounce_type IN ('hard', 'complaint', 'unsubscribe')
  ) INTO v_is_bounced;

  IF v_is_bounced THEN
    RETURN false;
  END IF;

  -- Get user preferences (create default if not exists)
  SELECT * INTO v_prefs FROM email_preferences WHERE user_id = p_user_id;

  IF v_prefs IS NULL THEN
    INSERT INTO email_preferences (user_id) VALUES (p_user_id)
    RETURNING * INTO v_prefs;
  END IF;

  -- Check global email setting
  IF NOT v_prefs.email_enabled THEN
    RETURN false;
  END IF;

  -- Check quiet hours
  IF v_prefs.quiet_hours_enabled AND v_prefs.quiet_hours_start IS NOT NULL AND v_prefs.quiet_hours_end IS NOT NULL THEN
    v_current_time := CURRENT_TIME AT TIME ZONE v_prefs.quiet_hours_timezone;

    IF v_prefs.quiet_hours_start < v_prefs.quiet_hours_end THEN
      -- Normal case: quiet hours don't span midnight
      IF v_current_time >= v_prefs.quiet_hours_start AND v_current_time <= v_prefs.quiet_hours_end THEN
        RETURN false;
      END IF;
    ELSE
      -- Quiet hours span midnight
      IF v_current_time >= v_prefs.quiet_hours_start OR v_current_time <= v_prefs.quiet_hours_end THEN
        RETURN false;
      END IF;
    END IF;
  END IF;

  -- Check specific email type preferences
  CASE p_email_type
    WHEN 'welcome' THEN RETURN v_prefs.welcome_emails;
    WHEN 'job_digest' THEN RETURN v_prefs.job_digest_emails;
    WHEN 'webinar_confirmation', 'webinar_reminder' THEN RETURN v_prefs.webinar_notifications;
    WHEN 'payment_success', 'payment_failed' THEN RETURN v_prefs.payment_notifications;
    WHEN 'subscription_expiry', 'subscription_renewal' THEN RETURN v_prefs.subscription_notifications;
    WHEN 'application_status' THEN RETURN v_prefs.application_updates;
    WHEN 'profile_completion' THEN RETURN v_prefs.profile_reminders;
    WHEN 'referral_reward' THEN RETURN v_prefs.referral_notifications;
    WHEN 'wallet_transaction' THEN RETURN v_prefs.wallet_notifications;
    WHEN 'interview_reminder' THEN RETURN v_prefs.interview_reminders;
    WHEN 'resume_optimization_complete' THEN RETURN v_prefs.resume_notifications;
    WHEN 'admin_job_update', 'admin_blog_post', 'admin_notification' THEN RETURN v_prefs.admin_announcements;
    ELSE RETURN true; -- Allow by default for new types
  END CASE;
END;
$$;

-- Function to get user email preferences with defaults
CREATE OR REPLACE FUNCTION get_user_email_preferences(p_user_id uuid)
RETURNS TABLE (
  email_enabled boolean,
  marketing_emails boolean,
  welcome_emails boolean,
  job_digest_emails boolean,
  job_digest_frequency text,
  webinar_notifications boolean,
  payment_notifications boolean,
  subscription_notifications boolean,
  application_updates boolean,
  profile_reminders boolean,
  referral_notifications boolean,
  wallet_notifications boolean,
  interview_reminders boolean,
  resume_notifications boolean,
  admin_announcements boolean,
  quiet_hours_enabled boolean,
  quiet_hours_start time,
  quiet_hours_end time,
  quiet_hours_timezone text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create preferences if they don't exist
  INSERT INTO email_preferences (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Return preferences
  RETURN QUERY
  SELECT
    ep.email_enabled,
    ep.marketing_emails,
    ep.welcome_emails,
    ep.job_digest_emails,
    ep.job_digest_frequency,
    ep.webinar_notifications,
    ep.payment_notifications,
    ep.subscription_notifications,
    ep.application_updates,
    ep.profile_reminders,
    ep.referral_notifications,
    ep.wallet_notifications,
    ep.interview_reminders,
    ep.resume_notifications,
    ep.admin_announcements,
    ep.quiet_hours_enabled,
    ep.quiet_hours_start,
    ep.quiet_hours_end,
    ep.quiet_hours_timezone
  FROM email_preferences ep
  WHERE ep.user_id = p_user_id;
END;
$$;

-- Function to record email bounce
CREATE OR REPLACE FUNCTION record_email_bounce(
  p_email_address text,
  p_bounce_type text,
  p_bounce_subtype text DEFAULT NULL,
  p_bounce_reason text DEFAULT NULL,
  p_email_log_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_bounce_id uuid;
BEGIN
  INSERT INTO email_bounces (
    email_address,
    bounce_type,
    bounce_subtype,
    bounce_reason,
    email_log_id,
    metadata
  ) VALUES (
    p_email_address,
    p_bounce_type,
    p_bounce_subtype,
    p_bounce_reason,
    p_email_log_id,
    p_metadata
  )
  RETURNING id INTO v_bounce_id;

  -- Update email_logs if reference provided
  IF p_email_log_id IS NOT NULL THEN
    UPDATE email_logs
    SET
      status = CASE
        WHEN p_bounce_type IN ('hard', 'complaint') THEN 'bounced'
        ELSE status
      END,
      bounce_type = p_bounce_type
    WHERE id = p_email_log_id;
  END IF;

  RETURN v_bounce_id;
END;
$$;

-- Function to resolve email bounce
CREATE OR REPLACE FUNCTION resolve_email_bounce(
  p_bounce_id uuid,
  p_resolved_by uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE email_bounces
  SET
    is_active = false,
    resolved_at = now(),
    resolved_by = p_resolved_by
  WHERE id = p_bounce_id;

  RETURN FOUND;
END;
$$;

-- Function to get email delivery rate
CREATE OR REPLACE FUNCTION get_email_delivery_rate(
  p_days integer DEFAULT 30
)
RETURNS TABLE (
  total_emails bigint,
  delivered bigint,
  failed bigint,
  bounced bigint,
  delivery_rate numeric,
  bounce_rate numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::bigint as total_emails,
    COUNT(*) FILTER (WHERE status = 'sent')::bigint as delivered,
    COUNT(*) FILTER (WHERE status = 'failed')::bigint as failed,
    COUNT(*) FILTER (WHERE status = 'bounced')::bigint as bounced,
    CASE
      WHEN COUNT(*) > 0 THEN
        ROUND((COUNT(*) FILTER (WHERE status = 'sent')::numeric / COUNT(*)::numeric) * 100, 2)
      ELSE 0
    END as delivery_rate,
    CASE
      WHEN COUNT(*) > 0 THEN
        ROUND((COUNT(*) FILTER (WHERE status = 'bounced')::numeric / COUNT(*)::numeric) * 100, 2)
      ELSE 0
    END as bounce_rate
  FROM email_logs
  WHERE created_at >= now() - (p_days || ' days')::interval;
END;
$$;

-- Function to get email engagement metrics
CREATE OR REPLACE FUNCTION get_email_engagement_metrics(
  p_days integer DEFAULT 30
)
RETURNS TABLE (
  email_type text,
  total_sent bigint,
  total_opened bigint,
  total_clicked bigint,
  open_rate numeric,
  click_rate numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    el.email_type,
    COUNT(*)::bigint as total_sent,
    COUNT(*) FILTER (WHERE el.opened_at IS NOT NULL)::bigint as total_opened,
    COUNT(*) FILTER (WHERE el.clicked_at IS NOT NULL)::bigint as total_clicked,
    CASE
      WHEN COUNT(*) > 0 THEN
        ROUND((COUNT(*) FILTER (WHERE el.opened_at IS NOT NULL)::numeric / COUNT(*)::numeric) * 100, 2)
      ELSE 0
    END as open_rate,
    CASE
      WHEN COUNT(*) > 0 THEN
        ROUND((COUNT(*) FILTER (WHERE el.clicked_at IS NOT NULL)::numeric / COUNT(*)::numeric) * 100, 2)
      ELSE 0
    END as click_rate
  FROM email_logs el
  WHERE
    el.status = 'sent'
    AND el.created_at >= now() - (p_days || ' days')::interval
  GROUP BY el.email_type
  ORDER BY total_sent DESC;
END;
$$;

-- Trigger to update updated_at on email_preferences
CREATE OR REPLACE FUNCTION update_email_preferences_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_email_preferences_timestamp_trigger ON email_preferences;
CREATE TRIGGER update_email_preferences_timestamp_trigger
  BEFORE UPDATE ON email_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_email_preferences_timestamp();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION should_send_email(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_email_preferences(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION record_email_bounce(text, text, text, text, uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION resolve_email_bounce(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_email_delivery_rate(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_email_engagement_metrics(integer) TO authenticated;
