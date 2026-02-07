import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Booking, CreateBookingInput, UpdateBookingInput, BookingWithRelations } from './types';
import { incrementCustomerVisitCount } from './customers-server';
import { getSecureSupabaseClient, verifyDataOwnership, getUserCurrentOrganization } from '@/lib/security/multi-tenant-validation';

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

export async function updateExpiredBookings(): Promise<void> {
  try {
    const supabase = await getBookingsClient();
    const now = new Date().toISOString();
    
    // Get the user's current organization to ensure RLS compliance
    const orgId = await getUserCurrentOrganization();

    // Update bookings that have passed check-out date to CHECKED_OUT status
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'CHECKED_OUT' })
      .eq('organization_id', orgId)
      .eq('status', 'ACTIVE')
      .lt('check_out_date', now);

    if (error) {
      console.error('Error updating expired bookings:', error);
    }
  } catch (err) {
    console.error('Unexpected error updating expired bookings:', err);
  }
}

export async function getBookings(): Promise<BookingWithRelations[]> {
  // Update expired bookings first
  await updateExpiredBookings();
  
  const supabase = await getBookingsClient();
  
  // Get user's current organization - ensures security context
  const orgId = await getUserCurrentOrganization();

  const { data, error } = await supabase
    .from('bookings')
    .select(
      `
      *,
      room:rooms(*),
      customer:customers(*)
    `
    )
    .eq('organization_id', orgId)
    .order('check_in_date', { ascending: false });

  if (error) {
    console.error('Error fetching bookings:', error);
    throw new Error('Failed to fetch bookings');
  }

  return data || [];
}

export async function getTodaysBookings(): Promise<BookingWithRelations[]> {
  // Update expired bookings first
  await updateExpiredBookings();
  
  const supabase = await getBookingsClient();
  const orgId = await getUserCurrentOrganization();
  
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
    .eq('organization_id', orgId)
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
  const orgId = await getUserCurrentOrganization();
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
    .eq('organization_id', orgId)
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

export async function getUpcomingBookings(): Promise<BookingWithRelations[]> {
  // Update expired bookings first
  await updateExpiredBookings();
  
  const supabase = await getBookingsClient();
  const orgId = await getUserCurrentOrganization();
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('bookings')
    .select(
      `
      *,
      room:rooms(*),
      customer:customers(*)
    `
    )
    .eq('organization_id', orgId)
    .gte('check_in_date', tomorrow.toISOString())
    .order('check_in_date', { ascending: true });

  if (error) {
    console.error('Error fetching upcoming bookings:', error);
    return [];
  }

  return data || [];
}

export async function getUpcomingCheckOuts(hoursAhead: number = 4): Promise<BookingWithRelations[]> {
  const supabase = await getBookingsClient();
  const orgId = await getUserCurrentOrganization();
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
    .eq('organization_id', orgId)
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
  const orgId = await getUserCurrentOrganization();

  const { data, error } = await supabase
    .from('bookings')
    .select('total_amount')
    .eq('organization_id', orgId)
    .in('status', ['ACTIVE', 'CHECKED_OUT'])
    .gte('check_in_date', startDate)
    .lt('check_in_date', endDate);

  if (error) {
    console.error('Error fetching revenue:', error);
    return 0;
  }

  return (data || []).reduce((sum, booking) => sum + (booking.total_amount || 0), 0);
}

export async function getBookingsForRoomInDateRange(
  roomId: string,
  startDate: string,
  endDate: string
): Promise<Booking[]> {
  const supabase = await getBookingsClient();
  const orgId = await getUserCurrentOrganization();

  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('organization_id', orgId)
    .eq('room_id', roomId)
    .eq('status', 'ACTIVE')
    .or(`check_in_date.lt.${endDate},check_out_date.gt.${startDate}`)
    .order('check_in_date', { ascending: true })

  if (error) {
    console.error('Error fetching bookings for room:', error);
    throw new Error('Failed to fetch room bookings');
  }

  return data || [];
}

export async function isRoomAvailable(
  roomId: string,
  checkInDate: string,
  checkOutDate: string,
  excludeBookingId?: string
): Promise<boolean> {
  const supabase = await getBookingsClient();
  const orgId = await getUserCurrentOrganization();

  let query = supabase
    .from('bookings')
    .select('id')
    .eq('organization_id', orgId)
    .eq('room_id', roomId)
    .eq('status', 'ACTIVE')
    .or(`and(check_in_date.lt.${checkOutDate},check_out_date.gt.${checkInDate})`);

  if (excludeBookingId) {
    query = query.neq('id', excludeBookingId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error checking room availability:', error);
    return false;
  }

  return (data || []).length === 0;
}

export async function getCustomerActiveBookings(customerId: string): Promise<BookingWithRelations[]> {
  const supabase = await getBookingsClient();
  const orgId = await getUserCurrentOrganization();

  const { data, error } = await supabase
    .from('bookings')
    .select(
      `
      *,
      room:rooms(*),
      customer:customers(*)
    `
    )
    .eq('organization_id', orgId)
    .eq('customer_id', customerId)
    .eq('status', 'ACTIVE')
    .order('check_in_date', { ascending: true });

  if (error) {
    console.error('Error fetching customer bookings:', error);
    throw new Error('Failed to fetch customer bookings');
  }

  return data || [];
}

export async function createBooking(input: CreateBookingInput): Promise<Booking> {
  const supabase = await getBookingsClient();

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
    console.error('Error creating booking (detailed):', {
      error,
      message: (error as any)?.message,
      code: (error as any)?.code,
      details: (error as any)?.details,
      hint: (error as any)?.hint,
      payload: {
        organization_id: orgId,
        room_id: input.room_id,
        customer_id: input.customer_id,
        check_in_date: input.check_in_date,
        check_out_date: input.check_out_date,
        booking_type: bookingType,
        total_amount: totalAmount,
        advance_paid: input.advance_paid,
        payment_status: paymentStatus,
      },
    });
    throw new Error('Failed to create booking: ' + ((error as any)?.message || JSON.stringify(error)));
  }

  return data;
}