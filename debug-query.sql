-- Get actual job data with logos to see what's in the UI
SELECT 
  id,
  company_name,
  company_logo_url,
  role_title,
  source_api,
  created_at
FROM job_listings
WHERE is_active = true
ORDER BY created_at DESC
LIMIT 5;
