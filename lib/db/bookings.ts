import { createClient } from '@/lib/supabase/client';
import { Booking, CreateBookingInput, UpdateBookingInput } from './types';

export async function createBookingClient(input: CreateBookingInput): Promise<Booking> {
  const supabase = createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    throw new Error('User not authenticated');
  }

  // Normalize field names (support both duration_type and booking_type, subtotal and total_amount)
  const bookingType = input.booking_type || (input.duration_type === 'HOURS' ? 'HOURLY' : 'DAILY');
  const totalAmount = input.total_amount ?? input.subtotal;

  if (!totalAmount) {
    throw new Error('Total amount is required');
  }

  // Calculate payment status based on advance paid vs total
  let paymentStatus: 'PENDING' | 'PARTIAL' | 'PAID' = 'PENDING';
  if (input.advance_paid >= totalAmount) {
    paymentStatus = 'PAID';
  } else if (input.advance_paid > 0) {
    paymentStatus = 'PARTIAL';
  }

  // Get user's current organization
  const { data: orgId } = await supabase.rpc('get_current_organization_id');
  if (!orgId) {
    throw new Error('No organization selected');
  }

  const { data, error } = await supabase
    .from('bookings')
    .insert({
      organization_id: orgId,
      room_id: input.room_id,
      customer_id: input.customer_id,
      check_in_date: input.check_in_date,
      check_out_date: input.check_out_date,
      booking_type: bookingType,
      status: 'ACTIVE',
      subtotal: totalAmount,
      total_amount: totalAmount,
      advance_paid: input.advance_paid,
      payment_status: paymentStatus,
      notes: input.notes,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating booking:', error);
    throw new Error('Failed to create booking');
  }

  return data;
}

export async function updateBookingClient(
  bookingId: string,
  input: UpdateBookingInput
): Promise<Booking> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('bookings')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId)
    .select()
    .single();

  if (error) {
    console.error('Error updating booking:', error);
    throw new Error('Failed to update booking');
  }

  return data;
}

export async function getBookingsForRoomInDateRangeClient(
  roomId: string,
  startDate: string,
  endDate: string
): Promise<Booking[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('room_id', roomId)
    .eq('status', 'ACTIVE')
    .lt('check_in_date', endDate)
    .gt('check_out_date', startDate)
    .order('check_in_date', { ascending: true });

  if (error) {
    console.error('Error fetching bookings for room:', error);
    throw new Error('Failed to fetch room bookings');
  }

  return data || [];
}

export async function getBookingById(bookingId: string): Promise<Booking | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      room:rooms(*),
      customer:customers(*)
    `)
    .eq('id', bookingId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching booking:', error);
    throw new Error('Failed to fetch booking');
  }

  return data || null;
}

export async function completeBooking(bookingId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('bookings')
    .update({ status: 'CHECKED_OUT' })
    .eq('id', bookingId);

  if (error) {
    console.error('Error completing booking:', error);
    throw new Error('Failed to complete booking');
  }
}

export async function cancelBooking(bookingId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('bookings')
    .update({ status: 'CANCELLED' })
    .eq('id', bookingId);

  if (error) {
    console.error('Error cancelling booking:', error);
    throw new Error('Failed to cancel booking');
  }
}
