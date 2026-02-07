/*
  # Fix mutable search_path security vulnerability on all public functions

  1. Security Fixes
    - Set `search_path = public, pg_temp` on 25 functions missing this setting
    - Prevents search_path hijacking attacks
    - Critical fix for SECURITY DEFINER function `book_slot_atomically`

  2. Functions Fixed
    - All trigger functions (update_*_updated_at, etc.)
    - Business logic functions (book_slot_atomically, generate_booking_code, etc.)
    - Utility functions (calculate_bubble_score, extract_skills_from_text, etc.)

  3. Important Notes
    - Only modifies the search_path config, no logic changes
*/

ALTER FUNCTION public.book_slot_atomically(uuid, uuid, date, text, uuid, text, text, text)
  SET search_path = public, pg_temp;

ALTER FUNCTION public.assign_referral_code(uuid)
  SET search_path = public, pg_temp;

ALTER FUNCTION public.calculate_bubble_score(numeric, integer, boolean, text)
  SET search_path = public, pg_temp;

ALTER FUNCTION public.calculate_commission_percentage()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.ensure_single_primary_resume()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.extract_skills_from_text(text)
  SET search_path = public, pg_temp;

ALTER FUNCTION public.generate_booking_code(date)
  SET search_path = public, pg_temp;

ALTER FUNCTION public.generate_device_fingerprint(text, text, text, text)
  SET search_path = public, pg_temp;

ALTER FUNCTION public.trg_touch_updated_at()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.update_app_metrics_updated_at()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.update_blog_post_updated_at()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.update_device_timestamp()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.update_job_fetch_configs_updated_at()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.update_job_listings_timestamp()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.update_job_updates_updated_at()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.update_linkedin_profile_optimizations_updated_at()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.update_portfolio_updated_at()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.update_profile_timestamp()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.update_recommendation_timestamp()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.update_smart_updated_at_column()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.update_subscription_timestamp()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.update_survey_subscription_timestamp()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.update_updated_at_column()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.update_wallet_updated_at()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.update_webinar_updates_timestamp()
  SET search_path = public, pg_temp;
