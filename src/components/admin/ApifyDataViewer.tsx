import React, { useState, useEffect } from 'react';
import { FileJson, Download, RefreshCw, Eye, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ApifyRawData {
  id: string;
  config_id: string;
  platform_name: string;
  sync_started_at: string;
  sync_completed_at: string;
  status: string;
  jobs_fetched: number;
  jobs_created: number;
  jobs_updated: number;
  jobs_skipped: number;
  sync_metadata: {
    apify_run_id?: string;
    dataset_id?: string;
  };
}

export const ApifyDataViewer: React.FC = () => {
  const [logs, setLogs] = useState<ApifyRawData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<ApifyRawData | null>(null);
  const [viewingJson, setViewingJson] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [fetchingJson, setFetchingJson] = useState(false);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('job_sync_logs')
        .select('*')
        .eq('status', 'success')
        .not('sync_metadata', 'is', null)
        .order('sync_completed_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApifyJson = async (log: ApifyRawData) => {
    setFetchingJson(true);
    setSelectedLog(log);

    try {
      // Get the config to access API token
      const { data: config, error: configError } = await supabase
        .from('job_fetch_configs')
        .select('apify_api_token')
        .eq('id', log.config_id)
        .single();

      if (configError) throw configError;

      const datasetId = log.sync_metadata.dataset_id;
      if (!datasetId) {
        throw new Error('No dataset ID found in sync metadata');
      }

      // Fetch raw JSON from Apify
      const response = await fetch(
        `https://api.apify.com/v2/datasets/${datasetId}/items?format=json`,
        {
          headers: {
            'Authorization': `Bearer ${config.apify_api_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch Apify data');
      }

      const jsonData = await response.json();
      setViewingJson(jsonData);
    } catch (error) {
      console.error('Error fetching Apify JSON:', error);
      alert(`Failed to fetch JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setFetchingJson(false);
    }
  };

  const downloadJson = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredLogs = logs.filter(log =>
    log.platform_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Apify JSON Data Viewer</h2>
          <p className="text-sm text-gray-600 mt-1">
            View and download raw JSON responses from Apify runs
          </p>
        </div>
        <button
          onClick={loadLogs}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by platform name..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FileJson className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="flex-1 text-sm text-blue-800">
            <p className="font-medium mb-1">How to Access Apify JSON Data:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Select a successful sync from the list below</li>
              <li>Click "View JSON" to fetch raw data from Apify</li>
              <li>Use "Download JSON" to save the data locally</li>
              <li>JSON shows the exact data structure returned by Apify before database mapping</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Logs List */}
      <div className="grid gap-4">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <FileJson className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">
              {searchTerm ? 'No matching sync logs found' : 'No successful syncs with data available yet'}
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {log.platform_name}
                    </h3>
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                      Success
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Fetched:</span>
                      <span className="font-semibold text-gray-900 ml-2">{log.jobs_fetched}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Created:</span>
                      <span className="font-semibold text-green-600 ml-2">{log.jobs_created}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Updated:</span>
                      <span className="font-semibold text-blue-600 ml-2">{log.jobs_updated}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Skipped:</span>
                      <span className="font-semibold text-gray-600 ml-2">{log.jobs_skipped}</span>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-gray-600">
                    <p>
                      <span className="font-medium">Completed:</span>{' '}
                      {new Date(log.sync_completed_at).toLocaleString()}
                    </p>
                    {log.sync_metadata.apify_run_id && (
                      <p className="mt-1">
                        <span className="font-medium">Apify Run ID:</span>{' '}
                        <code className="bg-gray-100 px-1 py-0.5 rounded">
                          {log.sync_metadata.apify_run_id}
                        </code>
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => fetchApifyJson(log)}
                  disabled={fetchingJson && selectedLog?.id === log.id}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Eye className="w-4 h-4" />
                  {fetchingJson && selectedLog?.id === log.id ? 'Loading...' : 'View JSON'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* JSON Viewer Modal */}
      {viewingJson && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Apify JSON Data - {selectedLog.platform_name}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {viewingJson.length} jobs returned from Apify
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => downloadJson(viewingJson, `apify-${selectedLog.platform_name}-${Date.now()}.json`)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download JSON
                </button>
                <button
                  onClick={() => {
                    setViewingJson(null);
                    setSelectedLog(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto font-mono">
                {JSON.stringify(viewingJson, null, 2)}
              </pre>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-start gap-3 text-sm">
                <FileJson className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-gray-700">
                  <p className="font-medium mb-1">Understanding the JSON Structure:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>This is the <strong>raw data</strong> returned by Apify before any processing</li>
                    <li>Each object represents one job listing scraped from {selectedLog.platform_name}</li>
                    <li>Fields like <code>title</code>, <code>company</code>, <code>location</code>, <code>description</code> are common</li>
                    <li>The structure varies by platform and Apify actor</li>
                    <li>This data is mapped to your database schema by the Edge Function</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
