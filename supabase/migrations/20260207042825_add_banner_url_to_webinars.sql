/*
  # Add Banner URL Column to Webinars Table

  1. Changes
    - Add `banner_url` column to store banner image URLs for webinar pages
    - Add `banner_alt_text` column for accessibility
    - Both columns are optional (nullable)

  2. Purpose
    - Allow admins to set custom banner images for each webinar landing page
    - Improve visual presentation of webinar pages
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'webinars' AND column_name = 'banner_url'
  ) THEN
    ALTER TABLE webinars ADD COLUMN banner_url text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'webinars' AND column_name = 'banner_alt_text'
  ) THEN
    ALTER TABLE webinars ADD COLUMN banner_alt_text text;
  END IF;
END $$;