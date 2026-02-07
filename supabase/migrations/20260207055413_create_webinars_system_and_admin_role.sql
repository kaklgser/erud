/*
  # Create Webinars System and Add Admin Role

  1. Changes to Existing Tables
    - `user_profiles`: Add `role` column (text, default 'client') for admin access control

  2. New Tables
    - `webinars`
      - `id` (uuid, primary key)
      - `title` (text, not null)
      - `slug` (text, unique, not null)
      - `description` (text, not null)
      - `short_description` (text, optional)
      - `thumbnail_url` (text, optional)
      - `banner_url` (text, optional)
      - `banner_alt_text` (text, optional)
      - `scheduled_at` (timestamptz, not null)
      - `duration_minutes` (integer, default 60)
      - `meet_link` (text, not null)
      - `original_price` (integer, default 0)
      - `discounted_price` (integer, default 0)
      - `max_attendees` (integer, default 100)
      - `current_attendees` (integer, default 0)
      - `status` (text, check constraint for upcoming/live/completed/cancelled)
      - `speaker_ids` (text array, default empty)
      - `learning_outcomes` (jsonb, optional)
      - `target_audience` (text array, default empty)
      - `prerequisites` (text array, default empty)
      - `is_featured` (boolean, default false)
      - `created_by` (uuid, optional, references auth.users)
      - `created_at` (timestamptz, default now)
      - `updated_at` (timestamptz, default now)

    - `webinar_registrations`
      - `id` (uuid, primary key)
      - `webinar_id` (uuid, references webinars)
      - `user_id` (uuid, optional, references auth.users)
      - `full_name` (text, not null)
      - `email` (text, not null)
      - `college_name` (text, optional)
      - `year_of_study` (text, optional)
      - `branch` (text, optional)
      - `phone_number` (text, optional)
      - `payment_transaction_id` (text, optional)
      - `registration_status` (text, default 'pending')
      - `payment_status` (text, default 'pending')
      - `meet_link_sent` (boolean, default false)
      - `meet_link_sent_at` (timestamptz, optional)
      - `attendance_marked` (boolean, default false)
      - `attended_at` (timestamptz, optional)
      - `registration_source` (text, optional)
      - `created_at` (timestamptz, default now)
      - `updated_at` (timestamptz, default now)

  3. Security
    - RLS enabled on both new tables
    - Admin users (role = 'admin') can perform all operations on webinars
    - Authenticated users can read upcoming/live webinars
    - Authenticated users can create and read their own registrations
    - Admin users can manage all registrations

  4. Notes
    - The role column allows distinguishing admin users from regular clients
    - Webinar slugs must be unique for URL routing
    - current_attendees is tracked separately and updated on registration
*/

-- Add role column to user_profiles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN role text DEFAULT 'client';
  END IF;
END $$;

-- Create webinars table
CREATE TABLE IF NOT EXISTS webinars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL,
  short_description text,
  thumbnail_url text,
  banner_url text,
  banner_alt_text text,
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  duration_minutes integer NOT NULL DEFAULT 60,
  meet_link text NOT NULL,
  original_price integer NOT NULL DEFAULT 0,
  discounted_price integer NOT NULL DEFAULT 0,
  max_attendees integer DEFAULT 100,
  current_attendees integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'completed', 'cancelled')),
  speaker_ids text[] DEFAULT '{}',
  learning_outcomes jsonb,
  target_audience text[] DEFAULT '{}',
  prerequisites text[] DEFAULT '{}',
  is_featured boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create webinar_registrations table
CREATE TABLE IF NOT EXISTS webinar_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webinar_id uuid NOT NULL REFERENCES webinars(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  full_name text NOT NULL,
  email text NOT NULL,
  college_name text,
  year_of_study text,
  branch text,
  phone_number text,
  payment_transaction_id text,
  registration_status text NOT NULL DEFAULT 'pending' CHECK (registration_status IN ('pending', 'confirmed', 'cancelled')),
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  meet_link_sent boolean NOT NULL DEFAULT false,
  meet_link_sent_at timestamptz,
  attendance_marked boolean NOT NULL DEFAULT false,
  attended_at timestamptz,
  registration_source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_webinars_slug ON webinars(slug);
CREATE INDEX IF NOT EXISTS idx_webinars_status ON webinars(status);
CREATE INDEX IF NOT EXISTS idx_webinars_scheduled_at ON webinars(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_webinars_is_featured ON webinars(is_featured);
CREATE INDEX IF NOT EXISTS idx_webinar_registrations_webinar_id ON webinar_registrations(webinar_id);
CREATE INDEX IF NOT EXISTS idx_webinar_registrations_user_id ON webinar_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_webinar_registrations_email ON webinar_registrations(email);

-- Enable RLS
ALTER TABLE webinars ENABLE ROW LEVEL SECURITY;
ALTER TABLE webinar_registrations ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
  OR
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND email = 'primoboostai@gmail.com'
  );
$$;

-- =====================
-- WEBINARS RLS POLICIES
-- =====================

-- Admins can read all webinars
CREATE POLICY "Admins can read all webinars"
  ON webinars FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Authenticated users can read published webinars (upcoming, live, completed)
CREATE POLICY "Users can read published webinars"
  ON webinars FOR SELECT
  TO authenticated
  USING (status IN ('upcoming', 'live', 'completed'));

-- Admins can insert webinars
CREATE POLICY "Admins can create webinars"
  ON webinars FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Admins can update webinars
CREATE POLICY "Admins can update webinars"
  ON webinars FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Admins can delete webinars
CREATE POLICY "Admins can delete webinars"
  ON webinars FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ================================
-- WEBINAR REGISTRATIONS RLS POLICIES
-- ================================

-- Admins can read all registrations
CREATE POLICY "Admins can read all registrations"
  ON webinar_registrations FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Users can read their own registrations
CREATE POLICY "Users can read own registrations"
  ON webinar_registrations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Authenticated users can register for webinars
CREATE POLICY "Users can register for webinars"
  ON webinar_registrations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- Admins can update registrations
CREATE POLICY "Admins can update registrations"
  ON webinar_registrations FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Users can update their own registration (e.g. cancel)
CREATE POLICY "Users can update own registrations"
  ON webinar_registrations FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins can delete registrations
CREATE POLICY "Admins can delete registrations"
  ON webinar_registrations FOR DELETE
  TO authenticated
  USING (public.is_admin());
