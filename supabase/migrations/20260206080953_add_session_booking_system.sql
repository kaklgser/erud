/*
  # Add Session Booking System

  1. New Tables
    - `session_services`
      - `id` (uuid, primary key) - unique service identifier
      - `title` (text) - service display name
      - `description` (text) - detailed description
      - `price` (integer) - price in paise (99900 = Rs 999)
      - `currency` (text) - currency code, default INR
      - `highlights` (jsonb) - array of bullet-point highlights
      - `bonus_credits` (integer) - JD credits awarded on booking
      - `max_slots_per_day` (integer) - max bookings per day (default 5)
      - `time_slots` (jsonb) - array of available time slot strings
      - `is_active` (boolean) - whether service is bookable
      - `created_at`, `updated_at` (timestamptz)

    - `session_slots`
      - `id` (uuid, primary key)
      - `service_id` (uuid FK -> session_services)
      - `slot_date` (date) - the date of the slot
      - `time_slot` (text) - e.g. "10:00-11:00"
      - `status` (text) - available / booked / blocked
      - `booked_by` (uuid FK -> auth.users, nullable)
      - `booking_id` (uuid FK -> session_bookings, nullable)
      - `created_at`, `updated_at` (timestamptz)
      - UNIQUE constraint on (service_id, slot_date, time_slot)

    - `session_bookings`
      - `id` (uuid, primary key)
      - `user_id` (uuid FK -> auth.users)
      - `service_id` (uuid FK -> session_services)
      - `slot_id` (uuid FK -> session_slots)
      - `booking_date` (date) - the booked date
      - `time_slot` (text) - the booked time slot
      - `payment_transaction_id` (uuid FK -> payment_transactions, nullable)
      - `status` (text) - confirmed / cancelled / completed / no_show
      - `bonus_credits_awarded` (integer) - credits given
      - `booking_code` (text, unique) - human-readable booking ID
      - `user_name` (text) - name at time of booking
      - `user_email` (text) - email at time of booking
      - `user_phone` (text, nullable) - phone at time of booking
      - `cancellation_reason` (text, nullable)
      - `created_at`, `updated_at` (timestamptz)

  2. Functions
    - `book_slot_atomically` - atomic slot booking with race condition protection
    - `generate_booking_code` - generates human-readable booking codes

  3. Security
    - RLS enabled on all 3 tables
    - Users can read active services
    - Users can read available slots
    - Users can read/manage their own bookings
    - Admins can read/write all data

  4. Seed Data
    - Initial "Resume Session - Career Transformation" service at Rs 999
*/

-- 1. Create session_services table
CREATE TABLE IF NOT EXISTS session_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  price integer NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  highlights jsonb NOT NULL DEFAULT '[]'::jsonb,
  bonus_credits integer NOT NULL DEFAULT 0,
  max_slots_per_day integer NOT NULL DEFAULT 5,
  time_slots jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE session_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active services"
  ON session_services FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage services"
  ON session_services FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- 2. Create session_bookings table (before session_slots so FK works)
CREATE TABLE IF NOT EXISTS session_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  service_id uuid NOT NULL,
  slot_id uuid,
  booking_date date NOT NULL,
  time_slot text NOT NULL,
  payment_transaction_id uuid REFERENCES payment_transactions(id),
  status text NOT NULL DEFAULT 'confirmed',
  bonus_credits_awarded integer NOT NULL DEFAULT 0,
  booking_code text UNIQUE NOT NULL,
  user_name text NOT NULL DEFAULT '',
  user_email text NOT NULL DEFAULT '',
  user_phone text,
  cancellation_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_booking_status CHECK (status IN ('confirmed', 'cancelled', 'completed', 'no_show'))
);

ALTER TABLE session_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings"
  ON session_bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookings"
  ON session_bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings"
  ON session_bookings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all bookings"
  ON session_bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can update all bookings"
  ON session_bookings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- 3. Create session_slots table
CREATE TABLE IF NOT EXISTS session_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES session_services(id),
  slot_date date NOT NULL,
  time_slot text NOT NULL,
  status text NOT NULL DEFAULT 'available',
  booked_by uuid REFERENCES auth.users(id),
  booking_id uuid REFERENCES session_bookings(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_service_date_slot UNIQUE (service_id, slot_date, time_slot),
  CONSTRAINT valid_slot_status CHECK (status IN ('available', 'booked', 'blocked'))
);

ALTER TABLE session_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view slots"
  ON session_slots FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage slots"
  ON session_slots FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "System can update slots on booking"
  ON session_slots FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "System can insert slots"
  ON session_slots FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add FK from session_bookings to session_services and session_slots
ALTER TABLE session_bookings
  ADD CONSTRAINT fk_session_bookings_service
  FOREIGN KEY (service_id) REFERENCES session_services(id);

ALTER TABLE session_bookings
  ADD CONSTRAINT fk_session_bookings_slot
  FOREIGN KEY (slot_id) REFERENCES session_slots(id);

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_session_slots_date ON session_slots(slot_date);
CREATE INDEX IF NOT EXISTS idx_session_slots_service_date ON session_slots(service_id, slot_date);
CREATE INDEX IF NOT EXISTS idx_session_bookings_user ON session_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_session_bookings_date ON session_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_session_bookings_status ON session_bookings(status);

-- 5. Function to generate booking codes like PB-20250206-001
CREATE OR REPLACE FUNCTION generate_booking_code(booking_date date)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  date_str text;
  seq_num integer;
  code text;
BEGIN
  date_str := to_char(booking_date, 'YYYYMMDD');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(booking_code FROM '[0-9]+$') AS integer)
  ), 0) + 1
  INTO seq_num
  FROM session_bookings
  WHERE session_bookings.booking_date = generate_booking_code.booking_date;
  
  code := 'PB-' || date_str || '-' || LPAD(seq_num::text, 3, '0');
  RETURN code;
END;
$$;

-- 6. Atomic booking function
CREATE OR REPLACE FUNCTION book_slot_atomically(
  p_user_id uuid,
  p_service_id uuid,
  p_slot_date date,
  p_time_slot text,
  p_payment_transaction_id uuid DEFAULT NULL,
  p_user_name text DEFAULT '',
  p_user_email text DEFAULT '',
  p_user_phone text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_slot_id uuid;
  v_booking_id uuid;
  v_booking_code text;
  v_bonus_credits integer;
  v_addon_type_id uuid;
  v_slot_count integer;
  v_max_slots integer;
BEGIN
  -- Get service info
  SELECT bonus_credits, max_slots_per_day
  INTO v_bonus_credits, v_max_slots
  FROM session_services
  WHERE id = p_service_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Service not found or inactive');
  END IF;

  -- Check how many slots are already booked for this date
  SELECT COUNT(*)
  INTO v_slot_count
  FROM session_slots
  WHERE service_id = p_service_id
    AND slot_date = p_slot_date
    AND status = 'booked';

  IF v_slot_count >= v_max_slots THEN
    RETURN jsonb_build_object('success', false, 'error', 'All slots for this date are fully booked');
  END IF;

  -- Try to find existing slot row
  SELECT id INTO v_slot_id
  FROM session_slots
  WHERE service_id = p_service_id
    AND slot_date = p_slot_date
    AND time_slot = p_time_slot
  FOR UPDATE;

  IF FOUND THEN
    -- Check if already booked or blocked
    IF (SELECT status FROM session_slots WHERE id = v_slot_id) != 'available' THEN
      RETURN jsonb_build_object('success', false, 'error', 'This slot is no longer available. Please pick another slot.');
    END IF;
  ELSE
    -- Create the slot row
    INSERT INTO session_slots (service_id, slot_date, time_slot, status)
    VALUES (p_service_id, p_slot_date, p_time_slot, 'available')
    RETURNING id INTO v_slot_id;
  END IF;

  -- Generate booking code
  v_booking_code := generate_booking_code(p_slot_date);

  -- Create the booking
  INSERT INTO session_bookings (
    user_id, service_id, slot_id, booking_date, time_slot,
    payment_transaction_id, status, bonus_credits_awarded,
    booking_code, user_name, user_email, user_phone
  )
  VALUES (
    p_user_id, p_service_id, v_slot_id, p_slot_date, p_time_slot,
    p_payment_transaction_id, 'confirmed', v_bonus_credits,
    v_booking_code, p_user_name, p_user_email, p_user_phone
  )
  RETURNING id INTO v_booking_id;

  -- Mark slot as booked
  UPDATE session_slots
  SET status = 'booked',
      booked_by = p_user_id,
      booking_id = v_booking_id,
      updated_at = now()
  WHERE id = v_slot_id;

  -- Award bonus JD credits
  IF v_bonus_credits > 0 THEN
    SELECT id INTO v_addon_type_id
    FROM addon_types
    WHERE type_key = 'optimization'
    LIMIT 1;

    IF v_addon_type_id IS NOT NULL THEN
      INSERT INTO user_addon_credits (
        user_id, addon_type_id, quantity_purchased, quantity_remaining,
        payment_transaction_id
      )
      VALUES (
        p_user_id, v_addon_type_id, v_bonus_credits, v_bonus_credits,
        p_payment_transaction_id
      );
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'booking_id', v_booking_id,
    'booking_code', v_booking_code,
    'slot_id', v_slot_id,
    'bonus_credits', v_bonus_credits
  );
END;
$$;

-- 7. Seed initial service
INSERT INTO session_services (title, description, price, currency, highlights, bonus_credits, max_slots_per_day, time_slots, is_active)
VALUES (
  'Resume Session - Career Transformation',
  'Get your resume reviewed by an ATS expert in a 1-on-1 live session. Learn how ATS shortlisting works, get practical guidance to improve your resume, and receive bonus JD optimization credits.',
  99900,
  'INR',
  '["ATS Resume Review by Expert", "Learn ATS shortlisting logic", "Practical guidance on resume improvement", "Bonus: 10 JD Optimization Credits"]'::jsonb,
  10,
  5,
  '["10:00-11:00", "11:00-12:00", "12:00-13:00", "14:00-15:00", "15:00-16:00"]'::jsonb,
  true
)
ON CONFLICT DO NOTHING;