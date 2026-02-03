import { getRoomById, updateRoom, deleteRoom } from '@/lib/db/rooms-server';
import { RoomForm } from '@/components/rooms/room-form';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Trash2 } from 'lucide-react';

interface RoomEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function RoomEditPage({ params }: RoomEditPageProps) {
  const { id } = await params;
  const room = await getRoomById(id);

  if (!room) {
    notFound();
  }

  const handleUpdateRoom = async (formData: any) => {
    'use server';
    console.log('Received form data:', formData);
    const updateData = formData.data || formData;
    console.log('Update data:', updateData);
    try {
      await updateRoom(id, updateData);
      redirect('/dashboard/rooms');
    } catch (error) {
      console.error('Update room error:', error);
      throw error;
    }
  };

  const handleDeleteRoom = async () => {
    'use server';
    await deleteRoom(id);
    redirect('/dashboard/rooms');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/rooms">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Edit Room</h1>
          <p className="text-slate-600 mt-1">{room.room_name}</p>
        </div>
      </div>

      {/* Edit Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <RoomForm room={room} onSubmit={handleUpdateRoom} />
      </div>

      {/* Delete Section */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-900 mb-2">Danger Zone</h3>
        <p className="text-sm text-red-800 mb-4">
          Delete this room permanently. This action cannot be undone.
        </p>
        <form action={handleDeleteRoom}>
          <Button
            type="submit"
            variant="destructive"
            className="bg-red-600 hover:bg-red-700"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Room
          </Button>
        </form>
      </div>
    </div>
  );
}