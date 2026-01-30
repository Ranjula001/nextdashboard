import { getCustomers, searchCustomers } from '@/lib/db/customers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Plus, Search, User, Phone } from 'lucide-react';
import { CreateCustomerDialog } from '@/components/customers/create-customer-dialog';

interface CustomersPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function CustomersPage({
  searchParams,
}: CustomersPageProps) {
  const { q } = await searchParams;

  try {
    let customers;

    if (q) {
      customers = await searchCustomers(q);
    } else {
      customers = await getCustomers();
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Customers</h1>
            <p className="text-slate-600 mt-2">Manage your guest contacts</p>
          </div>
          <CreateCustomerDialog />
        </div>

        {/* Search */}
        <form method="get" className="flex gap-2">
          <Input
            type="text"
            name="q"
            placeholder="Search by name or phone..."
            defaultValue={q || ''}
            className="flex-1"
          />
          <Button type="submit" variant="outline">
            <Search className="w-4 h-4" />
          </Button>
          {q && (
            <Link href="/dashboard/customers">
              <Button variant="outline">Clear</Button>
            </Link>
          )}
        </form>

        {/* Customers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((customer) => (
            <Link
              key={customer.id}
              href={`/dashboard/customers/${customer.id}`}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
            >
              {/* Customer Header */}
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">
                    {customer.name}
                  </h3>
                  <p className="text-sm text-slate-600 flex items-center gap-1 mt-1">
                    <Phone className="w-4 h-4" />
                    {customer.phone_number}
                  </p>
                </div>
              </div>

              {/* Contact Info */}
              {customer.email && (
                <p className="text-sm text-slate-600 mb-3 truncate">
                  {customer.email}
                </p>
              )}

              {/* Stats */}
              <div className="bg-slate-50 rounded-lg p-3 mb-3">
                <p className="text-xs text-slate-600">Total Visits</p>
                <p className="text-lg font-semibold text-slate-900">
                  {customer.visit_count}
                </p>
              </div>

              {/* Notes */}
              {customer.notes && (
                <p className="text-xs text-slate-600 line-clamp-2">
                  {customer.notes}
                </p>
              )}
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {customers.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <User className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {q ? 'No customers found' : 'No customers yet'}
            </h2>
            <p className="text-slate-600 mb-4">
              {q
                ? 'Try a different search'
                : 'Add your first customer to get started'}
            </p>
            {!q && <CreateCustomerDialog />}
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('Error loading customers:', error);
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-slate-900">Error</h1>
        <p className="text-slate-600 mt-2">Failed to load customers</p>
      </div>
    );
  }
}
