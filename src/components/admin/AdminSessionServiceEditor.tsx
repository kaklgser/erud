import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save,
  Loader2,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Settings,
  ChevronDown,
  ChevronUp,
  ToggleLeft,
  ToggleRight,
  Type,
  DollarSign,
  Gift,
  Users,
  Clock,
  ListChecks,
} from 'lucide-react';
import { adminSessionService } from '../../services/adminSessionService';
import { sessionBookingService } from '../../services/sessionBookingService';
import type { SessionService } from '../../types/session';

interface SaveStatus {
  type: 'success' | 'error';
  message: string;
}

export const AdminSessionServiceEditor: React.FC = () => {
  const [service, setService] = useState<SessionService | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceRupees, setPriceRupees] = useState(0);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [bonusCredits, setBonusCredits] = useState(0);
  const [maxSlots, setMaxSlots] = useState(5);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    loadService();
  }, []);

  const loadService = async () => {
    setLoading(true);
    const svc = await sessionBookingService.getActiveService();
    if (svc) {
      const full = await adminSessionService.getServiceForEditing(svc.id);
      if (full) {
        setService(full);
        setTitle(full.title);
        setDescription(full.description);
        setPriceRupees(full.price / 100);
        setHighlights([...(full.highlights || [])]);
        setBonusCredits(full.bonus_credits);
        setMaxSlots(full.max_slots_per_day);
        setTimeSlots([...(full.time_slots || [])]);
        setIsActive(full.is_active);
      }
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!service) return;
    setSaving(true);
    setSaveStatus(null);

    const result = await adminSessionService.updateService(service.id, {
      title: title.trim(),
      description: description.trim(),
      price: Math.round(priceRupees * 100),
      highlights: highlights.filter((h) => h.trim() !== ''),
      bonus_credits: bonusCredits,
      max_slots_per_day: maxSlots,
      time_slots: timeSlots.filter((t) => t.trim() !== ''),
      is_active: isActive,
    });

    if (result.success) {
      setSaveStatus({ type: 'success', message: 'Service updated successfully' });
      await loadService();
    } else {
      setSaveStatus({ type: 'error', message: result.error || 'Failed to save' });
    }

    setSaving(false);
    setTimeout(() => setSaveStatus(null), 4000);
  };

  const addHighlight = () => setHighlights([...highlights, '']);
  const removeHighlight = (index: number) => setHighlights(highlights.filter((_, i) => i !== index));
  const updateHighlight = (index: number, value: string) => {
    const updated = [...highlights];
    updated[index] = value;
    setHighlights(updated);
  };

  const addTimeSlot = () => setTimeSlots([...timeSlots, '']);
  const removeTimeSlot = (index: number) => setTimeSlots(timeSlots.filter((_, i) => i !== index));
  const updateTimeSlot = (index: number, value: string) => {
    const updated = [...timeSlots];
    updated[index] = value;
    setTimeSlots(updated);
  };

  if (loading) {
    return (
      <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-6 flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-6 text-center text-slate-400">
        No session service found.
      </div>
    );
  }

  return (
    <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 hover:bg-slate-800/60 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Settings className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-left">
            <p className="text-white font-semibold text-sm">Service Settings</p>
            <p className="text-slate-500 text-xs">Edit session page title, price, highlights, and time slots</p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-5 border-t border-slate-700/40 pt-5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <FieldGroup icon={<Type className="w-4 h-4" />} label="Title">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                  />
                </FieldGroup>

                <FieldGroup icon={<Type className="w-4 h-4" />} label="Description">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50 resize-none"
                  />
                </FieldGroup>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <FieldGroup icon={<DollarSign className="w-4 h-4" />} label="Price (INR)">
                  <input
                    type="number"
                    min={0}
                    value={priceRupees}
                    onChange={(e) => setPriceRupees(Number(e.target.value))}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                  />
                </FieldGroup>

                <FieldGroup icon={<Gift className="w-4 h-4" />} label="Bonus Credits">
                  <input
                    type="number"
                    min={0}
                    value={bonusCredits}
                    onChange={(e) => setBonusCredits(Number(e.target.value))}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                  />
                </FieldGroup>

                <FieldGroup icon={<Users className="w-4 h-4" />} label="Max Slots / Day">
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={maxSlots}
                    onChange={(e) => setMaxSlots(Number(e.target.value))}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                  />
                </FieldGroup>
              </div>

              <FieldGroup icon={<ListChecks className="w-4 h-4" />} label="Highlights">
                <div className="space-y-2">
                  {highlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={h}
                        onChange={(e) => updateHighlight(i, e.target.value)}
                        placeholder={`Highlight ${i + 1}`}
                        className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                      />
                      <button
                        onClick={() => removeHighlight(i)}
                        className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addHighlight}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Highlight
                  </button>
                </div>
              </FieldGroup>

              <FieldGroup icon={<Clock className="w-4 h-4" />} label="Time Slots (format: HH:MM-HH:MM)">
                <div className="space-y-2">
                  {timeSlots.map((ts, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={ts}
                        onChange={(e) => updateTimeSlot(i, e.target.value)}
                        placeholder="e.g. 10:00-11:00"
                        className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                      />
                      <button
                        onClick={() => removeTimeSlot(i)}
                        className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addTimeSlot}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Time Slot
                  </button>
                </div>
              </FieldGroup>

              <div className="flex items-center justify-between bg-slate-900/30 rounded-lg px-4 py-3">
                <div className="flex items-center gap-2">
                  {isActive ? (
                    <ToggleRight className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <ToggleLeft className="w-5 h-5 text-slate-500" />
                  )}
                  <span className="text-sm text-slate-300">
                    Service is {isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <button
                  onClick={() => setIsActive(!isActive)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    isActive ? 'bg-emerald-500' : 'bg-slate-600'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                      isActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between pt-2">
                <AnimatePresence>
                  {saveStatus && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className={`flex items-center gap-2 text-sm ${
                        saveStatus.type === 'success' ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {saveStatus.type === 'success' ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}
                      {saveStatus.message}
                    </motion.div>
                  )}
                </AnimatePresence>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="ml-auto flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Changes
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FieldGroup: React.FC<{
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}> = ({ icon, label, children }) => (
  <div>
    <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5">
      {icon}
      {label}
    </label>
    {children}
  </div>
);
