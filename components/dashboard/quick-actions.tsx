import Link from 'next/link';
import { Plus, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function QuickActions() {
  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <Link href="/dashboard/bookings/new">
          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm px-2 sm:px-4 py-2">
            <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">New Booking</span>
            <span className="sm:hidden">Book</span>
          </Button>
        </Link>
        <Link href="/dashboard/expenses">
          <Button
            variant="outline"
            className="w-full text-xs sm:text-sm px-2 sm:px-4 py-2"
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Add Expense</span>
            <span className="sm:hidden">Expense</span>
          </Button>
        </Link>
        <Link href="/dashboard/rooms">
          <Button
            variant="outline"
            className="w-full text-xs sm:text-sm px-2 sm:px-4 py-2"
          >
            <Lock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Block Room</span>
            <span className="sm:hidden">Block</span>
          </Button>
        </Link>
        <Link href="/dashboard/customers">
          <Button
            variant="outline"
            className="w-full text-xs sm:text-sm px-2 sm:px-4 py-2"
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">New Customer</span>
            <span className="sm:hidden">Customer</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
