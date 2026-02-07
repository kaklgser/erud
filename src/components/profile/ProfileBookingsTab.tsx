import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  Hash,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  CalendarPlus,
  Video,
  ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { sessionBookingService } from '../../services/sessionBookingService';
import { webinarService } from '../../services/webinarService';
import type { SessionBooking, BookingStatus } from '../../types/session';
import type { WebinarRegistrationWithDetails } from '../../types/webinar';

const statusConfig: Record<BookingStatus, { label: string; color: string; icon: React.ReactNode }> = {
  confirmed: {
    label: 'Confirmed',
    color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
  completed: {
    label: 'Completed',
    color: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-red-500/10 text-red-400 border-red-500/30',
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
  no_show: {
    label: 'No Show',
    color: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
  },
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
};

export const ProfileBookingsTab: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<SessionBooking[]>([]);
  const [webinarRegs, setWebinarRegs] = useState<WebinarRegistrationWithDetails[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingWebinars, setLoadingWebinars] = useState(true);
  const [subTab, setSubTab] = useState<'sessions' | 'webinars'>('sessions');

  useEffect(() => {
    if (user) {
      loadBookings();
      loadWebinars();
    }
  }, [user]);

  const loadBookings = async () => {
    if (!user) return;
    try {
      const data = await sessionBookingService.getUserBookings(user.id);
      setBookings(data);
    } catch (err) {
      console.error('Error loading bookings:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  const loadWebinars = async () => {
    if (!user) return;
    try {
      const data = await webinarService.getUserRegistrations(user.id);
      setWebinarRegs(data);
    } catch (err) {
      console.error('Error loading webinar registrations:', err);
    } finally {
      setLoadingWebinars(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const upcomingSessions = bookings.filter(b => b.status === 'confirmed' && b.booking_date >= today);
  const pastSessions = bookings.filter(b => b.status !== 'confirmed' || b.booking_date < today);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSubTab('sessions')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            subTab === 'sessions'
              ? 'bg-[rgba(0,230,184,0.15)] text-[#00E6B8]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          Sessions ({bookings.length})
        </button>
        <button
          onClick={() => setSubTab('webinars')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            subTab === 'webinars'
              ? 'bg-[rgba(0,230,184,0.15)] text-[#00E6B8]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          Webinars ({webinarRegs.length})
        </button>
      </div>

      {subTab === 'sessions' && (
        <div className="space-y-4">
          {loadingSessions ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[#00E6B8] mr-2" />
              <span className="text-slate-400">Loading sessions...</span>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12 bg-[#0a1a24] rounded-xl border border-[#0c1d25]">
              <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 mb-4">No session bookings yet</p>
              <button
                onClick={() => navigate('/session')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[rgba(0,230,184,0.15)] text-[#00E6B8] rounded-lg hover:bg-[rgba(0,230,184,0.25)] transition-colors text-sm font-medium"
              >
                <CalendarPlus className="w-4 h-4" /> Book a Session
              </button>
            </div>
          ) : (
            <>
              {upcomingSessions.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-[#00E6B8] uppercase tracking-wider mb-3">Upcoming</h3>
                  <div className="space-y-3">
                    {upcomingSessions.map(b => (
                      <BookingCard key={b.id} booking={b} />
                    ))}
                  </div>
                </div>
              )}
              {pastSessions.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Past</h3>
                  <div className="space-y-3">
                    {pastSessions.map(b => (
                      <BookingCard key={b.id} booking={b} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {subTab === 'webinars' && (
        <div className="space-y-3">
          {loadingWebinars ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[#00E6B8] mr-2" />
              <span className="text-slate-400">Loading webinars...</span>
            </div>
          ) : webinarRegs.length === 0 ? (
            <div className="text-center py-12 bg-[#0a1a24] rounded-xl border border-[#0c1d25]">
              <Video className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 mb-4">No webinar registrations yet</p>
              <button
                onClick={() => navigate('/webinars')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[rgba(0,230,184,0.15)] text-[#00E6B8] rounded-lg hover:bg-[rgba(0,230,184,0.25)] transition-colors text-sm font-medium"
              >
                <Video className="w-4 h-4" /> Browse Webinars
              </button>
            </div>
          ) : (
            webinarRegs.map(reg => (
              <motion.div
                key={reg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#0a1a24] border border-[#0c1d25] rounded-xl p-4 flex items-center justify-between hover:border-[rgba(0,230,184,0.2)] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                    <Video className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{reg.webinar?.title || 'Webinar'}</p>
                    <p className="text-xs text-slate-500">
                      {reg.webinar?.scheduled_date
                        ? new Date(reg.webinar.scheduled_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                        : 'Date TBD'}
                    </p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full border ${
                  reg.status === 'confirmed'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                }`}>
                  {reg.status || 'Registered'}
                </span>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const BookingCard: React.FC<{ booking: SessionBooking }> = ({ booking }) => {
  const status = statusConfig[booking.status] || statusConfig.confirmed;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#0a1a24] border border-[#0c1d25] rounded-xl p-4 hover:border-[rgba(0,230,184,0.2)] transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 text-sm">
          <Hash className="w-3.5 h-3.5 text-slate-500" />
          <span className="font-mono text-slate-400">{booking.booking_code || '---'}</span>
        </div>
        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${status.color}`}>
          {status.icon} {status.label}
        </span>
      </div>
      <div className="flex items-center gap-4 text-sm text-slate-300">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>{formatDate(booking.booking_date)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>{booking.time_slot}</span>
        </div>
      </div>
      {booking.session_services?.title && (
        <p className="text-xs text-slate-500 mt-2">{booking.session_services.title}</p>
      )}
    </motion.div>
  );
};
