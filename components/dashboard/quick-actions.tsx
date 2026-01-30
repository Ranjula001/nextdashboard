import Link from 'next/link';
import { Plus, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function QuickActions() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link href="/dashboard/bookings/new">
          <Button className="w-full bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            New Booking
          </Button>
        </Link>
        <Link href="/dashboard/expenses">
          <Button
            variant="outline"
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Expense
          </Button>
        </Link>
        <Link href="/dashboard/rooms">
          <Button
            variant="outline"
            className="w-full"
          >
            <Lock className="w-4 h-4 mr-2" />
            Block Room
          </Button>
        </Link>
        <Link href="/dashboard/customers">
          <Button
            variant="outline"
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Customer
          </Button>
        </Link>
      </div>
    </div>
  );
}
