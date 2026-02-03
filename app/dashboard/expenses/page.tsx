import { redirect } from 'next/navigation';
import {
  getExpenses,
  getExpenseSummaryByCategory,
} from '@/lib/db/expenses';
import { getSettings } from '@/lib/db/settings';
import { createExpense, deleteExpense } from '@/lib/db/expenses';
import { formatCurrency } from '@/lib/services/booking.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, Plus } from 'lucide-react';
import { ExpenseCategory } from '@/lib/db/types';

interface ExpensesPageProps {
  searchParams: Promise<{ category?: string }>;
}

const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'ELECTRICITY', label: 'Electricity' },
  { value: 'WATER', label: 'Water' },
  { value: 'CLEANING', label: 'Cleaning' },
  { value: 'REPAIRS', label: 'Repairs' },
  { value: 'INTERNET', label: 'Internet' },
  { value: 'STAFF', label: 'Staff' },
  { value: 'OTHER', label: 'Other' },
];

export default async function ExpensesPage({
  searchParams,
}: ExpensesPageProps) {
  const { category } = await searchParams;

  const handleAddExpense = async (formData: FormData) => {
    'use server';

    const amount = parseFloat(formData.get('amount') as string);
    const date = formData.get('date') as string;
    const expenseCategory = formData.get('category') as ExpenseCategory;
    const description = formData.get('description') as string;

    if (amount > 0 && date && expenseCategory) {
      await createExpense({
        category: expenseCategory,
        amount,
        expense_date: date,
        description: description || undefined,
      });
      redirect('/dashboard/expenses');
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    'use server';
    await deleteExpense(expenseId);
    redirect('/dashboard/expenses');
  };

  try {
    const [expenses, settings] = await Promise.all([
      getExpenses(),
      getSettings(),
    ]);

    // Filter by category if provided
    const filteredExpenses = category
      ? expenses.filter((e) => e.category === category)
      : expenses;

    // Calculate category summary
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const categorySummary = await getExpenseSummaryByCategory(
      monthStart.toISOString(),
      monthEnd.toISOString()
    );

    const totalExpenses = Object.values(categorySummary).reduce(
      (sum, val) => sum + val,
      0
    );

    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Expenses</h1>
          <p className="text-slate-600 mt-2">Track your operational costs</p>
        </div>

        {/* Monthly Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-slate-600">
              This Month's Total
            </p>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              {formatCurrency(totalExpenses, settings.currency)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-slate-600">
              Number of Expenses
            </p>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              {expenses.length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-slate-600">
              Average Expense
            </p>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              {formatCurrency(
                expenses.length > 0 ? totalExpenses / expenses.length : 0,
                settings.currency
              )}
            </p>
          </div>
        </div>

        {/* Category Breakdown */}
        {Object.keys(categorySummary).length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              This Month by Category
            </h2>
            <div className="space-y-3">
              {EXPENSE_CATEGORIES.map((cat) => {
                const amount = categorySummary[cat.value] || 0;
                const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;

                return amount > 0 ? (
                  <div key={cat.value}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-900">
                        {cat.label}
                      </span>
                      <span className="text-sm font-medium text-slate-900">
                        {formatCurrency(amount, settings.currency)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        )}

        {/* Add Expense Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Add New Expense
          </h2>
          <form action={handleAddExpense} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date" className="text-sm font-medium">
                  Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  name="date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div>
                <Label htmlFor="category" className="text-sm font-medium">
                  Category
                </Label>
                <Select name="category" defaultValue="OTHER">
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="amount" className="text-sm font-medium">
                Amount ({settings.currency})
              </Label>
              <Input
                id="amount"
                type="number"
                name="amount"
                placeholder="0"
                min="0"
                step="100"
                required
              />
            </div>
            <div>
              <Label htmlFor="description" className="text-sm font-medium">
                Description (Optional)
              </Label>
              <Input
                id="description"
                type="text"
                name="description"
                placeholder="e.g., Monthly electricity bill"
              />
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </form>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {EXPENSE_CATEGORIES.map((cat) => (
            <a key={cat.value} href={`?category=${cat.value}`}>
              <Button
                variant={category === cat.value ? 'default' : 'outline'}
                className={
                  category === cat.value ? 'bg-blue-600' : ''
                }
              >
                {cat.label}
              </Button>
            </a>
          ))}
        </div>

        {/* Expenses List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredExpenses.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">
                      Date
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">
                      Category
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">
                      Description
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-900">
                      Amount
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-900">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((expense) => (
                    <tr
                      key={expense.id}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="py-3 px-4 text-slate-900">
                        {new Date(expense.expense_date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-1 bg-slate-100 text-slate-800 rounded text-xs font-medium">
                          {
                            EXPENSE_CATEGORIES.find(
                              (c) => c.value === expense.category
                            )?.label
                          }
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {expense.description || '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-900">
                        {formatCurrency(expense.amount, settings.currency)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <form
                          action={async () => {
                            'use server';
                            await handleDeleteExpense(expense.id);
                          }}
                        >
                          <button
                            type="submit"
                            className="text-red-600 hover:text-red-700 inline-block"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                No expenses found
              </h2>
              <p className="text-slate-600">
                {category
                  ? 'No expenses in this category'
                  : 'Add your first expense to get started'}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading expenses:', error);
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-slate-900">Error</h1>
        <p className="text-slate-600 mt-2">Failed to load expenses</p>
      </div>
    );
  }
}
