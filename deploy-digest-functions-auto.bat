@echo off
echo ====================================
echo  Deploy 8-Hour Digest Functions
echo ====================================
echo.

REM Set your credentials
set SUPABASE_ACCESS_TOKEN=sbp_a281688503d7a4a16e89e15b0c790396813ba977
set PROJECT_REF=rixmudvtbfkjpwjoefon

echo Project: karthikl
echo Project ID: %PROJECT_REF%
echo.
echo ====================================
echo  Deploying Functions...
echo ====================================
echo.

echo [1/2] Deploying process-daily-job-digest...
npx supabase functions deploy process-daily-job-digest --project-ref %PROJECT_REF%
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to deploy process-daily-job-digest
    echo.
    echo Troubleshooting:
    echo 1. Check your internet connection
    echo 2. Verify your access token is still valid
    echo 3. Make sure the function folder exists
    echo.
    pause
    exit /b 1
)

echo.
echo [2/2] Deploying send-job-digest-email...
npx supabase functions deploy send-job-digest-email --project-ref %PROJECT_REF%
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to deploy send-job-digest-email
    echo.
    echo Troubleshooting:
    echo 1. Check your internet connection
    echo 2. Verify your access token is still valid
    echo 3. Make sure the function folder exists
    echo.
    pause
    exit /b 1
)

echo.
echo ====================================
echo  SUCCESS! Both functions deployed
echo ====================================
echo.
echo Deployed functions:
echo  ✓ process-daily-job-digest
echo  ✓ send-job-digest-email
echo.
echo ====================================
echo  Next Steps:
echo ====================================
echo.
echo 1. Go to: http://localhost:5173/admin/email-testing
echo 2. Click the purple "Test 8-Hour Digest" button
echo 3. You should see success with statistics!
echo 4. Check your email inbox for job digest
echo.
echo If you still get errors, check the Supabase logs:
echo https://supabase.com/dashboard/project/%PROJECT_REF%/logs/edge-functions
echo.
pause
