import { supabase } from '../lib/supabaseClient';
import type {
  SessionService,
  SessionSlot,
  SessionBooking,
  DateAvailability,
  BookingResult,
  SlotDisplayInfo,
} from '../types/session';

const SLOT_LABELS: Record<string, string> = {
  '10:00-11:00': '10:00 AM - 11:00 AM',
  '11:00-12:00': '11:00 AM - 12:00 PM',
  '12:00-13:00': '12:00 PM - 1:00 PM',
  '14:00-15:00': '2:00 PM - 3:00 PM',
  '15:00-16:00': '3:00 PM - 4:00 PM',
};

class SessionBookingService {
  async getActiveService(): Promise<SessionService | null> {
    const { data, error } = await supabase
      .from('session_services')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('SessionBookingService: Error fetching service:', error.message);
      return null;
    }
    return data;
  }

  async getAvailableDates(
    serviceId: string,
    year: number,
    month: number
  ): Promise<DateAvailability[]> {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    const { data: service } = await supabase
      .from('session_services')
      .select('max_slots_per_day, time_slots')
      .eq('id', serviceId)
      .maybeSingle();

    if (!service) return [];

    const totalSlots = (service.time_slots as string[]).length;
    const maxSlots = service.max_slots_per_day;

    const { data: slots, error } = await supabase
      .from('session_slots')
      .select('slot_date, status')
      .eq('service_id', serviceId)
      .gte('slot_date', startStr)
      .lte('slot_date', endStr);

    if (error) {
      console.error('SessionBookingService: Error fetching slots:', error.message);
      return [];
    }

    const bookedByDate: Record<string, number> = {};
    const blockedByDate: Record<string, number> = {};
    (slots || []).forEach((slot) => {
      if (slot.status === 'booked') {
        bookedByDate[slot.slot_date] = (bookedByDate[slot.slot_date] || 0) + 1;
      } else if (slot.status === 'blocked') {
        blockedByDate[slot.slot_date] = (blockedByDate[slot.slot_date] || 0) + 1;
      }
    });

    const result: DateAvailability[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      if (d < today) continue;

      const dateStr = d.toISOString().split('T')[0];
      const booked = bookedByDate[dateStr] || 0;
      const blocked = blockedByDate[dateStr] || 0;
      const unavailable = booked + blocked;
      const effectiveTotal = Math.min(totalSlots, maxSlots);
      const available = Math.max(0, effectiveTotal - unavailable);

      result.push({
        date: dateStr,
        total_slots: effectiveTotal,
        booked_slots: booked,
        available_slots: available,
        is_fully_booked: available === 0,
      });
    }

    return result;
  }

  async getSlotsForDate(serviceId: string, date: string): Promise<SlotDisplayInfo[]> {
    const { data: service } = await supabase
      .from('session_services')
      .select('time_slots')
      .eq('id', serviceId)
      .maybeSingle();

    if (!service) return [];

    const timeSlots = service.time_slots as string[];

    const { data: existingSlots, error } = await supabase
      .from('session_slots')
      .select('*')
      .eq('service_id', serviceId)
      .eq('slot_date', date);

    if (error) {
      console.error('SessionBookingService: Error fetching day slots:', error.message);
      return [];
    }

    const slotMap: Record<string, SessionSlot> = {};
    (existingSlots || []).forEach((s) => {
      slotMap[s.time_slot] = s as SessionSlot;
    });

    return timeSlots.map((ts) => {
      const existing = slotMap[ts];
      return {
        time_slot: ts,
        label: SLOT_LABELS[ts] || ts,
        status: existing?.status || 'available',
        slot_id: existing?.id,
      } as SlotDisplayInfo;
    });
  }

  async bookSlot(
    userId: string,
    serviceId: string,
    date: string,
    timeSlot: string,
    paymentTransactionId: string | null,
    userName: string,
    userEmail: string,
    userPhone?: string
  ): Promise<BookingResult> {
    const { data, error } = await supabase.rpc('book_slot_atomically', {
      p_user_id: userId,
      p_service_id: serviceId,
      p_slot_date: date,
      p_time_slot: timeSlot,
      p_payment_transaction_id: paymentTransactionId,
      p_user_name: userName,
      p_user_email: userEmail,
      p_user_phone: userPhone || null,
    });

    if (error) {
      console.error('SessionBookingService: Booking RPC error:', error.message);
      return { success: false, error: 'Failed to book slot. Please try again.' };
    }

    return data as BookingResult;
  }

  async getUserBookings(userId: string): Promise<SessionBooking[]> {
    const { data, error } = await supabase
      .from('session_bookings')
      .select('*, session_services(*)')
      .eq('user_id', userId)
      .order('booking_date', { ascending: false });

    if (error) {
      console.error('SessionBookingService: Error fetching bookings:', error.message);
      return [];
    }

    return (data || []) as SessionBooking[];
  }

  async getBookingById(bookingId: string): Promise<SessionBooking | null> {
    const { data, error } = await supabase
      .from('session_bookings')
      .select('*, session_services(*)')
      .eq('id', bookingId)
      .maybeSingle();

    if (error) {
      console.error('SessionBookingService: Error fetching booking:', error.message);
      return null;
    }
    return data as SessionBooking | null;
  }

  async cancelBooking(bookingId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
    const { data: booking, error: fetchErr } = await supabase
      .from('session_bookings')
      .select('slot_id, status')
      .eq('id', bookingId)
      .maybeSingle();

    if (fetchErr || !booking) {
      return { success: false, error: 'Booking not found.' };
    }

    if (booking.status !== 'confirmed') {
      return { success: false, error: 'Only confirmed bookings can be cancelled.' };
    }

    const { error: updateErr } = await supabase
      .from('session_bookings')
      .update({
        status: 'cancelled',
        cancellation_reason: reason || 'Cancelled by user',
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (updateErr) {
      return { success: false, error: 'Failed to cancel booking.' };
    }

    if (booking.slot_id) {
      await supabase
        .from('session_slots')
        .update({
          status: 'available',
          booked_by: null,
          booking_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', booking.slot_id);
    }

    return { success: true };
  }

  async createPaymentTransaction(
    userId: string,
    serviceId: string,
    amount: number
  ): Promise<string | null> {
    const { data, error } = await supabase
      .from('payment_transactions')
      .insert({
        user_id: userId,
        status: 'pending',
        amount: amount,
        currency: 'INR',
        final_amount: amount,
        purchase_type: 'session_booking',
        plan_id: null,
        metadata: { service_id: serviceId },
      })
      .select('id')
      .single();

    if (error) {
      console.error('SessionBookingService: Error creating payment:', error.message);
      return null;
    }
    return data.id;
  }

  async updatePaymentTransaction(
    transactionId: string,
    paymentId: string,
    orderId: string,
    status: string
  ): Promise<boolean> {
    const { error } = await supabase
      .from('payment_transactions')
      .update({
        payment_id: paymentId,
        order_id: orderId,
        status: status,
      })
      .eq('id', transactionId);

    if (error) {
      console.error('SessionBookingService: Error updating payment:', error.message);
      return false;
    }
    return true;
  }

  getSlotLabel(timeSlot: string): string {
    return SLOT_LABELS[timeSlot] || timeSlot;
  }

  generateCalendarUrl(booking: SessionBooking): string {
    const dateStr = booking.booking_date.replace(/-/g, '');
    const [startTime] = booking.time_slot.split('-');
    const [endTime] = booking.time_slot.split('-').slice(1);

    const startHour = startTime.replace(':', '');
    const endHour = endTime.replace(':', '');

    const title = encodeURIComponent('PrimoBoost Resume Session');
    const details = encodeURIComponent(
      `Booking ID: ${booking.booking_code}\nResume Session - Career Transformation`
    );

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateStr}T${startHour}00/${dateStr}T${endHour}00&details=${details}`;
  }

  generateICSContent(booking: SessionBooking): string {
    const dateStr = booking.booking_date.replace(/-/g, '');
    const [startTime] = booking.time_slot.split('-');
    const [endTime] = booking.time_slot.split('-').slice(1);
    const startHour = startTime.replace(':', '');
    const endHour = endTime.replace(':', '');

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//PrimoBoost//Session//EN',
      'BEGIN:VEVENT',
      `DTSTART:${dateStr}T${startHour}00`,
      `DTEND:${dateStr}T${endHour}00`,
      'SUMMARY:PrimoBoost Resume Session',
      `DESCRIPTION:Booking ID: ${booking.booking_code}\\nResume Session - Career Transformation`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
  }
}

export const sessionBookingService = new SessionBookingService();
