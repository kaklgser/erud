import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { EmailService } from '../_shared/emailService.ts';
import { createClient } from 'jsr:@supabase/supabase-js';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface TestEmailRequest {
  to: string;
  emailType: 'welcome' | 'job_digest' | 'webinar_confirmation' | 'redemption' | 'custom';
  customSubject?: string;
  customHtml?: string;
  testData?: any;
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);

  // Create a Supabase client with the incoming Authorization header
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const authHeader = req.headers.get('Authorization') || '';
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const getIsAdmin = async (): Promise<boolean> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const email = userData.user?.email || '';
      if (email && email.toLowerCase() === 'primoboostai@gmail.com') return true;
      if (!userData.user) return false;
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', userData.user.id)
        .maybeSingle();
      return profile?.role === 'admin';
    } catch (_) {
      return false;
    }
  };

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method === 'GET') {
    const isAdmin = await getIsAdmin();
    const emailService = new EmailService({ adminBypass: isAdmin, mockIfNoSmtp: true } as any);
    const ok = isAdmin ? true : await emailService.verifyConnection();
    return new Response(
      JSON.stringify({ ok, adminBypass: isAdmin }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const {to, emailType, customSubject, customHtml, testData = {}} : TestEmailRequest = await req.json();

    if (!to) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Recipient email address is required'
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const isAdmin = await getIsAdmin();
    const emailService = new EmailService({ adminBypass: isAdmin, mockIfNoSmtp: true } as any);

    // Verify SMTP connection (skip for admin bypass)
    if (!isAdmin) {
      const isConnected = await emailService.verifyConnection();
      if (!isConnected) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'SMTP connection failed. Please check your email configuration.'
          }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }
    }

    let subject = customSubject;
    let html = customHtml;

    // Generate test emails based on type
    if (emailType === 'welcome') {
      subject = 'Test Welcome Email - PrimoBoost AI';
      html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .container { background: white; border-radius: 12px; padding: 30px; box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1); }
    .header { background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to PrimoBoost AI!</h1>
    </div>
    <p>Hi ${testData.name || 'Test User'},</p>
    <p>This is a test welcome email to verify your email configuration is working correctly.</p>
    <p>If you're seeing this email, congratulations! Your SMTP settings are configured properly.</p>
    <p><strong>Test Data:</strong></p>
    <pre>${JSON.stringify(testData, null, 2)}</pre>
    <p>Best regards,<br>The PrimoBoost AI Team</p>
  </div>
</body>
</html>
      `;
    } else if (emailType === 'job_digest') {
      subject = 'Test Job Digest Email - PrimoBoost AI';
      html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .container { background: white; border-radius: 12px; padding: 30px; }
    .header { background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 20px; border-radius: 8px; }
    .job-card { border: 2px solid #e5e7eb; border-radius: 8px; padding: 15px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Your Daily Job Digest</h1>
    </div>
    <p>Hi ${testData.name || 'Test User'},</p>
    <p>This is a test job digest email. Here are your matching jobs:</p>
    <div class="job-card">
      <h3>Senior Software Engineer</h3>
      <p><strong>Company:</strong> Test Company Inc.</p>
      <p><strong>Location:</strong> Remote</p>
      <p><strong>Salary:</strong> $120,000 - $150,000</p>
    </div>
    <div class="job-card">
      <h3>Full Stack Developer</h3>
      <p><strong>Company:</strong> Another Test Co.</p>
      <p><strong>Location:</strong> Hybrid</p>
      <p><strong>Salary:</strong> $100,000 - $130,000</p>
    </div>
    <p>Best regards,<br>The PrimoBoost AI Team</p>
  </div>
</body>
</html>
      `;
    } else if (emailType === 'webinar_confirmation') {
      subject = 'Test Webinar Confirmation - PrimoBoost AI';
      html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .container { background: white; border-radius: 12px; padding: 30px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Webinar Registration Confirmed!</h1>
    </div>
    <p>Dear ${testData.name || 'Test User'},</p>
    <p>This is a test webinar confirmation email.</p>
    <p><strong>Webinar:</strong> Test Webinar Session</p>
    <p><strong>Date:</strong> ${testData.date || 'Tomorrow'}</p>
    <p><strong>Time:</strong> ${testData.time || '10:00 AM'}</p>
    <p><strong>Meeting Link:</strong> https://meet.google.com/test-link</p>
    <p>See you at the webinar!</p>
    <p>Best regards,<br>The PrimoBoost AI Team</p>
  </div>
</body>
</html>
      `;
    } else if (emailType === 'redemption') {
      subject = 'Test Redemption Email - PrimoBoost AI';
      html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .container { background: white; border-radius: 12px; padding: 30px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; border-radius: 8px; }
    .amount { font-size: 32px; font-weight: bold; color: #10b981; text-align: center; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Redemption Request</h1>
    </div>
    <div class="amount">₹${testData.amount || '500.00'}</div>
    <p>This is a test redemption email.</p>
    <p><strong>User:</strong> ${testData.name || 'Test User'}</p>
    <p><strong>Method:</strong> ${testData.method || 'Bank Transfer'}</p>
    <p><strong>Transaction ID:</strong> TEST-${Date.now()}</p>
    <p>Best regards,<br>The PrimoBoost AI Team</p>
  </div>
</body>
</html>
      `;
    } else if (emailType === 'custom' && customSubject && customHtml) {
      subject = customSubject;
      html = customHtml;
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid email type or missing custom email data'
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Prefix subject for admin tests
    if (isAdmin && subject) {
      subject = `[ADMIN TEST] ${subject}`;
    }

    console.log(`Sending test ${emailType} email to: ${to}`);

    const result = await emailService.sendEmail({
      to: to,
      subject: subject!,
      html: html!,
    });

    if (!result.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: result.error,
          message: 'Failed to send test email'
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Test ${emailType} email sent successfully!`,
        recipient: to,
        messageId: result.messageId,
        emailType: emailType,
        adminBypass: isAdmin
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error sending test email:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to send test email'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
