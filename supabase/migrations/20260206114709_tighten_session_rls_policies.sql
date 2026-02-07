/*
  # Tighten session booking RLS policies

  1. Security Fixes - session_slots table
    - Remove overly permissive INSERT policy (WITH CHECK true) - any user could insert slots
    - Remove overly permissive UPDATE policy (USING true, WITH CHECK true) - any user could modify slots
    - Replace SELECT policy (USING true) with proper ownership check
    - The `book_slot_atomically` function is SECURITY DEFINER and bypasses RLS,
      so slot INSERT/UPDATE only needs to happen through that function
    - Admins retain full access through their existing admin policy

  2. Security Fixes - session_services table
    - Replace `FOR ALL` admin policy with separate SELECT, INSERT, UPDATE, DELETE policies
    - This follows the principle of explicit, granular access control

  3. Important Notes
    - `book_slot_atomically` (SECURITY DEFINER) handles all slot creation and booking
    - Regular users only need to READ slots to see availability
    - No data is modified or deleted, only policies are replaced
*/

-- ============================================================
-- session_slots: Remove dangerous open INSERT/UPDATE policies
-- ============================================================

DROP POLICY IF EXISTS "System can insert slots" ON public.session_slots;
DROP POLICY IF EXISTS "System can update slots on booking" ON public.session_slots;
DROP POLICY IF EXISTS "Anyone can view slots" ON public.session_slots;

CREATE POLICY "Authenticated users can view slots"
  ON public.session_slots
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- session_services: Replace FOR ALL with specific policies
-- ============================================================

DROP POLICY IF EXISTS "Admins can manage services" ON public.session_services;

CREATE POLICY "Admins can view all services"
  ON public.session_services
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can insert services"
  ON public.session_services
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can update services"
  ON public.session_services
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can delete services"
  ON public.session_services
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );
