import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';
import { EmailService, logEmailSend } from '../_shared/emailService.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface BookingEmailRequest {
  bookingId: string;
  recipientEmail: string;
  recipientName: string;
  serviceTitle: string;
  bookingDate: string;
  slotLabel: string;
  bookingCode: string;
  bonusCredits: number;
}

function buildClientConfirmationHtml(data: BookingEmailRequest, siteUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Session Booking Confirmed</title>
  <style>
    body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f0fdf4; }
    .container { background: white; border-radius: 16px; padding: 40px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08); }
    .header { text-align: center; margin-bottom: 30px; }
    .header h1 { margin: 0; font-size: 28px; font-weight: bold; color: #065f46; }
    .success-badge { display: inline-block; background: #10b981; color: white; padding: 8px 20px; border-radius: 20px; font-weight: bold; font-size: 14px; margin-bottom: 20px; }
    .greeting { font-size: 16px; margin-bottom: 20px; color: #555; }
    .session-details { background: linear-gradient(135deg, #059669 0%, #0d9488 100%); color: white; padding: 28px; border-radius: 12px; margin: 24px 0; }
    .session-details h2 { margin: 0 0 18px 0; font-size: 22px; }
    .detail-row { margin: 12px 0; font-size: 15px; }
    .detail-row strong { display: inline-block; min-width: 110px; }
    .bonus-box { background: #fffbeb; border: 1px solid #fbbf24; border-radius: 10px; padding: 16px 20px; margin: 20px 0; text-align: center; }
    .bonus-box p { margin: 0; color: #92400e; font-weight: 600; font-size: 15px; }
    .instructions { background: #f0fdf4; border-left: 4px solid #10b981; padding: 18px; border-radius: 8px; margin: 20px 0; }
    .instructions h3 { margin-top: 0; color: #065f46; font-size: 16px; }
    .instructions ul { margin: 10px 0; padding-left: 20px; }
    .instructions li { margin: 8px 0; font-size: 14px; color: #374151; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #059669 0%, #0d9488 100%); color: white; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px; margin: 10px 5px; }
    .footer { text-align: center; margin-top: 36px; padding-top: 20px; border-top: 2px solid #e5e7eb; color: #6b7280; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="success-badge">Booking Confirmed</div>
      <h1>Your Session is Booked!</h1>
    </div>

    <div class="greeting">
      <p>Hi ${data.recipientName},</p>
      <p>Great news! Your 1:1 mentoring session has been successfully booked and confirmed. Here are your session details:</p>
    </div>

    <div class="session-details">
      <h2>${data.serviceTitle}</h2>
      <div class="detail-row"><strong>Date:</strong> ${data.bookingDate}</div>
      <div class="detail-row"><strong>Time:</strong> ${data.slotLabel}</div>
      <div class="detail-row"><strong>Booking Code:</strong> ${data.bookingCode}</div>
    </div>

    ${data.bonusCredits > 0 ? `
    <div class="bonus-box">
      <p>+${data.bonusCredits} JD Optimization Credits added to your account!</p>
    </div>
    ` : ''}

    <div class="instructions">
      <h3>How to Prepare:</h3>
      <ul>
        <li><strong>Save this email</strong> - Keep your booking code handy</li>
        <li><strong>Prepare your resume & JD</strong> - Have them ready for the session</li>
        <li><strong>List your questions</strong> - Make the most of your time with the mentor</li>
        <li><strong>Be on time</strong> - Join at the scheduled time for the full session</li>
        <li><strong>Stable internet</strong> - Ensure a reliable connection for a smooth experience</li>
      </ul>
    </div>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${siteUrl}/my-bookings" class="cta-button">View My Bookings</a>
    </div>

    <div class="footer">
      <p><strong>Need to reschedule or have questions?</strong></p>
      <p>Visit your bookings page or contact us at <a href="mailto:primoboostai@gmail.com" style="color: #059669;">primoboostai@gmail.com</a></p>
      <p style="margin-top: 16px;">Best regards,<br><strong>PrimoBoost AI Team</strong></p>
    </div>
  </div>
</body>
</html>`;
}

function buildMentorNotificationHtml(data: BookingEmailRequest): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Session Booked</title>
  <style>
    body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #eff6ff; }
    .container { background: white; border-radius: 16px; padding: 40px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08); }
    .header { text-align: center; margin-bottom: 24px; }
    .header h1 { margin: 0; font-size: 24px; color: #1e40af; }
    .badge { display: inline-block; background: #2563eb; color: white; padding: 6px 16px; border-radius: 16px; font-weight: bold; font-size: 13px; margin-bottom: 16px; }
    .details-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 24px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
    .detail-row:last-child { border-bottom: none; }
    .label { font-weight: 600; color: #475569; }
    .value { color: #1e293b; }
    .footer { text-align: center; margin-top: 28px; color: #6b7280; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">New Booking</div>
      <h1>New 1:1 Session Booked</h1>
    </div>

    <p style="color: #555; font-size: 15px;">A new mentoring session has been booked. Here are the details:</p>

    <div class="details-card">
      <div class="detail-row"><span class="label">Service</span><span class="value">${data.serviceTitle}</span></div>
      <div class="detail-row"><span class="label">Client Name</span><span class="value">${data.recipientName}</span></div>
      <div class="detail-row"><span class="label">Client Email</span><span class="value">${data.recipientEmail}</span></div>
      <div class="detail-row"><span class="label">Date</span><span class="value">${data.bookingDate}</span></div>
      <div class="detail-row"><span class="label">Time Slot</span><span class="value">${data.slotLabel}</span></div>
      <div class="detail-row"><span class="label">Booking Code</span><span class="value">${data.bookingCode}</span></div>
    </div>

    <div class="footer">
      <p>This is an automated notification from PrimoBoost AI.</p>
    </div>
  </div>
</body>
</html>`;
}

function buildReminderHtml(data: BookingEmailRequest, siteUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Session Reminder</title>
  <style>
    body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fefce8; }
    .container { background: white; border-radius: 16px; padding: 40px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08); }
    .header { text-align: center; margin-bottom: 24px; }
    .header h1 { margin: 0; font-size: 26px; color: #92400e; }
    .reminder-badge { display: inline-block; background: #f59e0b; color: white; padding: 8px 20px; border-radius: 20px; font-weight: bold; font-size: 14px; margin-bottom: 16px; }
    .session-details { background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%); color: white; padding: 24px; border-radius: 12px; margin: 20px 0; }
    .session-details h2 { margin: 0 0 14px 0; font-size: 20px; }
    .detail-row { margin: 10px 0; font-size: 15px; }
    .detail-row strong { display: inline-block; min-width: 110px; }
    .checklist { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 18px; border-radius: 8px; margin: 20px 0; }
    .checklist h3 { margin-top: 0; color: #92400e; font-size: 16px; }
    .checklist ul { margin: 10px 0; padding-left: 20px; }
    .checklist li { margin: 8px 0; font-size: 14px; color: #374151; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%); color: white; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px; }
    .footer { text-align: center; margin-top: 28px; padding-top: 16px; border-top: 2px solid #e5e7eb; color: #6b7280; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="reminder-badge">Reminder</div>
      <h1>Your Session is Tomorrow!</h1>
    </div>

    <p style="color: #555; font-size: 16px;">Hi ${data.recipientName}, just a friendly reminder about your upcoming session:</p>

    <div class="session-details">
      <h2>${data.serviceTitle}</h2>
      <div class="detail-row"><strong>Date:</strong> ${data.bookingDate}</div>
      <div class="detail-row"><strong>Time:</strong> ${data.slotLabel}</div>
      <div class="detail-row"><strong>Booking Code:</strong> ${data.bookingCode}</div>
    </div>

    <div class="checklist">
      <h3>Quick Checklist:</h3>
      <ul>
        <li>Resume and job description ready</li>
        <li>Questions prepared for the mentor</li>
        <li>Stable internet connection</li>
        <li>Quiet environment for the call</li>
      </ul>
    </div>

    <div style="text-align: center; margin: 24px 0;">
      <a href="${siteUrl}/my-bookings" class="cta-button">View My Bookings</a>
    </div>

    <div class="footer">
      <p>Need help? Contact <a href="mailto:primoboostai@gmail.com" style="color: #d97706;">primoboostai@gmail.com</a></p>
      <p>Best regards,<br><strong>PrimoBoost AI Team</strong></p>
    </div>
  </div>
</body>
</html>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const emailData: BookingEmailRequest = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const siteUrl = Deno.env.get('SITE_URL') || 'https://primoboost.ai';

    const emailService = new EmailService();
    const results: { client: boolean; mentor: boolean; reminder: boolean } = {
      client: false,
      mentor: false,
      reminder: false,
    };

    const clientSubject = `Session Confirmed: ${emailData.serviceTitle} on ${emailData.bookingDate}`;
    const clientHtml = buildClientConfirmationHtml(emailData, siteUrl);

    const clientResult = await emailService.sendEmail({
      to: emailData.recipientEmail,
      subject: clientSubject,
      html: clientHtml,
    });

    await logEmailSend(
      supabase,
      emailData.bookingId,
      'session_booking_confirmation',
      emailData.recipientEmail,
      clientSubject,
      clientResult.success ? 'sent' : 'failed',
      clientResult.error
    );
    results.client = clientResult.success;

    const mentorEmail = Deno.env.get('HR_EMAIL') || 'primoboostai@gmail.com';
    const mentorSubject = `New Session Booked: ${emailData.serviceTitle} on ${emailData.bookingDate}`;
    const mentorHtml = buildMentorNotificationHtml(emailData);

    const mentorResult = await emailService.sendEmail({
      to: mentorEmail,
      subject: mentorSubject,
      html: mentorHtml,
    });

    await logEmailSend(
      supabase,
      emailData.bookingId,
      'session_booking_mentor_notification',
      mentorEmail,
      mentorSubject,
      mentorResult.success ? 'sent' : 'failed',
      mentorResult.error
    );
    results.mentor = mentorResult.success;

    try {
      const bookingDateObj = new Date(emailData.bookingDate);
      if (!isNaN(bookingDateObj.getTime())) {
        const reminderDate = new Date(bookingDateObj);
        reminderDate.setDate(reminderDate.getDate() - 1);
        reminderDate.setHours(9, 0, 0, 0);

        const now = new Date();
        if (reminderDate > now) {
          const reminderHtml = buildReminderHtml(emailData, siteUrl);
          const reminderSubject = `Reminder: Your session is tomorrow - ${emailData.serviceTitle}`;

          await supabase.from('email_queue').insert({
            user_id: emailData.bookingId,
            email_type: 'session_reminder_24h',
            recipient_email: emailData.recipientEmail,
            email_data: {
              subject: reminderSubject,
              html_content: reminderHtml,
            },
            priority: 1,
            scheduled_for: reminderDate.toISOString(),
            status: 'pending',
            max_attempts: 3,
          });
          results.reminder = true;
        }
      }
    } catch (reminderErr) {
      console.error('Failed to queue reminder email:', reminderErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
        message: 'Session booking emails processed',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error sending session booking email:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to send session booking email',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
