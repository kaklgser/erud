import React, { useState, useEffect } from 'react';
import { Clock, Plus, Trash2, Power, PowerOff, Calendar, X } from 'lucide-react';
import { apifyService } from '../../services/apifyService';

interface ScheduledSync {
  id: string;
  config_id: string;
  schedule_name: string;
  cron_expression: string;
  timezone: string;
  is_active: boolean;
  next_run_at: string | null;
  last_run_at: string | null;
  created_at: string;
}

interface PlatformConfig {
  id: string;
  platform_name: string;
}

interface ScheduledSyncManagerProps {
  configs: PlatformConfig[];
}

const CRON_PRESETS = [
  { label: 'Every Hour', value: '0 * * * *', description: 'Runs at the start of every hour' },
  { label: 'Every 3 Hours', value: '0 */3 * * *', description: 'Runs every 3 hours' },
  { label: 'Every 6 Hours', value: '0 */6 * * *', description: 'Runs every 6 hours' },
  { label: 'Every 12 Hours', value: '0 */12 * * *', description: 'Runs twice daily' },
  { label: 'Daily at 9 AM', value: '0 9 * * *', description: 'Runs every day at 9:00 AM' },
  { label: 'Daily at 6 PM', value: '0 18 * * *', description: 'Runs every day at 6:00 PM' },
  { label: 'Weekdays at 9 AM', value: '0 9 * * 1-5', description: 'Runs Mon-Fri at 9:00 AM' },
  { label: 'Weekly on Monday', value: '0 9 * * 1', description: 'Runs every Monday at 9:00 AM' },
  { label: 'Monthly (1st day)', value: '0 9 1 * *', description: 'Runs on the 1st of each month' },
];

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Kolkata',
  'Asia/Tokyo',
  'Australia/Sydney',
];

export const ScheduledSyncManager: React.FC<ScheduledSyncManagerProps> = ({ configs }) => {
  const [scheduledSyncs, setScheduledSyncs] = useState<ScheduledSync[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    config_id: '',
    schedule_name: '',
    cron_expression: '0 9 * * 1',
    timezone: 'UTC',
    is_active: true,
  });

  useEffect(() => {
    loadScheduledSyncs();
  }, []);

  const loadScheduledSyncs = async () => {
    try {
      setLoading(true);
      const data = await apifyService.getScheduledSyncs();
      setScheduledSyncs(data);
    } catch (error) {
      console.error('Failed to load scheduled syncs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchedule = async () => {
    if (!formData.config_id || !formData.schedule_name) {
      alert('Please fill all required fields');
      return;
    }

    try {
      await apifyService.createScheduledSync(formData);
      await loadScheduledSyncs();
      setShowAddModal(false);
      setFormData({
        config_id: '',
        schedule_name: '',
        cron_expression: '0 9 * * 1',
        timezone: 'UTC',
        is_active: true,
      });
    } catch (error) {
      console.error('Failed to create schedule:', error);
      alert('Failed to create schedule');
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await apifyService.updateScheduledSync(id, { is_active: !currentStatus });
      await loadScheduledSyncs();
    } catch (error) {
      console.error('Failed to toggle schedule:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;

    try {
      await apifyService.deleteScheduledSync(id);
      await loadScheduledSyncs();
    } catch (error) {
      console.error('Failed to delete schedule:', error);
    }
  };

  const getPlatformName = (configId: string) => {
    return configs.find((c) => c.id === configId)?.platform_name || 'Unknown';
  };

  const formatNextRun = (nextRun: string | null) => {
    if (!nextRun) return 'Not scheduled';
    const date = new Date(nextRun);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (diff < 0) return 'Overdue';
    if (hours < 1) return `In ${minutes} minutes`;
    if (hours < 24) return `In ${hours} hours`;
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
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
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Scheduled Syncs</h3>
          <p className="text-sm text-gray-600 mt-1">
            Set up recurring sync schedules for your platforms
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add Schedule
        </button>
      </div>

      {scheduledSyncs.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
          <h4 className="text-lg font-semibold text-gray-900 mb-2">No Scheduled Syncs</h4>
          <p className="text-gray-600 mb-4">Create your first schedule to automate syncs</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Schedule
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {scheduledSyncs.map((schedule) => (
            <div
              key={schedule.id}
              className={`border rounded-lg p-4 ${
                schedule.is_active ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold text-gray-900">{schedule.schedule_name}</h4>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        schedule.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {schedule.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-700">
                      <span className="font-medium">Platform:</span> {getPlatformName(schedule.config_id)}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Schedule:</span>{' '}
                      {CRON_PRESETS.find((p) => p.value === schedule.cron_expression)?.label ||
                        schedule.cron_expression}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Timezone:</span> {schedule.timezone}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Next Run:</span> {formatNextRun(schedule.next_run_at)}
                    </p>
                    {schedule.last_run_at && (
                      <p className="text-gray-600">
                        <span className="font-medium">Last Run:</span>{' '}
                        {new Date(schedule.last_run_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleActive(schedule.id, schedule.is_active)}
                    className={`p-2 rounded-lg transition-colors ${
                      schedule.is_active
                        ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                        : 'bg-green-100 hover:bg-green-200 text-green-700'
                    }`}
                    title={schedule.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {schedule.is_active ? <PowerOff size={18} /> : <Power size={18} />}
                  </button>
                  <button
                    onClick={() => handleDelete(schedule.id)}
                    className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Create Scheduled Sync</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Schedule Name *
                  </label>
                  <input
                    type="text"
                    value={formData.schedule_name}
                    onChange={(e) => setFormData({ ...formData, schedule_name: e.target.value })}
                    placeholder="e.g., Weekly Monday LinkedIn Sync"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Platform *
                  </label>
                  <select
                    value={formData.config_id}
                    onChange={(e) => setFormData({ ...formData, config_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a platform</option>
                    {configs.map((config) => (
                      <option key={config.id} value={config.id}>
                        {config.platform_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Schedule Pattern *
                  </label>
                  <select
                    value={formData.cron_expression}
                    onChange={(e) => setFormData({ ...formData, cron_expression: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {CRON_PRESETS.map((preset) => (
                      <option key={preset.value} value={preset.value}>
                        {preset.label} - {preset.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                  <select
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                    Activate schedule immediately
                  </label>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                    <Clock size={16} />
                    Schedule Preview
                  </h4>
                  <p className="text-sm text-blue-800">
                    {CRON_PRESETS.find((p) => p.value === formData.cron_expression)?.description}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Cron: {formData.cron_expression} ({formData.timezone})
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateSchedule}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
