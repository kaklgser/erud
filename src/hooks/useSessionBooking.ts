import { useState, useCallback } from 'react';
import type { SessionService, BookingResult } from '../types/session';

interface BookingFlowState {
  service: SessionService | null;
  selectedDate: string | null;
  selectedSlot: string | null;
  paymentStatus: 'idle' | 'processing' | 'success' | 'failed';
  bookingResult: BookingResult | null;
}

const initialState: BookingFlowState = {
  service: null,
  selectedDate: null,
  selectedSlot: null,
  paymentStatus: 'idle',
  bookingResult: null,
};

export function useSessionBooking() {
  const [state, setState] = useState<BookingFlowState>(initialState);

  const setService = useCallback((service: SessionService) => {
    setState((prev) => ({ ...prev, service }));
  }, []);

  const setSelectedDate = useCallback((date: string) => {
    setState((prev) => ({ ...prev, selectedDate: date, selectedSlot: null }));
  }, []);

  const setSelectedSlot = useCallback((slot: string) => {
    setState((prev) => ({ ...prev, selectedSlot: slot }));
  }, []);

  const setPaymentStatus = useCallback(
    (status: BookingFlowState['paymentStatus']) => {
      setState((prev) => ({ ...prev, paymentStatus: status }));
    },
    []
  );

  const setBookingResult = useCallback((result: BookingResult) => {
    setState((prev) => ({ ...prev, bookingResult: result }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  const goBackToDatePicker = useCallback(() => {
    setState((prev) => ({ ...prev, selectedSlot: null }));
  }, []);

  return {
    ...state,
    setService,
    setSelectedDate,
    setSelectedSlot,
    setPaymentStatus,
    setBookingResult,
    goBackToDatePicker,
    reset,
  };
}
