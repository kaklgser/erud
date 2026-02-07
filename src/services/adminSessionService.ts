import { supabase } from '../lib/supabaseClient';
import type { SessionBooking, SessionService } from '../types/session';

interface AdminSlotView {
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

interface BookingStats {
  total_bookings: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  total_revenue: number;
}

class AdminSessionService {
  async getSlotsByDate(serviceId: string, date: string): Promise<AdminSlotView[]> {
    const { data: service } = await supabase
      .from('session_services')
      .select('time_slots')
      .eq('id', serviceId)
      .maybeSingle();

    if (!service) return [];

    const timeSlots = service.time_slots as string[];

    const { data: slots } = await supabase
      .from('session_slots')
      .select('id, slot_date, time_slot, status, booked_by, booking_id')
      .eq('service_id', serviceId)
      .eq('slot_date', date);

    const slotMap: Record<string, any> = {};
    (slots || []).forEach((s) => {
      slotMap[s.time_slot] = s;
    });

    const bookingIds = (slots || [])
      .filter((s) => s.booking_id)
      .map((s) => s.booking_id);

    let bookingMap: Record<string, SessionBooking> = {};
    if (bookingIds.length > 0) {
      const { data: bookings } = await supabase
        .from('session_bookings')
        .select('*')
        .in('id', bookingIds);

      (bookings || []).forEach((b: any) => {
        bookingMap[b.id] = b;
      });
    }

    return timeSlots.map((ts) => {
      const slot = slotMap[ts];
      const booking = slot?.booking_id ? bookingMap[slot.booking_id] : null;

      return {
        id: slot?.id || '',
        slot_date: date,
        time_slot: ts,
        status: slot?.status || 'available',
        user_name: booking?.user_name || null,
        user_email: booking?.user_email || null,
        user_phone: booking?.user_phone || null,
        booking_code: booking?.booking_code || null,
        booking_status: booking?.status || null,
      };
    });
  }

  async toggleSlotBlock(
    serviceId: string,
    date: string,
    timeSlot: string,
    block: boolean
  ): Promise<{ success: boolean; error?: string }> {
    const { data: existing } = await supabase
      .from('session_slots')
      .select('id, status')
      .eq('service_id', serviceId)
      .eq('slot_date', date)
      .eq('time_slot', timeSlot)
      .maybeSingle();

    if (existing) {
      if (existing.status === 'booked') {
        return { success: false, error: 'Cannot block a booked slot.' };
      }

      const { error } = await supabase
        .from('session_slots')
        .update({
          status: block ? 'blocked' : 'available',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (error) return { success: false, error: error.message };
    } else if (block) {
      const { error } = await supabase.from('session_slots').insert({
        service_id: serviceId,
        slot_date: date,
        time_slot: timeSlot,
        status: 'blocked',
      });

      if (error) return { success: false, error: error.message };
    }

    return { success: true };
  }

  async getBookingStats(): Promise<BookingStats> {
    const { data } = await supabase
      .from('session_bookings')
      .select('status, session_services(price)');

    const bookings = data || [];
    let total_revenue = 0;
    let confirmed = 0;
    let completed = 0;
    let cancelled = 0;

    bookings.forEach((b: any) => {
      if (b.status === 'confirmed') {
        confirmed++;
        total_revenue += (b.session_services?.price || 0) / 100;
      }
      if (b.status === 'completed') {
        completed++;
        total_revenue += (b.session_services?.price || 0) / 100;
      }
      if (b.status === 'cancelled') cancelled++;
    });

    return {
      total_bookings: bookings.length,
      confirmed,
      completed,
      cancelled,
      total_revenue,
    };
  }

  async getServiceForEditing(serviceId: string): Promise<SessionService | null> {
    const { data, error } = await supabase
      .from('session_services')
      .select('*')
      .eq('id', serviceId)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      price: data.price,
      currency: data.currency,
      highlights: data.highlights as string[],
      bonus_credits: data.bonus_credits,
      max_slots_per_day: data.max_slots_per_day,
      time_slots: data.time_slots as string[],
      is_active: data.is_active,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }

  async updateService(
    serviceId: string,
    updates: Partial<Pick<SessionService, 'title' | 'description' | 'price' | 'highlights' | 'bonus_credits' | 'max_slots_per_day' | 'time_slots' | 'is_active'>>
  ): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
      .from('session_services')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', serviceId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  async exportBookingsCSV(startDate: string, endDate: string): Promise<string> {
    const { data } = await supabase
      .from('session_bookings')
      .select('*')
      .gte('booking_date', startDate)
      .lte('booking_date', endDate)
      .order('booking_date', { ascending: true });

    const rows = data || [];
    const headers = ['Booking Code', 'Date', 'Time Slot', 'Name', 'Email', 'Phone', 'Status'];
    const csvRows = [headers.join(',')];

    rows.forEach((r: any) => {
      csvRows.push(
        [
          r.booking_code,
          r.booking_date,
          r.time_slot,
          `"${r.user_name}"`,
          r.user_email,
          r.user_phone || '',
          r.status,
        ].join(',')
      );
    });

    return csvRows.join('\n');
  }
}

export const adminSessionService = new AdminSessionService();
