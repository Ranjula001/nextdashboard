import { getCustomerById, updateCustomer, deleteCustomer } from '@/lib/db/customers';
import { getCustomerActiveBookings } from '@/lib/db/bookings';
import { getSettings } from '@/lib/db/settings';
import { formatCurrency, getPaymentStatusColor } from '@/lib/services/booking.service';
import { CustomerForm } from '@/components/customers/customer-form';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Phone, Mail, Calendar, Trash2 } from 'lucide-react';

interface CustomerProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerProfilePage({
  params,
}: CustomerProfilePageProps) {
  const { id } = await params;
  const [customer, bookings, settings] = await Promise.all([
    getCustomerById(id),
    getCustomerActiveBookings(id),
    getSettings(),
  ]);

  if (!customer) {
    notFound();
  }

  const handleUpdateCustomer = async (data: any) => {
    'use server';
    const { data: updateData } = data;
    await updateCustomer(id, updateData);
    redirect(`/dashboard/customers/${id}`);
  };

  const handleDeleteCustomer = async () => {
    'use server';
    await deleteCustomer(id);
    redirect('/dashboard/customers');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/customers">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {customer.name}
          </h1>
          <p className="text-slate-600 mt-1">Customer Profile</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Edit Form */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Edit Information
          </h2>
          <CustomerForm customer={customer} onSubmit={handleUpdateCustomer} />
        </div>

        {/* Right Column - Info & Bookings */}
        <div className="space-y-4">
          {/* Customer Details */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">
              Contact Details
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400" />
                <a
                  href={`tel:${customer.phone_number}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {customer.phone_number}
                </a>
              </div>
              {customer.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <a
                    href={`mailto:${customer.email}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {customer.email}
                  </a>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-slate-600 mb-1">Total Visits</p>
              <p className="text-2xl font-bold text-slate-900">
                {customer.visit_count}
              </p>
            </div>

            {/* Customer Since */}
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-slate-600 mb-1">Customer Since</p>
              <p className="text-sm font-medium text-slate-900">
                {new Date(customer.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Active Bookings */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-slate-600" />
              <h3 className="text-sm font-semibold text-slate-900">
                Active Bookings
              </h3>
            </div>
            {bookings.length > 0 ? (
              <div className="space-y-2">
                {bookings.map((booking) => (
                  <Link
                    key={booking.id}
                    href={`/dashboard/bookings/${booking.id}`}
                    className="block p-2 bg-slate-50 rounded hover:bg-slate-100 transition-colors"
                  >
                    <p className="text-xs font-medium text-slate-900">
                      {booking.room?.room_name}
                    </p>
                    <p className="text-xs text-slate-600">
                      {new Date(booking.check_in_date).toLocaleDateString()}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-600">No active bookings</p>
            )}
          </div>

          {/* Delete */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-red-900 mb-2">
              Danger Zone
            </h3>
            <p className="text-xs text-red-800 mb-3">
              Delete this customer and their information
            </p>
            <form action={handleDeleteCustomer}>
              <Button
                type="submit"
                variant="destructive"
                className="w-full bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Customer
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
