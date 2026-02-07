import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { EmailService } from '../_shared/emailService.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

// Format salary to LPA
function formatSalaryToLPA(amount: number): string {
  if (!amount) return '';
  const lpa = amount / 100000;
  if (lpa >= 10) return `₹${Math.round(lpa)} LPA`;
  return `₹${lpa.toFixed(1)} LPA`;
}

// Get first name
function getFirstName(fullName: string): string {
  return fullName.split(' ')[0] || fullName;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const emailData: JobDigestRequest = await req.json();
    const siteUrl = Deno.env.get('SITE_URL') || 'https://primoboost.ai';
    // Use the same logo from navbar (Cloudinary hosted)
    const logoUrl = 'https://res.cloudinary.com/dlkovvlud/image/upload/w_1000,c_fill,ar_1:1,g_auto,r_max,bo_5px_solid_red,b_rgb:262c35/v1751536902/a-modern-logo-design-featuring-primoboos_XhhkS8E_Q5iOwxbAXB4CqQ_HnpCsJn4S1yrhb826jmMDw_nmycqj.jpg';
    const jobCount = emailData.jobs.length;
    const firstName = getFirstName(emailData.recipientName);

    // Generate compact job cards with professional colors
    const jobCardsHtml = emailData.jobs.map((job) => {
      const companyLogoHtml = job.company_logo_url
        ? `<img src="${job.company_logo_url}" alt="${job.company_name}" width="48" height="48" style="border-radius:8px;display:block;border:1px solid #E5E7EB;" onerror="this.style.display='none';this.parentElement.innerHTML='<div style=\\'width:48px;height:48px;border-radius:8px;background:#EFF6FF;color:#2563EB;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:18px;border:1px solid #E5E7EB;\\'>${job.company_name.charAt(0).toUpperCase()}</div>';" />`
        : `<div style="width:48px;height:48px;border-radius:8px;background:#EFF6FF;color:#2563EB;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:18px;border:1px solid #E5E7EB;">${job.company_name.charAt(0).toUpperCase()}</div>`;

      const salaryText = job.package_amount ? formatSalaryToLPA(job.package_amount) : '';
      const metadata = [job.domain, job.location_type].filter(Boolean).join(' • ');

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
                        ${metadata}${salaryText ? ` • <span style="color:#166534;font-weight:600;">${salaryText}</span>` : ''}
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
      .job-card { margin-bottom: 8px !important; }
      .button { display: block !important; width: 100% !important; margin: 4px 0 !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#F8FAFC;">
    <tr>
      <td style="padding:20px 10px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="container" style="margin:0 auto;background:#FFFFFF;border-radius:12px;box-shadow:0 1px 2px rgba(0,0,0,0.04);">

          <!-- Clean Header -->
          <tr>
            <td style="padding:24px 24px 16px;background:#FFFFFF;border-bottom:1px solid #E5E7EB;text-align:center;">
              <img src="${logoUrl}" alt="PrimoBoost AI" width="140" class="header-logo" style="display:block;margin:0 auto 12px;" />
              <div style="font-size:14px;font-weight:600;color:#0F172A;">${jobCount} New Jobs • Updated in the last 8 hours</div>
            </td>
          </tr>

          <!-- Personalized Greeting -->
          <tr>
            <td style="padding:24px 24px 16px;background:#FFFFFF;">
              <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#0F172A;">Hi ${firstName},</p>
              <p style="margin:0;font-size:14px;color:#475569;line-height:1.6;">Based on your interest in <strong style="color:#0F172A;">SDE and entry-level roles</strong>, here are the latest jobs you can apply for today:</p>
            </td>
          </tr>

          <!-- Job Cards -->
          <tr>
            <td style="padding:0 24px 24px;background:#FFFFFF;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                ${jobCardsHtml}
              </table>
            </td>
          </tr>

          <!-- CTA to Platform -->
          <tr>
            <td style="padding:0 24px 24px;background:#FFFFFF;text-align:center;">
              <a href="${siteUrl}/jobs" target="_blank" style="display:inline-block;padding:12px 24px;background:#2563EB;color:#FFFFFF;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">View All Matching Jobs</a>
            </td>
          </tr>

          <!-- Actionable Tip -->
          <tr>
            <td style="padding:0 24px 24px;background:#FFFFFF;">
              <div style="background:#EFF6FF;border-left:4px solid #2563EB;padding:16px;border-radius:8px;">
                <div style="font-size:13px;font-weight:600;color:#2563EB;margin:0 0 4px;">Why apply early?</div>
                <div style="font-size:13px;color:#475569;line-height:1.6;">Candidates who apply within <strong style="color:#0F172A;">24 hours</strong> see 2× higher shortlisting rates.</div>
              </div>
            </td>
          </tr>

          <!-- Footer with Trust & Control -->
          <tr>
            <td style="padding:24px;background:#F1F5F9;border-top:1px solid #E5E7EB;text-align:center;border-radius:0 0 12px 12px;">
              <p style="margin:0 0 8px;font-size:12px;color:#64748B;">You're receiving this because you enabled <strong style="color:#475569;">job alerts for SDE & fresher roles</strong>.</p>
              <div style="font-size:12px;">
                <a href="${siteUrl}/profile/settings" style="color:#2563EB;text-decoration:none;margin:0 8px;">Manage preferences</a>
                <span style="color:#64748B;">|</span>
                <a href="${siteUrl}/unsubscribe" style="color:#2563EB;text-decoration:none;margin:0 8px;">Unsubscribe</a>
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

    // Plain text version
    const plainText = `
${jobCount} New Jobs • Updated in the last 8 hours

Hi ${firstName},

Based on your interest in SDE and entry-level roles, here are the latest jobs:

${emailData.jobs.map((job, i) => `
${i + 1}. ${job.role_title} — ${job.company_name}
   ${job.domain} • ${job.location_type} • ${job.package_amount ? formatSalaryToLPA(job.package_amount) : ''}
   Apply: ${job.application_link}
   Details: ${siteUrl}/jobs/${job.job_id}
`).join('\n')}

View all matching jobs: ${siteUrl}/jobs

Why apply early?
Candidates who apply within 24 hours see 2× higher shortlisting rates.

---
You're receiving this because you enabled job alerts for SDE & fresher roles.
Manage preferences: ${siteUrl}/profile/settings
Unsubscribe: ${siteUrl}/unsubscribe
    `.trim();

    // Send email
    const emailService = new EmailService();
    const result = await emailService.send({
      to: emailData.recipientEmail,
      subject: `${jobCount} Fresh SDE & Analyst Jobs (₹5-12 LPA) – Updated Today`,
      html: emailHtml,
      text: plainText,
    });

    // Log email
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const emailStatus = result.success ? 'sent' : 'failed';

    await supabase.from('email_logs').insert({
      recipient: emailData.recipientEmail,
      email_type: 'job_digest',
      subject: `${jobCount} Fresh SDE & Analyst Jobs (₹5-12 LPA) – Updated Today`,
      status: emailStatus,
      metadata: { job_count: jobCount, user_id: emailData.userId },
      error_message: result.error || null
    });

    if (result.success) {
      // Log notifications
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

      // Update last sent
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
