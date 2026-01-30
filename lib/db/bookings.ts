import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Booking, CreateBookingInput, UpdateBookingInput, BookingWithRelations } from './types';

export async function getBookingsClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}

/**
 * Get all bookings for the authenticated owner
 */
export async function getBookings(): Promise<BookingWithRelations[]> {
  const supabase = await getBookingsClient();

  const { data, error } = await supabase
    .from('bookings')
    .select(
      `
      *,
      room:rooms(*),
      customer:customers(*),
      payments(*)
    `
    )
    .order('check_in_date', { ascending: false });

  if (error) {
    console.error('Error fetching bookings:', error);
    throw new Error('Failed to fetch bookings');
  }

  return data || [];
}

/**
 * Get a single booking by ID with relations
 */
export async function getBookingById(bookingId: string): Promise<BookingWithRelations | null> {
  const supabase = await getBookingsClient();

  const { data, error } = await supabase
    .from('bookings')
    .select(
      `
      *,
      room:rooms(*),
      customer:customers(*),
      payments(*)
    `
    )
    .eq('id', bookingId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching booking:', error);
    throw new Error('Failed to fetch booking');
  }

  return data || null;
}

/**
 * Get bookings for a specific room in a date range
 */
export async function getBookingsForRoomInDateRange(
  roomId: string,
  startDate: string,
  endDate: string
): Promise<Booking[]> {
  const supabase = await getBookingsClient();

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

/**
 * Get today's bookings
 */
export async function getTodaysBookings(): Promise<BookingWithRelations[]> {
  const supabase = await getBookingsClient();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data, error } = await supabase
    .from('bookings')
    .select(
      `
      *,
      room:rooms(*),
      customer:customers(*)
    `
    )
    .eq('status', 'ACTIVE')
    .gte('check_in_date', today.toISOString())
    .lt('check_in_date', tomorrow.toISOString())
    .order('check_in_date', { ascending: true });

  if (error) {
    console.error('Error fetching today\'s bookings:', error);
    throw new Error('Failed to fetch today\'s bookings');
  }

  return data || [];
}

/**
 * Get upcoming check-ins within the next N hours
 */
export async function getUpcomingCheckIns(hoursAhead: number = 4): Promise<BookingWithRelations[]> {
  const supabase = await getBookingsClient();
  const now = new Date();
  const future = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from('bookings')
    .select(
      `
      *,
      room:rooms(*),
      customer:customers(*)
    `
    )
    .eq('status', 'ACTIVE')
    .gte('check_in_date', now.toISOString())
    .lte('check_in_date', future.toISOString())
    .order('check_in_date', { ascending: true });

  if (error) {
    console.error('Error fetching upcoming check-ins:', error);
    return [];
  }

  return data || [];
}

/**
 * Get upcoming check-outs within the next N hours
 */
export async function getUpcomingCheckOuts(hoursAhead: number = 4): Promise<BookingWithRelations[]> {
  const supabase = await getBookingsClient();
  const now = new Date();
  const future = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from('bookings')
    .select(
      `
      *,
      room:rooms(*),
      customer:customers(*)
    `
    )
    .eq('status', 'ACTIVE')
    .gte('check_out_date', now.toISOString())
    .lte('check_out_date', future.toISOString())
    .order('check_out_date', { ascending: true });

  if (error) {
    console.error('Error fetching upcoming check-outs:', error);
    return [];
  }

  return data || [];
}

/**
 * Create a new booking
 */
export async function createBooking(input: CreateBookingInput): Promise<Booking> {
  const supabase = await getBookingsClient();

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

/**
 * Update a booking
 */
export async function updateBooking(
  bookingId: string,
  input: UpdateBookingInput
): Promise<Booking> {
  const supabase = await getBookingsClient();

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

/**
 * Cancel a booking
 */
export async function cancelBooking(bookingId: string): Promise<void> {
  await updateBooking(bookingId, { status: 'CANCELLED' });
}

/**
 * Complete a booking
 */
export async function completeBooking(bookingId: string): Promise<void> {
  await updateBooking(bookingId, { status: 'COMPLETED' });
}

/**
 * Get active bookings for a customer
 */
export async function getCustomerActiveBookings(customerId: string): Promise<BookingWithRelations[]> {
  const supabase = await getBookingsClient();

  const { data, error } = await supabase
    .from('bookings')
    .select(
      `
      *,
      room:rooms(*),
      payments(*)
    `
    )
    .eq('customer_id', customerId)
    .eq('status', 'ACTIVE')
    .order('check_in_date', { ascending: false });

  if (error) {
    console.error('Error fetching customer bookings:', error);
    throw new Error('Failed to fetch customer bookings');
  }

  return data || [];
}

/**
 * Get total revenue for a date range
 */
export async function getRevenueForDateRange(
  startDate: string,
  endDate: string
): Promise<number> {
  const supabase = await getBookingsClient();

  const { data, error } = await supabase
    .from('bookings')
    .select('subtotal')
    .in('status', ['ACTIVE', 'COMPLETED'])
    .gte('check_in_date', startDate)
    .lt('check_in_date', endDate);

  if (error) {
    console.error('Error fetching revenue:', error);
    return 0;
  }

  return (data || []).reduce((sum, booking) => sum + (booking.subtotal || 0), 0);
}

/**
 * Get bookings by status
 */
export async function getBookingsByStatus(status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'): Promise<BookingWithRelations[]> {
  const supabase = await getBookingsClient();

  const { data, error } = await supabase
    .from('bookings')
    .select(
      `
      *,
      room:rooms(*),
      customer:customers(*),
      payments(*)
    `
    )
    .eq('status', status)
    .order('check_in_date', { ascending: false });

  if (error) {
    console.error('Error fetching bookings by status:', error);
    throw new Error('Failed to fetch bookings');
  }

  return data || [];
}
