import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Expense, CreateExpenseInput, UpdateExpenseInput, ExpenseCategory } from './types';

export async function getExpensesClient() {
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
 * Get all expenses for the authenticated owner
 */
export async function getExpenses(): Promise<Expense[]> {
  const supabase = await getExpensesClient();

  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('expense_date', { ascending: false });

  if (error) {
    console.error('Error fetching expenses:', error);
    throw new Error('Failed to fetch expenses');
  }

  return data || [];
}

/**
 * Get a single expense by ID
 */
export async function getExpenseById(expenseId: string): Promise<Expense | null> {
  const supabase = await getExpensesClient();

  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('id', expenseId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching expense:', error);
    throw new Error('Failed to fetch expense');
  }

  return data || null;
}

/**
 * Get expenses for a date range
 */
export async function getExpensesForDateRange(
  startDate: string,
  endDate: string
): Promise<Expense[]> {
  const supabase = await getExpensesClient();

  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .gte('expense_date', startDate)
    .lt('expense_date', endDate)
    .order('expense_date', { ascending: false });

  if (error) {
    console.error('Error fetching expenses for date range:', error);
    throw new Error('Failed to fetch expenses');
  }

  return data || [];
}

/**
 * Get expenses by category
 */
export async function getExpensesByCategory(category: ExpenseCategory): Promise<Expense[]> {
  const supabase = await getExpensesClient();

  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('category', category)
    .order('expense_date', { ascending: false });

  if (error) {
    console.error('Error fetching expenses by category:', error);
    throw new Error('Failed to fetch expenses');
  }

  return data || [];
}

/**
 * Create a new expense
 */
export async function createExpense(input: CreateExpenseInput): Promise<Expense> {
  const supabase = await getExpensesClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      owner_id: userData.user.id,
      ...input,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating expense:', error);
    throw new Error('Failed to create expense');
  }

  return data;
}

/**
 * Update an expense
 */
export async function updateExpense(
  expenseId: string,
  input: UpdateExpenseInput
): Promise<Expense> {
  const supabase = await getExpensesClient();

  const { data, error } = await supabase
    .from('expenses')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', expenseId)
    .select()
    .single();

  if (error) {
    console.error('Error updating expense:', error);
    throw new Error('Failed to update expense');
  }

  return data;
}

/**
 * Delete an expense
 */
export async function deleteExpense(expenseId: string): Promise<void> {
  const supabase = await getExpensesClient();

  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', expenseId);

  if (error) {
    console.error('Error deleting expense:', error);
    throw new Error('Failed to delete expense');
  }
}

/**
 * Get total expenses for a date range
 */
export async function getTotalExpensesForDateRange(
  startDate: string,
  endDate: string
): Promise<number> {
  const supabase = await getExpensesClient();

  const { data, error } = await supabase
    .from('expenses')
    .select('amount')
    .gte('expense_date', startDate)
    .lt('expense_date', endDate);

  if (error) {
    console.error('Error calculating total expenses:', error);
    return 0;
  }

  return (data || []).reduce((sum, expense) => sum + (expense.amount || 0), 0);
}

/**
 * Get expense summary grouped by category
 */
export async function getExpenseSummaryByCategory(
  startDate: string,
  endDate: string
): Promise<Record<string, number>> {
  const expenses = await getExpensesForDateRange(startDate, endDate);
  const summary: Record<string, number> = {};

  expenses.forEach((expense) => {
    summary[expense.category] = (summary[expense.category] || 0) + expense.amount;
  });

  return summary;
}
