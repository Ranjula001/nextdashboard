import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Payment, CreatePaymentInput } from './types';

export async function getPaymentsClient() {
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
 * Get all payments for the authenticated owner
 */
export async function getPayments(): Promise<Payment[]> {
  const supabase = await getPaymentsClient();

  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .order('payment_date', { ascending: false });

  if (error) {
    console.error('Error fetching payments:', error);
    throw new Error('Failed to fetch payments');
  }

  return data || [];
}

/**
 * Get payments for a specific booking
 */
export async function getPaymentsForBooking(bookingId: string): Promise<Payment[]> {
  const supabase = await getPaymentsClient();

  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('booking_id', bookingId)
    .order('payment_date', { ascending: false });

  if (error) {
    console.error('Error fetching payments for booking:', error);
    throw new Error('Failed to fetch payments');
  }

  return data || [];
}

/**
 * Get a single payment by ID
 */
export async function getPaymentById(paymentId: string): Promise<Payment | null> {
  const supabase = await getPaymentsClient();

  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('id', paymentId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching payment:', error);
    throw new Error('Failed to fetch payment');
  }

  return data || null;
}

/**
 * Create a new payment
 */
export async function createPayment(input: CreatePaymentInput): Promise<Payment> {
  const supabase = await getPaymentsClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('payments')
    .insert({
      owner_id: userData.user.id,
      ...input,
      payment_date: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating payment:', error);
    throw new Error('Failed to create payment');
  }

  return data;
}

/**
 * Get total paid amount for a booking
 */
export async function getTotalPaidForBooking(bookingId: string): Promise<number> {
  const supabase = await getPaymentsClient();

  const { data, error } = await supabase
    .from('payments')
    .select('amount')
    .eq('booking_id', bookingId);

  if (error) {
    console.error('Error calculating total paid:', error);
    return 0;
  }

  return (data || []).reduce((sum, payment) => sum + (payment.amount || 0), 0);
}

/**
 * Get payments for a date range
 */
export async function getPaymentsForDateRange(
  startDate: string,
  endDate: string
): Promise<Payment[]> {
  const supabase = await getPaymentsClient();

  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .gte('payment_date', startDate)
    .lt('payment_date', endDate)
    .order('payment_date', { ascending: false });

  if (error) {
    console.error('Error fetching payments for date range:', error);
    throw new Error('Failed to fetch payments');
  }

  return data || [];
}

/**
 * Get total revenue from payments for a date range
 */
export async function getTotalRevenueForDateRange(
  startDate: string,
  endDate: string
): Promise<number> {
  const supabase = await getPaymentsClient();

  const { data, error } = await supabase
    .from('payments')
    .select('amount')
    .gte('payment_date', startDate)
    .lt('payment_date', endDate);

  if (error) {
    console.error('Error calculating total revenue:', error);
    return 0;
  }

  return (data || []).reduce((sum, payment) => sum + (payment.amount || 0), 0);
}

/**
 * Delete a payment
 */
export async function deletePayment(paymentId: string): Promise<void> {
  const supabase = await getPaymentsClient();

  const { error } = await supabase
    .from('payments')
    .delete()
    .eq('id', paymentId);

  if (error) {
    console.error('Error deleting payment:', error);
    throw new Error('Failed to delete payment');
  }
}
