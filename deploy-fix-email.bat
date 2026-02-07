@echo off
echo ====================================
echo  Deploy Email Function Fix
echo ====================================
echo.

REM Set credentials
set SUPABASE_ACCESS_TOKEN=sbp_a281688503d7a4a16e89e15b0c790396813ba977
set PROJECT_REF=rixmudvtbfkjpwjoefon

echo Deploying fixed send-job-digest-email function...
echo.

npx supabase functions deploy send-job-digest-email --project-ref %PROJECT_REF%

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to deploy function
    pause
    exit /b 1
)

echo.
echo ====================================
echo  SUCCESS! Function deployed
echo ====================================
echo.
echo The .catch() error is now fixed!
echo.
echo Test again:
echo 1. Go to: http://localhost:5173/admin/email-testing
echo 2. Enter your email
echo 3. Select "Job Digest (Last 8 Hours)"
echo 4. Click "Send Test Email"
echo.
pause
