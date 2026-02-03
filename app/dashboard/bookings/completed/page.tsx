import { getBookings } from '@/lib/db/bookings-server';
import { getSettings } from '@/lib/db/settings';
import { formatCurrency, getPaymentStatusColor } from '@/lib/services/booking.service';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Eye, CheckCircle } from 'lucide-react';

export default async function CompletedBookingsPage() {
  try {
    const [bookings, settings] = await Promise.all([
      getBookings(),
      getSettings(),
    ]);

    const completedBookings = bookings.filter((b) => b.status === 'CHECKED_OUT');

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/bookings">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Completed Bookings</h1>
            <p className="text-slate-600 mt-2">View all checked-out bookings</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {completedBookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">Customer</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">Room</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">Check-in</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">Check-out</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-900">Amount</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {completedBookings.map((booking) => (
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
                      <td className="py-3 px-4 text-slate-600">
                        {new Date(booking.check_out_date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-900">
                        {formatCurrency(booking.total_amount, settings.currency)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(booking.payment_status)}`}>
                          {booking.payment_status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Link href={`/dashboard/bookings/${booking.id}`}>
                          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
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
              <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-slate-900 mb-2">No Completed Bookings</h2>
              <p className="text-slate-600">Completed bookings will appear here</p>
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading completed bookings:', error);
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-slate-900">Error</h1>
        <p className="text-slate-600 mt-2">Failed to load completed bookings</p>
      </div>
    );
  }
}