import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Settings, UpdateSettingsInput } from './types';

export async function getSettingsClient() {
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

/**
 * Get the authenticated user's settings
 */
export async function getSettings(): Promise<Settings> {
  const supabase = await getSettingsClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('owner_id', userData.user.id)
    .single();

  if (error && error.code === 'PGRST116') {
    // Settings not found, create default settings
    return createDefaultSettings(userData.user.id);
  }

  if (error) {
    console.error('Error fetching settings:', error);
    throw new Error('Failed to fetch settings');
  }

  return data;
}

/**
 * Create default settings for a new user
 */
async function createDefaultSettings(ownerId: string): Promise<Settings> {
  const supabase = await getSettingsClient();

  const { data, error } = await supabase
    .from('settings')
    .insert({
      owner_id: ownerId,
      business_name: 'BIMBARA Holiday Home',
      currency: 'LKR',
      timezone: 'Asia/Colombo',
      check_in_time: '14:00:00',
      check_out_time: '12:00:00',
      tax_rate: 0,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating default settings:', error);
    throw new Error('Failed to create settings');
  }

  return data;
}

/**
 * Update the authenticated user's settings
 */
export async function updateSettings(input: UpdateSettingsInput): Promise<Settings> {
  const supabase = await getSettingsClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('settings')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('owner_id', userData.user.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating settings:', error);
    throw new Error('Failed to update settings');
  }

  return data;
}
