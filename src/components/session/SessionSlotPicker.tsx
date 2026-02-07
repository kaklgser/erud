import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Lock, CheckCircle, Loader2, ArrowLeft } from 'lucide-react';
import { sessionBookingService } from '../../services/sessionBookingService';
import type { SlotDisplayInfo } from '../../types/session';

interface SessionSlotPickerProps {
  serviceId: string;
  selectedDate: string;
  selectedSlot: string | null;
  price: number;
  onSelectSlot: (slot: string) => void;
  onProceed: () => void;
  onBack: () => void;
}

export const SessionSlotPicker: React.FC<SessionSlotPickerProps> = ({
  serviceId,
  selectedDate,
  selectedSlot,
  price,
  onSelectSlot,
  onProceed,
  onBack,
}) => {
  const [slots, setSlots] = useState<SlotDisplayInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await sessionBookingService.getSlotsForDate(serviceId, selectedDate);
      setSlots(data);
      setLoading(false);
    };
    load();
  }, [serviceId, selectedDate]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const priceInRupees = price / 100;

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Change date
      </button>

      <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
        Select a Time Slot
      </h2>
      <p className="text-emerald-400 text-sm font-medium mb-6">
        {formatDate(selectedDate)}
      </p>

      {/* Slots */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {slots.map((slot, i) => {
            const isBooked = slot.status === 'booked';
            const isBlocked = slot.status === 'blocked';
            const isDisabled = isBooked || isBlocked;
            const isSelected = selectedSlot === slot.time_slot;

            return (
              <motion.button
                key={slot.time_slot}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => !isDisabled && onSelectSlot(slot.time_slot)}
                disabled={isDisabled}
                className={`
                  w-full flex items-center justify-between px-5 py-4 rounded-xl border transition-all duration-200
                  ${isDisabled
                    ? 'border-slate-800 bg-slate-900/40 cursor-not-allowed opacity-50'
                    : isSelected
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
                      : 'border-slate-700/50 bg-slate-800/30 hover:border-emerald-500/40 hover:bg-emerald-500/5 cursor-pointer'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  {isDisabled ? (
                    <Lock className="w-5 h-5 text-slate-600" />
                  ) : isSelected ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Clock className="w-5 h-5 text-slate-400" />
                  )}
                  <span
                    className={`font-medium ${
                      isDisabled
                        ? 'text-slate-600'
                        : isSelected
                          ? 'text-emerald-300'
                          : 'text-slate-200'
                    }`}
                  >
                    {slot.label}
                  </span>
                </div>
                {isBooked && (
                  <span className="text-xs font-medium text-red-400/80 bg-red-500/10 px-2.5 py-1 rounded-full">
                    Booked
                  </span>
                )}
                {isBlocked && (
                  <span className="text-xs font-medium text-slate-500 bg-slate-700/40 px-2.5 py-1 rounded-full">
                    Unavailable
                  </span>
                )}
                {!isDisabled && isSelected && (
                  <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                    Selected
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Proceed */}
      <motion.button
        onClick={onProceed}
        disabled={!selectedSlot}
        whileHover={selectedSlot ? { scale: 1.02 } : {}}
        whileTap={selectedSlot ? { scale: 0.98 } : {}}
        className="w-full mt-8 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-emerald-500/25 transition-all"
      >
        Proceed to Pay {'\u20B9'}{priceInRupees.toLocaleString('en-IN')}
      </motion.button>
    </div>
  );
};
