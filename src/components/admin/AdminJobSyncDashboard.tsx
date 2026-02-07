import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  Database,
  PlusCircle,
  Edit,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { apifyService } from '../../services/apifyService';
import type { JobSyncLog } from '../../types/jobs';

export const AdminJobSyncDashboard: React.FC = () => {
  const [logs, setLogs] = useState<JobSyncLog[]>([]);
  const [stats, setStats] = useState({
    totalSyncs: 0,
    successfulSyncs: 0,
    failedSyncs: 0,
    totalJobsFetched: 0,
    totalJobsCreated: 0,
    lastSyncDate: null as string | null
  });
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<JobSyncLog | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [logsData, statsData] = await Promise.all([
        apifyService.getSyncLogs(),
        apifyService.getSyncStats()
      ]);
      setLogs(logsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading sync data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'partial':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Clock className="w-5 h-5 text-blue-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filterStatus === 'all') return true;
    return log.status === filterStatus;
  });

  const formatDuration = (start: string, end?: string) => {
    if (!end) return 'Running...';
    const duration = new Date(end).getTime() - new Date(start).getTime();
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    return minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Job Sync Dashboard</h2>
          <p className="text-sm text-gray-600 mt-1">
            Monitor automated job syncs from Apify
          </p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Syncs"
          value={stats.totalSyncs}
          icon={<Database className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="Successful"
          value={stats.successfulSyncs}
          icon={<CheckCircle className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          title="Failed"
          value={stats.failedSyncs}
          icon={<XCircle className="w-5 h-5" />}
          color="red"
        />
        <StatCard
          title="Jobs Fetched"
          value={stats.totalJobsFetched}
          icon={<TrendingUp className="w-5 h-5" />}
          color="purple"
        />
        <StatCard
          title="Jobs Created"
          value={stats.totalJobsCreated}
          icon={<PlusCircle className="w-5 h-5" />}
          color="indigo"
        />
        <StatCard
          title="Last Sync"
          value={stats.lastSyncDate ? new Date(stats.lastSyncDate).toLocaleDateString() : 'Never'}
          icon={<Calendar className="w-5 h-5" />}
          color="gray"
          isText
        />
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Filter by status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="partial">Partial</option>
              <option value="running">Running</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Platform
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Started
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fetched
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Updated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    No sync logs found
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{log.platform_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          log.status
                        )}`}
                      >
                        {getStatusIcon(log.status)}
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(log.sync_started_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDuration(log.sync_started_at, log.sync_completed_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {log.jobs_fetched}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                      {log.jobs_created}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                      {log.jobs_updated}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedLog && (
        <LogDetailsModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'red' | 'purple' | 'indigo' | 'gray';
  isText?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, isText = false }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    gray: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${isText ? 'text-sm' : ''}`}>
            {value}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>{icon}</div>
      </div>
    </div>
  );
};

interface LogDetailsModalProps {
  log: JobSyncLog;
  onClose: () => void;
}

const LogDetailsModal: React.FC<LogDetailsModalProps> = ({ log, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">Sync Log Details</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Platform</label>
            <p className="mt-1 text-gray-900">{log.platform_name}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Status</label>
            <p className="mt-1">
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  log.status === 'success'
                    ? 'bg-green-100 text-green-800'
                    : log.status === 'failed'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {log.status}
              </span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Started At</label>
              <p className="mt-1 text-gray-900">
                {new Date(log.sync_started_at).toLocaleString()}
              </p>
            </div>
            {log.sync_completed_at && (
              <div>
                <label className="text-sm font-medium text-gray-700">Completed At</label>
                <p className="mt-1 text-gray-900">
                  {new Date(log.sync_completed_at).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Jobs Fetched</label>
              <p className="mt-1 text-gray-900 font-semibold">{log.jobs_fetched}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Jobs Created</label>
              <p className="mt-1 text-green-600 font-semibold">{log.jobs_created}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Jobs Updated</label>
              <p className="mt-1 text-blue-600 font-semibold">{log.jobs_updated}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Jobs Skipped</label>
              <p className="mt-1 text-gray-600 font-semibold">{log.jobs_skipped}</p>
            </div>
          </div>

          {log.error_message && (
            <div>
              <label className="text-sm font-medium text-gray-700">Error Message</label>
              <p className="mt-1 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
                {log.error_message}
              </p>
            </div>
          )}

          {log.sync_metadata && Object.keys(log.sync_metadata).length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-700">Metadata</label>
              <pre className="mt-1 bg-gray-50 p-3 rounded-lg text-xs overflow-x-auto">
                {JSON.stringify(log.sync_metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
