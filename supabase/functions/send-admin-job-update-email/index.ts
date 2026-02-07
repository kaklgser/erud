import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';
import { EmailService, logEmailSend } from '../_shared/emailService.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface JobUpdateEmailRequest {
  jobId: string;
  jobTitle: string;
  companyName: string;
  updateType: 'created' | 'updated' | 'deactivated';
  changes?: Record<string, { old: any; new: any }>;
  updatedBy: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const emailData: JobUpdateEmailRequest = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get subscribed users who have admin_announcements enabled
    const { data: usersWithPreferences, error: usersError } = await supabase
      .from('email_preferences')
      .select('user_id')
      .eq('email_enabled', true)
      .eq('admin_announcements', true);

    if (usersError) {
      console.error('Error fetching users with preferences:', usersError);
      throw new Error('Failed to fetch subscribed users');
    }

    if (!usersWithPreferences || usersWithPreferences.length === 0) {
      console.log('No subscribed users found for admin job updates');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No subscribed users to notify',
          sentCount: 0
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

    // Get user emails
    const userIds = usersWithPreferences.map(u => u.user_id);
    const { data: users, error: userEmailsError } = await supabase.auth.admin.listUsers();

    if (userEmailsError) {
      console.error('Error fetching user emails:', userEmailsError);
      throw new Error('Failed to fetch user emails');
    }

    const emailService = new EmailService();
    let sentCount = 0;
    let failedCount = 0;

    // Generate changes HTML if available
    let changesHtml = '';
    if (emailData.changes && Object.keys(emailData.changes).length > 0) {
      changesHtml = `
        <div class="changes-section">
          <h3>Changes Made:</h3>
          <table class="changes-table">
            <thead>
              <tr>
                <th>Field</th>
                <th>Previous Value</th>
                <th>New Value</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(emailData.changes)
                .map(([field, { old, new: newVal }]) => `
                  <tr>
                    <td><strong>${field}</strong></td>
                    <td>${old || 'N/A'}</td>
                    <td>${newVal || 'N/A'}</td>
                  </tr>
                `)
                .join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    // Determine action text and color based on update type
    let actionText = '';
    let actionColor = '';
    let actionIcon = '';

    switch (emailData.updateType) {
      case 'created':
        actionText = 'New Job Posted';
        actionColor = '#10b981';
        actionIcon = '✨';
        break;
      case 'updated':
        actionText = 'Job Updated';
        actionColor = '#3b82f6';
        actionIcon = '✏️';
        break;
      case 'deactivated':
        actionText = 'Job Deactivated';
        actionColor = '#ef4444';
        actionIcon = '🚫';
        break;
    }

    for (const user of users.users.filter(u => userIds.includes(u.id))) {
      try {
        // Check if user should receive email
        const { data: shouldSend } = await supabase.rpc('should_send_email', {
          p_user_id: user.id,
          p_email_type: 'admin_job_update',
          p_recipient_email: user.email
        });

        if (!shouldSend) {
          console.log(`Skipping email for user ${user.email} due to preferences`);
          continue;
        }

        const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Job Update Notification</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .container {
      background: white;
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, ${actionColor} 0%, ${actionColor}dd 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .job-details {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid ${actionColor};
    }
    .job-details h2 {
      margin-top: 0;
      color: ${actionColor};
      font-size: 20px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      margin: 10px 0;
      padding: 10px 0;
      border-bottom: 1px solid #e0e0e0;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .label {
      font-weight: bold;
      color: #555;
    }
    .value {
      color: #333;
    }
    .changes-section {
      margin: 20px 0;
    }
    .changes-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    .changes-table th,
    .changes-table td {
      padding: 10px;
      border: 1px solid #e0e0e0;
      text-align: left;
    }
    .changes-table th {
      background: #f8f9fa;
      font-weight: bold;
    }
    .action-button {
      display: inline-block;
      background: ${actionColor};
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: bold;
      font-size: 14px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #eee;
      color: #777;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${actionIcon} ${actionText}</h1>
    </div>

    <div class="job-details">
      <h2>${emailData.jobTitle}</h2>
      <div class="detail-row">
        <span class="label">Company:</span>
        <span class="value">${emailData.companyName}</span>
      </div>
      <div class="detail-row">
        <span class="label">Job ID:</span>
        <span class="value">${emailData.jobId}</span>
      </div>
      <div class="detail-row">
        <span class="label">Action:</span>
        <span class="value">${actionText}</span>
      </div>
      <div class="detail-row">
        <span class="label">Updated By:</span>
        <span class="value">${emailData.updatedBy}</span>
      </div>
      <div class="detail-row">
        <span class="label">Date:</span>
        <span class="value">${new Date().toLocaleString()}</span>
      </div>
    </div>

    ${changesHtml}

    <div style="text-align: center;">
      <a href="${Deno.env.get('SITE_URL') || 'https://primoboost.ai'}/admin/jobs/${emailData.jobId}" class="action-button">
        View Job Details
      </a>
    </div>

    <div class="footer">
      <p><strong>PrimoBoost AI Admin Notifications</strong></p>
      <p>This is an automated notification about job listing changes.</p>
      <p style="margin-top: 15px; font-size: 12px; color: #999;">
        To manage your notification preferences, visit your <a href="${Deno.env.get('SITE_URL') || 'https://primoboost.ai'}/settings/notifications">settings page</a>.
      </p>
    </div>
  </div>
</body>
</html>
        `;

        const subject = `${actionIcon} ${actionText}: ${emailData.jobTitle} at ${emailData.companyName}`;

        const result = await emailService.sendEmail({
          to: user.email!,
          subject: subject,
          html: emailHtml,
        });

        if (result.success) {
          sentCount++;
          await logEmailSend(
            supabase,
            user.id,
            'admin_job_update',
            user.email!,
            subject,
            'sent'
          );
        } else {
          failedCount++;
          await logEmailSend(
            supabase,
            user.id,
            'admin_job_update',
            user.email!,
            subject,
            'failed',
            result.error
          );
        }
      } catch (error: any) {
        console.error(`Error sending email to ${user.email}:`, error);
        failedCount++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Job update notifications sent successfully`,
        sentCount: sentCount,
        failedCount: failedCount,
        totalUsers: usersWithPreferences.length
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('Error sending admin job update emails:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to send admin job update emails'
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
