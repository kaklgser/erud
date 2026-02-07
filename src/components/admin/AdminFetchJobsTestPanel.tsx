import React, { useState, useEffect } from 'react';
import {
  Play,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Database,
  Briefcase,
  Building,
  MapPin,
  AlertTriangle,
  Zap,
  Settings,
} from 'lucide-react';
import { apifyService } from '../../services/apifyService';
import { supabase } from '../../lib/supabase';
import type { JobFetchConfig } from '../../types/jobs';

interface SyncResult {
  platform: string;
  success: boolean;
  stats?: {
    fetched: number;
    created: number;
    updated: number;
    skipped: number;
  };
  error?: string;
}

interface RecentJob {
  id: string;
  company_name: string;
  role_title: string;
  location_city: string;
  package_amount: number | null;
  source_platform: string;
  created_at: string;
}

type SyncStatus = 'idle' | 'fetching' | 'success' | 'error';

export const AdminFetchJobsTestPanel: React.FC = () => {
  const [defaultConfig, setDefaultConfig] = useState<JobFetchConfig | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadDefaultConfig();
    loadRecentJobs();
  }, []);

  useEffect(() => {
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [timerInterval]);

  const loadDefaultConfig = async () => {
    try {
      const config = await apifyService.getDefaultConfig();
      setDefaultConfig(config);
    } catch (error) {
      console.error('Error loading default config:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('job_listings')
        .select('id, company_name, role_title, location_city, package_amount, source_platform, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data) {
        setRecentJobs(data);
      }
    } catch (error) {
      console.error('Error loading recent jobs:', error);
    }
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const startTimer = () => {
    setElapsedTime(0);
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    setTimerInterval(interval);
    return interval;
  };

  const stopTimer = (interval: NodeJS.Timeout) => {
    clearInterval(interval);
    setTimerInterval(null);
  };

  const handleFetchJobs = async () => {
    setLogs([]);
    setSyncResult(null);
    setSyncStatus('fetching');
    const timer = startTimer();

    addLog('Starting job fetch using default configuration...');

    try {
      const result = await apifyService.triggerDefaultSync();

      if (result.config) {
        addLog(`Configuration: ${result.config.platform_name}`);
        addLog(`Actor ID: ${result.config.actor_id}`);
      }

      if (result.success) {
        addLog('Apify run started successfully!');
        addLog('Waiting for Apify to fetch jobs from job boards...');

        await new Promise(resolve => setTimeout(resolve, 2000));

        addLog('Processing fetched jobs...');

        if (result.config) {
          const { data: latestLog } = await supabase
            .from('job_sync_logs')
            .select('*')
            .eq('config_id', result.config.id)
            .order('sync_started_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (latestLog) {
            const stats = {
              fetched: latestLog.jobs_fetched || 0,
              created: latestLog.jobs_created || 0,
              updated: latestLog.jobs_updated || 0,
              skipped: latestLog.jobs_skipped || 0,
            };

            addLog(`Jobs fetched from Apify: ${stats.fetched}`);
            addLog(`New jobs created: ${stats.created}`);
            addLog(`Existing jobs updated: ${stats.updated}`);
            addLog(`Jobs skipped: ${stats.skipped}`);

            setSyncResult({
              platform: result.config.platform_name,
              success: true,
              stats,
            });
          } else {
            setSyncResult({
              platform: result.config.platform_name,
              success: true,
              stats: result.stats,
            });
          }
        }

        addLog('Sync completed successfully!');
        setSyncStatus('success');
        await loadRecentJobs();
      } else {
        addLog(`Error: ${result.message || 'Unknown error'}`);
        setSyncResult({
          platform: result.config?.platform_name || 'Unknown',
          success: false,
          error: result.message,
        });
        setSyncStatus('error');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addLog(`Error: ${errorMessage}`);
      setSyncResult({
        platform: 'Unknown',
        success: false,
        error: errorMessage,
      });
      setSyncStatus('error');
    } finally {
      stopTimer(timer);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const getStatusColor = () => {
    switch (syncStatus) {
      case 'fetching': return 'bg-blue-500';
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-lg">
              <Zap size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Fetch Jobs</h2>
              <p className="text-blue-100">One-click job sync automation</p>
            </div>
          </div>

          {defaultConfig && (
            <div className="bg-white/10 rounded-lg px-4 py-2 flex items-center gap-2">
              <Settings size={16} className="text-blue-200" />
              <span className="text-sm text-blue-100">
                Using: <span className="font-semibold text-white">{defaultConfig.platform_name}</span>
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={handleFetchJobs}
            disabled={syncStatus === 'fetching' || !defaultConfig}
            className={`flex-1 py-5 px-8 rounded-xl font-bold text-xl flex items-center justify-center gap-4 transition-all shadow-lg ${
              syncStatus === 'fetching'
                ? 'bg-gray-400 cursor-not-allowed'
                : !defaultConfig
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600 hover:scale-[1.02] active:scale-[0.98] hover:shadow-xl'
            }`}
          >
            {syncStatus === 'fetching' ? (
              <>
                <RefreshCw className="animate-spin" size={28} />
                Fetching Jobs...
              </>
            ) : (
              <>
                <Play size={28} />
                Fetch Jobs Now
              </>
            )}
          </button>

          <div className="bg-white/10 rounded-xl p-4 min-w-[140px] text-center">
            <div className={`w-5 h-5 rounded-full ${getStatusColor()} mx-auto mb-2 ${syncStatus === 'fetching' ? 'animate-pulse' : ''}`}></div>
            <p className="text-sm font-medium">
              {syncStatus === 'idle' && 'Ready'}
              {syncStatus === 'fetching' && 'Fetching...'}
              {syncStatus === 'success' && 'Completed'}
              {syncStatus === 'error' && 'Failed'}
            </p>
            {syncStatus === 'fetching' && (
              <p className="text-xs text-blue-200 mt-1">
                {formatTime(elapsedTime)}
              </p>
            )}
          </div>
        </div>

        {!defaultConfig && (
          <div className="mt-4 bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="text-yellow-300 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-medium text-yellow-100">No configuration found</p>
              <p className="text-sm text-yellow-200 mt-1">
                Please add an Apify configuration in the "Configuration Manager" tab first.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Clock size={18} className="text-gray-500" />
              Live Logs
            </h3>
            {logs.length > 0 && (
              <button
                onClick={() => setLogs([])}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            )}
          </div>
          <div className="p-4 h-64 overflow-y-auto bg-gray-900 rounded-b-xl">
            {logs.length === 0 ? (
              <p className="text-gray-500 text-sm">
                Logs will appear here when you start fetching...
              </p>
            ) : (
              <div className="space-y-1 font-mono text-xs">
                {logs.map((log, index) => (
                  <div
                    key={index}
                    className={`${
                      log.includes('Error')
                        ? 'text-red-400'
                        : log.includes('successfully') || log.includes('completed')
                        ? 'text-green-400'
                        : 'text-gray-300'
                    }`}
                  >
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Database size={18} className="text-gray-500" />
              Sync Results
            </h3>
          </div>
          <div className="p-6">
            {!syncResult ? (
              <div className="text-center py-8 text-gray-500">
                <Database size={48} className="mx-auto mb-3 opacity-30" />
                <p>Run a sync to see results here</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  {syncResult.success ? (
                    <CheckCircle className="text-green-500" size={24} />
                  ) : (
                    <XCircle className="text-red-500" size={24} />
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">{syncResult.platform}</p>
                    <p className={`text-sm ${syncResult.success ? 'text-green-600' : 'text-red-600'}`}>
                      {syncResult.success ? 'Sync completed successfully' : 'Sync failed'}
                    </p>
                  </div>
                </div>

                {syncResult.stats && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs text-blue-600 font-medium">Fetched</p>
                      <p className="text-2xl font-bold text-blue-900">{syncResult.stats.fetched}</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-xs text-green-600 font-medium">Created</p>
                      <p className="text-2xl font-bold text-green-900">{syncResult.stats.created}</p>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-xs text-yellow-600 font-medium">Updated</p>
                      <p className="text-2xl font-bold text-yellow-900">{syncResult.stats.updated}</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <p className="text-xs text-gray-600 font-medium">Skipped</p>
                      <p className="text-2xl font-bold text-gray-900">{syncResult.stats.skipped}</p>
                    </div>
                  </div>
                )}

                {syncResult.error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
                      <p className="text-sm text-red-700">{syncResult.error}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Briefcase size={18} className="text-gray-500" />
            Recently Synced Jobs (Last 10)
          </h3>
          <button
            onClick={loadRecentJobs}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
        <div className="divide-y divide-gray-100">
          {recentJobs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Briefcase size={48} className="mx-auto mb-3 opacity-30" />
              <p>No jobs found. Run a sync to fetch jobs.</p>
            </div>
          ) : (
            recentJobs.map((job) => (
              <div key={job.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{job.role_title}</h4>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Building size={14} />
                        {job.company_name}
                      </span>
                      {job.location_city && (
                        <span className="flex items-center gap-1">
                          <MapPin size={14} />
                          {job.location_city}
                        </span>
                      )}
                      {job.package_amount && (
                        <span className="text-green-600 font-medium">
                          {job.package_amount} LPA
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {job.source_platform}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(job.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
          <AlertTriangle size={18} />
          How This Works
        </h4>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Click "Fetch Jobs Now" to trigger the Apify sync</li>
          <li>Apify scrapes jobs using your saved JSON configuration</li>
          <li>Jobs are processed and saved to the database</li>
          <li>New jobs appear in the "Recently Synced Jobs" section</li>
          <li>Check "Sync Logs" tab for detailed sync history</li>
        </ol>
      </div>
    </div>
  );
};
