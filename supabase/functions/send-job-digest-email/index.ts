import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';
import { EmailService } from '../_shared/emailService.ts';

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

function formatSalaryToLPA(amount: number): string {
  if (!amount) return '';
  const lpa = amount / 100000;
  if (lpa >= 10) return `₹${Math.round(lpa)} LPA`;
  return `₹${lpa.toFixed(1)} LPA`;
}

function getFirstName(fullName: string): string {
  return fullName.split(' ')[0] || fullName;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const emailData: JobDigestRequest = await req.json();
    const siteUrl = Deno.env.get('SITE_URL') || 'https://primoboost.ai';
    const logoUrl = 'https://res.cloudinary.com/dlkovvlud/image/upload/w_1000,c_fill,ar_1:1,g_auto,r_max,bo_5px_solid_red,b_rgb:262c35/v1751536902/a-modern-logo-design-featuring-primoboos_XhhkS8E_Q5iOwxbAXB4CqQ_HnpCsJn4S1yrhb826jmMDw_nmycqj.jpg';
    const jobCount = emailData.jobs.length;
    const firstName = getFirstName(emailData.recipientName);

    const jobCardsHtml = emailData.jobs.map((job) => {
      const companyLogoHtml = job.company_logo_url
        ? `<img src="${job.company_logo_url}" alt="${job.company_name}" width="48" height="48" style="border-radius:8px;display:block;border:1px solid #E5E7EB;" />`
        : `<div style="width:48px;height:48px;border-radius:8px;background:#EFF6FF;color:#2563EB;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:18px;border:1px solid #E5E7EB;">${job.company_name.charAt(0).toUpperCase()}</div>`;

      const salaryText = job.package_amount ? formatSalaryToLPA(job.package_amount) : '';
      const metadata = [job.domain, job.location_type].filter(Boolean).join(' &bull; ');

      return `
      <tr>
        <td style="padding:0;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#FFFFFF;border:1px solid #E5E7EB;border-radius:12px;margin-bottom:12px;">
            <tr>
              <td style="padding:16px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                  <tr>
                    <td style="width:48px;padding-right:12px;vertical-align:top;">
                      ${companyLogoHtml}
                    </td>
                    <td style="vertical-align:top;">
                      <div style="font-size:16px;font-weight:600;color:#0F172A;margin:0 0 4px 0;">${job.role_title}</div>
                      <div style="font-size:14px;color:#475569;margin:0 0 8px 0;">${job.company_name}</div>
                      <div style="font-size:13px;color:#64748B;margin:0 0 12px 0;">
                        ${metadata}${salaryText ? ` &bull; <span style="color:#166534;font-weight:600;">${salaryText}</span>` : ''}
                      </div>
                      <div>
                        <a href="${job.application_link}" target="_blank" style="display:inline-block;padding:10px 16px;background:#2563EB;color:#FFFFFF;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;margin-right:8px;">Apply</a>
                        <a href="${siteUrl}/jobs/${job.job_id}" target="_blank" style="display:inline-block;padding:10px 16px;background:#FFFFFF;color:#2563EB;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;border:1px solid #2563EB;">View Details</a>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      `;
    }).join('');

    const emailSubject = `${jobCount} New Job${jobCount > 1 ? 's' : ''} Matching Your Preferences - PrimoBoost AI`;

    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Job Digest</title>
  <style>
    @media screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .header-logo { width: 120px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#F8FAFC;">
    <tr>
      <td style="padding:20px 10px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="container" style="margin:0 auto;background:#FFFFFF;border-radius:12px;box-shadow:0 1px 2px rgba(0,0,0,0.04);">
          <tr>
            <td style="padding:24px 24px 16px;background:#FFFFFF;border-bottom:1px solid #E5E7EB;text-align:center;">
              <img src="${logoUrl}" alt="PrimoBoost AI" width="140" class="header-logo" style="display:block;margin:0 auto 12px;" />
              <div style="font-size:14px;font-weight:600;color:#0F172A;">${jobCount} New Job${jobCount > 1 ? 's' : ''} for You</div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 24px 16px;background:#FFFFFF;">
              <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#0F172A;">Hi ${firstName},</p>
              <p style="margin:0;font-size:14px;color:#475569;line-height:1.6;">Here are the latest jobs matching your preferences. Apply early for the best chances!</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 24px;background:#FFFFFF;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                ${jobCardsHtml}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 24px;background:#FFFFFF;text-align:center;">
              <a href="${siteUrl}/jobs" target="_blank" style="display:inline-block;padding:12px 24px;background:#2563EB;color:#FFFFFF;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">View All Jobs</a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 24px;background:#FFFFFF;">
              <div style="background:#EFF6FF;border-left:4px solid #2563EB;padding:16px;border-radius:8px;">
                <div style="font-size:13px;font-weight:600;color:#2563EB;margin:0 0 4px;">Pro tip</div>
                <div style="font-size:13px;color:#475569;line-height:1.6;">Candidates who apply within <strong style="color:#0F172A;">24 hours</strong> of posting see 2x higher shortlisting rates.</div>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;background:#F1F5F9;border-top:1px solid #E5E7EB;text-align:center;border-radius:0 0 12px 12px;">
              <p style="margin:0 0 8px;font-size:12px;color:#64748B;">You're receiving this because you enabled job alerts on PrimoBoost AI.</p>
              <div style="font-size:12px;">
                <a href="${siteUrl}/profile" style="color:#2563EB;text-decoration:none;margin:0 8px;">Manage preferences</a>
                <span style="color:#64748B;">|</span>
                <a href="${siteUrl}/profile" style="color:#2563EB;text-decoration:none;margin:0 8px;">Unsubscribe</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const plainText = `
${jobCount} New Job${jobCount > 1 ? 's' : ''} for You

Hi ${firstName},

Here are the latest jobs matching your preferences:

${emailData.jobs.map((job, i) => `
${i + 1}. ${job.role_title} - ${job.company_name}
   ${job.domain} | ${job.location_type || ''} ${job.package_amount ? '| ' + formatSalaryToLPA(job.package_amount) : ''}
   Apply: ${job.application_link}
   Details: ${siteUrl}/jobs/${job.job_id}
`).join('\n')}

View all jobs: ${siteUrl}/jobs

---
You're receiving this because you enabled job alerts on PrimoBoost AI.
Manage preferences: ${siteUrl}/profile
    `.trim();

    const emailService = new EmailService();
    const result = await emailService.sendEmail({
      to: emailData.recipientEmail,
      subject: emailSubject,
      html: emailHtml,
      text: plainText,
    });

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const emailStatus = result.success ? 'sent' : 'failed';

    await supabase.from('email_logs').insert({
      user_id: emailData.userId,
      recipient_email: emailData.recipientEmail,
      email_type: 'job_digest',
      subject: emailSubject,
      status: emailStatus,
      metadata: { job_count: jobCount },
      error_message: result.error || null,
      sent_at: result.success ? new Date().toISOString() : null,
    });

    if (result.success) {
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

      try {
        await supabase.rpc('update_subscription_last_sent', {
          p_user_id: emailData.userId
        });
      } catch (err) {
        console.error('Error updating last sent:', err);
      }
    }

    return new Response(
      JSON.stringify({ success: result.success, messageId: result.messageId }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error sending job digest email:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to send email' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
