/*
  # Add Password Reset Rate Limiting System

  1. New Tables
    - `password_reset_attempts`
      - `id` (uuid, primary key)
      - `email` (text, indexed) - Email address requesting reset
      - `ip_address` (text) - IP address of requester
      - `attempted_at` (timestamptz) - Timestamp of attempt
      - `success` (boolean) - Whether reset email was sent successfully
      - `user_agent` (text) - Browser/device info

  2. Security
    - Enable RLS on `password_reset_attempts` table
    - Add policy for authenticated admins to view reset attempts
    - Add function to check rate limit (3 attempts per 15 minutes)
    - Add cleanup function to remove old attempts (older than 24 hours)

  3. Functions
    - `check_password_reset_rate_limit` - Returns remaining time if rate limited
    - `cleanup_old_password_reset_attempts` - Removes attempts older than 24 hours
    - `log_password_reset_attempt` - Logs a new reset attempt
*/

-- Create password_reset_attempts table
CREATE TABLE IF NOT EXISTS password_reset_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  ip_address text,
  attempted_at timestamptz DEFAULT now() NOT NULL,
  success boolean DEFAULT false NOT NULL,
  user_agent text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_password_reset_attempts_email ON password_reset_attempts(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_attempts_attempted_at ON password_reset_attempts(attempted_at);
CREATE INDEX IF NOT EXISTS idx_password_reset_attempts_ip_address ON password_reset_attempts(ip_address);

-- Enable RLS
ALTER TABLE password_reset_attempts ENABLE ROW LEVEL SECURITY;

-- Admin policy to view all attempts
CREATE POLICY "Admins can view all password reset attempts"
  ON password_reset_attempts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Function to check if email is rate limited
CREATE OR REPLACE FUNCTION check_password_reset_rate_limit(
  p_email text,
  p_ip_address text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_attempt_count integer;
  v_oldest_attempt timestamptz;
  v_time_until_allowed integer;
  v_rate_limit_minutes integer := 15;
  v_max_attempts integer := 3;
BEGIN
  -- Count attempts in the last 15 minutes for this email
  SELECT COUNT(*), MIN(attempted_at)
  INTO v_attempt_count, v_oldest_attempt
  FROM password_reset_attempts
  WHERE email = p_email
  AND attempted_at > now() - interval '15 minutes';

  -- If under the limit, allow the request
  IF v_attempt_count < v_max_attempts THEN
    RETURN json_build_object(
      'allowed', true,
      'remaining_attempts', v_max_attempts - v_attempt_count,
      'message', 'Request allowed'
    );
  END IF;

  -- Calculate time until oldest attempt expires
  v_time_until_allowed := EXTRACT(EPOCH FROM (
    v_oldest_attempt + interval '15 minutes' - now()
  ))::integer;

  -- Return rate limit info
  RETURN json_build_object(
    'allowed', false,
    'remaining_attempts', 0,
    'retry_after_seconds', v_time_until_allowed,
    'message', format('Too many password reset attempts. Please try again in %s minutes.',
      CEIL(v_time_until_allowed / 60.0)
    )
  );
END;
$$;

-- Function to log password reset attempt
CREATE OR REPLACE FUNCTION log_password_reset_attempt(
  p_email text,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_success boolean DEFAULT true
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_attempt_id uuid;
BEGIN
  INSERT INTO password_reset_attempts (
    email,
    ip_address,
    user_agent,
    success,
    attempted_at
  ) VALUES (
    p_email,
    p_ip_address,
    p_user_agent,
    p_success,
    now()
  )
  RETURNING id INTO v_attempt_id;

  RETURN v_attempt_id;
END;
$$;

-- Function to cleanup old attempts (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_password_reset_attempts()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count integer;
BEGIN
  DELETE FROM password_reset_attempts
  WHERE attempted_at < now() - interval '24 hours';

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RETURN v_deleted_count;
END;
$$;

-- Create a scheduled job to cleanup old attempts daily (using pg_cron if available)
-- Note: This is optional and requires pg_cron extension
-- Uncomment if pg_cron is enabled:
-- SELECT cron.schedule(
--   'cleanup-password-reset-attempts',
--   '0 2 * * *', -- Run at 2 AM daily
--   $$SELECT cleanup_old_password_reset_attempts();$$
-- );