/*
  # Split session_slots admin FOR ALL policy into granular policies

  1. Security Fixes
    - Replace `FOR ALL` admin policy on session_slots with separate SELECT, INSERT, UPDATE, DELETE
    - Follows principle of explicit, granular access control

  2. Important Notes
    - No data changes, only policy restructuring
*/

DROP POLICY IF EXISTS "Admins can manage slots" ON public.session_slots;

CREATE POLICY "Admins can view all slots"
  ON public.session_slots
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can insert slots"
  ON public.session_slots
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can update slots"
  ON public.session_slots
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

CREATE POLICY "Admins can delete slots"
  ON public.session_slots
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );
