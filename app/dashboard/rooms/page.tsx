import { getRooms } from '@/lib/db/rooms';
import { getRoomStatusColor } from '@/lib/services/booking.service';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, Edit, AlertCircle } from 'lucide-react';
import { CreateRoomDialog } from '@/components/rooms/create-room-dialog';

export default async function RoomsPage() {
  try {
    const rooms = await getRooms();

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Rooms</h1>
            <p className="text-slate-600 mt-2">Manage your accommodation units</p>
          </div>
          <CreateRoomDialog />
        </div>

        {/* Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              {/* Room Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {room.room_name}
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">
                    {room.room_type === 'AC' ? 'Air Conditioned' : 'Non-AC'}
                  </p>
                </div>
                <Link href={`/dashboard/rooms/${room.id}/edit`}>
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                </Link>
              </div>

              {/* Status Badge */}
              <div className="mb-4">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getRoomStatusColor(
                    room.status
                  )}`}
                >
                  {room.status}
                </span>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-xs text-slate-600">Hourly Rate</p>
                  <p className="text-sm font-semibold text-slate-900">
                    Rs. {room.hourly_rate}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Daily Rate</p>
                  <p className="text-sm font-semibold text-slate-900">
                    Rs. {room.daily_rate}
                  </p>
                </div>
              </div>

              {/* Maintenance Notes */}
              {room.maintenance_notes && (
                <div className="flex gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-yellow-900">
                      Maintenance Note
                    </p>
                    <p className="text-xs text-yellow-800">
                      {room.maintenance_notes}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Empty State */}
        {rooms.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              No Rooms Yet
            </h2>
            <p className="text-slate-600 mb-4">
              Create your first room to start managing bookings
            </p>
            <CreateRoomDialog asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Room
              </Button>
            </CreateRoomDialog>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('Error loading rooms:', error);
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-slate-900">Error</h1>
        <p className="text-slate-600 mt-2">Failed to load rooms</p>
      </div>
    );
  }
}
