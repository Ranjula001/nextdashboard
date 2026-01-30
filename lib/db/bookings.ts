import { createClient } from '@/lib/supabase/client';
import { Booking, CreateBookingInput, UpdateBookingInput } from './types';

export async function createBookingClient(input: CreateBookingInput): Promise<Booking> {
  const supabase = createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('bookings')
    .insert({
      owner_id: userData.user.id,
      ...input,
      status: 'ACTIVE',
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
