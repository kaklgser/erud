-- Add specific admin user to all admin policies
-- This migration updates all RLS policies to recognize primoboostai@gmail.com as an admin

-- Update questions table admin policy
DROP POLICY IF EXISTS "Admins can manage questions" ON questions;
CREATE POLICY "Admins can manage questions" ON questions 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.email IN (
        'admin@primojobs.com', 
        'your-admin-email@gmail.com', 
        'demo@primojobs.com',
        'primoboostai@gmail.com'
      )
    )
  );

-- Update materials table admin policy
DROP POLICY IF EXISTS "Admins can manage materials" ON materials;
CREATE POLICY "Admins can manage materials" ON materials 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.email IN (
        'admin@primojobs.com', 
        'your-admin-email@gmail.com', 
        'demo@primojobs.com',
        'primoboostai@gmail.com'
      )
    )
  );

-- Update payment_settings table admin policy
DROP POLICY IF EXISTS "Admins can manage payment settings" ON payment_settings;
CREATE POLICY "Admins can manage payment settings" ON payment_settings 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.email IN (
        'admin@primojobs.com', 
        'your-admin-email@gmail.com', 
        'demo@primojobs.com',
        'primoboostai@gmail.com'
      )
    )
  );

-- Note: The user account will be created automatically when they first sign up
-- The system will recognize them as admin based on their email address