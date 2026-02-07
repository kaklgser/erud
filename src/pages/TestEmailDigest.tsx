import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Send, CheckCircle, XCircle, Loader, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export const TestEmailDigest: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTestDigest = async () => {
    if (!user) {
      setError('You must be logged in to test email digest');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Call the process-daily-job-digest function
      const { data, error: fnError } = await supabase.functions.invoke('process-daily-job-digest', {
        body: {}
      });

      if (fnError) {
        throw fnError;
      }

      setResult(data);
    } catch (err: any) {
      console.error('Error testing digest:', err);
      setError(err.message || 'Failed to send test digest');
    } finally {
      setLoading(false);
    }
  };

  const handleTestSingleEmail = async () => {
    if (!user) {
      setError('You must be logged in to test email');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Get user's email from auth
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser?.email) {
        throw new Error('User email not found');
      }

      // Get sample jobs from last 24 hours
      const { data: jobs, error: jobsError } = await supabase
        .from('job_listings')
        .select('id, company_name, company_logo_url, role_title, domain, application_link, location_type, package_amount')
        .eq('is_active', true)
        .order('posted_date', { ascending: false })
        .limit(5);

      if (jobsError) throw jobsError;

      if (!jobs || jobs.length === 0) {
        throw new Error('No active jobs found to include in test email');
      }

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

      // Call send-job-digest-email function
      const { data, error: fnError } = await supabase.functions.invoke('send-job-digest-email', {
        body: {
          userId: user.id,
          recipientEmail: authUser.email,
          recipientName: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
          jobs: formattedJobs,
          dateRange: 'Test Email - Last 24 hours'
        }
      });

      if (fnError) {
        throw fnError;
      }

      setResult({
        success: true,
        message: 'Test email sent successfully!',
        recipient: authUser.email,
        jobCount: formattedJobs.length,
        ...data
      });
    } catch (err: any) {
      console.error('Error sending test email:', err);
      setError(err.message || 'Failed to send test email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8"
        >
          {/* Header */}
          <div className="flex items-center space-x-4 mb-8">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Test 8-Hour Email Digest</h1>
              <p className="text-slate-400 mt-1">Test if job update emails are sending correctly</p>
            </div>
          </div>

          {/* Test Buttons */}
          <div className="space-y-4 mb-8">
            {/* Test Full Digest System */}
            <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/50">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Test Full Digest System</h3>
                  <p className="text-slate-400 text-sm">
                    Triggers the complete digest processor - sends emails to all subscribed users with jobs from the last 8 hours
                  </p>
                </div>
                <button
                  onClick={handleTestDigest}
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-all"
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Testing...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Test Full System</span>
                    </>
                  )}
                </button>
              </div>
              <div className="flex items-center space-x-2 text-sm text-slate-500">
                <RefreshCw className="w-4 h-4" />
                <span>Runs every 8 hours: 12am, 8am, 4pm</span>
              </div>
            </div>

            {/* Test Single Email */}
            <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/50">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Test Single Email (Quick Test)</h3>
                  <p className="text-slate-400 text-sm">
                    Sends a test email to your account with the latest 5 jobs - no subscription needed
                  </p>
                </div>
                <button
                  onClick={handleTestSingleEmail}
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-all"
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-5 h-5" />
                      <span>Send Test Email</span>
                    </>
                  )}
                </button>
              </div>
              <div className="flex items-center space-x-2 text-sm text-emerald-500">
                <CheckCircle className="w-4 h-4" />
                <span>Recommended for quick testing</span>
              </div>
            </div>
          </div>

          {/* Result Display */}
          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-500/10 border border-green-500/50 rounded-xl p-6 mb-4"
            >
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-green-400 font-semibold mb-2">Success!</h4>
                  <div className="space-y-2 text-sm">
                    <p className="text-slate-300">{result.message}</p>
                    {result.recipient && (
                      <p className="text-slate-400">
                        <span className="font-medium">Recipient:</span> {result.recipient}
                      </p>
                    )}
                    {result.stats && (
                      <div className="bg-slate-900/50 rounded-lg p-4 mt-3">
                        <p className="text-white font-medium mb-2">Email Statistics:</p>
                        <div className="grid grid-cols-2 gap-3 text-slate-400">
                          <div>
                            <span className="block text-xs">Total Subscribers</span>
                            <span className="text-lg font-bold text-white">{result.stats.totalSubscribers || 0}</span>
                          </div>
                          <div>
                            <span className="block text-xs">Emails Sent</span>
                            <span className="text-lg font-bold text-green-400">{result.stats.emailsSent || 0}</span>
                          </div>
                          <div>
                            <span className="block text-xs">Total Jobs Sent</span>
                            <span className="text-lg font-bold text-blue-400">{result.stats.totalJobsSent || 0}</span>
                          </div>
                          <div>
                            <span className="block text-xs">Errors</span>
                            <span className="text-lg font-bold text-red-400">{result.stats.errors || 0}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    {result.jobCount && (
                      <p className="text-slate-400">
                        <span className="font-medium">Jobs Included:</span> {result.jobCount}
                      </p>
                    )}
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mt-3">
                      <p className="text-blue-400 text-xs">
                        ✓ Check your email inbox for the job digest
                        <br />
                        ✓ If not in inbox, check spam folder
                        <br />
                        ✓ Email includes company logos and all job URLs
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-500/10 border border-red-500/50 rounded-xl p-6 mb-4"
            >
              <div className="flex items-start space-x-3">
                <XCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-red-400 font-semibold mb-2">Error</h4>
                  <p className="text-slate-300 text-sm">{error}</p>
                  <div className="mt-3 text-xs text-slate-400">
                    <p className="font-medium mb-1">Common issues:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Edge functions not deployed</li>
                      <li>No active job listings in database</li>
                      <li>SMTP credentials not configured</li>
                      <li>No email subscription found</li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Info Box */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
            <h4 className="text-blue-400 font-semibold mb-3 flex items-center space-x-2">
              <Mail className="w-5 h-5" />
              <span>What This Tests</span>
            </h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-start space-x-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>8-hour job digest email system</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>Company logos in emails (with gradient fallback)</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>Job application URLs and "Apply Now" buttons</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>Plain text version for better inbox delivery</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>Anti-spam headers and professional formatting</span>
              </li>
            </ul>
          </div>

          {/* Next Steps */}
          <div className="mt-6 bg-purple-500/10 border border-purple-500/30 rounded-xl p-6">
            <h4 className="text-purple-400 font-semibold mb-3">After Testing</h4>
            <ol className="space-y-2 text-sm text-slate-300 list-decimal list-inside">
              <li>Check your email inbox (or spam folder)</li>
              <li>Verify company logos are displaying</li>
              <li>Click "Apply Now" to test job URLs</li>
              <li>If satisfied, the system will run automatically every 8 hours</li>
              <li>Monitor email logs in database: <code className="text-xs bg-slate-900 px-2 py-1 rounded">email_logs</code> table</li>
            </ol>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
