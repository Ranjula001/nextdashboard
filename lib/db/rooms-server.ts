import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Room, CreateRoomInput, UpdateRoomInput } from './types';
import { getUserCurrentOrganization, verifyDataOwnership } from '@/lib/security/multi-tenant-validation';

export async function getRoomsClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}

export async function getRooms(): Promise<Room[]> {
  const supabase = await getRoomsClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    throw new Error('User not authenticated');
  }

  // Get user's current organization
  const orgId = await getUserCurrentOrganization();

  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('organization_id', orgId)
    .order('room_name', { ascending: true });

  if (error) {
    console.error('Error fetching rooms:', error);
    throw new Error('Failed to fetch rooms');
  }

  return data || [];
}

export async function getRoomById(roomId: string): Promise<Room | null> {
  const supabase = await getRoomsClient();

  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', roomId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching room:', error);
    throw new Error('Failed to fetch room');
  }

  return data || null;
}

export async function createRoom(input: CreateRoomInput): Promise<Room> {
  const supabase = await getRoomsClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    throw new Error('User not authenticated');
  }

  // Get user's current organization
  const { data: orgId } = await supabase
    .rpc('get_current_organization_id');

  if (!orgId) {
    throw new Error('No organization selected');
  }

  const { data, error } = await supabase
    .from('rooms')
    .insert({
      organization_id: orgId,
      ...input,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating room:', error);
    throw new Error('Failed to create room');
  }

  return data;
}

export async function updateRoom(
  roomId: string,
  input: UpdateRoomInput
): Promise<Room> {
  const supabase = await getRoomsClient();

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
    throw new Error(`Failed to update room: ${error.message}`);
  }

  return data;
}

export async function deactivateRoom(roomId: string): Promise<void> {
  await updateRoom(roomId, { status: 'OUT_OF_ORDER' });
}

export async function reactivateRoom(roomId: string): Promise<void> {
  await updateRoom(roomId, { status: 'AVAILABLE' });
}

export async function deleteRoom(roomId: string): Promise<void> {
  const supabase = await getRoomsClient();

  const { error } = await supabase
    .from('rooms')
    .delete()
    .eq('id', roomId);

  if (error) {
    console.error('Error deleting room:', error);
    throw new Error('Failed to delete room');
  }
}