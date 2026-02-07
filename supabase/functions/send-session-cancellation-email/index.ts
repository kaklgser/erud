import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';
import { EmailService, logEmailSend } from '../_shared/emailService.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CancellationEmailRequest {
  bookingId: string;
  recipientEmail: string;
  recipientName: string;
  serviceTitle: string;
  bookingDate: string;
  slotLabel: string;
  bookingCode: string;
}

function buildClientCancellationHtml(data: CancellationEmailRequest, siteUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Session Cancelled</title>
  <style>
    body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fef2f2; }
    .container { background: white; border-radius: 16px; padding: 40px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08); }
    .header { text-align: center; margin-bottom: 24px; }
    .header h1 { margin: 0; font-size: 26px; color: #991b1b; }
    .cancel-badge { display: inline-block; background: #ef4444; color: white; padding: 8px 20px; border-radius: 20px; font-weight: bold; font-size: 14px; margin-bottom: 16px; }
    .greeting { font-size: 16px; margin-bottom: 20px; color: #555; }
    .session-details { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
    .detail-row:last-child { border-bottom: none; }
    .label { font-weight: 600; color: #475569; }
    .value { color: #1e293b; text-decoration: line-through; opacity: 0.7; }
    .info-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px; margin: 20px 0; font-size: 14px; color: #92400e; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #059669 0%, #0d9488 100%); color: white; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px; }
    .footer { text-align: center; margin-top: 28px; padding-top: 16px; border-top: 2px solid #e5e7eb; color: #6b7280; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="cancel-badge">Cancelled</div>
      <h1>Session Cancelled</h1>
    </div>

    <div class="greeting">
      <p>Hi ${data.recipientName},</p>
      <p>Your 1:1 mentoring session has been cancelled as requested. Here are the details of the cancelled session:</p>
    </div>

    <div class="session-details">
      <div class="detail-row"><span class="label">Service</span><span class="value">${data.serviceTitle}</span></div>
      <div class="detail-row"><span class="label">Date</span><span class="value">${data.bookingDate}</span></div>
      <div class="detail-row"><span class="label">Time Slot</span><span class="value">${data.slotLabel}</span></div>
      <div class="detail-row"><span class="label">Booking Code</span><span class="value">${data.bookingCode}</span></div>
    </div>

    <div class="info-box">
      <strong>Need a different time?</strong> You can book a new session at any time from the session booking page. Your time slot has been released and is available for others.
    </div>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${siteUrl}/session" class="cta-button">Book a New Session</a>
    </div>

    <div class="footer">
      <p>Questions about your cancellation? Contact <a href="mailto:primoboostai@gmail.com" style="color: #059669;">primoboostai@gmail.com</a></p>
      <p>Best regards,<br><strong>PrimoBoost AI Team</strong></p>
    </div>
  </div>
</body>
</html>`;
}

function buildMentorCancellationHtml(data: CancellationEmailRequest): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Session Cancelled</title>
  <style>
    body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fef2f2; }
    .container { background: white; border-radius: 16px; padding: 40px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08); }
    .header { text-align: center; margin-bottom: 24px; }
    .header h1 { margin: 0; font-size: 24px; color: #991b1b; }
    .badge { display: inline-block; background: #ef4444; color: white; padding: 6px 16px; border-radius: 16px; font-weight: bold; font-size: 13px; margin-bottom: 16px; }
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
      <div class="badge">Session Cancelled</div>
      <h1>A Session Has Been Cancelled</h1>
    </div>

    <p style="color: #555; font-size: 15px;">A client has cancelled their upcoming session. The time slot has been released.</p>

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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const emailData: CancellationEmailRequest = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const siteUrl = Deno.env.get('SITE_URL') || 'https://primoboost.ai';

    const emailService = new EmailService();

    const clientSubject = `Session Cancelled: ${emailData.serviceTitle} on ${emailData.bookingDate}`;
    const clientHtml = buildClientCancellationHtml(emailData, siteUrl);

    const clientResult = await emailService.sendEmail({
      to: emailData.recipientEmail,
      subject: clientSubject,
      html: clientHtml,
    });

    await logEmailSend(
      supabase,
      emailData.bookingId,
      'session_cancellation',
      emailData.recipientEmail,
      clientSubject,
      clientResult.success ? 'sent' : 'failed',
      clientResult.error
    );

    const mentorEmail = Deno.env.get('HR_EMAIL') || 'primoboostai@gmail.com';
    const mentorSubject = `Session Cancelled by Client: ${emailData.serviceTitle} on ${emailData.bookingDate}`;
    const mentorHtml = buildMentorCancellationHtml(emailData);

    const mentorResult = await emailService.sendEmail({
      to: mentorEmail,
      subject: mentorSubject,
      html: mentorHtml,
    });

    await logEmailSend(
      supabase,
      emailData.bookingId,
      'session_cancellation_mentor',
      mentorEmail,
      mentorSubject,
      mentorResult.success ? 'sent' : 'failed',
      mentorResult.error
    );

    return new Response(
      JSON.stringify({
        success: true,
        results: { client: clientResult.success, mentor: mentorResult.success },
        message: 'Session cancellation emails processed',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error sending session cancellation email:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to send cancellation email',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
