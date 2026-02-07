import React, { useState, useEffect } from 'react';
import { Mail, Send, CheckCircle, XCircle, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useIsAdmin } from '../../hooks/useIsAdmin';

interface EmailLog {
  id: string;
  user_id: string;
  email_type: string;
  recipient_email: string;
  subject: string;
  status: string;
  error_message?: string;
  sent_at?: string;
  created_at: string;
}

interface EmailStats {
  email_type: string;
  total_sent: number;
  total_failed: number;
  success_rate: number;
}

export const EmailTestingPanel: React.FC = () => {
  const isAdmin = useIsAdmin();
  const [testEmail, setTestEmail] = useState('');
  const [emailType, setEmailType] = useState<'welcome' | 'job_digest' | 'webinar_confirmation' | 'redemption'>('welcome');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [stats, setStats] = useState<EmailStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [smtpOk, setSmtpOk] = useState<'unknown' | 'connected' | 'failed' | 'bypassed'>('unknown');
  const [testingDigest, setTestingDigest] = useState(false);
  const [digestResult, setDigestResult] = useState<any>(null);

  const emailTypes = [
    { value: 'welcome', label: 'Welcome Email', icon: '👋' },
    { value: 'job_digest', label: 'Job Digest (Last 8 Hours)', icon: '📧' },
    { value: 'webinar_confirmation', label: 'Webinar Confirmation', icon: '🎓' },
    { value: 'redemption', label: 'Redemption', icon: '💰' }
  ];

  useEffect(() => {
    loadEmailLogs();
    loadEmailStats();
    loadSmtpStatus();
  }, []);

  const loadEmailLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error loading email logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmailStats = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_email_statistics', { p_days: 30 });

      if (error) throw error;
      setStats(data || []);
    } catch (error) {
      console.error('Error loading email stats:', error);
    }
  };

  const loadSmtpStatus = async () => {
    try {
      const siteUrl = import.meta.env.VITE_SUPABASE_URL;
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const resp = await fetch(`${siteUrl}/functions/v1/test-email`, {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        }
      });
      const data = await resp.json();
      if (data?.ok) {
        setSmtpOk(data.adminBypass ? 'bypassed' : 'connected');
      } else {
        setSmtpOk('failed');
      }
    } catch (e) {
      setSmtpOk('failed');
    }
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    // If Job Digest is selected, use the new 8-hour digest function
    if (emailType === 'job_digest') {
      handleTestSingleDigest();
      return;
    }

    setSending(true);
    setResult(null);

    try {
      const siteUrl = import.meta.env.VITE_SUPABASE_URL;
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const response = await fetch(`${siteUrl}/functions/v1/test-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          to: testEmail,
          emailType: emailType,
          testData: {
            name: 'Test User',
            date: new Date().toLocaleDateString(),
            time: '10:00 AM',
            amount: '500.00',
            method: 'Bank Transfer'
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        setResult({ success: true, message: 'Test email sent successfully!' });
        setTestEmail('');
        setTimeout(() => {
          loadEmailLogs();
          loadEmailStats();
          loadSmtpStatus();
        }, 1000);
      } else {
        setResult({ success: false, message: data.error || 'Failed to send test email' });
      }
    } catch (error: any) {
      console.error('Error sending test email:', error);
      setResult({ success: false, message: error.message || 'An error occurred' });
    } finally {
      setSending(false);
    }
  };

  const handleTest8HourDigest = async () => {
    setTestingDigest(true);
    setDigestResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('process-daily-job-digest', {
        body: {}
      });

      if (error) throw error;

      setDigestResult(data);
      setTimeout(() => {
        loadEmailLogs();
        loadEmailStats();
      }, 1000);
    } catch (error: any) {
      console.error('Error testing digest:', error);
      setDigestResult({
        success: false,
        error: error.message || 'Failed to send digest emails'
      });
    } finally {
      setTestingDigest(false);
    }
  };

  const handleTestSingleDigest = async () => {
    if (!testEmail) {
      setResult({ success: false, message: 'Please enter an email address' });
      return;
    }

    setSending(true);
    setResult(null);

    try {
      // Get jobs from last 8 hours
      const { data: jobs, error: jobsError } = await supabase
        .from('job_listings')
        .select('id, company_name, company_logo_url, role_title, domain, application_link, location_type, package_amount, posted_date')
        .eq('is_active', true)
        .gte('posted_date', new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString())
        .order('posted_date', { ascending: false })
        .limit(10);

      if (jobsError) throw jobsError;

      if (!jobs || jobs.length === 0) {
        setResult({ success: false, message: 'No jobs found in the last 8 hours. Try syncing jobs first.' });
        setSending(false);
        return;
      }

      // Get current user info
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', user?.id)
        .single();

      // Format jobs for email
      const formattedJobs = jobs.map(job => ({
        job_id: job.id,
        company_name: job.company_name,
        company_logo_url: job.company_logo_url,
        role_title: job.role_title,
        domain: job.domain,
        application_link: job.application_link,
        location_type: job.location_type,
        package_amount: job.package_amount
      }));

      // Send to single email
      const { data, error } = await supabase.functions.invoke('send-job-digest-email', {
        body: {
          userId: user?.id || 'test-user',
          recipientEmail: testEmail,
          recipientName: profile?.full_name || 'Test User',
          jobs: formattedJobs,
          dateRange: 'Last 8 hours'
        }
      });

      if (error) throw error;

      setResult({
        success: true,
        message: `Job digest sent to ${testEmail} with ${jobs.length} jobs from last 8 hours!`
      });
      setTestEmail('');
      setTimeout(() => {
        loadEmailLogs();
        loadEmailStats();
      }, 1000);
    } catch (error: any) {
      console.error('Error sending single digest:', error);
      setResult({ success: false, message: error.message || 'Failed to send job digest' });
    } finally {
      setSending(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-dark-100 rounded-xl border-2 border-gray-200 dark:border-dark-300 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Mail className="w-6 h-6 text-blue-600 dark:text-neon-cyan-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">
              Email Testing & Monitoring
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">SMTP</span>
            <span
              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                smtpOk === 'connected'
                  ? 'bg-green-100 text-green-700'
                  : smtpOk === 'bypassed'
                  ? 'bg-yellow-100 text-yellow-700'
                  : smtpOk === 'failed'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {smtpOk === 'connected' && 'Connected'}
              {smtpOk === 'bypassed' && 'Bypassed (Admin)'}
              {smtpOk === 'failed' && 'Disconnected'}
              {smtpOk === 'unknown' && 'Checking...'}
            </span>
          </div>
          <button
            onClick={() => {
              loadEmailLogs();
              loadEmailStats();
              loadSmtpStatus();
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-dark-200 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-300 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
        {!isAdmin && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900 dark:text-blue-300">
                <p className="font-semibold mb-1">SMTP Configuration Required</p>
                <p>Make sure SMTP credentials are configured in Supabase project settings:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>SMTP_HOST (e.g., smtp.gmail.com)</li>
                  <li>SMTP_PORT (587 for TLS, 465 for SSL)</li>
                  <li>SMTP_USER (your email address)</li>
                  <li>SMTP_PASS (your app-specific password)</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSendTestEmail} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-dark-text-secondary mb-2">
              Recipient Email Address
            </label>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              required
              placeholder="Enter email address to receive test email"
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-dark-300 bg-white dark:bg-dark-200 text-gray-900 dark:text-dark-text-primary focus:border-blue-500 dark:focus:border-neon-cyan-500 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-dark-text-secondary mb-2">
              Email Type
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {emailTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setEmailType(type.value as any)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    emailType === type.value
                      ? 'border-blue-600 dark:border-neon-cyan-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-dark-300 hover:border-blue-400 dark:hover:border-neon-cyan-600'
                  }`}
                >
                  <div className="text-2xl mb-2">{type.icon}</div>
                  <div className={`font-semibold text-sm ${
                    emailType === type.value
                      ? 'text-blue-900 dark:text-neon-cyan-300'
                      : 'text-gray-900 dark:text-dark-text-primary'
                  }`}>
                    {type.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {result && (
            <div className={`p-4 rounded-lg flex items-center space-x-3 ${
              result.success
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-800'
            }`}>
              {result.success ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <span className="text-sm font-medium">{result.message}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={sending || !testEmail}
            className={`w-full py-3 px-6 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2 ${
              sending || !testEmail
                ? 'bg-gray-300 dark:bg-dark-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 dark:bg-neon-cyan-500 text-white hover:bg-blue-700 dark:hover:bg-neon-cyan-600'
            }`}
          >
            {sending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Sending Test Email...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Send Test Email</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* 8-Hour Digest Test Section */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-800 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-dark-text-primary flex items-center space-x-2 mb-2">
              <RefreshCw className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <span>8-Hour Job Digest System</span>
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Test the automated job digest email system that sends every 8 hours (12am, 8am, 4pm)
            </p>
          </div>
          <button
            onClick={handleTest8HourDigest}
            disabled={testingDigest}
            className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center space-x-2 ${
              testingDigest
                ? 'bg-gray-300 dark:bg-dark-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-500 dark:to-blue-500 text-white hover:from-purple-700 hover:to-blue-700'
            }`}
          >
            {testingDigest ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Testing...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Test 8-Hour Digest</span>
              </>
            )}
          </button>
        </div>

        {digestResult && (
          <div className={`mt-4 p-4 rounded-lg ${
            digestResult.success
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}>
            <div className="flex items-start space-x-3">
              {digestResult.success ? (
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <h4 className={`font-semibold mb-2 ${
                  digestResult.success
                    ? 'text-green-900 dark:text-green-300'
                    : 'text-red-900 dark:text-red-300'
                }`}>
                  {digestResult.success ? 'Digest Processed Successfully!' : 'Digest Processing Failed'}
                </h4>
                {digestResult.stats && (
                  <div className="bg-white dark:bg-dark-200 rounded-lg p-4 mt-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600 dark:text-gray-400">Total Subscribers</div>
                        <div className="text-xl font-bold text-gray-900 dark:text-white">
                          {digestResult.stats.totalSubscribers || 0}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600 dark:text-gray-400">Emails Sent</div>
                        <div className="text-xl font-bold text-green-600 dark:text-green-400">
                          {digestResult.stats.emailsSent || 0}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600 dark:text-gray-400">Total Jobs</div>
                        <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                          {digestResult.stats.totalJobsSent || 0}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600 dark:text-gray-400">Errors</div>
                        <div className="text-xl font-bold text-red-600 dark:text-red-400">
                          {digestResult.stats.errors || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {digestResult.error && (
                  <p className="text-sm text-red-800 dark:text-red-300 mt-2">
                    Error: {digestResult.error}
                  </p>
                )}
                <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                  <p>✓ Emails include company logos with fallback</p>
                  <p>✓ "Apply Now" and "View Details" URLs included</p>
                  <p>✓ Sends to all users subscribed to job digest</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-900 dark:text-blue-300">
            <strong>ℹ️ What this tests:</strong> This triggers the complete digest system that normally runs every 8 hours.
            It will send job digest emails to all subscribed users with jobs from the last 8 hours, including company logos and application URLs.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-100 rounded-xl border-2 border-gray-200 dark:border-dark-300 p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-dark-text-primary mb-4">
          Email Statistics (Last 30 Days)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.email_type} className="bg-gray-50 dark:bg-dark-200 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                {stat.email_type}
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary mb-1">
                {stat.total_sent}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Success Rate: <span className="font-semibold text-green-600 dark:text-green-400">{stat.success_rate}%</span>
              </div>
              {stat.total_failed > 0 && (
                <div className="text-sm text-red-600 dark:text-red-400 mt-1">
                  Failed: {stat.total_failed}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-dark-100 rounded-xl border-2 border-gray-200 dark:border-dark-300 p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-dark-text-primary mb-4">
          Recent Email Logs
        </h3>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-neon-cyan-400" />
          </div>
        ) : logs.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400 text-center py-8">No email logs found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200 dark:border-dark-300">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-dark-text-secondary">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-dark-text-secondary">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-dark-text-secondary">Recipient</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-dark-text-secondary">Subject</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-dark-text-secondary">Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-100 dark:border-dark-300 hover:bg-gray-50 dark:hover:bg-dark-200">
                    <td className="py-3 px-4">{getStatusIcon(log.status)}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-dark-text-primary">{log.email_type}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-dark-text-primary">{log.recipient_email}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{log.subject}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
