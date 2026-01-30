import { getBookings } from '@/lib/db/bookings';
import { getSettings } from '@/lib/db/settings';
import { formatCurrency, getPaymentStatusColor } from '@/lib/services/booking.service';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FileText, AlertCircle, CheckCircle, Eye } from 'lucide-react';

interface BillingPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function BillingPage({
  searchParams,
}: BillingPageProps) {
  const { status } = await searchParams;

  try {
    const [bookings, settings] = await Promise.all([
      getBookings(),
      getSettings(),
    ]);

    // Filter by status if provided
    let filteredBookings = bookings;
    if (status) {
      filteredBookings = bookings.filter((b) =>
        status === 'PENDING'
          ? b.payment_status === 'PENDING'
          : status === 'PARTIAL'
            ? b.payment_status === 'PARTIAL'
            : status === 'PAID'
              ? b.payment_status === 'PAID'
              : true
      );
    } else {
      // By default show pending and partial
      filteredBookings = bookings.filter((b) =>
        ['PENDING', 'PARTIAL'].includes(b.payment_status)
      );
    }

    // Calculate summary stats
    const totalRevenue = bookings
      .filter((b) => b.status === 'ACTIVE' || b.status === 'COMPLETED')
      .reduce((sum, b) => sum + b.subtotal, 0);

    const totalPaid = bookings
      .filter((b) => b.status === 'ACTIVE' || b.status === 'COMPLETED')
      .reduce((sum, b) => sum + b.advance_paid, 0);

    const totalOutstanding = totalRevenue - totalPaid;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Billing</h1>
          <p className="text-slate-600 mt-2">Manage invoices and payments</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-slate-600">Total Revenue</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              {formatCurrency(totalRevenue, settings.currency)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-slate-600">Total Paid</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {formatCurrency(totalPaid, settings.currency)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-slate-600">Outstanding</p>
            <p className="text-3xl font-bold text-red-600 mt-2">
              {formatCurrency(totalOutstanding, settings.currency)}
            </p>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/billing">
            <Button
              variant={!status ? 'default' : 'outline'}
              className={!status ? 'bg-blue-600' : ''}
            >
              Pending & Partial
            </Button>
          </Link>
          <Link href="/dashboard/billing?status=PENDING">
            <Button
              variant={status === 'PENDING' ? 'default' : 'outline'}
              className={status === 'PENDING' ? 'bg-blue-600' : ''}
            >
              Pending Only
            </Button>
          </Link>
          <Link href="/dashboard/billing?status=PARTIAL">
            <Button
              variant={status === 'PARTIAL' ? 'default' : 'outline'}
              className={status === 'PARTIAL' ? 'bg-blue-600' : ''}
            >
              Partial Only
            </Button>
          </Link>
          <Link href="/dashboard/billing?status=PAID">
            <Button
              variant={status === 'PAID' ? 'default' : 'outline'}
              className={status === 'PAID' ? 'bg-blue-600' : ''}
            >
              Paid
            </Button>
          </Link>
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredBookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">
                      Customer
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">
                      Booking ID
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">
                      Room
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-900">
                      Total
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-900">
                      Paid
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-900">
                      Balance
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr
                      key={booking.id}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {booking.customer?.name}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-xs">
                        {booking.id.substring(0, 8)}...
                      </td>
                      <td className="py-3 px-4 text-slate-900">
                        {booking.room?.room_name}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-900">
                        {formatCurrency(booking.subtotal, settings.currency)}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600">
                        {formatCurrency(booking.advance_paid, settings.currency)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-medium text-red-600">
                          {formatCurrency(
                            booking.balance,
                            settings.currency
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(
                            booking.payment_status
                          )}`}
                        >
                          {booking.payment_status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Link href={`/dashboard/bookings/${booking.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                No invoices found
              </h2>
              <p className="text-slate-600">
                All payment status matches your filter
              </p>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Invoice Management</p>
            <p>
              Click on any booking to record payments, view full details, or
              generate invoices.
            </p>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading billing:', error);
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-slate-900">Error</h1>
        <p className="text-slate-600 mt-2">Failed to load billing information</p>
      </div>
    );
  }
}
