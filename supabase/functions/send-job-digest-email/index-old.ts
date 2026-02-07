import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';
import { EmailService, logEmailSend } from '../_shared/emailService.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface JobDigestRequest {
  userId: string;
  recipientEmail: string;
  recipientName: string;
  jobs: Array<{
    job_id: string;
    company_name: string;
    company_logo_url?: string;
    role_title: string;
    domain: string;
    application_link: string;
    location_type?: string;
    package_amount?: number;
  }>;
  dateRange?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const emailData: JobDigestRequest = await req.json();
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // If no jobs, don't send email
    if (!emailData.jobs || emailData.jobs.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No jobs to send, email skipped',
          recipient: emailData.recipientEmail
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const dateRange = emailData.dateRange || 'Last 24 hours';
    const jobCount = emailData.jobs.length;
    const siteUrl = Deno.env.get('SITE_URL') || 'https://primoboost.ai';

    // Generate job cards HTML with company logos
    const jobCardsHtml = emailData.jobs.map((job, index) => {
      const logoHtml = job.company_logo_url
        ? `<img src="${job.company_logo_url}" alt="${job.company_name}" style="max-width: 100%; max-height: 100%; object-fit: contain;" onerror="this.style.display='none';this.parentElement.innerHTML='<div style=\\'width:100%;height:100%;border-radius:8px;background:linear-gradient(135deg,#4F46E5 0%,#7C3AED 100%);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:24px;\\'>${job.company_name.charAt(0).toUpperCase()}</div>';" />`
        : `<div style="width:100%;height:100%;border-radius:8px;background:linear-gradient(135deg,#4F46E5 0%,#7C3AED 100%);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:24px;">${job.company_name.charAt(0).toUpperCase()}</div>`;

      return `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="job-card" style="background:#1e293b;border:2px solid #334155;border-radius:12px;margin:20px 0;overflow:hidden;">
        <tr>
          <td style="padding:20px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td style="width:80px;vertical-align:top;padding-right:16px;">
                  <div style="width:80px;height:80px;background:#0f172a;border:2px solid #334155;border-radius:8px;display:flex;align-items:center;justify-content:center;overflow:hidden;">
                    ${logoHtml}
                  </div>
                </td>
                <td style="vertical-align:top;">
                  <h3 style="margin:0 0 8px 0;font-size:18px;color:#ffffff;font-weight:600;">${job.role_title}</h3>
                  <p style="margin:0 0 12px 0;font-size:14px;color:#94a3b8;">${job.company_name}</p>
                  <div style="margin:12px 0;">
                    <span style="display:inline-block;margin-right:12px;font-size:13px;color:#94a3b8;">🎯 ${job.domain}</span>
                    ${job.location_type ? `<span style="display:inline-block;margin-right:12px;font-size:13px;color:#94a3b8;">📍 ${job.location_type}</span>` : ''}
                    ${job.package_amount ? `<span style="display:inline-block;font-size:13px;color:#94a3b8;">💰 ₹${job.package_amount.toLocaleString()}</span>` : ''}
                  </div>
                  <div style="margin-top:16px;">
                    <a href="${job.application_link}" target="_blank" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;margin-right:8px;">Apply Now →</a>
                    <a href="${siteUrl}/jobs/${job.job_id}" target="_blank" style="display:inline-block;padding:12px 24px;background:transparent;color:#3b82f6;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;border:2px solid #3b82f6;">View Details</a>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      `;
    }).join('');

    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Your Job Digest - PrimoBoost AI</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, sans-serif !important;}
  </style>
  <![endif]-->
  <style>
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; padding: 10px !important; }
      .header h1 { font-size: 24px !important; }
      .job-card td { display: block !important; width: 100% !important; }
      .logo-container { margin-bottom: 16px !important; }
      .apply-button { display: block !important; margin-bottom: 8px !important; }
    }
    @media (prefers-color-scheme: dark) {
      body { background-color: #0f172a !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:Arial,sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#0f172a;">
    <tr>
      <td style="padding:20px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="650" class="email-container" style="margin:0 auto;background-color:#1e293b;border-radius:16px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#4F46E5 0%,#7C3AED 100%);padding:30px;text-align:center;">
              <h1 style="margin:0 0 10px 0;font-size:28px;color:#ffffff;font-weight:bold;">Your Job Digest</h1>
              <p style="margin:0;color:#e0e7ff;font-size:14px;">${dateRange}</p>
              <div style="display:inline-block;background:rgba(255,255,255,0.2);color:#ffffff;padding:10px 24px;border-radius:20px;font-weight:bold;font-size:14px;margin-top:15px;">
                ${jobCount} New ${jobCount === 1 ? 'Job' : 'Jobs'} Matching Your Preferences
              </div>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:30px 30px 20px 30px;">
              <p style="margin:0 0 10px 0;font-size:16px;color:#f1f5f9;">Hi ${emailData.recipientName},</p>
              <p style="margin:0;font-size:16px;color:#cbd5e1;">We found ${jobCount} exciting ${jobCount === 1 ? 'opportunity' : 'opportunities'} that match your preferences! Here's what's new:</p>
            </td>
          </tr>

          <!-- Job Cards -->
          <tr>
            <td style="padding:0 30px;">
              ${jobCardsHtml}
            </td>
          </tr>

          <!-- Tip Box -->
          <tr>
            <td style="padding:20px 30px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#1e3a8a;border-left:4px solid #3b82f6;border-radius:8px;">
                <tr>
                  <td style="padding:20px;">
                    <h3 style="margin:0 0 8px 0;color:#60a5fa;font-size:16px;">💡 Quick Tip:</h3>
                    <p style="margin:0;color:#93c5fd;font-size:14px;">Apply early to increase your chances! Employers often review applications in the order they receive them.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Browse All Jobs Button -->
          <tr>
            <td style="padding:20px 30px;text-align:center;">
              <a href="${siteUrl}/jobs" style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#4F46E5 0%,#7C3AED 100%);color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:14px;">🔍 Browse All Jobs</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:30px;text-align:center;border-top:2px solid #334155;">
              <p style="margin:0 0 15px 0;color:#f1f5f9;font-size:14px;"><strong>PrimoBoost AI</strong> - Your Intelligent Career Companion</p>
              <p style="margin:0 0 15px 0;font-size:13px;">
                <a href="${siteUrl}/profile" style="color:#3b82f6;text-decoration:none;">Update Preferences</a>
                <span style="color:#64748b;"> | </span>
                <a href="${siteUrl}/settings" style="color:#3b82f6;text-decoration:none;">Manage Notifications</a>
              </p>
              <p style="margin:0;font-size:12px;color:#64748b;">
                You're receiving this email because you subscribed to job notifications on PrimoBoost AI.<br>
                To unsubscribe, <a href="${siteUrl}/unsubscribe?token=${emailData.userId}" style="color:#3b82f6;text-decoration:none;">click here</a>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    console.log(`Sending job digest email to: ${emailData.recipientEmail}`);
    console.log(`Number of jobs: ${jobCount}`);
    console.log(`User ID: ${emailData.userId}`);

    const emailService = new EmailService();
    const subject = `${jobCount} New ${jobCount === 1 ? 'Job' : 'Jobs'} for You - PrimoBoost AI`;

    // Generate plain text version for better deliverability
    const plainText = `
Hi ${emailData.recipientName},

We found ${jobCount} exciting ${jobCount === 1 ? 'opportunity' : 'opportunities'} that match your preferences!

${emailData.jobs.map((job, index) => `
${index + 1}. ${job.role_title} at ${job.company_name}
   Domain: ${job.domain}
   ${job.location_type ? `Location: ${job.location_type}` : ''}
   ${job.package_amount ? `Package: ₹${job.package_amount.toLocaleString()}` : ''}
   Apply Now: ${job.application_link}
`).join('\n')}

Apply early to increase your chances! Employers often review applications in the order they receive them.

Browse all jobs: ${siteUrl}/jobs

---
PrimoBoost AI - Your Intelligent Career Companion
Update Preferences: ${siteUrl}/profile
Manage Notifications: ${siteUrl}/settings

To unsubscribe: ${siteUrl}/unsubscribe?token=${emailData.userId}
    `.trim();

    const result = await emailService.sendEmail({
      to: emailData.recipientEmail,
      subject: subject,
      html: emailHtml,
      text: plainText,
    });

    const emailStatus = result.success ? 'sent' : 'failed';

    // Log email send
    await logEmailSend(
      supabase,
      emailData.userId,
      'job_digest',
      emailData.recipientEmail,
      subject,
      emailStatus,
      result.error
    );

    if (result.success) {
      // Log each job notification
      for (const job of emailData.jobs) {
        try {
          await supabase.rpc('log_notification_send', {
            p_user_id: emailData.userId,
            p_job_id: job.job_id,
            p_email_status: emailStatus,
            p_notification_type: 'daily_digest'
          });
        } catch (err) {
          console.error('Error logging notification:', err);
        }
      }

      // Update last sent timestamp
      try {
        await supabase.rpc('update_subscription_last_sent', {
          p_user_id: emailData.userId
        });
      } catch (err) {
        console.error('Error updating last sent:', err);
      }
    }

    if (!result.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: result.error,
          message: 'Failed to send job digest email'
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
        message: 'Job digest email sent successfully',
        recipient: emailData.recipientEmail,
        jobCount: jobCount,
        userId: emailData.userId,
        messageId: result.messageId
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
    console.error('Error sending job digest email:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to send job digest email'
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