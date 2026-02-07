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

    // Generate job cards HTML
    const jobCardsHtml = emailData.jobs.map((job, index) => `

