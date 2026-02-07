import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  Hash,
  Lock,
  Unlock,
  Download,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Users,
  DollarSign,
  CheckCircle,
} from 'lucide-react';
import { adminSessionService } from '../../services/adminSessionService';
import { sessionBookingService } from '../../services/sessionBookingService';

const SLOT_LABELS: Record<string, string> = {
  '10:00-11:00': '10:00 AM - 11:00 AM',
  '11:00-12:00': '11:00 AM - 12:00 PM',
  '12:00-13:00': '12:00 PM - 1:00 PM',
  '14:00-15:00': '2:00 PM - 3:00 PM',
  '15:00-16:00': '3:00 PM - 4:00 PM',
};

interface SlotRow {
  id: string;
  slot_date: string;
  time_slot: string;
  status: string;
  user_name: string | null;
  user_email: string | null;
  user_phone: string | null;
  booking_code: string | null;
  booking_status: string | null;
}

interface Stats {
  total_bookings: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  total_revenue: number;
}

export const AdminSessionSchedule: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [slots, setSlots] = useState<SlotRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [togglingSlot, setTogglingSlot] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const svc = await sessionBookingService.getActiveService();
      if (svc) {
        setServiceId(svc.id);
      }
      const s = await adminSessionService.getBookingStats();
      setStats(s);
    };
    init();
  }, []);

  useEffect(() => {
    if (serviceId) loadSlots();
  }, [serviceId, selectedDate]);

  const loadSlots = async () => {
    if (!serviceId) return;
    setLoading(true);
    const data = await adminSessionService.getSlotsByDate(serviceId, selectedDate);
    setSlots(data);
    setLoading(false);
  };

  const handleToggleBlock = async (timeSlot: string, currentStatus: string) => {
    if (!serviceId) return;
    if (currentStatus === 'booked') return;

    setTogglingSlot(timeSlot);
    const shouldBlock = currentStatus !== 'blocked';
    await adminSessionService.toggleSlotBlock(serviceId, selectedDate, timeSlot, shouldBlock);
    await loadSlots();
    setTogglingSlot(null);
  };

  const handleExportCSV = async () => {
    const startDate = selectedDate;
    const endDate = selectedDate;
    const csv = await adminSessionService.exportBookingsCSV(startDate, endDate);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings-${selectedDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const changeDate = (delta: number) => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const formatDateDisplay = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const bookedCount = slots.filter((s) => s.status === 'booked').length;
  const availableCount = slots.filter((s) => s.status === 'available').length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Total Bookings',
              value: stats.total_bookings,
              icon: <Users className="w-5 h-5" />,
              color: 'text-blue-400 bg-blue-500/10',
            },
            {
              label: 'Confirmed',
              value: stats.confirmed,
              icon: <CheckCircle className="w-5 h-5" />,
              color: 'text-emerald-400 bg-emerald-500/10',
            },
            {
              label: 'Completed',
              value: stats.completed,
              icon: <CheckCircle className="w-5 h-5" />,
              color: 'text-teal-400 bg-teal-500/10',
            },
            {
              label: 'Revenue',
              value: `\u20B9${stats.total_revenue.toLocaleString('en-IN')}`,
              icon: <DollarSign className="w-5 h-5" />,
              color: 'text-amber-400 bg-amber-500/10',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4"
            >
              <div className={`w-9 h-9 rounded-lg ${stat.color} flex items-center justify-center mb-2`}>
                {stat.icon}
              </div>
              <p className="text-white text-lg font-bold">{stat.value}</p>
              <p className="text-slate-400 text-xs">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Date Selector */}
      <div className="flex items-center justify-between bg-slate-800/40 border border-slate-700/40 rounded-xl p-4">
        <button
          onClick={() => changeDate(-1)}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <p className="text-white font-semibold">{formatDateDisplay(selectedDate)}</p>
          <p className="text-slate-400 text-xs mt-0.5">
            {bookedCount} booked / {availableCount} available
          </p>
        </div>
        <button
          onClick={() => changeDate(1)}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Date Input */}
      <div className="flex items-center gap-3">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
        />
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800/60 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Slots Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {slots.map((slot, i) => (
            <motion.div
              key={slot.time_slot}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`border rounded-xl p-4 ${
                slot.status === 'booked'
                  ? 'bg-emerald-500/5 border-emerald-500/20'
                  : slot.status === 'blocked'
                    ? 'bg-red-500/5 border-red-500/20'
                    : 'bg-slate-800/30 border-slate-700/40'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                {/* Time */}
                <div className="flex items-center gap-2 min-w-[160px]">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-white font-medium text-sm">
                    {SLOT_LABELS[slot.time_slot] || slot.time_slot}
                  </span>
                </div>

                {/* Status Badge */}
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium w-fit ${
                    slot.status === 'booked'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : slot.status === 'blocked'
                        ? 'bg-red-500/10 text-red-400'
                        : 'bg-slate-700/40 text-slate-400'
                  }`}
                >
                  {slot.status === 'booked'
                    ? 'Booked'
                    : slot.status === 'blocked'
                      ? 'Blocked'
                      : 'Available'}
                </span>

                {/* User info (if booked) */}
                {slot.status === 'booked' && slot.user_name && (
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-300">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      {slot.user_name}
                    </span>
                    {slot.user_email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        {slot.user_email}
                      </span>
                    )}
                    {slot.user_phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        {slot.user_phone}
                      </span>
                    )}
                    {slot.booking_code && (
                      <span className="flex items-center gap-1 font-mono">
                        <Hash className="w-3.5 h-3.5 text-slate-500" />
                        {slot.booking_code}
                      </span>
                    )}
                  </div>
                )}

                {/* Block/Unblock button */}
                {slot.status !== 'booked' && (
                  <button
                    onClick={() => handleToggleBlock(slot.time_slot, slot.status)}
                    disabled={togglingSlot === slot.time_slot}
                    className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      slot.status === 'blocked'
                        ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                        : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                    } disabled:opacity-40`}
                  >
                    {togglingSlot === slot.time_slot ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : slot.status === 'blocked' ? (
                      <>
                        <Unlock className="w-3.5 h-3.5" />
                        Unblock
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        Block
                      </>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
