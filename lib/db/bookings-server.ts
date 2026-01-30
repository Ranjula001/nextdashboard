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

export async function getBookings(): Promise<BookingWithRelations[]> {
  const supabase = await getBookingsClient();

  const { data, error } = await supabase
    .from('bookings')
    .select(
      `
      *,
      room:rooms(*),
      customer:customers(*)
    `
    )
    .order('check_in_date', { ascending: false });

  if (error) {
    console.error('Error fetching bookings:', error);
    throw new Error('Failed to fetch bookings');
  }

  return data || [];
}

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

export async function getRevenueForDateRange(
  startDate: string,
  endDate: string
): Promise<number> {
  const supabase = await getBookingsClient();

  const { data, error } = await supabase
    .from('bookings')
    .select('subtotal')
    .in('status', ['ACTIVE', 'CHECKED_OUT'])
    .gte('check_in_date', startDate)
    .lt('check_in_date', endDate);

  if (error) {
    console.error('Error fetching revenue:', error);
    return 0;
  }

  return (data || []).reduce((sum, booking) => sum + (booking.subtotal || 0), 0);
}

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