import { createClient } from '@/lib/supabase/client';
import { Customer, CreateCustomerInput, UpdateCustomerInput } from './types';

export async function createCustomerClient(input: CreateCustomerInput): Promise<Customer> {
  const supabase = createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('customers')
    .insert({
      owner_id: userData.user.id,
      ...input,
      visit_count: 0,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating customer:', error);
    throw new Error('Failed to create customer');
  }

  return data;
}

export async function updateCustomerClient(
  customerId: string,
  input: UpdateCustomerInput
): Promise<Customer> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('customers')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', customerId)
    .select()
    .single();

  if (error) {
    console.error('Error updating customer:', error);
    throw new Error('Failed to update customer');
  }

  return data;
}
