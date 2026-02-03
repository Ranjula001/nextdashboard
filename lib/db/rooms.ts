import { createClient } from '@/lib/supabase/client';
import { Room, CreateRoomInput, UpdateRoomInput } from './types';

export async function createRoomClient(input: CreateRoomInput): Promise<Room> {
  const supabase = createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('rooms')
    .insert({
      owner_id: userData.user.id,
      ...input,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating room:', error);
    throw new Error('Failed to create room');
  }

  return data;
}

export async function updateRoomClient(
  roomId: string,
  input: UpdateRoomInput
): Promise<Room> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('rooms')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', roomId)
    .select()
    .single();

  if (error) {
    console.error('Error updating room:', error);
    throw new Error('Failed to update room');
  }

  return data;
}
