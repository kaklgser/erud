import React, { useState, useEffect } from 'react';
import { Mail, TrendingUp, Send, XCircle, BarChart3, Users, Loader2, Eye } from 'lucide-react';
import {
  emailTemplateService,
  EmailDeliveryMetrics,
  EmailEngagementMetrics,
  EmailLog,
  EmailBounce
} from '../../services/emailTemplateService';

export const AdminEmailDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'bounces'>('overview');
  const [deliveryMetrics, setDeliveryMetrics] = useState<EmailDeliveryMetrics | null>(null);
  const [engagementMetrics, setEngagementMetrics] = useState<EmailEngagementMetrics[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [bounces, setBounces] = useState<EmailBounce[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30);

  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [delivery, engagement, logs, bouncesList] = await Promise.all([
        emailTemplateService.getDeliveryMetrics(timeRange),
        emailTemplateService.getEngagementMetrics(timeRange),
        emailTemplateService.getEmailLogs(undefined, undefined, undefined, 100),
        emailTemplateService.getAllBounces(true)
      ]);

      setDeliveryMetrics(delivery);
      setEngagementMetrics(engagement);
      setEmailLogs(logs);
      setBounces(bouncesList);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-neon-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-dark-100 rounded-xl border-2 border-gray-200 dark:border-dark-300 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Mail className="w-6 h-6 text-blue-600 dark:text-neon-cyan-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">
              Email System Dashboard
            </h2>
          </div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className="px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-dark-300 bg-white dark:bg-dark-200 text-gray-900 dark:text-dark-text-primary focus:border-blue-500 dark:focus:border-neon-cyan-500 focus:outline-none"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-dark-100 rounded-xl border-2 border-gray-200 dark:border-dark-300">
        <div className="flex border-b border-gray-200 dark:border-dark-300">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-4 font-semibold transition-colors ${
              activeTab === 'overview'
                ? 'text-blue-600 dark:text-neon-cyan-400 border-b-2 border-blue-600 dark:border-neon-cyan-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-dark-text-primary'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-6 py-4 font-semibold transition-colors ${
              activeTab === 'logs'
                ? 'text-blue-600 dark:text-neon-cyan-400 border-b-2 border-blue-600 dark:border-neon-cyan-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-dark-text-primary'
            }`}
          >
            Email Logs
          </button>
          <button
            onClick={() => setActiveTab('bounces')}
            className={`px-6 py-4 font-semibold transition-colors ${
              activeTab === 'bounces'
                ? 'text-blue-600 dark:text-neon-cyan-400 border-b-2 border-blue-600 dark:border-neon-cyan-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-dark-text-primary'
            }`}
          >
            Bounces ({bounces.length})
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Delivery Metrics */}
              {deliveryMetrics && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <Send className="w-8 h-8 opacity-80" />
                      <span className="text-2xl font-bold">{deliveryMetrics.total_emails}</span>
                    </div>
                    <p className="text-sm opacity-90">Total Emails</p>
                  </div>

                  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <TrendingUp className="w-8 h-8 opacity-80" />
                      <span className="text-2xl font-bold">{deliveryMetrics.delivered}</span>
                    </div>
                    <p className="text-sm opacity-90">Delivered</p>
                    <p className="text-xs mt-1 opacity-75">{deliveryMetrics.delivery_rate}% rate</p>
                  </div>

                  <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <XCircle className="w-8 h-8 opacity-80" />
                      <span className="text-2xl font-bold">{deliveryMetrics.failed}</span>
                    </div>
                    <p className="text-sm opacity-90">Failed</p>
                  </div>

                  <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <BarChart3 className="w-8 h-8 opacity-80" />
                      <span className="text-2xl font-bold">{deliveryMetrics.bounced}</span>
                    </div>
                    <p className="text-sm opacity-90">Bounced</p>
                    <p className="text-xs mt-1 opacity-75">{deliveryMetrics.bounce_rate}% rate</p>
                  </div>
                </div>
              )}

              {/* Engagement Metrics */}
              <div className="bg-gray-50 dark:bg-dark-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-dark-text-primary mb-4 flex items-center">
                  <Eye className="w-5 h-5 mr-2" />
                  Email Engagement by Type
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200 dark:border-dark-300">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-dark-text-secondary">
                          Email Type
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-dark-text-secondary">
                          Sent
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-dark-text-secondary">
                          Opened
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-dark-text-secondary">
                          Clicked
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-dark-text-secondary">
                          Open Rate
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-dark-text-secondary">
                          Click Rate
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {engagementMetrics.map((metric) => (
                        <tr
                          key={metric.email_type}
                          className="border-b border-gray-100 dark:border-dark-300 hover:bg-gray-50 dark:hover:bg-dark-200"
                        >
                          <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-dark-text-primary">
                            {metric.email_type}
                          </td>
                          <td className="py-3 px-4 text-sm text-right text-gray-900 dark:text-dark-text-primary">
                            {metric.total_sent}
                          </td>
                          <td className="py-3 px-4 text-sm text-right text-gray-900 dark:text-dark-text-primary">
                            {metric.total_opened}
                          </td>
                          <td className="py-3 px-4 text-sm text-right text-gray-900 dark:text-dark-text-primary">
                            {metric.total_clicked}
                          </td>
                          <td className="py-3 px-4 text-sm text-right">
                            <span className={`font-semibold ${
                              metric.open_rate >= 20
                                ? 'text-green-600 dark:text-green-400'
                                : metric.open_rate >= 10
                                ? 'text-yellow-600 dark:text-yellow-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {metric.open_rate}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-right">
                            <span className={`font-semibold ${
                              metric.click_rate >= 5
                                ? 'text-green-600 dark:text-green-400'
                                : metric.click_rate >= 2
                                ? 'text-yellow-600 dark:text-yellow-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {metric.click_rate}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200 dark:border-dark-300">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-dark-text-secondary">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-dark-text-secondary">
                      Type
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-dark-text-secondary">
                      Recipient
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-dark-text-secondary">
                      Subject
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-dark-text-secondary">
                      Sent At
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {emailLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-gray-100 dark:border-dark-300 hover:bg-gray-50 dark:hover:bg-dark-200"
                    >
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            log.status === 'sent'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                              : log.status === 'failed'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                              : log.status === 'bounced'
                              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-dark-text-primary">
                        {log.email_type}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-dark-text-primary">
                        {log.recipient_email}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {log.subject}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(log.sent_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'bounces' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200 dark:border-dark-300">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-dark-text-secondary">
                      Email
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-dark-text-secondary">
                      Bounce Type
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-dark-text-secondary">
                      Reason
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-dark-text-secondary">
                      Bounced At
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-dark-text-secondary">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {bounces.map((bounce) => (
                    <tr
                      key={bounce.id}
                      className="border-b border-gray-100 dark:border-dark-300 hover:bg-gray-50 dark:hover:bg-dark-200"
                    >
                      <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-dark-text-primary">
                        {bounce.email_address}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            bounce.bounce_type === 'hard'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                              : bounce.bounce_type === 'soft'
                              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                              : bounce.bounce_type === 'complaint'
                              ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
                          }`}
                        >
                          {bounce.bounce_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {bounce.bounce_reason || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(bounce.bounced_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            bounce.is_active
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                              : 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                          }`}
                        >
                          {bounce.is_active ? 'Active' : 'Resolved'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
