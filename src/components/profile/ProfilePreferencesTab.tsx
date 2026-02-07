import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  BellOff,
  Loader2,
  Save,
  CheckCircle,
  AlertCircle,
  Briefcase,
  GraduationCap,
  Globe,
  Mail,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { userPreferencesService, UserJobPreferences } from '../../services/userPreferencesService';

const ROLE_TYPES = [
  { value: 'internship', label: 'Internship' },
  { value: 'fulltime', label: 'Full-time' },
  { value: 'both', label: 'Both' },
];

const FREQUENCIES = [
  { value: 'daily', label: 'Daily Digest' },
  { value: 'weekly', label: 'Weekly Summary' },
  { value: 'immediate', label: 'Immediate Alerts' },
];

export const ProfilePreferencesTab: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [preferences, setPreferences] = useState<Partial<UserJobPreferences>>({
    role_type: 'both',
    passout_year: new Date().getFullYear(),
    tech_interests: [],
    preferred_modes: [],
  });

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [availableDomains, setAvailableDomains] = useState<string[]>([]);
  const [frequency, setFrequency] = useState<'daily' | 'immediate' | 'weekly'>('daily');
  const [stats, setStats] = useState({ totalNotifications: 0, lastNotificationDate: null as string | null });

  useEffect(() => {
    if (user) loadAll();
  }, [user]);

  const loadAll = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [prefs, sub, domains, notifStats] = await Promise.all([
        userPreferencesService.getUserPreferences(user.id),
        userPreferencesService.getNotificationSubscription(user.id),
        userPreferencesService.getAvailableDomains(),
        userPreferencesService.getNotificationStats(user.id),
      ]);
      if (prefs) {
        setPreferences({
          role_type: prefs.role_type || 'both',
          passout_year: prefs.passout_year || new Date().getFullYear(),
          tech_interests: prefs.tech_interests || [],
          preferred_modes: prefs.preferred_modes || [],
        });
      }
      if (sub) {
        setIsSubscribed(sub.is_subscribed);
        setSelectedDomains(sub.preferred_domains || []);
        setFrequency(sub.notification_frequency || 'daily');
      }
      setAvailableDomains(domains);
      setStats(notifStats);
    } catch (err) {
      console.error('Error loading preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setMessage(null);
    try {
      await userPreferencesService.savePreferences({
        user_id: user.id,
        role_type: preferences.role_type as any,
        passout_year: preferences.passout_year,
        tech_interests: preferences.tech_interests,
        preferred_modes: preferences.preferred_modes,
      });
      await userPreferencesService.updateNotificationSubscription(
        user.id,
        selectedDomains,
        isSubscribed,
        frequency
      );
      setMessage({ type: 'success', text: 'Preferences saved successfully' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save preferences' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const toggleDomain = (domain: string) => {
    setSelectedDomains(prev =>
      prev.includes(domain) ? prev.filter(d => d !== domain) : [...prev, domain]
    );
  };

  const [techInput, setTechInput] = useState('');
  const addTech = () => {
    const trimmed = techInput.trim();
    if (trimmed && !preferences.tech_interests?.includes(trimmed)) {
      setPreferences(prev => ({ ...prev, tech_interests: [...(prev.tech_interests || []), trimmed] }));
      setTechInput('');
    }
  };

  const removeTech = (tech: string) => {
    setPreferences(prev => ({ ...prev, tech_interests: (prev.tech_interests || []).filter(t => t !== tech) }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-[#00E6B8] mr-2" />
        <span className="text-slate-400">Loading preferences...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm ${
            message.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-red-500/10 text-red-400 border-red-500/30'
          }`}
        >
          {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {message.text}
        </motion.div>
      )}

      <div className="bg-[#0a1a24] rounded-xl border border-[#0c1d25] p-5 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <Briefcase className="w-4 h-4 text-[#00E6B8]" />
          <h3 className="text-sm font-semibold text-slate-200">Job Preferences</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Role Type</label>
            <select
              value={preferences.role_type || 'both'}
              onChange={e => setPreferences(prev => ({ ...prev, role_type: e.target.value as any }))}
              className="w-full bg-[#05131A] border border-[#0c1d25] text-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#00E6B8] transition-colors"
            >
              {ROLE_TYPES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              <GraduationCap className="w-3.5 h-3.5 inline mr-1" />
              Passout Year
            </label>
            <input
              type="number"
              value={preferences.passout_year || ''}
              onChange={e => setPreferences(prev => ({ ...prev, passout_year: parseInt(e.target.value) || undefined }))}
              className="w-full bg-[#05131A] border border-[#0c1d25] text-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#00E6B8] transition-colors"
              min={2000}
              max={2035}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Tech Interests</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={techInput}
              onChange={e => setTechInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTech())}
              placeholder="e.g., React, Python, AWS"
              className="flex-1 bg-[#05131A] border border-[#0c1d25] text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#00E6B8] transition-colors"
            />
            <button
              onClick={addTech}
              className="px-3 py-2 bg-[rgba(0,230,184,0.15)] text-[#00E6B8] rounded-lg text-sm font-medium hover:bg-[rgba(0,230,184,0.25)] transition-colors"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {(preferences.tech_interests || []).map(tech => (
              <span
                key={tech}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#05131A] border border-[#0c1d25] text-slate-300 rounded-full text-xs"
              >
                {tech}
                <button onClick={() => removeTech(tech)} className="text-slate-500 hover:text-red-400 ml-1">&times;</button>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#0a1a24] rounded-xl border border-[#0c1d25] p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-slate-200">Email Notifications</h3>
          </div>
          <button
            onClick={() => setIsSubscribed(!isSubscribed)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isSubscribed
                ? 'bg-[rgba(0,230,184,0.15)] text-[#00E6B8]'
                : 'bg-slate-800 text-slate-500'
            }`}
          >
            {isSubscribed ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
            {isSubscribed ? 'Subscribed' : 'Unsubscribed'}
          </button>
        </div>

        {isSubscribed && (
          <>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Frequency</label>
              <div className="flex gap-2">
                {FREQUENCIES.map(f => (
                  <button
                    key={f.value}
                    onClick={() => setFrequency(f.value as any)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      frequency === f.value
                        ? 'bg-[rgba(0,230,184,0.15)] text-[#00E6B8] border border-[rgba(0,230,184,0.3)]'
                        : 'bg-[#05131A] text-slate-400 border border-[#0c1d25] hover:border-slate-600'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {availableDomains.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">
                  <Globe className="w-3.5 h-3.5 inline mr-1" />
                  Preferred Domains
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableDomains.map(domain => (
                    <button
                      key={domain}
                      onClick={() => toggleDomain(domain)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                        selectedDomains.includes(domain)
                          ? 'bg-[rgba(0,230,184,0.15)] text-[#00E6B8] border-[rgba(0,230,184,0.3)]'
                          : 'bg-[#05131A] text-slate-400 border-[#0c1d25] hover:border-slate-600'
                      }`}
                    >
                      {domain}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-[#0c1d25]">
              <span>Total notifications: {stats.totalNotifications}</span>
              {stats.lastNotificationDate && (
                <span>Last sent: {new Date(stats.lastNotificationDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
              )}
            </div>
          </>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[rgba(0,230,184,0.15)] text-[#00E6B8] rounded-lg hover:bg-[rgba(0,230,184,0.25)] transition-colors text-sm font-medium disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
};
