import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';
import { EmailService, logEmailSend } from '../_shared/emailService.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface BlogPostEmailRequest {
  postId: string;
  title: string;
  excerpt: string;
  author: string;
  category: string;
  imageUrl?: string;
  slug: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const emailData: BlogPostEmailRequest = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get subscribed users who have marketing and admin announcement emails enabled
    const { data: usersWithPreferences, error: usersError } = await supabase
      .from('email_preferences')
      .select('user_id')
      .eq('email_enabled', true)
      .eq('marketing_emails', true)
      .eq('admin_announcements', true);

    if (usersError) {
      console.error('Error fetching users with preferences:', usersError);
      throw new Error('Failed to fetch subscribed users');
    }

    if (!usersWithPreferences || usersWithPreferences.length === 0) {
      console.log('No subscribed users found for blog post notifications');
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

    const siteUrl = Deno.env.get('SITE_URL') || 'https://primoboost.ai';
    const blogPostUrl = `${siteUrl}/blog/${emailData.slug}`;

    for (const user of users.users.filter(u => userIds.includes(u.id))) {
      try {
        // Check if user should receive email
        const { data: shouldSend } = await supabase.rpc('should_send_email', {
          p_user_id: user.id,
          p_email_type: 'admin_blog_post',
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
  <title>New Blog Post</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 650px;
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
      text-align: center;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0 0 10px 0;
      font-size: 28px;
      font-weight: bold;
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .category-badge {
      display: inline-block;
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      color: white;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
      margin-bottom: 20px;
    }
    .post-image {
      width: 100%;
      max-height: 300px;
      object-fit: cover;
      border-radius: 12px;
      margin: 20px 0;
    }
    .post-title {
      font-size: 24px;
      font-weight: bold;
      color: #1f2937;
      margin: 20px 0 15px 0;
      line-height: 1.3;
    }
    .post-excerpt {
      color: #4b5563;
      font-size: 16px;
      line-height: 1.8;
      margin: 15px 0 25px 0;
    }
    .author-section {
      display: flex;
      align-items: center;
      padding: 15px 0;
      border-top: 1px solid #e5e7eb;
      border-bottom: 1px solid #e5e7eb;
      margin: 20px 0;
    }
    .author-section .author-icon {
      font-size: 20px;
      margin-right: 10px;
    }
    .author-section .author-name {
      font-weight: 600;
      color: #1f2937;
    }
    .read-more-button {
      display: inline-block;
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      color: white;
      padding: 14px 32px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: bold;
      font-size: 16px;
      margin: 20px 0;
      transition: all 0.3s ease;
    }
    .read-more-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(59, 130, 246, 0.4);
    }
    .cta-section {
      text-align: center;
      margin: 30px 0;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #eee;
      color: #777;
      font-size: 13px;
    }
    .footer a {
      color: #3b82f6;
      text-decoration: none;
    }
    .footer a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📝 New Blog Post</h1>
      <div class="category-badge">${emailData.category}</div>
    </div>

    ${emailData.imageUrl ? `<img src="${emailData.imageUrl}" alt="${emailData.title}" class="post-image">` : ''}

    <h2 class="post-title">${emailData.title}</h2>

    <div class="author-section">
      <span class="author-icon">✍️</span>
      <span class="author-name">By ${emailData.author}</span>
    </div>

    <p class="post-excerpt">${emailData.excerpt}</p>

    <div class="cta-section">
      <a href="${blogPostUrl}" class="read-more-button">
        Read Full Article →
      </a>
    </div>

    <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 8px; margin: 25px 0;">
      <h3 style="margin-top: 0; color: #1e40af; font-size: 16px;">💡 Why You'll Love This Article:</h3>
      <ul style="margin: 10px 0; padding-left: 20px; color: #1e40af;">
        <li style="margin: 8px 0;">Expert insights to help you advance your career</li>
        <li style="margin: 8px 0;">Practical tips you can apply immediately</li>
        <li style="margin: 8px 0;">Real-world examples and case studies</li>
        <li style="margin: 8px 0;">Free resources and templates</li>
      </ul>
    </div>

    <div class="footer">
      <p><strong>PrimoBoost AI Blog</strong></p>
      <p>Stay updated with the latest career tips, job search strategies, and industry insights.</p>
      <p style="margin-top: 15px;">
        <a href="${siteUrl}/blog">Browse All Articles</a> |
        <a href="${siteUrl}/settings/notifications">Manage Notifications</a>
      </p>
      <p style="margin-top: 15px; font-size: 12px; color: #999;">
        You're receiving this email because you subscribed to blog updates on PrimoBoost AI.<br>
        To unsubscribe from blog notifications, update your <a href="${siteUrl}/settings/notifications">email preferences</a>.
      </p>
    </div>
  </div>
</body>
</html>
        `;

        const subject = `📝 New Blog Post: ${emailData.title}`;

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
            'admin_blog_post',
            user.email!,
            subject,
            'sent'
          );
        } else {
          failedCount++;
          await logEmailSend(
            supabase,
            user.id,
            'admin_blog_post',
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
        message: `Blog post notifications sent successfully`,
        sentCount: sentCount,
        failedCount: failedCount,
        totalUsers: usersWithPreferences.length,
        blogPostUrl: blogPostUrl
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
    console.error('Error sending blog post notification emails:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to send blog post notification emails'
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
