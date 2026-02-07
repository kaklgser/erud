import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';
import { EmailService, logEmailSend, replaceTemplateVariables } from '../_shared/emailService.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get pending emails from queue
    const { data: pendingEmails, error: queueError } = await supabase.rpc('get_pending_emails', {
      p_limit: 50
    });

    if (queueError) {
      console.error('Error fetching pending emails:', queueError);
      throw new Error('Failed to fetch pending emails from queue');
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      console.log('No pending emails in queue');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No pending emails to process',
          processed: 0
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

    console.log(`Processing ${pendingEmails.length} pending emails from queue`);

    const emailService = new EmailService();
    let processedCount = 0;
    let failedCount = 0;

    for (const queuedEmail of pendingEmails) {
      try {
        console.log(`Processing queued email ${queuedEmail.id} for ${queuedEmail.recipient_email}`);

        // Check if user should receive this email type
        if (queuedEmail.user_id) {
          const { data: shouldSend } = await supabase.rpc('should_send_email', {
            p_user_id: queuedEmail.user_id,
            p_email_type: queuedEmail.email_type,
            p_recipient_email: queuedEmail.recipient_email
          });

          if (!shouldSend) {
            console.log(`Skipping email ${queuedEmail.id} - user preferences prevent sending`);

            // Mark as failed with specific reason
            await supabase.rpc('update_email_queue_status', {
              p_queue_id: queuedEmail.id,
              p_status: 'failed',
              p_error_message: 'Blocked by user email preferences'
            });

            failedCount++;
            continue;
          }
        }

        // Get email template if template_name is provided in email_data
        let subject = queuedEmail.email_data.subject || 'Notification from PrimoBoost AI';
        let htmlContent = queuedEmail.email_data.html_content;
        let textContent = queuedEmail.email_data.text_content;

        if (queuedEmail.email_data.template_name) {
          const { data: template, error: templateError } = await supabase
            .from('email_templates')
            .select('*')
            .eq('template_name', queuedEmail.email_data.template_name)
            .eq('is_active', true)
            .maybeSingle();

          if (template && !templateError) {
            // Replace variables in template
            const variables = queuedEmail.email_data.variables || {};
            subject = replaceTemplateVariables(template.subject, variables);
            htmlContent = replaceTemplateVariables(template.html_content, variables);
            textContent = template.text_content
              ? replaceTemplateVariables(template.text_content, variables)
              : undefined;
          }
        }

        // Send email
        const result = await emailService.sendEmail({
          to: queuedEmail.recipient_email,
          subject: subject,
          html: htmlContent,
          text: textContent
        });

        if (result.success) {
          // Update queue status to sent
          await supabase.rpc('update_email_queue_status', {
            p_queue_id: queuedEmail.id,
            p_status: 'sent',
            p_error_message: null
          });

          // Log email send
          if (queuedEmail.user_id) {
            await logEmailSend(
              supabase,
              queuedEmail.user_id,
              queuedEmail.email_type,
              queuedEmail.recipient_email,
              subject,
              'sent'
            );
          }

          processedCount++;
          console.log(`Successfully sent queued email ${queuedEmail.id}`);
        } else {
          // Update queue status to failed (will retry if attempts < max_attempts)
          await supabase.rpc('update_email_queue_status', {
            p_queue_id: queuedEmail.id,
            p_status: queuedEmail.attempts + 1 >= queuedEmail.max_attempts ? 'failed' : 'pending',
            p_error_message: result.error || 'Failed to send email'
          });

          // Log email send failure
          if (queuedEmail.user_id) {
            await logEmailSend(
              supabase,
              queuedEmail.user_id,
              queuedEmail.email_type,
              queuedEmail.recipient_email,
              subject,
              'failed',
              result.error
            );
          }

          failedCount++;
          console.error(`Failed to send queued email ${queuedEmail.id}:`, result.error);
        }
      } catch (error: any) {
        console.error(`Error processing queued email ${queuedEmail.id}:`, error);

        // Update queue status
        await supabase.rpc('update_email_queue_status', {
          p_queue_id: queuedEmail.id,
          p_status: 'failed',
          p_error_message: error.message || 'Unexpected error during processing'
        });

        failedCount++;
      }

      // Small delay between emails to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Email queue processing complete`,
        total: pendingEmails.length,
        processed: processedCount,
        failed: failedCount
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
    console.error('Error processing email queue:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to process email queue'
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
