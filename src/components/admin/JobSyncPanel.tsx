import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, CheckCircle, XCircle, Clock, Database, TrendingUp, AlertCircle, Play } from 'lucide-react';
import { jobSyncService, SyncLog, SyncStats } from '../../services/jobSyncService';

export const JobSyncPanel: React.FC = () => {
  const [stats, setStats] = useState<SyncStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await jobSyncService.getSyncStats();
      setStats(data);

      const isRunning = await jobSyncService.isCurrentlyRunning();
      setSyncing(isRunning);
    } catch (err) {
      setError('Failed to load sync stats');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, [loadStats]);

  const handleRunSync = async () => {
    if (syncing) return;

    setSyncing(true);
    setError(null);

    try {
      const result = await jobSyncService.triggerSync();

      if (!result.success) {
        setError(result.error || 'Sync failed');
      }

      await loadStats();
    } catch (err) {
      setError('Failed to trigger sync');
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-';
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'running':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      success: 'bg-green-100 text-green-800 border-green-200',
      failed: 'bg-red-100 text-red-800 border-red-200',
      running: 'bg-blue-100 text-blue-800 border-blue-200',
      partial: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    };
    return styles[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (loading && !stats) {
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
          <h2 className="text-xl font-semibold text-gray-900">Job Sync Dashboard</h2>
          <p className="text-sm text-gray-500 mt-1">
            Monitor and trigger job synchronization from LinkedIn
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadStats}
            disabled={loading}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh stats"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleRunSync}
            disabled={syncing}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Syncing...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                <span>Run Now</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Active Jobs</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats?.totalActiveJobs.toLocaleString() || 0}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Database className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Created (24h)</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                +{stats?.totalJobsCreatedLast24h || 0}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Updated (24h)</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">
                {stats?.totalJobsUpdatedLast24h || 0}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <RefreshCw className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Last Sync Status</p>
              <div className="flex items-center space-x-2 mt-1">
                {stats?.lastSync ? (
                  <>
                    {getStatusIcon(stats.lastSync.status)}
                    <span className="text-lg font-semibold capitalize">
                      {stats.lastSync.status}
                    </span>
                  </>
                ) : (
                  <span className="text-gray-400">No syncs yet</span>
                )}
              </div>
            </div>
            <div className="p-3 bg-gray-100 rounded-full">
              <Clock className="h-6 w-6 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {stats?.lastSync && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Last Sync Details</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-sm text-gray-500">Platform</p>
              <p className="font-medium">{stats.lastSync.platform_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Started</p>
              <p className="font-medium">{formatDate(stats.lastSync.sync_started_at)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Duration</p>
              <p className="font-medium">{formatDuration(stats.lastSync.duration_seconds)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Jobs Fetched</p>
              <p className="font-medium">{stats.lastSync.jobs_fetched ?? '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Jobs Created</p>
              <p className="font-medium text-green-600">+{stats.lastSync.jobs_created ?? 0}</p>
            </div>
          </div>
          {stats.lastSync.error_message && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg">
              <p className="text-sm text-red-700">{stats.lastSync.error_message}</p>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Sync History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Platform</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Started</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fetched</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Updated</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Skipped</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stats?.recentSyncs.map((log: SyncLog) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(log.status)}`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{log.platform_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(log.sync_started_at)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDuration(log.duration_seconds)}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{log.jobs_fetched ?? '-'}</td>
                  <td className="px-4 py-3 text-sm text-green-600">+{log.jobs_created ?? 0}</td>
                  <td className="px-4 py-3 text-sm text-orange-600">{log.jobs_updated ?? 0}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{log.jobs_skipped ?? 0}</td>
                </tr>
              ))}
              {(!stats?.recentSyncs || stats.recentSyncs.length === 0) && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No sync history available. Click "Run Now" to start a sync.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
