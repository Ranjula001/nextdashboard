import { getBookings, getRevenueForDateRange } from '@/lib/db/bookings-server';
import { getTotalExpensesForDateRange } from '@/lib/db/expenses';
import { getSettings } from '@/lib/db/settings';
import { formatCurrency, getPaymentStatusColor } from '@/lib/services/booking.service';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Eye, FileText, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';

export default async function BillingPage() {
  try {
    const [bookings, settings] = await Promise.all([
      getBookings(),
      getSettings(),
    ]);

    // Calculate financial metrics
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [monthRevenue, monthExpenses] = await Promise.all([
      getRevenueForDateRange(monthStart.toISOString(), monthEnd.toISOString()),
      getTotalExpensesForDateRange(monthStart.toISOString(), monthEnd.toISOString()),
    ]);

    const totalPaid = bookings
      .filter(b => b.payment_status === 'PAID')
      .reduce((sum, b) => sum + b.total_amount, 0);

    const outstandings = bookings
      .filter(b => b.payment_status !== 'PAID')
      .reduce((sum, b) => sum + (b.total_amount - (b.advance_paid || 0)), 0);

    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Billing & Revenue</h1>
          <p className="text-slate-600 mt-2">Manage invoices, payments and financial overview</p>
        </div>

        {/* Financial Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-slate-600">Total Revenue</p>
                <p className="text-2xl font-bold text-slate-900">
                  {formatCurrency(monthRevenue, settings.currency)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-slate-600">Total Paid</p>
                <p className="text-2xl font-bold text-slate-900">
                  {formatCurrency(totalPaid, settings.currency)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-sm font-medium text-slate-600">Outstandings</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(outstandings, settings.currency)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-slate-600">Total Bookings</p>
                <p className="text-2xl font-bold text-slate-900">{bookings.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* All Bookings Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">All Bookings & Invoices</h2>
          </div>
          
          {bookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">Customer</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">Room</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">Check-in</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-900">Amount</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-900">Paid</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-900">Balance</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => {
                    const balance = booking.total_amount - (booking.advance_paid || 0);
                    return (
                      <tr key={booking.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4 font-medium text-slate-900">
                          {booking.customer?.name}
                        </td>
                        <td className="py-3 px-4 text-slate-900">
                          {booking.room?.room_name}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {new Date(booking.check_in_date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-slate-900">
                          {formatCurrency(booking.total_amount, settings.currency)}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-green-600">
                          {formatCurrency(booking.advance_paid || 0, settings.currency)}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-red-600">
                          {formatCurrency(balance, settings.currency)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            booking.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                            booking.status === 'EXPIRED' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Link href={`/dashboard/bookings/${booking.id}`}>
                              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700">
                              <FileText className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-slate-900 mb-2">No Bookings Found</h2>
              <p className="text-slate-600">Create your first booking to see billing information</p>
            </div>
          )}
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