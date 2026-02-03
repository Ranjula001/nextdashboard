import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { StatCard } from '@/components/dashboard/stat-card';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { DigitalClock } from '@/components/ui/digital-clock';
import { formatCurrency } from '@/lib/services/booking.service';
import { getRooms } from '@/lib/db/rooms-server';
import {
  getTodaysBookings,
  getUpcomingCheckIns,
  getUpcomingCheckOuts,
  getUpcomingBookings,
  getRevenueForDateRange,
} from '@/lib/db/bookings-server';
import { getTotalExpensesForDateRange } from '@/lib/db/expenses';
import { getSettings } from '@/lib/db/settings';
import {
  Users,
  DoorOpen,
  TrendingUp,
  DollarSign,
  Clock,
  LogOut,
} from 'lucide-react';

export default async function DashboardPage() {
  try {
    // Get all necessary data
    const [rooms, todaysBookings, upcomingCheckIns, upcomingCheckOuts, upcomingBookings, settings] =
      await Promise.all([
        getRooms(),
        getTodaysBookings(),
        getUpcomingCheckIns(4),
        getUpcomingCheckOuts(4),
        getUpcomingBookings(),
        getSettings(),
      ]);

    // Calculate today's revenue
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Calculate month start and end
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [todayRevenue, monthRevenue, monthExpenses] = await Promise.all([
      getRevenueForDateRange(today.toISOString(), tomorrow.toISOString()),
      getRevenueForDateRange(monthStart.toISOString(), monthEnd.toISOString()),
      getTotalExpensesForDateRange(
        monthStart.toISOString(),
        monthEnd.toISOString()
      ),
    ]);

    // Calculate real-time occupancy stats
    const currentlyOccupiedRooms = todaysBookings.filter(booking => {
      const checkIn = new Date(booking.check_in_date);
      const checkOut = new Date(booking.check_out_date);
      return now >= checkIn && now < checkOut && booking.status === 'ACTIVE';
    });
    
    const occupiedRooms = currentlyOccupiedRooms.length;
    const availableRooms = rooms.length - occupiedRooms;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Welcome to {settings.business_name} Dashboard
            </h1>
            <p className="text-slate-600 mt-2 text-sm sm:text-base">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div className="self-center sm:self-start">
            <DigitalClock />
          </div>
        </div>

        {/* Quick Actions */}
        <QuickActions />

        {/* Key Metrics - Responsive Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            title="Occupied Rooms"
            value={occupiedRooms}
            icon={Users}
            color="blue"
            description={`of ${rooms.length} rooms`}
          />
          <StatCard
            title="Available Rooms"
            value={availableRooms}
            icon={DoorOpen}
            color="green"
            description="Ready to book"
          />
          <StatCard
            title="Today's Income"
            value={formatCurrency(todayRevenue, settings.currency)}
            icon={DollarSign}
            color="purple"
          />
          <StatCard
            title="Monthly Profit"
            value={formatCurrency(monthRevenue - monthExpenses, settings.currency)}
            icon={TrendingUp}
            color={monthRevenue - monthExpenses >= 0 ? 'green' : 'red'}
          />
        </div>

        {/* Upcoming Events - Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Upcoming Check-ins */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              <h2 className="text-base sm:text-lg font-semibold text-slate-900">
                Check-ins (Next 4 Hours)
              </h2>
            </div>
            {upcomingCheckIns.length > 0 ? (
              <div className="space-y-3">
                {upcomingCheckIns.slice(0, 5).map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-2 sm:p-3 bg-blue-50 rounded-lg border border-blue-200"
                  >
                    <div>
                      <p className="font-medium text-slate-900 text-sm sm:text-base">
                        {booking.customer?.name}
                      </p>
                      <p className="text-xs sm:text-sm text-slate-600">
                        Room {booking.room?.room_name} •{' '}
                        {new Date(booking.check_in_date).toLocaleTimeString(
                          'en-US',
                          {
                            hour: '2-digit',
                            minute: '2-digit',
                          }
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500">No check-ins scheduled</p>
            )}
          </div>

          {/* Upcoming Check-outs */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
              <h2 className="text-base sm:text-lg font-semibold text-slate-900">
                Check-outs (Next 4 Hours)
              </h2>
            </div>
            {upcomingCheckOuts.length > 0 ? (
              <div className="space-y-3">
                {upcomingCheckOuts.slice(0, 5).map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-2 sm:p-3 bg-orange-50 rounded-lg border border-orange-200"
                  >
                    <div>
                      <p className="font-medium text-slate-900 text-sm sm:text-base">
                        {booking.customer?.name}
                      </p>
                      <p className="text-xs sm:text-sm text-slate-600">
                        Room {booking.room?.room_name} •{' '}
                        {new Date(booking.check_out_date).toLocaleTimeString(
                          'en-US',
                          {
                            hour: '2-digit',
                            minute: '2-digit',
                          }
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500">No check-outs scheduled</p>
            )}
          </div>
        </div>

        {/* Upcoming Bookings */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-4">
            Upcoming Bookings
          </h2>
          {upcomingBookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead className="border-b border-slate-200">
                  <tr>
                    <th className="text-left py-2 px-1 sm:px-3 font-semibold text-slate-900">Date</th>
                    <th className="text-left py-2 px-1 sm:px-3 font-semibold text-slate-900">Customer</th>
                    <th className="text-left py-2 px-1 sm:px-3 font-semibold text-slate-900 hidden sm:table-cell">Room</th>
                    <th className="text-right py-2 px-1 sm:px-3 font-semibold text-slate-900">Bill</th>
                    <th className="text-left py-2 px-1 sm:px-3 font-semibold text-slate-900 hidden md:table-cell">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingBookings.map((booking) => (
                    <tr key={booking.id} className="border-b border-slate-100">
                      <td className="py-2 px-1 sm:px-3 text-slate-900">
                        {new Date(booking.check_in_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="py-2 px-1 sm:px-3 text-slate-900 truncate max-w-[100px] sm:max-w-none">
                        {booking.customer?.name}
                      </td>
                      <td className="py-2 px-1 sm:px-3 text-slate-900 hidden sm:table-cell">
                        {booking.room?.room_name}
                      </td>
                      <td className="py-2 px-1 sm:px-3 text-right font-medium text-slate-900">
                        {formatCurrency(booking.total_amount, settings.currency)}
                      </td>
                      <td className="py-2 px-1 sm:px-3 hidden md:table-cell">
                        <span className={`inline-block px-1 sm:px-2 py-1 rounded-full text-xs font-medium ${
                          booking.status === 'CHECKED_OUT' ? 'bg-green-100 text-green-800' :
                          booking.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-slate-500">No upcoming bookings</p>
          )}
        </div>

        {/* Today's Bookings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Today's Bookings
          </h2>
          {todaysBookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200">
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
                    <th className="text-right py-3 px-4 font-semibold text-slate-900">
                      Balance
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {todaysBookings.map((booking) => (
                    <tr key={booking.id} className="border-b border-slate-100">
                      <td className="py-3 px-4 text-slate-900">
                        {booking.customer?.name}
                      </td>
                      <td className="py-3 px-4 text-slate-900">
                        {booking.room?.room_name}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {new Date(booking.check_in_date).toLocaleTimeString(
                          'en-US',
                          {
                            hour: '2-digit',
                            minute: '2-digit',
                          }
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {new Date(booking.check_out_date).toLocaleTimeString(
                          'en-US',
                          {
                            hour: '2-digit',
                            minute: '2-digit',
                          }
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-900">
                        {formatCurrency(booking.total_amount, settings.currency)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-red-600">
                        {formatCurrency(booking.total_amount, settings.currency)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          booking.payment_status === 'PAID' ? 'bg-green-100 text-green-800' :
                          booking.payment_status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {booking.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-slate-500">No bookings for today</p>
          )}
        </div>

        {/* Monthly Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <p className="text-xs sm:text-sm font-medium text-slate-600">Monthly Revenue</p>
            <p className="text-lg sm:text-2xl font-bold text-slate-900 mt-2">
              {formatCurrency(monthRevenue, settings.currency)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <p className="text-xs sm:text-sm font-medium text-slate-600">Monthly Expenses</p>
            <p className="text-lg sm:text-2xl font-bold text-slate-900 mt-2">
              {formatCurrency(monthExpenses, settings.currency)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <p className="text-xs sm:text-sm font-medium text-slate-600">Net Profit</p>
            <p
              className={`text-lg sm:text-2xl font-bold mt-2 ${
                monthRevenue - monthExpenses >= 0
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {formatCurrency(monthRevenue - monthExpenses, settings.currency)}
            </p>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Dashboard error:', error);
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-slate-900">
          Error Loading Dashboard
        </h1>
        <p className="text-slate-600 mt-2">
          Please make sure your Supabase database is set up correctly.
        </p>
      </div>
    );
  }
}
