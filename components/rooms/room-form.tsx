'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Room, CreateRoomInput, RoomStatus, RoomType } from '@/lib/db/types';

interface RoomFormProps {
  room?: Room;
  onSubmit: (data: CreateRoomInput | { id: string; data: any }) => Promise<void>;
  isLoading?: boolean;
}

export function RoomForm({
  room,
  onSubmit,
  isLoading = false,
}: RoomFormProps) {
  const [formData, setFormData] = useState<CreateRoomInput>({
    room_name: room?.room_name || '',
    room_type: room?.room_type || 'AC',
    hourly_rate: room?.hourly_rate || 0,
    daily_rate: room?.daily_rate || 0,
    maintenance_notes: room?.maintenance_notes || '',
  });

  const [status, setStatus] = useState<RoomStatus>(room?.status || 'AVAILABLE');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.room_name.trim()) {
      setError('Room name is required');
      return;
    }

    if (formData.hourly_rate < 0 || formData.daily_rate < 0) {
      setError('Rates cannot be negative');
      return;
    }

    try {
      if (room) {
        await onSubmit({
          id: room.id,
          data: {
            ...formData,
            status,
          },
        });
      } else {
        await onSubmit(formData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save room');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Room Name */}
      <div>
        <Label htmlFor="room_name" className="text-sm font-medium">
          Room Name
        </Label>
        <Input
          id="room_name"
          type="text"
          placeholder="e.g., Room 1, Deluxe Suite"
          value={formData.room_name}
          onChange={(e) =>
            setFormData({ ...formData, room_name: e.target.value })
          }
          disabled={isLoading}
        />
      </div>

      {/* Room Type */}
      <div>
        <Label htmlFor="room_type" className="text-sm font-medium">
          Room Type
        </Label>
        <Select
          value={formData.room_type}
          onValueChange={(value) =>
            setFormData({ ...formData, room_type: value as RoomType })
          }
        >
          <SelectTrigger id="room_type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AC">Air Conditioned</SelectItem>
            <SelectItem value="NON_AC">Non-AC</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Hourly Rate */}
      <div>
        <Label htmlFor="hourly_rate" className="text-sm font-medium">
          Hourly Rate (Rs.)
        </Label>
        <Input
          id="hourly_rate"
          type="number"
          placeholder="1500"
          value={formData.hourly_rate}
          onChange={(e) =>
            setFormData({ ...formData, hourly_rate: parseFloat(e.target.value) || 0 })
          }
          disabled={isLoading}
          min="0"
          step="100"
        />
      </div>

      {/* Daily Rate */}
      <div>
        <Label htmlFor="daily_rate" className="text-sm font-medium">
          Daily Rate (Rs.)
        </Label>
        <Input
          id="daily_rate"
          type="number"
          placeholder="5000"
          value={formData.daily_rate}
          onChange={(e) =>
            setFormData({ ...formData, daily_rate: parseFloat(e.target.value) || 0 })
          }
          disabled={isLoading}
          min="0"
          step="500"
        />
      </div>

      {/* Status (only for existing rooms) */}
      {room && (
        <div>
          <Label htmlFor="status" className="text-sm font-medium">
            Status
          </Label>
          <Select value={status} onValueChange={(value) => setStatus(value as RoomStatus)}>
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AVAILABLE">Available</SelectItem>
              <SelectItem value="OCCUPIED">Occupied</SelectItem>
              <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
              <SelectItem value="BLOCKED">Blocked</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Maintenance Notes */}
      <div>
        <Label htmlFor="maintenance_notes" className="text-sm font-medium">
          Maintenance Notes
        </Label>
        <textarea
          id="maintenance_notes"
          placeholder="e.g., AC under repair, scheduled maintenance..."
          value={formData.maintenance_notes || ''}
          onChange={(e) =>
            setFormData({ ...formData, maintenance_notes: e.target.value })
          }
          disabled={isLoading}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
        />
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        {isLoading ? 'Saving...' : room ? 'Update Room' : 'Create Room'}
      </Button>
    </form>
  );
}
