/*
  # Add agenda field to webinars table

  1. Changes
    - Add `agenda` jsonb column to store session breakdown with time and topic
    - Column allows null values for backward compatibility
  
  2. Purpose
    - Store structured agenda data for webinars showing session timeline
    - Each agenda item contains time and topic information
*/

ALTER TABLE webinars 
ADD COLUMN IF NOT EXISTS agenda jsonb DEFAULT NULL;

COMMENT ON COLUMN webinars.agenda IS 'Session breakdown with time and topic (e.g., [{"time": "3:00-3:10 PM", "topic": "Introduction"}])';
