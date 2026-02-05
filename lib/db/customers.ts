import { createClient } from '@/lib/supabase/client';
import { Customer, CreateCustomerInput, UpdateCustomerInput } from './types';

export async function createCustomerClient(input: CreateCustomerInput): Promise<Customer> {
  const supabase = createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    throw new Error('User not authenticated');
  }

  // Get user's current organization
  const { data: orgId } = await supabase.rpc('get_current_organization_id');
  if (!orgId) {
    throw new Error('No organization selected');
  }

  const { data, error } = await supabase
    .from('customers')
    .insert({
      organization_id: orgId,
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

export async function deleteCustomer(customerId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', customerId);

  if (error) {
    console.error('Error deleting customer:', error);
    throw new Error('Failed to delete customer');
  }
}
