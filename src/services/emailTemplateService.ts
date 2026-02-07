import { supabase } from '../lib/supabaseClient';

export interface EmailTemplate {
  id: string;
  template_name: string;
  subject: string;
  html_content: string;
  text_content?: string;
  variables: Record<string, string>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailPreferences {
  id?: string;
  user_id: string;
  email_enabled: boolean;
  marketing_emails: boolean;
  welcome_emails: boolean;
  job_digest_emails: boolean;
  job_digest_frequency: 'immediate' | 'daily' | 'weekly' | 'disabled';
  webinar_notifications: boolean;
  payment_notifications: boolean;
  subscription_notifications: boolean;
  application_updates: boolean;
  profile_reminders: boolean;
  referral_notifications: boolean;
  wallet_notifications: boolean;
  interview_reminders: boolean;
  resume_notifications: boolean;
  admin_announcements: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  quiet_hours_timezone: string;
  daily_digest_time: string;
  weekly_digest_day?: number;
  created_at?: string;
  updated_at?: string;
}

export interface EmailBounce {
  id: string;
  email_address: string;
  bounce_type: 'hard' | 'soft' | 'complaint' | 'unsubscribe';
  bounce_subtype?: string;
  bounce_reason?: string;
  bounced_at: string;
  email_log_id?: string;
  metadata: Record<string, any>;
  is_active: boolean;
  resolved_at?: string;
  resolved_by?: string;
  created_at: string;
}

export interface EmailLog {
  id: string;
  user_id?: string;
  email_type: string;
  recipient_email: string;
  subject: string;
  status: 'sent' | 'failed' | 'pending' | 'bounced';
  error_message?: string;
  sent_at: string;
  opened_at?: string;
  clicked_at?: string;
  metadata?: Record<string, any>;
  template_used?: string;
  bounce_type?: string;
  created_at: string;
}

export interface EmailDeliveryMetrics {
  total_emails: number;
  delivered: number;
  failed: number;
  bounced: number;
  delivery_rate: number;
  bounce_rate: number;
}

export interface EmailEngagementMetrics {
  email_type: string;
  total_sent: number;
  total_opened: number;
  total_clicked: number;
  open_rate: number;
  click_rate: number;
}

class EmailTemplateService {
  // ============= TEMPLATE MANAGEMENT =============

  async getAllTemplates(): Promise<EmailTemplate[]> {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .order('template_name', { ascending: true });

    if (error) throw new Error(`Failed to fetch email templates: ${error.message}`);
    return data || [];
  }

  async getTemplateByName(templateName: string): Promise<EmailTemplate | null> {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('template_name', templateName)
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw new Error(`Failed to fetch email template: ${error.message}`);
    return data;
  }

  async createTemplate(template: Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<EmailTemplate> {
    const { data, error } = await supabase
      .from('email_templates')
      .insert(template)
      .select()
      .single();

    if (error) throw new Error(`Failed to create email template: ${error.message}`);
    return data;
  }

  async updateTemplate(id: string, updates: Partial<EmailTemplate>): Promise<EmailTemplate> {
    const { data, error } = await supabase
      .from('email_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update email template: ${error.message}`);
    return data;
  }

  async deleteTemplate(id: string): Promise<void> {
    const { error } = await supabase
      .from('email_templates')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete email template: ${error.message}`);
  }

  async toggleTemplateStatus(id: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('email_templates')
      .update({ is_active: isActive })
      .eq('id', id);

    if (error) throw new Error(`Failed to toggle template status: ${error.message}`);
  }

  // ============= PREFERENCE MANAGEMENT =============

  async getUserPreferences(userId: string): Promise<EmailPreferences | null> {
    const { data, error } = await supabase.rpc('get_user_email_preferences', {
      p_user_id: userId
    });

    if (error) {
      console.error('Error fetching email preferences:', error);
      return null;
    }

    return data?.[0] || null;
  }

  async updateUserPreferences(
    userId: string,
    preferences: Partial<EmailPreferences>
  ): Promise<EmailPreferences> {
    const { data, error } = await supabase
      .from('email_preferences')
      .upsert({
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to update email preferences: ${error.message}`);
    return data;
  }

  async checkShouldSendEmail(
    userId: string,
    emailType: string,
    recipientEmail: string
  ): Promise<boolean> {
    const { data, error } = await supabase.rpc('should_send_email', {
      p_user_id: userId,
      p_email_type: emailType,
      p_recipient_email: recipientEmail
    });

    if (error) {
      console.error('Error checking if email should be sent:', error);
      return false;
    }

    return data === true;
  }

  // ============= BOUNCE MANAGEMENT =============

  async getAllBounces(activeOnly: boolean = true): Promise<EmailBounce[]> {
    let query = supabase
      .from('email_bounces')
      .select('*')
      .order('bounced_at', { ascending: false });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Failed to fetch email bounces: ${error.message}`);
    return data || [];
  }

  async recordBounce(
    emailAddress: string,
    bounceType: 'hard' | 'soft' | 'complaint' | 'unsubscribe',
    bounceSubtype?: string,
    bounceReason?: string,
    emailLogId?: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    const { data, error } = await supabase.rpc('record_email_bounce', {
      p_email_address: emailAddress,
      p_bounce_type: bounceType,
      p_bounce_subtype: bounceSubtype,
      p_bounce_reason: bounceReason,
      p_email_log_id: emailLogId,
      p_metadata: metadata || {}
    });

    if (error) throw new Error(`Failed to record email bounce: ${error.message}`);
    return data;
  }

  async resolveBounce(bounceId: string, resolvedBy: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('resolve_email_bounce', {
      p_bounce_id: bounceId,
      p_resolved_by: resolvedBy
    });

    if (error) throw new Error(`Failed to resolve email bounce: ${error.message}`);
    return data === true;
  }

  // ============= ANALYTICS & REPORTING =============

  async getEmailLogs(
    userId?: string,
    emailType?: string,
    status?: string,
    limit: number = 50
  ): Promise<EmailLog[]> {
    let query = supabase
      .from('email_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (userId) query = query.eq('user_id', userId);
    if (emailType) query = query.eq('email_type', emailType);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;

    if (error) throw new Error(`Failed to fetch email logs: ${error.message}`);
    return data || [];
  }

  async getDeliveryMetrics(days: number = 30): Promise<EmailDeliveryMetrics | null> {
    const { data, error } = await supabase.rpc('get_email_delivery_rate', {
      p_days: days
    });

    if (error) {
      console.error('Error fetching delivery metrics:', error);
      return null;
    }

    return data?.[0] || null;
  }

  async getEngagementMetrics(days: number = 30): Promise<EmailEngagementMetrics[]> {
    const { data, error } = await supabase.rpc('get_email_engagement_metrics', {
      p_days: days
    });

    if (error) {
      console.error('Error fetching engagement metrics:', error);
      return [];
    }

    return data || [];
  }

  async getEmailStatistics(userId?: string, days: number = 30): Promise<any[]> {
    const { data, error } = await supabase.rpc('get_email_statistics', {
      p_user_id: userId || null,
      p_days: days
    });

    if (error) {
      console.error('Error fetching email statistics:', error);
      return [];
    }

    return data || [];
  }

  // ============= UTILITY FUNCTIONS =============

  replaceTemplateVariables(template: string, variables: Record<string, any>): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(regex, String(value));
    }
    return result;
  }

  async sendTestEmail(
    to: string,
    emailType: 'welcome' | 'job_digest' | 'webinar_confirmation' | 'redemption',
    testData?: Record<string, any>
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/test-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token
              ? `Bearer ${token}`
              : `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            to,
            emailType,
            testData: testData || {}
          })
        }
      );

      const data = await response.json();
      return data;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to send test email'
      };
    }
  }

  // Validate email template variables
  validateTemplateVariables(
    content: string,
    providedVariables: Record<string, any>
  ): { valid: boolean; missingVariables: string[] } {
    const variableRegex = /{{\\s*([\\w]+)\\s*}}/g;
    const matches = [...content.matchAll(variableRegex)];
    const requiredVariables = matches.map(match => match[1]);
    const uniqueRequired = [...new Set(requiredVariables)];
    const missingVariables = uniqueRequired.filter(
      variable => !(variable in providedVariables)
    );

    return {
      valid: missingVariables.length === 0,
      missingVariables
    };
  }
}

export const emailTemplateService = new EmailTemplateService();
