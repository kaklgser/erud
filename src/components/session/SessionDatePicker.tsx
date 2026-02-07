import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { sessionBookingService } from '../../services/sessionBookingService';
import type { DateAvailability } from '../../types/session';

interface SessionDatePickerProps {
  serviceId: string;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const SessionDatePicker: React.FC<SessionDatePickerProps> = ({
  serviceId,
  selectedDate,
  onSelectDate,
  onNext,
  onBack,
}) => {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [availability, setAvailability] = useState<DateAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await sessionBookingService.getAvailableDates(serviceId, currentYear, currentMonth);
      setAvailability(data);
      setLoading(false);
    };
    load();
  }, [serviceId, currentYear, currentMonth]);

  const availabilityMap = useMemo(() => {
    const map: Record<string, DateAvailability> = {};
    availability.forEach((a) => {
      map[a.date] = a;
    });
    return map;
  }, [availability]);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  const goToPrevMonth = () => {
    setDirection(-1);
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    setDirection(1);
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const isPrevDisabled =
    currentYear === today.getFullYear() && currentMonth === today.getMonth();

  const maxMonth = new Date(today.getFullYear(), today.getMonth() + 3, 1);
  const isNextDisabled =
    currentYear > maxMonth.getFullYear() ||
    (currentYear === maxMonth.getFullYear() && currentMonth >= maxMonth.getMonth());

  const formatDateStr = (day: number) => {
    const m = String(currentMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${currentYear}-${m}-${d}`;
  };

  const isDayPast = (day: number) => {
    const d = new Date(currentYear, currentMonth, day);
    return d < today;
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <h2 className="text-xl sm:text-2xl font-bold text-white text-center mb-2">
        Select a Date
      </h2>
      <p className="text-slate-400 text-sm text-center mb-6">
        Choose your preferred session date
      </p>

      {/* Month Nav */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPrevMonth}
          disabled={isPrevDisabled}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-white font-semibold text-lg">
          {MONTHS[currentMonth]} {currentYear}
        </span>
        <button
          onClick={goToNextMonth}
          disabled={isNextDisabled}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-slate-500 py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${currentYear}-${currentMonth}`}
          initial={{ opacity: 0, x: direction * 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -30 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-7 gap-1"
        >
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = formatDateStr(day);
            const isPast = isDayPast(day);
            const avail = availabilityMap[dateStr];
            const isFullyBooked = avail?.is_fully_booked === true;
            const isDisabled = isPast || isFullyBooked;
            const isSelected = selectedDate === dateStr;
            const hasSlots = avail && avail.available_slots > 0;

            return (
              <button
                key={day}
                onClick={() => !isDisabled && onSelectDate(dateStr)}
                disabled={isDisabled}
                className={`
                  relative aspect-square rounded-lg flex flex-col items-center justify-center text-sm font-medium transition-all duration-200
                  ${isDisabled
                    ? 'text-slate-600 cursor-not-allowed'
                    : isSelected
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                      : hasSlots
                        ? 'text-white hover:bg-emerald-500/20 cursor-pointer'
                        : 'text-slate-400 hover:bg-slate-800/40 cursor-pointer'
                  }
                `}
              >
                <span>{day}</span>
                {!isPast && avail && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                      isFullyBooked
                        ? 'bg-red-500/70'
                        : hasSlots
                          ? 'bg-emerald-400'
                          : 'bg-slate-600'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {loading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-5 text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          Available
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500/70" />
          Fully Booked
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-8">
        <button
          onClick={onBack}
          className="flex-1 px-4 py-3 rounded-xl border border-slate-700 text-slate-300 font-medium hover:bg-slate-800/60 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!selectedDate}
          className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-emerald-500/25 transition-all"
        >
          Next
        </button>
      </div>
    </div>
  );
};
