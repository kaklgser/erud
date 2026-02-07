/*
  # Create Demo Admin User

  This migration ensures there's a demo admin user available for testing admin functionality.

  ## Changes
  1. Insert demo admin user if not exists
  2. Update RLS policies to include demo user as admin
*/

-- Insert demo admin user (will be created when they first sign up)
-- This is handled by the application, but we update the policies to recognize them

-- Update admin policies to include demo user
DROP POLICY IF EXISTS "Admins can manage questions" ON questions;
CREATE POLICY "Admins can manage questions" ON questions 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.email IN ('admin@primojobs.com', 'your-admin-email@gmail.com', 'demo@primojobs.com')
    )
  );

DROP POLICY IF EXISTS "Admins can manage materials" ON materials;
CREATE POLICY "Admins can manage materials" ON materials 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.email IN ('admin@primojobs.com', 'your-admin-email@gmail.com', 'demo@primojobs.com')
    )
  );

DROP POLICY IF EXISTS "Admins can manage payment settings" ON payment_settings;
CREATE POLICY "Admins can manage payment settings" ON payment_settings 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.email IN ('admin@primojobs.com', 'your-admin-email@gmail.com', 'demo@primojobs.com')
    )
  );