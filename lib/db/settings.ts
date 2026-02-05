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

  // Try to get settings by organization first
  const { data: orgData, error: orgError } = await supabase.rpc('get_current_organization_id');
  const orgId = orgData as string | null;

  let settingsData: Settings | null = null;

  if (orgId) {
    // Try organization-scoped settings first
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('organization_id', orgId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      // Some error other than not found
      console.error('Error fetching settings by org:', error);
    }

    if (data) {
      settingsData = data;
    }
  }

  // If no org settings found, try owner-scoped settings (fallback for legacy schema)
  if (!settingsData) {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('owner_id', userData.user.id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching settings by owner:', error);
    }

    if (data) {
      settingsData = data;
    }
  }

  // If settings exist, return them
  if (settingsData) {
    return settingsData;
  }

  // Settings don't exist, create default settings via RPC
  return createDefaultSettings(userData.user.id, orgId);
}

/**
 * Create default settings for a new user
 */
async function createDefaultSettings(ownerId: string, orgId?: string | null): Promise<Settings> {
  const supabase = await getSettingsClient();

  try {
    // Call the RPC to create default settings
    // This runs on the server under SECURITY DEFINER, so it can always insert
    const { data, error } = await supabase.rpc('create_default_settings', {
      p_user_id: ownerId,
      p_org_id: orgId || null,
    });

    if (error) {
      console.error('Error calling create_default_settings RPC:', {
        error,
        message: (error as any)?.message,
        code: (error as any)?.code,
        details: (error as any)?.details,
      });
      throw new Error('Failed to create settings: ' + ((error as any)?.message || JSON.stringify(error)));
    }

    if (data?.error) {
      console.error('RPC returned error:', data.error);
      throw new Error('Failed to create settings: ' + data.error);
    }

    return data;
  } catch (err: any) {
    console.error('Unexpected error creating default settings:', err);
    throw err instanceof Error ? err : new Error('Failed to create settings');
  }
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

  // Get current organization
  const { data: orgData } = await supabase.rpc('get_current_organization_id');
  const orgId = orgData as string | null;

  // Update by organization if it exists, otherwise by owner
  const query = supabase
    .from('settings')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (orgId) {
    const { data, error } = await query.eq('organization_id', orgId);
    if (error) {
      console.error('Error updating settings:', error);
      throw new Error('Failed to update settings');
    }
    return data;
  } else {
    const { data, error } = await query.eq('owner_id', userData.user.id);
    if (error) {
      console.error('Error updating settings:', error);
      throw new Error('Failed to update settings');
    }
    return data;
  }
}
