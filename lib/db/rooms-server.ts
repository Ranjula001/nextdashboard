import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Room, CreateRoomInput, UpdateRoomInput } from './types';

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

  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('is_active', true)
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
    throw new Error('Failed to update room');
  }

  return data;
}

export async function deactivateRoom(roomId: string): Promise<void> {
  await updateRoom(roomId, { is_active: false });
}

export async function reactivateRoom(roomId: string): Promise<void> {
  await updateRoom(roomId, { is_active: true });
}

export async function getAvailableRoomsForDateRange(
  checkInDate: string,
  checkOutDate: string
): Promise<Room[]> {
  const supabase = await getRoomsClient();

  const { data, error } = await supabase
    .from('rooms')
    .select(
      `
      *,
      bookings!inner(id)
    `
    )
    .eq('is_active', true)
    .not('bookings.id', 'is', null)
    .gte('bookings.check_out_date', checkInDate)
    .lte('bookings.check_in_date', checkOutDate)
    .eq('bookings.status', 'ACTIVE');

  if (error) {
    console.error('Error fetching available rooms:', error);
    return getRooms();
  }

  const allRooms = await getRooms();
  const bookedRoomIds = data?.map((r: any) => r.id) || [];
  return allRooms.filter((room) => !bookedRoomIds.includes(room.id));
}