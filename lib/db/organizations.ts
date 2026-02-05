import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Organization, CreateOrganizationInput, UserProfile, OrganizationUser } from './types';

export async function getOrganizationClient() {
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
 * Create a new organization
 */
export async function createOrganization(input: CreateOrganizationInput): Promise<Organization> {
  const supabase = await getOrganizationClient();
  
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    throw new Error('User not authenticated');
  }

  // Generate unique slug from name
  const slug = input.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  
  const { data, error } = await supabase
    .from('organizations')
    .insert({
      name: input.name,
      slug,
      business_type: input.business_type,
      subscription_plan: input.subscription_plan,
      subscription_status: 'ACTIVE',
      max_rooms: input.subscription_plan === 'BASIC' ? 10 : input.subscription_plan === 'PREMIUM' ? 50 : 200,
      max_users: input.subscription_plan === 'BASIC' ? 3 : input.subscription_plan === 'PREMIUM' ? 10 : 50,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating organization:', error);
    throw new Error('Failed to create organization');
  }

  // Add user as owner
  await supabase
    .from('organization_users')
    .insert({
      organization_id: data.id,
      user_id: userData.user.id,
      role: 'OWNER',
      is_active: true,
    });

  return data;
}

/**
 * Get user's organizations
 */
export async function getUserOrganizations(): Promise<Organization[]> {
  const supabase = await getOrganizationClient();
  
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('organization_users')
    .select(`
      organization:organizations(*)
    `)
    .eq('user_id', userData.user.id)
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching organizations:', error);
    throw new Error('Failed to fetch organizations');
  }

  return data?.map(item => item.organization).filter(Boolean) || [];
}

/**
 * Get current user's organization context
 */
export async function getCurrentOrganization(): Promise<Organization | null> {
  const supabase = await getOrganizationClient();
  
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return null;
  }

  // Get user profile to find current organization
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('current_organization_id')
    .eq('user_id', userData.user.id)
    .single();

  if (!profile?.current_organization_id) {
    // Get first organization if no current one set
    const orgs = await getUserOrganizations();
    return orgs[0] || null;
  }

  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', profile.current_organization_id)
    .single();

  if (error) {
    console.error('Error fetching current organization:', error);
    return null;
  }

  return data;
}

/**
 * Switch user's current organization
 */
export async function switchOrganization(organizationId: string): Promise<void> {
  const supabase = await getOrganizationClient();
  
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('user_profiles')
    .upsert({
      user_id: userData.user.id,
      current_organization_id: organizationId,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error('Error switching organization:', error);
    throw new Error('Failed to switch organization');
  }
}