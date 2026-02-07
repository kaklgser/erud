import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Power, PowerOff, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { apifyService } from '../../services/apifyService';
import type { JobFetchConfig } from '../../types/jobs';

export const AdminApifyConfigManager: React.FC = () => {
  const [configs, setConfigs] = useState<JobFetchConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<JobFetchConfig | null>(null);
  const [syncingConfigs, setSyncingConfigs] = useState<Set<string>>(new Set());
  const [syncingAll, setSyncingAll] = useState(false);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const data = await apifyService.getConfigs();
      setConfigs(data);
    } catch (error) {
      console.error('Error loading configs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await apifyService.toggleConfig(id, !currentStatus);
      await loadConfigs();
    } catch (error) {
      console.error('Error toggling config:', error);
      alert('Failed to toggle configuration');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this configuration?')) {
      return;
    }

    try {
      await apifyService.deleteConfig(id);
      await loadConfigs();
    } catch (error) {
      console.error('Error deleting config:', error);
      alert('Failed to delete configuration');
    }
  };

  const handleManualSync = async (id: string) => {
    setSyncingConfigs(prev => new Set(prev).add(id));
    try {
      const result = await apifyService.triggerManualSync(id);
      if (result.success) {
        alert('✅ Sync started successfully! Check the Sync Logs tab for progress.');
        await loadConfigs();
      } else {
        alert(`❌ Failed to trigger sync: ${result.message}`);
      }
    } catch (error) {
      console.error('Error triggering sync:', error);
      alert('❌ Failed to trigger sync. Please check your configuration.');
    } finally {
      setSyncingConfigs(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleSyncAll = async () => {
    const activeConfigs = configs.filter(c => c.is_active);
    if (activeConfigs.length === 0) {
      alert('No active configurations to sync');
      return;
    }

    if (!confirm(`Run sync for all ${activeConfigs.length} active platform(s)?`)) {
      return;
    }

    setSyncingAll(true);
    let successCount = 0;
    let failCount = 0;

    for (const config of activeConfigs) {
      setSyncingConfigs(prev => new Set(prev).add(config.id));
      try {
        const result = await apifyService.triggerManualSync(config.id);
        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        console.error(`Error syncing ${config.platform_name}:`, error);
        failCount++;
      } finally {
        setSyncingConfigs(prev => {
          const next = new Set(prev);
          next.delete(config.id);
          return next;
        });
      }
    }

    setSyncingAll(false);
    await loadConfigs();

    alert(`✅ Sync Complete!\n\nSuccess: ${successCount}\nFailed: ${failCount}\n\nCheck Sync Logs for details.`);
  };

  const handleEdit = (config: JobFetchConfig) => {
    setEditingConfig(config);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingConfig(null);
  };

  const handleFormSuccess = () => {
    handleCloseForm();
    loadConfigs();
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
      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <RefreshCw className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-1">How Job Sync Works</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p>
                <strong>Automatic:</strong> Active platforms sync every <strong>8 hours</strong> automatically (configured in sync frequency)
              </p>
              <p>
                <strong>Manual:</strong> Click <strong>"Run Now"</strong> button to fetch jobs immediately without waiting
              </p>
              <p>
                <strong>Bulk:</strong> Use <strong>"Sync All Active"</strong> to run all active platforms at once
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Apify Configuration Manager</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage job platform connections and sync configurations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSyncAll}
            disabled={syncingAll || configs.filter(c => c.is_active).length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${syncingAll ? 'animate-spin' : ''}`} />
            {syncingAll ? 'Syncing All...' : 'Sync All Active'}
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Configuration
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm text-blue-600 font-medium">Total Platforms</div>
          <div className="text-2xl font-bold text-blue-900">{configs.length}</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-sm text-green-600 font-medium">Active</div>
          <div className="text-2xl font-bold text-green-900">
            {configs.filter(c => c.is_active).length}
          </div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 font-medium">Inactive</div>
          <div className="text-2xl font-bold text-gray-900">
            {configs.filter(c => !c.is_active).length}
          </div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="text-sm text-purple-600 font-medium">Syncing Now</div>
          <div className="text-2xl font-bold text-purple-900">{syncingConfigs.size}</div>
        </div>
      </div>

      {showForm && (
        <ConfigForm
          config={editingConfig}
          onClose={handleCloseForm}
          onSuccess={handleFormSuccess}
        />
      )}

      <div className="grid gap-4">
        {configs.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No configurations found. Add your first platform connection!</p>
          </div>
        ) : (
          configs.map((config) => {
            const isSyncing = syncingConfigs.has(config.id);
            return (
            <div
              key={config.id}
              className={`bg-white border rounded-lg p-6 hover:shadow-md transition-all ${
                isSyncing ? 'border-blue-400 shadow-lg' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {config.platform_name}
                    </h3>
                    {isSyncing ? (
                      <span className="flex items-center gap-1 text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full animate-pulse">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        Syncing...
                      </span>
                    ) : config.is_active ? (
                      <span className="flex items-center gap-1 text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded-full">
                        <XCircle className="w-3 h-3" />
                        Inactive
                      </span>
                    )}
                  </div>

                  <div className="mt-3 space-y-2 text-sm text-gray-600">
                    <p>
                      <span className="font-medium">Actor ID:</span> {config.actor_id}
                    </p>
                    <p>
                      <span className="font-medium">Sync Frequency:</span> Every {config.sync_frequency_hours} hours
                    </p>
                    <p>
                      <span className="font-medium">Last Sync:</span>{' '}
                      {config.last_sync_at
                        ? new Date(config.last_sync_at).toLocaleString()
                        : 'Never'}
                    </p>
                    <p>
                      <span className="font-medium">Search Config:</span>{' '}
                      {apifyService.formatSearchConfigForDisplay(config.search_config)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleManualSync(config.id)}
                    disabled={!config.is_active || isSyncing}
                    className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                      isSyncing
                        ? 'bg-blue-100 text-blue-600 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    title={isSyncing ? 'Sync in progress...' : 'Run sync now'}
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span className="text-sm font-medium">
                      {isSyncing ? 'Syncing...' : 'Run Now'}
                    </span>
                  </button>
                  <button
                    onClick={() => handleToggleActive(config.id, config.is_active)}
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    title={config.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {config.is_active ? (
                      <PowerOff className="w-4 h-4" />
                    ) : (
                      <Power className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleEdit(config)}
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    title="Edit configuration"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(config.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete configuration"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
          })
        )}
      </div>
    </div>
  );
};

interface ConfigFormProps {
  config: JobFetchConfig | null;
  onClose: () => void;
  onSuccess: () => void;
}

const ConfigForm: React.FC<ConfigFormProps> = ({ config, onClose, onSuccess }) => {
  const [platformName, setPlatformName] = useState(config?.platform_name || '');
  const [apiToken, setApiToken] = useState(config?.apify_api_token || '');
  const [actorId, setActorId] = useState(config?.actor_id || '');
  const [syncFrequency, setSyncFrequency] = useState(config?.sync_frequency_hours || 8);
  const [searchConfigJson, setSearchConfigJson] = useState(
    JSON.stringify(config?.search_config || {}, null, 2)
  );
  const [isActive, setIsActive] = useState(config?.is_active ?? true);
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  const popularActors = apifyService.getPopularActorIds();

  const handlePlatformChange = (platform: string) => {
    setPlatformName(platform);
    if (popularActors[platform.toLowerCase()]) {
      setActorId(popularActors[platform.toLowerCase()]);
      const defaultConfig = apifyService.generateDefaultSearchConfig(platform);
      setSearchConfigJson(JSON.stringify(defaultConfig, null, 2));
    }
  };

  const handleTestConnection = async () => {
    if (!apiToken || !actorId) {
      alert('Please enter API token and Actor ID');
      return;
    }

    setTestingConnection(true);
    try {
      const result = await apifyService.testApifyConnection(apiToken, actorId);
      if (result.success) {
        alert('Connection successful!');
      } else {
        alert(`Connection failed: ${result.message}`);
      }
    } catch (error) {
      alert('Connection test failed');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let searchConfig;
    try {
      searchConfig = JSON.parse(searchConfigJson);
    } catch (error) {
      alert('Invalid JSON in search configuration');
      return;
    }

    const validation = apifyService.validateSearchConfig(searchConfig);
    if (!validation.valid) {
      alert(`Invalid search config: ${validation.errors.join(', ')}`);
      return;
    }

    setLoading(true);
    try {
      if (config) {
        await apifyService.updateConfig(config.id, {
          platform_name: platformName,
          apify_api_token: apiToken,
          actor_id: actorId,
          search_config: searchConfig,
          sync_frequency_hours: syncFrequency,
          is_active: isActive,
        });
      } else {
        await apifyService.createConfig({
          platform_name: platformName,
          apify_api_token: apiToken,
          actor_id: actorId,
          search_config: searchConfig,
          sync_frequency_hours: syncFrequency,
          is_active: isActive,
        });
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">
            {config ? 'Edit Configuration' : 'Add Configuration'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Platform Name
            </label>
            <select
              value={platformName}
              onChange={(e) => handlePlatformChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select Platform</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="Indeed">Indeed</option>
              <option value="Naukri">Naukri</option>
              <option value="Instahyre">Instahyre</option>
              <option value="Glassdoor">Glassdoor</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Apify API Token
            </label>
            <input
              type="password"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your Apify API token"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Actor ID
            </label>
            <input
              type="text"
              value={actorId}
              onChange={(e) => setActorId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., apify/linkedin-jobs-scraper"
              required
            />
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testingConnection}
              className="mt-2 text-sm text-blue-600 hover:underline disabled:opacity-50"
            >
              {testingConnection ? 'Testing...' : 'Test Connection'}
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sync Frequency (hours)
            </label>
            <input
              type="number"
              value={syncFrequency}
              onChange={(e) => setSyncFrequency(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1"
              max="168"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Configuration (JSON)
            </label>
            <textarea
              value={searchConfigJson}
              onChange={(e) => setSearchConfigJson(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              rows={10}
              placeholder='{"keywords": ["software engineer"], "location": "India"}'
              required
            />
            <div className="mt-2 space-y-2">
              <p className="text-xs text-gray-500">
                <strong>Edit the JSON above to customize job search parameters.</strong> This JSON controls what jobs Apify will fetch.
              </p>
              <details className="text-xs text-gray-600">
                <summary className="cursor-pointer font-medium text-blue-600 hover:underline">
                  View Example Configurations
                </summary>
                <div className="mt-2 space-y-3 bg-gray-50 p-3 rounded border border-gray-200">
                  <div>
                    <p className="font-semibold mb-1">LinkedIn Example:</p>
                    <pre className="bg-white p-2 rounded text-xs overflow-x-auto">
{`{
  "keywords": ["React Developer", "Node.js"],
  "location": "India",
  "datePosted": "week",
  "experienceLevel": ["Entry level", "Mid-Senior"],
  "jobType": ["Full-time"]
}`}
                    </pre>
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Indeed Example:</p>
                    <pre className="bg-white p-2 rounded text-xs overflow-x-auto">
{`{
  "position": "Software Engineer",
  "location": "Bangalore",
  "maxItems": 100,
  "datePosted": "7"
}`}
                    </pre>
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Naukri Example:</p>
                    <pre className="bg-white p-2 rounded text-xs overflow-x-auto">
{`{
  "keywords": "Python Developer",
  "location": "Mumbai",
  "experience": "0-3",
  "salary": "3-8"
}`}
                    </pre>
                  </div>
                </div>
              </details>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
              Active (enable automatic syncing)
            </label>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : config ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
