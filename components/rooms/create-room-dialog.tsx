'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { RoomForm } from './room-form';
import { createRoomClient } from '@/lib/db/rooms';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';

interface CreateRoomDialogProps {
  asChild?: boolean;
  children?: React.ReactNode;
}

export function CreateRoomDialog({
  asChild = false,
  children,
}: CreateRoomDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (formData: any) => {
    setIsLoading(true);
    try {
      await createRoomClient(formData);
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error('Error creating room:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ? (
          children
        ) : (
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Room
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Room</DialogTitle>
          <DialogDescription>
            Add a new room to your accommodation inventory
          </DialogDescription>
        </DialogHeader>
        <RoomForm onSubmit={handleSubmit} isLoading={isLoading} />
      </DialogContent>
    </Dialog>
  );
}
