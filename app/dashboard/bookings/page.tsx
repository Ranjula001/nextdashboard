import { getBookings } from '@/lib/db/bookings';
import { getSettings } from '@/lib/db/settings';
import { formatCurrency, getPaymentStatusColor } from '@/lib/services/booking.service';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, Eye, Calendar } from 'lucide-react';

export default async function BookingsPage() {
  try {
    const [bookings, settings] = await Promise.all([
      getBookings(),
      getSettings(),
    ]);

    // Filter for active bookings only
    const activeBookings = bookings.filter((b) => b.status === 'ACTIVE');

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Bookings</h1>
            <p className="text-slate-600 mt-2">Manage your accommodation bookings</p>
          </div>
          <Link href="/dashboard/bookings/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              New Booking
            </Button>
          </Link>
        </div>

        {/* Bookings Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {activeBookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">
                      Customer
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">
                      Room
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">
                      Check-in
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">
                      Check-out
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-900">
                      Amount
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {activeBookings.map((booking) => (
                    <tr
                      key={booking.id}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {booking.customer?.name}
                      </td>
                      <td className="py-3 px-4 text-slate-900">
                        {booking.room?.room_name}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {new Date(booking.check_in_date).toLocaleDateString()}
                        <br />
                        <span className="text-xs">
                          {new Date(booking.check_in_date).toLocaleTimeString(
                            'en-US',
                            {
                              hour: '2-digit',
                              minute: '2-digit',
                            }
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {new Date(booking.check_out_date).toLocaleDateString()}
                        <br />
                        <span className="text-xs">
                          {new Date(booking.check_out_date).toLocaleTimeString(
                            'en-US',
                            {
                              hour: '2-digit',
                              minute: '2-digit',
                            }
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="font-medium text-slate-900">
                          {formatCurrency(booking.subtotal, settings.currency)}
                        </div>
                        <div className="text-xs text-slate-600">
                          Paid:{' '}
                          {formatCurrency(booking.advance_paid, settings.currency)}
                        </div>
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
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-700"
                          >
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
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                No Active Bookings
              </h2>
              <p className="text-slate-600 mb-4">
                Create your first booking to get started
              </p>
              <Link href="/dashboard/bookings/new">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Booking
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading bookings:', error);
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-slate-900">Error</h1>
        <p className="text-slate-600 mt-2">Failed to load bookings</p>
      </div>
    );
  }
}
