-- Check the specific jobs you're seeing (MDB, Capgemini)
SELECT 
  id,
  company_name,
  company_logo_url,
  role_title,
  source_api,
  created_at
FROM job_listings
WHERE company_name IN ('MDB General Referrals', 'Capgemini')
ORDER BY created_at DESC
LIMIT 5;
