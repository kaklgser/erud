-- ============================================
-- Test 8-Hour Job Digest System
-- Run these queries in Supabase SQL Editor
-- ============================================

-- 1. CREATE DATABASE FUNCTION WITH LOGO URL
-- ============================================
DROP FUNCTION IF EXISTS get_jobs_for_daily_digest(uuid);

CREATE OR REPLACE FUNCTION get_jobs_for_daily_digest(p_user_id uuid)
RETURNS TABLE (
  job_id text,
  company_name text,
  company_logo_url text,
  role_title text,
  domain text,
  application_link text,
  posted_date timestamp with time zone,
  location_type text,
  package_amount numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_last_sent_at timestamp with time zone;
  v_preferred_domains text[];
BEGIN
  SELECT last_sent_at, preferred_domains
  INTO v_last_sent_at, v_preferred_domains
  FROM job_notification_subscriptions
  WHERE user_id = p_user_id
    AND is_subscribed = true;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF v_last_sent_at IS NULL THEN
    v_last_sent_at := NOW() - INTERVAL '8 hours';
  END IF;

  RETURN QUERY
  SELECT
    jl.id::text,
    jl.company_name,
    jl.company_logo_url,
    jl.role_title,
    jl.domain,
    jl.application_link,
    jl.posted_date,
    jl.location_type,
    jl.package_amount
  FROM job_listings jl
  WHERE jl.is_active = true
    AND jl.posted_date > v_last_sent_at
    AND (
      v_preferred_domains IS NULL
      OR array_length(v_preferred_domains, 1) IS NULL
      OR jl.domain = ANY(v_preferred_domains)
    )
  ORDER BY jl.posted_date DESC
  LIMIT 10;
END;
$$;


-- 2. TEST THE FUNCTION
-- ============================================
-- First, find a user with subscription
SELECT user_id, preferred_domains, last_sent_at
FROM job_notification_subscriptions
WHERE is_subscribed = true
LIMIT 1;

-- Copy the user_id from above and test the function
-- REPLACE 'USER-ID-HERE' with actual UUID
SELECT * FROM get_jobs_for_daily_digest('USER-ID-HERE');

-- Check if company_logo_url is populated
-- Should see logo URLs in the results


-- 3. CHECK CURRENT SUBSCRIPTIONS
-- ============================================
SELECT
  COUNT(*) as total_subscribed_users,
  notification_frequency,
  COUNT(*) FILTER (WHERE last_sent_at > NOW() - INTERVAL '8 hours') as recently_sent
FROM job_notification_subscriptions
WHERE is_subscribed = true
GROUP BY notification_frequency;


-- 4. CHECK RECENT JOBS (Last 8 Hours)
-- ============================================
SELECT
  company_name,
  company_logo_url,
  role_title,
  domain,
  posted_date,
  NOW() - posted_date as age
FROM job_listings
WHERE is_active = true
  AND posted_date > NOW() - INTERVAL '8 hours'
ORDER BY posted_date DESC
LIMIT 20;

-- Count jobs with logos
SELECT
  COUNT(*) as total_jobs,
  COUNT(company_logo_url) as jobs_with_logo,
  ROUND(COUNT(company_logo_url) * 100.0 / COUNT(*), 2) as logo_percentage
FROM job_listings
WHERE is_active = true
  AND posted_date > NOW() - INTERVAL '8 hours';


-- 5. SETUP 8-HOUR CRON JOB
-- ============================================
-- Enable pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Set your Supabase configuration
-- IMPORTANT: Replace these with your actual values!
ALTER DATABASE postgres
SET app.settings.supabase_url = 'https://YOUR-PROJECT-REF.supabase.co';

ALTER DATABASE postgres
SET app.settings.supabase_service_role_key = 'YOUR-SERVICE-ROLE-KEY';

-- Create the 8-hour cron schedule (12am, 8am, 4pm)
SELECT cron.schedule(
  'job-digest-every-8-hours',
  '0 0,8,16 * * *',
  $$
  SELECT
    net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/process-daily-job-digest',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key')
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);


-- 6. VERIFY CRON JOB
-- ============================================
-- Check if cron job exists
SELECT
  jobid,
  jobname,
  schedule,
  active,
  database
FROM cron.job
WHERE jobname = 'job-digest-every-8-hours';

-- Check next run time (approximate)
SELECT
  jobname,
  CASE
    WHEN EXTRACT(HOUR FROM NOW()) < 8 THEN
      DATE_TRUNC('day', NOW()) + INTERVAL '8 hours'
    WHEN EXTRACT(HOUR FROM NOW()) < 16 THEN
      DATE_TRUNC('day', NOW()) + INTERVAL '16 hours'
    ELSE
      DATE_TRUNC('day', NOW() + INTERVAL '1 day')
  END as next_run_approx
FROM cron.job
WHERE jobname = 'job-digest-every-8-hours';


-- 7. CHECK EMAIL LOGS (After Testing)
-- ============================================
SELECT
  recipient_email,
  subject,
  status,
  sent_at,
  error_message
FROM email_logs
WHERE email_type = 'job_digest'
ORDER BY created_at DESC
LIMIT 10;

-- Email success rate
SELECT
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM email_logs
WHERE email_type = 'job_digest'
GROUP BY status;


-- 8. MONITOR CRON EXECUTION (After it runs)
-- ============================================
SELECT
  start_time,
  end_time,
  status,
  return_message,
  EXTRACT(EPOCH FROM (end_time - start_time)) as duration_seconds
FROM cron.job_run_details
WHERE jobid = (
  SELECT jobid FROM cron.job WHERE jobname = 'job-digest-every-8-hours'
)
ORDER BY start_time DESC
LIMIT 10;


-- 9. RESET LAST_SENT_AT (For Testing)
-- ============================================
-- This will make the system send emails to all users on next run
-- ONLY USE THIS FOR TESTING!
UPDATE job_notification_subscriptions
SET last_sent_at = NOW() - INTERVAL '9 hours'
WHERE is_subscribed = true;
-- After this, manually trigger the processor to test


-- 10. CLEANUP (If you want to remove and start over)
-- ============================================
-- Remove cron job
-- SELECT cron.unschedule('job-digest-every-8-hours');

-- Delete email logs
-- DELETE FROM email_logs WHERE email_type = 'job_digest';

-- Reset subscriptions
-- UPDATE job_notification_subscriptions SET last_sent_at = NULL;


-- ============================================
-- QUICK CHECKLIST
-- ============================================
-- [ ] 1. Database function created ✓
-- [ ] 2. Function returns jobs with logo URLs ✓
-- [ ] 3. Subscriptions exist ✓
-- [ ] 4. Recent jobs available (last 8 hours) ✓
-- [ ] 5. Cron job scheduled ✓
-- [ ] 6. Functions deployed (run in terminal: npx supabase functions deploy)
-- [ ] 7. Manual test successful ✓
-- [ ] 8. Emails received with logos ✓
-- [ ] 9. Cron running on schedule ✓
-- [ ] 10. Monitor spam rate ✓
