import React, { useState, useEffect } from 'react';
import { Mail, Bell, CheckCircle, XCircle, Loader2, Clock, Globe } from 'lucide-react';
import { emailTemplateService, EmailPreferences as IEmailPreferences } from '../../services/emailTemplateService';
import { supabase } from '../../lib/supabaseClient';

export const EmailPreferences: React.FC = () => {
  const [preferences, setPreferences] = useState<IEmailPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const prefs = await emailTemplateService.getUserPreferences(user.id);

      if (prefs) {
        setPreferences(prefs);
      } else {
        // Create default preferences
        setPreferences({
          user_id: user.id,
          email_enabled: true,
          marketing_emails: true,
          welcome_emails: true,
          job_digest_emails: true,
          job_digest_frequency: 'daily',
          webinar_notifications: true,
          payment_notifications: true,
          subscription_notifications: true,
          application_updates: true,
          profile_reminders: true,
          referral_notifications: true,
          wallet_notifications: true,
          interview_reminders: true,
          resume_notifications: true,
          admin_announcements: true,
          quiet_hours_enabled: false,
          quiet_hours_timezone: 'UTC',
          daily_digest_time: '09:00:00',
        });
      }
    } catch (error: any) {
      console.error('Error loading preferences:', error);
      setMessage({ type: 'error', text: 'Failed to load email preferences' });
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!preferences) return;

    setSaving(true);
    setMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      await emailTemplateService.updateUserPreferences(user.id, preferences);
      setMessage({ type: 'success', text: 'Email preferences saved successfully!' });
    } catch (error: any) {
      console.error('Error saving preferences:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to save email preferences' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (field: keyof IEmailPreferences) => {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      [field]: !(preferences[field] as boolean)
    });
  };

  const handleFrequencyChange = (frequency: 'immediate' | 'daily' | 'weekly' | 'disabled') => {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      job_digest_frequency: frequency
    });
  };

  const handleTimeChange = (field: 'quiet_hours_start' | 'quiet_hours_end' | 'daily_digest_time', value: string) => {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      [field]: value
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-neon-cyan-400" />
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Failed to load email preferences</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-dark-100 rounded-xl border-2 border-gray-200 dark:border-dark-300 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Mail className="w-6 h-6 text-blue-600 dark:text-neon-cyan-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">
            Email Preferences
          </h2>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Customize which emails you want to receive and when
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center space-x-3 ${
          message.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* Global Settings */}
      <div className="bg-white dark:bg-dark-100 rounded-xl border-2 border-gray-200 dark:border-dark-300 p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-dark-text-primary mb-4">
          Global Settings
        </h3>

        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center space-x-3">
              <Bell className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <div>
                <div className="font-semibold text-gray-900 dark:text-dark-text-primary">
                  Enable Email Notifications
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Receive all email notifications from PrimoBoost AI
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.email_enabled}
              onChange={() => handleToggle('email_enabled')}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <div>
                <div className="font-semibold text-gray-900 dark:text-dark-text-primary">
                  Marketing Emails
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Receive promotional content and updates
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.marketing_emails}
              onChange={() => handleToggle('marketing_emails')}
              disabled={!preferences.email_enabled}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          </label>
        </div>
      </div>

      {/* Notification Types */}
      <div className="bg-white dark:bg-dark-100 rounded-xl border-2 border-gray-200 dark:border-dark-300 p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-dark-text-primary mb-4">
          Notification Types
        </h3>

        <div className="space-y-4">
          {[
            { key: 'welcome_emails', label: 'Welcome Emails', description: 'Initial welcome email when you sign up' },
            { key: 'job_digest_emails', label: 'Job Digest', description: 'Daily digest of matching job opportunities' },
            { key: 'webinar_notifications', label: 'Webinar Notifications', description: 'Updates about webinar registrations and reminders' },
            { key: 'payment_notifications', label: 'Payment Notifications', description: 'Payment success and failure notifications' },
            { key: 'subscription_notifications', label: 'Subscription Notifications', description: 'Subscription expiry and renewal reminders' },
            { key: 'application_updates', label: 'Application Updates', description: 'Status updates on your job applications' },
            { key: 'profile_reminders', label: 'Profile Reminders', description: 'Reminders to complete your profile' },
            { key: 'referral_notifications', label: 'Referral Notifications', description: 'Updates on your referral rewards' },
            { key: 'wallet_notifications', label: 'Wallet Notifications', description: 'Wallet transaction notifications' },
            { key: 'interview_reminders', label: 'Interview Reminders', description: 'Reminders for scheduled mock interviews' },
            { key: 'resume_notifications', label: 'Resume Notifications', description: 'Resume optimization completion notifications' },
            { key: 'admin_announcements', label: 'Admin Announcements', description: 'Important updates and announcements from admins' },
          ].map((item) => (
            <label key={item.key} className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="font-semibold text-gray-900 dark:text-dark-text-primary">
                  {item.label}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {item.description}
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences[item.key as keyof IEmailPreferences] as boolean}
                onChange={() => handleToggle(item.key as keyof IEmailPreferences)}
                disabled={!preferences.email_enabled}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Job Digest Frequency */}
      <div className="bg-white dark:bg-dark-100 rounded-xl border-2 border-gray-200 dark:border-dark-300 p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-dark-text-primary mb-4">
          Job Digest Frequency
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {['immediate', 'daily', 'weekly', 'disabled'].map((freq) => (
            <button
              key={freq}
              type="button"
              onClick={() => handleFrequencyChange(freq as any)}
              disabled={!preferences.email_enabled || !preferences.job_digest_emails}
              className={`p-4 rounded-lg border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                preferences.job_digest_frequency === freq
                  ? 'border-blue-600 dark:border-neon-cyan-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-dark-300 hover:border-blue-400 dark:hover:border-neon-cyan-600'
              }`}
            >
              <div className={`font-semibold text-sm capitalize ${
                preferences.job_digest_frequency === freq
                  ? 'text-blue-900 dark:text-neon-cyan-300'
                  : 'text-gray-900 dark:text-dark-text-primary'
              }`}>
                {freq}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="bg-white dark:bg-dark-100 rounded-xl border-2 border-gray-200 dark:border-dark-300 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Clock className="w-6 h-6 text-blue-600 dark:text-neon-cyan-400" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-dark-text-primary">
              Quiet Hours
            </h3>
          </div>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.quiet_hours_enabled}
              onChange={() => handleToggle('quiet_hours_enabled')}
              disabled={!preferences.email_enabled}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
          </label>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Don't send me emails during these hours
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
              Start Time
            </label>
            <input
              type="time"
              value={preferences.quiet_hours_start || '22:00'}
              onChange={(e) => handleTimeChange('quiet_hours_start', e.target.value)}
              disabled={!preferences.email_enabled || !preferences.quiet_hours_enabled}
              className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-dark-300 bg-white dark:bg-dark-200 text-gray-900 dark:text-dark-text-primary focus:border-blue-500 dark:focus:border-neon-cyan-500 focus:outline-none disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
              End Time
            </label>
            <input
              type="time"
              value={preferences.quiet_hours_end || '08:00'}
              onChange={(e) => handleTimeChange('quiet_hours_end', e.target.value)}
              disabled={!preferences.email_enabled || !preferences.quiet_hours_enabled}
              className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-dark-300 bg-white dark:bg-dark-200 text-gray-900 dark:text-dark-text-primary focus:border-blue-500 dark:focus:border-neon-cyan-500 focus:outline-none disabled:opacity-50"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
            <Globe className="inline w-4 h-4 mr-1" />
            Timezone
          </label>
          <select
            value={preferences.quiet_hours_timezone}
            onChange={(e) => setPreferences({ ...preferences, quiet_hours_timezone: e.target.value })}
            disabled={!preferences.email_enabled || !preferences.quiet_hours_enabled}
            className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-dark-300 bg-white dark:bg-dark-200 text-gray-900 dark:text-dark-text-primary focus:border-blue-500 dark:focus:border-neon-cyan-500 focus:outline-none disabled:opacity-50"
          >
            <option value="UTC">UTC</option>
            <option value="America/New_York">Eastern Time (ET)</option>
            <option value="America/Chicago">Central Time (CT)</option>
            <option value="America/Denver">Mountain Time (MT)</option>
            <option value="America/Los_Angeles">Pacific Time (PT)</option>
            <option value="Europe/London">London (GMT)</option>
            <option value="Europe/Paris">Central European Time (CET)</option>
            <option value="Asia/Kolkata">India Standard Time (IST)</option>
            <option value="Asia/Tokyo">Japan Standard Time (JST)</option>
            <option value="Australia/Sydney">Australian Eastern Time (AET)</option>
          </select>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={savePreferences}
          disabled={saving}
          className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center space-x-2 ${
            saving
              ? 'bg-gray-300 dark:bg-dark-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 dark:bg-neon-cyan-500 text-white hover:bg-blue-700 dark:hover:bg-neon-cyan-600'
          }`}
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              <span>Save Preferences</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
