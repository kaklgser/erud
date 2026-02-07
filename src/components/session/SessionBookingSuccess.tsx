import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  Calendar,
  Clock,
  Hash,
  Gift,
  LayoutDashboard,
  List,
  Download,
} from 'lucide-react';
import { sessionBookingService } from '../../services/sessionBookingService';
import type { BookingResult } from '../../types/session';

interface SessionBookingSuccessProps {
  bookingResult: BookingResult;
  selectedDate: string;
  selectedSlot: string;
}

export const SessionBookingSuccess: React.FC<SessionBookingSuccessProps> = ({
  bookingResult,
  selectedDate,
  selectedSlot,
}) => {
  const navigate = useNavigate();
  const slotLabel = sessionBookingService.getSlotLabel(selectedSlot);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleAddToCalendar = () => {
    const booking = {
      booking_date: selectedDate,
      time_slot: selectedSlot,
      booking_code: bookingResult.booking_code || '',
    } as any;
    const url = sessionBookingService.generateCalendarUrl(booking);
    window.open(url, '_blank');
  };

  const handleDownloadICS = () => {
    const booking = {
      booking_date: selectedDate,
      time_slot: selectedSlot,
      booking_code: bookingResult.booking_code || '',
    } as any;
    const ics = sessionBookingService.generateICSContent(booking);
    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `primoboost-session-${bookingResult.booking_code}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-md mx-auto text-center">
      {/* Success Animation */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
        className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 250 }}
        >
          <CheckCircle className="w-10 h-10 text-emerald-400" />
        </motion.div>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-2xl sm:text-3xl font-bold text-white mb-2"
      >
        Booking Confirmed!
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-slate-400 mb-8"
      >
        Your session has been successfully booked
      </motion.p>

      {/* Booking Details */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-5 mb-6 text-left space-y-3"
      >
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div>
            <p className="text-slate-400 text-xs">Date</p>
            <p className="text-white font-medium text-sm">{formatDate(selectedDate)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div>
            <p className="text-slate-400 text-xs">Time Slot</p>
            <p className="text-white font-medium text-sm">{slotLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Hash className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div>
            <p className="text-slate-400 text-xs">Booking ID</p>
            <p className="text-white font-mono font-medium text-sm">
              {bookingResult.booking_code}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Credits Badge */}
      {bookingResult.bonus_credits && bookingResult.bonus_credits > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
          className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-8 flex items-center gap-3"
        >
          <Gift className="w-6 h-6 text-amber-400 flex-shrink-0" />
          <p className="text-amber-300 text-sm font-medium text-left">
            {bookingResult.bonus_credits} JD Optimization Credits have been added to your
            account!
          </p>
        </motion.div>
      )}

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="space-y-3"
      >
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleAddToCalendar}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-700 text-slate-200 font-medium text-sm hover:bg-slate-800/60 transition-colors"
          >
            <Calendar className="w-4 h-4" />
            Google Cal
          </button>
          <button
            onClick={handleDownloadICS}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-700 text-slate-200 font-medium text-sm hover:bg-slate-800/60 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download .ics
          </button>
        </div>

        <button
          onClick={() => navigate('/')}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition-all"
        >
          <LayoutDashboard className="w-4 h-4" />
          Go to Dashboard
        </button>

        <button
          onClick={() => navigate('/my-bookings')}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-700 text-slate-300 font-medium hover:bg-slate-800/60 transition-colors"
        >
          <List className="w-4 h-4" />
          View My Bookings
        </button>
      </motion.div>
    </div>
  );
};
