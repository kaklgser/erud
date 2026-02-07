import React, { useState, useEffect } from 'react';
import { 
  Monitor, 
  Smartphone, 
  Tablet, 
  MapPin, 
  Clock, 
  Shield, 
  AlertTriangle, 
  Trash2, 
  CheckCircle,
  Globe,
  Activity,
  LogOut,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { deviceTrackingService, UserDevice, UserSession, ActivityLog } from '../../services/deviceTrackingService';
import { useAuth } from '../../contexts/AuthContext';

export const DeviceManagement: React.FC = () => {
  const { user } = useAuth();
  const [devices, setDevices] = useState<UserDevice[]>([]);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'devices' | 'sessions' | 'activity'>('devices');
  const [showDetails, setShowDetails] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [devicesData, sessionsData, activityData] = await Promise.all([
        deviceTrackingService.getUserDevices(user.id),
        deviceTrackingService.getUserSessions(user.id),
        deviceTrackingService.getUserActivityLogs(user.id, 20)
      ]);

      setDevices(devicesData);
      setSessions(sessionsData);
      setActivityLogs(activityData);
    } catch (error) {
      console.error('Error loading device data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTrustDevice = async (deviceId: string) => {
    const success = await deviceTrackingService.trustDevice(deviceId);
    if (success) {
      await loadData();
    }
  };

  const handleRemoveDevice = async (deviceId: string) => {
    if (confirm('Are you sure you want to remove this device? All sessions will be ended.')) {
      const success = await deviceTrackingService.removeDevice(deviceId);
      if (success) {
        await loadData();
      }
    }
  };

  const handleEndSession = async (sessionId: string) => {
    const success = await deviceTrackingService.endSpecificSession(sessionId);
    if (success) {
      await loadData();
    }
  };

  const handleEndAllOtherSessions = async () => {
    if (confirm('Are you sure you want to end all other sessions? You will remain logged in on this device.')) {
      // Get current session token (you'll need to implement this)
      const currentSessionToken = 'current-session-token'; // Replace with actual current session
      const success = await deviceTrackingService.endAllOtherSessions(user!.id, currentSessionToken);
      if (success) {
        await loadData();
      }
    }
  };

  const toggleDetails = (id: string) => {
    const newShowDetails = new Set(showDetails);
    if (newShowDetails.has(id)) {
      newShowDetails.delete(id);
    } else {
      newShowDetails.add(id);
    }
    setShowDetails(newShowDetails);
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile': return <Smartphone className="w-5 h-5" />;
      case 'tablet': return <Tablet className="w-5 h-5" />;
      default: return <Monitor className="w-5 h-5" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getRiskColor = (score: number) => {
    if (score >= 70) return 'text-red-400 bg-red-500/20';
    if (score >= 40) return 'text-orange-400 bg-orange-500/20';
    return 'text-emerald-400 bg-emerald-500/20';
  };

  if (loading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-slate-700/50">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-400 mr-2" />
          <span className="text-slate-300">Loading device information...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700/50 p-6 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-emerald-500 to-cyan-500 w-12 h-12 rounded-full flex items-center justify-center mr-4">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-100">Device & Session Management</h2>
              <p className="text-slate-400">Monitor and manage your account security across all devices</p>
            </div>
          </div>
          <button
            onClick={loadData}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-700/50">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'devices', label: 'Devices', count: devices.length },
            { id: 'sessions', label: 'Active Sessions', count: sessions.length },
            { id: 'activity', label: 'Recent Activity', count: activityLogs.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'devices' && (
          <div className="space-y-4">
            {devices.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                No devices found
              </div>
            ) : (
              devices.map((device) => (
                <div key={device.id} className="border border-slate-700/50 rounded-lg p-4 bg-slate-900/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-slate-400">
                        {getDeviceIcon(device.deviceType)}
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-100">
                          {device.deviceName || `${device.browserName} on ${device.osName}`}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-slate-400">
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            Last seen: {formatDate(device.lastSeenAt)}
                          </span>
                          {device.lastLocation && (
                            <span className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {device.lastLocation.city}, {device.lastLocation.country}
                            </span>
                          )}
                          <span className="flex items-center">
                            <Activity className="w-4 h-4 mr-1" />
                            {device.activeSessions} active session{device.activeSessions !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {device.isTrusted ? (
                        <span className="flex items-center text-emerald-400 text-sm">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Trusted
                        </span>
                      ) : (
                        <button
                          onClick={() => handleTrustDevice(device.id)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          Trust Device
                        </button>
                      )}
                      <button
                        onClick={() => toggleDetails(device.id)}
                        className="text-slate-400 hover:text-slate-200 p-1"
                      >
                        {showDetails.has(device.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleRemoveDevice(device.id)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {showDetails.has(device.id) && (
                    <div className="mt-4 pt-4 border-t border-slate-700/50 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-slate-300">Device Type:</span>
                        <span className="ml-2 text-slate-400">{device.deviceType}</span>
                      </div>
                      <div>
                        <span className="font-medium text-slate-300">Browser:</span>
                        <span className="ml-2 text-slate-400">{device.browserName}</span>
                      </div>
                      <div>
                        <span className="font-medium text-slate-300">Operating System:</span>
                        <span className="ml-2 text-slate-400">{device.osName}</span>
                      </div>
                      <div>
                        <span className="font-medium text-slate-300">Status:</span>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                          device.isTrusted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {device.isTrusted ? 'Trusted' : 'Untrusted'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-slate-100">Active Sessions</h3>
              <button
                onClick={handleEndAllOtherSessions}
                className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>End All Other Sessions</span>
              </button>
            </div>
            
            {sessions.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                No active sessions found
              </div>
            ) : (
              sessions.map((session) => (
                <div key={session.id} className="border border-slate-700/50 rounded-lg p-4 bg-slate-900/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-slate-400">
                        <Globe className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-100">
                          Session from {session.ipAddress}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-slate-400">
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            Started: {formatDate(session.createdAt)}
                          </span>
                          <span className="flex items-center">
                            <Activity className="w-4 h-4 mr-1" />
                            Last activity: {formatDate(session.lastActivityAt)}
                          </span>
                          {session.location && (
                            <span className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {session.location.city}, {session.location.country}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="flex items-center text-emerald-400 text-sm">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Active
                      </span>
                      <button
                        onClick={() => handleEndSession(session.id)}
                        className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        End Session
                      </button>
                    </div>
                  </div>
                  
                  {showDetails.has(session.id) && (
                    <div className="mt-4 pt-4 border-t border-slate-700/50 text-sm">
                      <div className="grid grid-cols-1 gap-2">
                        <div>
                          <span className="font-medium text-slate-300">User Agent:</span>
                          <span className="ml-2 text-slate-400 break-all">{session.userAgent}</span>
                        </div>
                        <div>
                          <span className="font-medium text-slate-300">Expires:</span>
                          <span className="ml-2 text-slate-400">{formatDate(session.expiresAt)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-100">Recent Activity</h3>
            
            {activityLogs.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                No recent activity found
              </div>
            ) : (
              activityLogs.map((log) => (
                <div key={log.id} className="border border-slate-700/50 rounded-lg p-4 bg-slate-900/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-slate-400">
                        <Activity className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-100 capitalize">
                          {log.activityType.replace('_', ' ')}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-slate-400">
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {formatDate(log.createdAt)}
                          </span>
                          {log.ipAddress && (
                            <span className="flex items-center">
                              <Globe className="w-4 h-4 mr-1" />
                              {log.ipAddress}
                            </span>
                          )}
                          {log.location && (
                            <span className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {log.location.city}, {log.location.country}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(log.riskScore)}`}>
                        Risk: {log.riskScore}%
                      </span>
                      {log.riskScore >= 70 && (
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                  </div>
                  
                  {log.activityDetails && (
                    <div className="mt-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                      <pre className="text-sm text-slate-300 whitespace-pre-wrap">
                        {JSON.stringify(log.activityDetails, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};