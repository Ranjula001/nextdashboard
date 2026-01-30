import { getRoomById, updateRoom, deactivateRoom } from '@/lib/db/rooms';
import { notFound, redirect } from 'next/navigation';
import { RoomForm } from '@/components/rooms/room-form';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { UpdateRoomInput } from '@/lib/db/types';

interface RoomEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function RoomEditPage({ params }: RoomEditPageProps) {
  const { id } = await params;
  const room = await getRoomById(id);

  if (!room) {
    notFound();
  }

  const handleSubmit = async (data: any) => {
    'use server';

    if (data.id) {
      const { id, data: updateData } = data;
      const updatePayload: UpdateRoomInput = {
        room_name: updateData.room_name,
        room_type: updateData.room_type,
        hourly_rate: updateData.hourly_rate,
        daily_rate: updateData.daily_rate,
        maintenance_notes: updateData.maintenance_notes,
        status: updateData.status,
      };

      await updateRoom(id, updatePayload);
    }

    redirect('/dashboard/rooms');
  };

  const handleDelete = async () => {
    'use server';
    await deactivateRoom(id);
    redirect('/dashboard/rooms');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/rooms">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Edit Room</h1>
          <p className="text-slate-600 mt-1">{room.room_name}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <RoomForm room={room} onSubmit={handleSubmit} />
        </div>

        {/* Sidebar - Room Info & Actions */}
        <div className="space-y-4">
          {/* Room Details */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">
              Room Details
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-slate-600">Room ID</p>
                <p className="text-slate-900 font-mono text-xs break-all">
                  {room.id}
                </p>
              </div>
              <div>
                <p className="text-slate-600">Created</p>
                <p className="text-slate-900">
                  {new Date(room.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-slate-600">Last Updated</p>
                <p className="text-slate-900">
                  {new Date(room.updated_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Delete Room */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-red-900 mb-2">
              Danger Zone
            </h3>
            <p className="text-xs text-red-800 mb-3">
              Deactivate this room to remove it from availability
            </p>
            <form action={handleDelete}>
              <Button
                type="submit"
                variant="destructive"
                className="w-full bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Deactivate Room
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
