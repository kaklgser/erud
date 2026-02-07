@echo off
echo ====================================
echo  Deploy Improved Email Template
echo ====================================
echo.
echo New Features:
echo  - PrimoBoost AI logo in header
echo  - Company logos in job cards (48x48)
echo  - Better subject line with salary hint
echo  - Compact, scannable job cards
echo  - Salary formatted as LPA
echo  - First name personalization
echo  - Clear primary action (Apply button)
echo  - Actionable tip (2x shortlisting rate)
echo  - Trust signals (preferences/unsubscribe)
echo  - Mobile-optimized design
echo.

set SUPABASE_ACCESS_TOKEN=sbp_a281688503d7a4a16e89e15b0c790396813ba977
set PROJECT_REF=rixmudvtbfkjpwjoefon

echo Deploying improved send-job-digest-email function...
echo.

npx supabase functions deploy send-job-digest-email --project-ref %PROJECT_REF%

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to deploy
    pause
    exit /b 1
)

echo.
echo ====================================
echo  SUCCESS! Improved Email Deployed
echo ====================================
echo.
echo Test the new email:
echo 1. Go to: http://localhost:5173/admin/email-testing
echo 2. Enter your Gmail
echo 3. Select "Job Digest (Last 8 Hours)"
echo 4. Click "Send Test Email"
echo.
echo You'll receive an email with:
echo  ✓ Clean, scannable design
echo  ✓ Salary in LPA format
echo  ✓ Company logos
echo  ✓ Better subject line
echo  ✓ Personalized greeting
echo  ✓ Trust signals
echo.
pause
