import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, CheckCircle, XCircle, Clock } from 'lucide-react';
import { apifyService } from '../../services/apifyService';

interface SyncLog {
  id: string;
  config_id: string;
  platform_name: string;
  status: 'success' | 'failed' | 'partial';
  jobs_fetched: number;
  jobs_created: number;
  jobs_updated: number;
  jobs_skipped: number;
  duration_seconds: number | null;
  created_at: string;
}

interface SyncMetrics {
  platform_name: string;
  config_id: string;
  total_syncs: number;
  successful_syncs: number;
  failed_syncs: number;
  avg_jobs_fetched: number;
  avg_jobs_created: number;
  avg_duration_seconds: number;
  last_sync_at: string;
}

interface SyncHistoryGraphProps {
  configId?: string;
}

export const SyncHistoryGraph: React.FC<SyncHistoryGraphProps> = ({ configId }) => {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [metrics, setMetrics] = useState<SyncMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    loadData();
  }, [configId, timeRange]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [logsData, metricsData] = await Promise.all([
        apifyService.getSyncLogs(),
        apifyService.getSyncMetrics(),
      ]);

      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);

      const filteredLogs = logsData.filter((log: SyncLog) => {
        const logDate = new Date(log.created_at);
        const matchesTime = logDate >= cutoff;
        const matchesConfig = !configId || log.config_id === configId;
        return matchesTime && matchesConfig;
      });

      setLogs(filteredLogs);
      setMetrics(metricsData);
    } catch (error) {
      console.error('Failed to load sync data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTrends = () => {
    const sortedLogs = [...logs].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const midpoint = Math.floor(sortedLogs.length / 2);
    const firstHalf = sortedLogs.slice(0, midpoint);
    const secondHalf = sortedLogs.slice(midpoint);

    const avgJobsFirst =
      firstHalf.reduce((sum, log) => sum + log.jobs_fetched, 0) / (firstHalf.length || 1);
    const avgJobsSecond =
      secondHalf.reduce((sum, log) => sum + log.jobs_fetched, 0) / (secondHalf.length || 1);

    const successRateFirst =
      (firstHalf.filter((log) => log.status === 'success').length / (firstHalf.length || 1)) * 100;
    const successRateSecond =
      (secondHalf.filter((log) => log.status === 'success').length / (secondHalf.length || 1)) *
      100;

    return {
      jobsTrend: avgJobsSecond - avgJobsFirst,
      successTrend: successRateSecond - successRateFirst,
    };
  };

  const groupLogsByDay = () => {
    const grouped: { [key: string]: SyncLog[] } = {};

    logs.forEach((log) => {
      const date = new Date(log.created_at).toLocaleDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(log);
    });

    return Object.entries(grouped)
      .map(([date, dayLogs]) => ({
        date,
        count: dayLogs.length,
        successCount: dayLogs.filter((log) => log.status === 'success').length,
        failedCount: dayLogs.filter((log) => log.status === 'failed').length,
        totalJobs: dayLogs.reduce((sum, log) => sum + log.jobs_fetched, 0),
        avgDuration:
          dayLogs.reduce((sum, log) => sum + (log.duration_seconds || 0), 0) / dayLogs.length,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const groupedData = groupLogsByDay();
  const maxJobs = Math.max(...groupedData.map((d) => d.totalJobs), 1);
  const trends = logs.length > 1 ? calculateTrends() : { jobsTrend: 0, successTrend: 0 };

  const totalSyncs = logs.length;
  const successfulSyncs = logs.filter((log) => log.status === 'success').length;
  const failedSyncs = logs.filter((log) => log.status === 'failed').length;
  const successRate = totalSyncs > 0 ? (successfulSyncs / totalSyncs) * 100 : 0;
  const totalJobsFetched = logs.reduce((sum, log) => sum + log.jobs_fetched, 0);
  const avgDuration =
    logs.reduce((sum, log) => sum + (log.duration_seconds || 0), 0) / (totalSyncs || 1);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Sync History & Trends</h3>
          <p className="text-sm text-gray-600 mt-1">Performance metrics and sync patterns over time</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTimeRange('7d')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              timeRange === '7d'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setTimeRange('30d')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              timeRange === '30d'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            30 Days
          </button>
          <button
            onClick={() => setTimeRange('90d')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              timeRange === '90d'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            90 Days
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-700">Total Syncs</span>
            <Activity className="text-blue-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-blue-900">{totalSyncs}</p>
          <p className="text-xs text-blue-600 mt-1">Last {timeRange === '7d' ? '7' : timeRange === '30d' ? '30' : '90'} days</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-700">Success Rate</span>
            <CheckCircle className="text-green-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-green-900">{successRate.toFixed(1)}%</p>
          <div className="flex items-center gap-1 text-xs mt-1">
            {trends.successTrend > 0 ? (
              <TrendingUp className="text-green-600" size={14} />
            ) : trends.successTrend < 0 ? (
              <TrendingDown className="text-red-600" size={14} />
            ) : null}
            <span className={trends.successTrend >= 0 ? 'text-green-600' : 'text-red-600'}>
              {Math.abs(trends.successTrend).toFixed(1)}% trend
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-purple-700">Jobs Fetched</span>
            <Activity className="text-purple-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-purple-900">{totalJobsFetched}</p>
          <div className="flex items-center gap-1 text-xs mt-1">
            {trends.jobsTrend > 0 ? (
              <TrendingUp className="text-green-600" size={14} />
            ) : trends.jobsTrend < 0 ? (
              <TrendingDown className="text-red-600" size={14} />
            ) : null}
            <span className={trends.jobsTrend >= 0 ? 'text-green-600' : 'text-red-600'}>
              {Math.abs(trends.jobsTrend).toFixed(0)} avg trend
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-orange-700">Avg Duration</span>
            <Clock className="text-orange-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-orange-900">{avgDuration.toFixed(0)}s</p>
          <p className="text-xs text-orange-600 mt-1">Per sync operation</p>
        </div>
      </div>

      {groupedData.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <Activity size={48} className="mx-auto text-gray-400 mb-4" />
          <h4 className="text-lg font-semibold text-gray-900 mb-2">No Sync History</h4>
          <p className="text-gray-600">Sync history will appear here once you run your first sync</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Sync Activity Timeline</h4>
          <div className="space-y-2">
            {groupedData.map((data, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="text-xs font-medium text-gray-600 w-24">{data.date}</span>
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden flex">
                    <div
                      className="bg-green-500 flex items-center justify-center text-white text-xs font-medium"
                      style={{ width: `${(data.successCount / data.count) * 100}%` }}
                    >
                      {data.successCount > 0 && data.successCount}
                    </div>
                    <div
                      className="bg-red-500 flex items-center justify-center text-white text-xs font-medium"
                      style={{ width: `${(data.failedCount / data.count) * 100}%` }}
                    >
                      {data.failedCount > 0 && data.failedCount}
                    </div>
                  </div>
                  <div
                    className="bg-blue-200 rounded-full h-8 flex items-center justify-center text-blue-900 text-xs font-medium px-3"
                    style={{ minWidth: `${Math.max((data.totalJobs / maxJobs) * 100, 10)}px` }}
                  >
                    {data.totalJobs} jobs
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>Success</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span>Failed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-200 rounded"></div>
              <span>Jobs Fetched</span>
            </div>
          </div>
        </div>
      )}

      {metrics.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Platform Performance</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-700">Platform</th>
                  <th className="text-right p-3 font-medium text-gray-700">Total Syncs</th>
                  <th className="text-right p-3 font-medium text-gray-700">Success Rate</th>
                  <th className="text-right p-3 font-medium text-gray-700">Avg Jobs</th>
                  <th className="text-right p-3 font-medium text-gray-700">Avg Duration</th>
                  <th className="text-right p-3 font-medium text-gray-700">Last Sync</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((metric) => {
                  const successRate = (metric.successful_syncs / metric.total_syncs) * 100;
                  return (
                    <tr key={metric.config_id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3 font-medium text-gray-900">{metric.platform_name}</td>
                      <td className="p-3 text-right text-gray-700">{metric.total_syncs}</td>
                      <td className="p-3 text-right">
                        <span
                          className={`inline-flex items-center gap-1 ${
                            successRate >= 90
                              ? 'text-green-700'
                              : successRate >= 70
                              ? 'text-yellow-700'
                              : 'text-red-700'
                          }`}
                        >
                          {successRate.toFixed(0)}%
                        </span>
                      </td>
                      <td className="p-3 text-right text-gray-700">
                        {metric.avg_jobs_fetched.toFixed(0)}
                      </td>
                      <td className="p-3 text-right text-gray-700">
                        {metric.avg_duration_seconds?.toFixed(0) || 0}s
                      </td>
                      <td className="p-3 text-right text-gray-600 text-xs">
                        {new Date(metric.last_sync_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
