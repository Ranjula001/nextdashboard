import { createClient } from '@/lib/supabase/client';
import { Payment, CreatePaymentInput } from './types';

export async function getPaymentsForBooking(bookingId: string): Promise<Payment[]> {
  // Since payments table doesn't exist, return empty array
  return [];
}

export async function createPayment(input: CreatePaymentInput): Promise<Payment> {
  // Since payments table doesn't exist, throw error for now
  throw new Error('Payments functionality not implemented - payments table does not exist');
}