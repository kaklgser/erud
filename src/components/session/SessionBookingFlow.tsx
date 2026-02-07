import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSessionBooking } from '../../hooks/useSessionBooking';
import { sessionBookingService } from '../../services/sessionBookingService';
import { SessionDatePicker } from './SessionDatePicker';
import { SessionSlotPicker } from './SessionSlotPicker';
import { SessionPayment } from './SessionPayment';
import { SessionBookingSuccess } from './SessionBookingSuccess';
import type { BookingResult } from '../../types/session';

type FlowStep = 'date' | 'slot' | 'payment' | 'success';

export const SessionBookingFlow: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const booking = useSessionBooking();
  const [step, setStep] = useState<FlowStep>('date');
  const [loading, setLoading] = useState(true);
  const [slotTakenError, setSlotTakenError] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/session');
      return;
    }
    const load = async () => {
      const svc = await sessionBookingService.getActiveService();
      if (!svc) {
        navigate('/session');
        return;
      }
      booking.setService(svc);
      setLoading(false);
    };
    if (isAuthenticated) load();
  }, [isAuthenticated, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (!booking.service) return null;

  const handleDateSelect = (date: string) => {
    booking.setSelectedDate(date);
    setSlotTakenError(false);
  };

  const handleSlotSelect = (slot: string) => {
    booking.setSelectedSlot(slot);
    setSlotTakenError(false);
  };

  const handlePaymentSuccess = (result: BookingResult) => {
    booking.setBookingResult(result);
    booking.setPaymentStatus('success');
    setStep('success');
  };

  const handleSlotTaken = () => {
    setSlotTakenError(true);
    booking.setSelectedSlot(null);
    setStep('slot');
  };

  const stepVariants = {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  };

  const stepIndicators = ['Date', 'Slot', 'Pay', 'Done'];
  const stepIndex = { date: 0, slot: 1, payment: 2, success: 3 }[step];

  return (
    <div className="min-h-screen pb-20 md:pl-16">
      <div className="max-w-lg mx-auto px-4 sm:px-6 pt-8 sm:pt-12">
        {/* Progress Bar */}
        {step !== 'success' && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              {stepIndicators.map((label, i) => (
                <div key={label} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                      i <= stepIndex
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {i + 1}
                  </div>
                  {i < stepIndicators.length - 1 && (
                    <div
                      className={`w-12 sm:w-20 h-0.5 mx-1 transition-all ${
                        i < stepIndex ? 'bg-emerald-500' : 'bg-slate-800'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              {stepIndicators.map((label) => (
                <span key={label} className="w-8 text-center">
                  {label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Slot Taken Error */}
        {slotTakenError && step === 'slot' && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6 text-amber-300 text-sm">
            This slot was just booked by someone else. Please pick another slot.
          </div>
        )}

        {/* Steps */}
        <AnimatePresence mode="wait">
          {step === 'date' && (
            <motion.div
              key="date"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25 }}
            >
              <SessionDatePicker
                serviceId={booking.service.id}
                selectedDate={booking.selectedDate}
                onSelectDate={handleDateSelect}
                onNext={() => setStep('slot')}
                onBack={() => navigate('/session')}
              />
            </motion.div>
          )}

          {step === 'slot' && booking.selectedDate && (
            <motion.div
              key="slot"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25 }}
            >
              <SessionSlotPicker
                serviceId={booking.service.id}
                selectedDate={booking.selectedDate}
                selectedSlot={booking.selectedSlot}
                price={booking.service.price}
                onSelectSlot={handleSlotSelect}
                onProceed={() => setStep('payment')}
                onBack={() => setStep('date')}
              />
            </motion.div>
          )}

          {step === 'payment' && booking.selectedDate && booking.selectedSlot && (
            <motion.div
              key="payment"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25 }}
            >
              <SessionPayment
                service={booking.service}
                selectedDate={booking.selectedDate}
                selectedSlot={booking.selectedSlot}
                onSuccess={handlePaymentSuccess}
                onBack={() => setStep('slot')}
                onSlotTaken={handleSlotTaken}
              />
            </motion.div>
          )}

          {step === 'success' && booking.bookingResult && booking.selectedDate && booking.selectedSlot && (
            <motion.div
              key="success"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25 }}
            >
              <SessionBookingSuccess
                bookingResult={booking.bookingResult}
                selectedDate={booking.selectedDate}
                selectedSlot={booking.selectedSlot}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
