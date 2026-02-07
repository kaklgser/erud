import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  Hash,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  CalendarPlus,
  Video,
  UserCheck,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { sessionBookingService } from '../../services/sessionBookingService';
import { webinarService } from '../../services/webinarService';
import { supabase } from '../../lib/supabaseClient';
import type { SessionBooking, BookingStatus } from '../../types/session';
import type { WebinarRegistrationWithDetails } from '../../types/webinar';

type ActiveTab = 'sessions' | 'webinars';

const bookingStatusConfig: Record<BookingStatus, { label: string; color: string; icon: React.ReactNode }> = {
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
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const MyBookingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<ActiveTab>('sessions');
  const [bookings, setBookings] = useState<SessionBooking[]>([]);
  const [webinarRegistrations, setWebinarRegistrations] = useState<WebinarRegistrationWithDetails[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingWebinars, setLoadingWebinars] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/session');
      return;
    }
    if (user) {
      loadAllData();
    }
  }, [user, isAuthenticated, authLoading]);

  const loadAllData = async () => {
    if (!user) return;
    loadBookings();
    loadWebinarRegistrations();
  };

  const loadBookings = async () => {
    if (!user) return;
    setLoadingSessions(true);
    try {
      const data = await sessionBookingService.getUserBookings(user.id);
      setBookings(data);
    } catch (err) {
      console.error('Error loading session bookings:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  const loadWebinarRegistrations = async () => {
    if (!user) return;
    setLoadingWebinars(true);
    try {
      const data = await webinarService.getUserRegistrations(user.id);
      setWebinarRegistrations(data);
    } catch (err) {
      console.error('Error loading webinar registrations:', err);
    } finally {
      setLoadingWebinars(false);
    }
  };

  const handleCancel = async (bookingId: string) => {
    setCancellingId(bookingId);
    const booking = bookings.find((b) => b.id === bookingId);
    const result = await sessionBookingService.cancelBooking(bookingId);
    if (result.success) {
      if (booking && user) {
        try {
          await supabase.functions.invoke('send-session-cancellation-email', {
            body: {
              bookingId: booking.id,
              recipientEmail: user.email,
              recipientName: user.name,
              serviceTitle: booking.session_services?.title || 'Resume Session',
              bookingDate: formatDate(booking.booking_date),
              slotLabel: sessionBookingService.getSlotLabel(booking.time_slot),
              bookingCode: booking.booking_code,
            },
          });
        } catch (emailErr) {
          console.error('Failed to send cancellation email:', emailErr);
        }
      }
      await loadBookings();
    }
    setCancellingId(null);
    setShowCancelConfirm(null);
  };

  const today = new Date().toISOString().split('T')[0];

  const upcomingSessions = bookings.filter(
    (b) => b.status === 'confirmed' && b.booking_date >= today
  );
  const pastSessions = bookings.filter(
    (b) => b.status !== 'confirmed' || b.booking_date < today
  );

  const upcomingWebinars = webinarRegistrations.filter((r) => {
    if (!r.webinar?.scheduled_at) return false;
    return new Date(r.webinar.scheduled_at) >= new Date();
  });
  const pastWebinars = webinarRegistrations.filter((r) => {
    if (!r.webinar?.scheduled_at) return true;
    return new Date(r.webinar.scheduled_at) < new Date();
  });

  const sessionCount = bookings.length;
  const webinarCount = webinarRegistrations.length;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 md:pl-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">My Bookings</h1>
          <p className="text-slate-400 text-sm">Your webinar registrations and 1:1 session history</p>
        </div>

        <div className="flex gap-2 mb-8 bg-slate-800/60 p-1 rounded-xl border border-slate-700/50">
          <button
            onClick={() => setActiveTab('sessions')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'sessions'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/40'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            1:1 Sessions
            {sessionCount > 0 && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === 'sessions'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-slate-700 text-slate-400'
              }`}>
                {sessionCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('webinars')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'webinars'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/40'
            }`}
          >
            <Video className="w-4 h-4" />
            Webinars
            {webinarCount > 0 && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === 'webinars'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-slate-700 text-slate-400'
              }`}>
                {webinarCount}
              </span>
            )}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'sessions' ? (
            <SessionsTab
              key="sessions"
              loading={loadingSessions}
              upcoming={upcomingSessions}
              past={pastSessions}
              today={today}
              cancellingId={cancellingId}
              showCancelConfirm={showCancelConfirm}
              onCancel={handleCancel}
              onShowCancelConfirm={setShowCancelConfirm}
              onNavigate={navigate}
            />
          ) : (
            <WebinarsTab
              key="webinars"
              loading={loadingWebinars}
              upcoming={upcomingWebinars}
              past={pastWebinars}
              onNavigate={navigate}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

interface SessionsTabProps {
  loading: boolean;
  upcoming: SessionBooking[];
  past: SessionBooking[];
  today: string;
  cancellingId: string | null;
  showCancelConfirm: string | null;
  onCancel: (id: string) => void;
  onShowCancelConfirm: (id: string | null) => void;
  onNavigate: (path: string) => void;
}

const SessionsTab: React.FC<SessionsTabProps> = ({
  loading,
  upcoming,
  past,
  today,
  cancellingId,
  showCancelConfirm,
  onCancel,
  onShowCancelConfirm,
  onNavigate,
}) => {
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex justify-center py-16"
      >
        <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
      </motion.div>
    );
  }

  const isEmpty = upcoming.length === 0 && past.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ duration: 0.2 }}
    >
      {isEmpty ? (
        <EmptyState
          icon={<Calendar className="w-12 h-12 text-slate-600" />}
          title="No sessions yet"
          description="Book a 1-on-1 resume session with our experts"
          actionLabel="Book a Session"
          onAction={() => onNavigate('/session')}
        />
      ) : (
        <>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => onNavigate('/session')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-colors"
            >
              <CalendarPlus className="w-4 h-4" />
              Book New
            </button>
          </div>

          {upcoming.length > 0 && (
            <section className="mb-10">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Upcoming Sessions
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {upcoming.map((booking) => (
                  <SessionCard
                    key={booking.id}
                    booking={booking}
                    isUpcoming
                    today={today}
                    cancellingId={cancellingId}
                    showCancelConfirm={showCancelConfirm}
                    onCancel={onCancel}
                    onShowCancelConfirm={onShowCancelConfirm}
                  />
                ))}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-500" />
                Past Sessions
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {past.map((booking) => (
                  <SessionCard
                    key={booking.id}
                    booking={booking}
                    isUpcoming={false}
                    today={today}
                    cancellingId={cancellingId}
                    showCancelConfirm={showCancelConfirm}
                    onCancel={onCancel}
                    onShowCancelConfirm={onShowCancelConfirm}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </motion.div>
  );
};

interface SessionCardProps {
  booking: SessionBooking;
  isUpcoming: boolean;
  today: string;
  cancellingId: string | null;
  showCancelConfirm: string | null;
  onCancel: (id: string) => void;
  onShowCancelConfirm: (id: string | null) => void;
}

const SessionCard: React.FC<SessionCardProps> = ({
  booking,
  isUpcoming,
  cancellingId,
  showCancelConfirm,
  onCancel,
  onShowCancelConfirm,
}) => {
  const status = bookingStatusConfig[booking.status as BookingStatus] || bookingStatusConfig.confirmed;
  const slotLabel = sessionBookingService.getSlotLabel(booking.time_slot);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-5 hover:border-slate-600/50 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-white font-semibold text-sm line-clamp-1">
          {booking.session_services?.title || 'Resume Session'}
        </h3>
        <span
          className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${status.color}`}
        >
          {status.icon}
          {status.label}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-slate-300">
          <Calendar className="w-4 h-4 text-slate-500" />
          {formatDate(booking.booking_date)}
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <Clock className="w-4 h-4 text-slate-500" />
          {slotLabel}
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <Hash className="w-4 h-4 text-slate-500" />
          <span className="font-mono text-xs">{booking.booking_code}</span>
        </div>
      </div>

      {isUpcoming && (
        <div className="mt-4 pt-3 border-t border-slate-700/50">
          {showCancelConfirm === booking.id ? (
            <div className="space-y-2">
              <p className="text-amber-400 text-xs">Are you sure you want to cancel?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => onCancel(booking.id)}
                  disabled={cancellingId === booking.id}
                  className="flex-1 px-3 py-2 rounded-lg bg-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/30 disabled:opacity-50 transition-colors"
                >
                  {cancellingId === booking.id ? 'Cancelling...' : 'Yes, Cancel'}
                </button>
                <button
                  onClick={() => onShowCancelConfirm(null)}
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-700 text-slate-300 text-xs font-medium hover:bg-slate-800/60 transition-colors"
                >
                  Keep Booking
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => onShowCancelConfirm(booking.id)}
              className="text-xs text-red-400/70 hover:text-red-400 transition-colors"
            >
              Cancel Booking
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
};

interface WebinarsTabProps {
  loading: boolean;
  upcoming: WebinarRegistrationWithDetails[];
  past: WebinarRegistrationWithDetails[];
  onNavigate: (path: string) => void;
}

const WebinarsTab: React.FC<WebinarsTabProps> = ({ loading, upcoming, past, onNavigate }) => {
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex justify-center py-16"
      >
        <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
      </motion.div>
    );
  }

  const isEmpty = upcoming.length === 0 && past.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.2 }}
    >
      {isEmpty ? (
        <EmptyState
          icon={<Video className="w-12 h-12 text-slate-600" />}
          title="No webinars yet"
          description="Register for a webinar to see it here"
          actionLabel="Browse Webinars"
          onAction={() => onNavigate('/webinars')}
        />
      ) : (
        <>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => onNavigate('/webinars')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-colors"
            >
              <Video className="w-4 h-4" />
              Browse Webinars
            </button>
          </div>

          {upcoming.length > 0 && (
            <section className="mb-10">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Upcoming Webinars
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {upcoming.map((reg) => (
                  <WebinarCard key={reg.id} registration={reg} onNavigate={onNavigate} />
                ))}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-500" />
                Past Webinars
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {past.map((reg) => (
                  <WebinarCard key={reg.id} registration={reg} onNavigate={onNavigate} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </motion.div>
  );
};

interface WebinarCardProps {
  registration: WebinarRegistrationWithDetails;
  onNavigate: (path: string) => void;
}

const WebinarCard: React.FC<WebinarCardProps> = ({ registration, onNavigate }) => {
  const webinar = registration.webinar;
  const scheduledDate = webinar?.scheduled_at
    ? new Date(webinar.scheduled_at)
    : null;

  const paymentColor =
    registration.payment_status === 'completed'
      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
      : registration.payment_status === 'failed'
        ? 'bg-red-500/10 text-red-400 border-red-500/30'
        : 'bg-amber-500/10 text-amber-400 border-amber-500/30';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onNavigate(`/webinar-details/${registration.id}`)}
      className="bg-slate-800/40 border border-slate-700/50 rounded-xl overflow-hidden hover:border-slate-600/50 transition-colors cursor-pointer group"
    >
      {webinar?.thumbnail_url && (
        <div className="relative h-32 overflow-hidden">
          <img
            src={webinar.thumbnail_url}
            alt={webinar.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-white font-semibold text-sm line-clamp-2 flex-1 mr-2">
            {webinar?.title || 'Webinar'}
          </h3>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors flex-shrink-0 mt-0.5" />
        </div>

        <div className="space-y-2 text-sm mb-3">
          {scheduledDate && (
            <>
              <div className="flex items-center gap-2 text-slate-300">
                <Calendar className="w-4 h-4 text-slate-500" />
                {scheduledDate.toLocaleDateString('en-IN', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Clock className="w-4 h-4 text-slate-500" />
                {scheduledDate.toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span
            className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${paymentColor}`}
          >
            {registration.payment_status === 'completed' ? (
              <CheckCircle className="w-3 h-3" />
            ) : (
              <AlertTriangle className="w-3 h-3" />
            )}
            {registration.payment_status}
          </span>
          {registration.attendance_marked && (
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Attended
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, actionLabel, onAction }) => (
  <div className="text-center py-16">
    <div className="mx-auto mb-4">{icon}</div>
    <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
    <p className="text-slate-400 text-sm mb-6">{description}</p>
    <button
      onClick={onAction}
      className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition-all"
    >
      {actionLabel}
    </button>
  </div>
);
