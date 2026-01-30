import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Customer, CreateCustomerInput, UpdateCustomerInput } from './types';

export async function getCustomersClient() {
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
 * Get all customers for the authenticated owner
 */
export async function getCustomers(): Promise<Customer[]> {
  const supabase = await getCustomersClient();

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching customers:', error);
    throw new Error('Failed to fetch customers');
  }

  return data || [];
}

/**
 * Get a single customer by ID
 */
export async function getCustomerById(customerId: string): Promise<Customer | null> {
  const supabase = await getCustomersClient();

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching customer:', error);
    throw new Error('Failed to fetch customer');
  }

  return data || null;
}

/**
 * Search customers by name or phone number
 */
export async function searchCustomers(query: string): Promise<Customer[]> {
  const supabase = await getCustomersClient();

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .or(
      `name.ilike.%${query}%,phone_number.ilike.%${query}%`
    )
    .order('name', { ascending: true });

  if (error) {
    console.error('Error searching customers:', error);
    throw new Error('Failed to search customers');
  }

  return data || [];
}

/**
 * Create a new customer
 */
export async function createCustomer(input: CreateCustomerInput): Promise<Customer> {
  const supabase = await getCustomersClient();

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

/**
 * Update a customer
 */
export async function updateCustomer(
  customerId: string,
  input: UpdateCustomerInput
): Promise<Customer> {
  const supabase = await getCustomersClient();

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

/**
 * Increment visit count for a customer
 */
export async function incrementCustomerVisitCount(customerId: string): Promise<void> {
  const customer = await getCustomerById(customerId);
  if (!customer) {
    throw new Error('Customer not found');
  }

  await updateCustomer(customerId, {
    visit_count: (customer.visit_count || 0) + 1,
  });
}

/**
 * Delete a customer
 */
export async function deleteCustomer(customerId: string): Promise<void> {
  const supabase = await getCustomersClient();

  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', customerId);

  if (error) {
    console.error('Error deleting customer:', error);
    throw new Error('Failed to delete customer');
  }
}
