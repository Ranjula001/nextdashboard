import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * SERVER-SIDE MULTI-TENANT SECURITY HELPER
 * 
 * This file provides secure helpers for all server-side data operations
 * to ensure organization context is always validated.
 * 
 * IMPORTANT: Always use these helpers or similar validation in server functions
 * Never trust client-side organization_id values - always revalidate on server
 */

/**
 * Get the secure Supabase client
 */
export async function getSecureSupabaseClient() {
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
 * Get current user's authenticated session
 * Throws error if not authenticated
 */
export async function getAuthenticatedUser() {
  const supabase = await getSecureSupabaseClient();
  const { data: userData, error } = await supabase.auth.getUser();
  
  if (error || !userData.user) {
    throw new Error('User not authenticated');
  }
  
  return userData.user;
}

/**
 * Get current user's active organization
 * Throws error if user has no organization
 */
export async function getUserCurrentOrganization() {
  const user = await getAuthenticatedUser();
  const supabase = await getSecureSupabaseClient();
  
  const { data: orgId, error } = await supabase.rpc('get_current_organization_id');
  
  if (error || !orgId) {
    throw new Error('No organization selected for user');
  }
  
  return orgId as string;
}

/**
 * Verify that user belongs to a specific organization
 * Throws error if not a member
 */
export async function verifyUserOrganizationMembership(organizationId: string) {
  const user = await getAuthenticatedUser();
  const supabase = await getSecureSupabaseClient();
  
  const { data: isMember, error } = await supabase.rpc('is_user_org_member', {
    p_org_id: organizationId,
    p_user_id: user.id,
  });
  
  if (error) {
    console.error('Error verifying organization membership:', error);
    throw new Error('Failed to verify organization membership');
  }
  
  if (!isMember) {
    throw new Error('User does not have access to this organization');
  }
  
  return true;
}

/**
 * Verify user is an admin (OWNER or MANAGER) of organization
 */
export async function verifyUserIsOrgAdmin(organizationId: string) {
  const user = await getAuthenticatedUser();
  const supabase = await getSecureSupabaseClient();
  
  const { data: isAdmin, error } = await supabase.rpc('is_user_org_admin', {
    p_org_id: organizationId,
    p_user_id: user.id,
  });
  
  if (error) {
    console.error('Error checking admin status:', error);
    throw new Error('Failed to verify admin status');
  }
  
  if (!isAdmin) {
    throw new Error('User does not have admin privileges for this organization');
  }
  
  return true;
}

/**
 * Get all organizations user belongs to
 */
export async function getUserOrganizations() {
  const user = await getAuthenticatedUser();
  const supabase = await getSecureSupabaseClient();
  
  const { data, error } = await supabase
    .from('organization_users')
    .select(`
      organization:organizations(*)
    `)
    .eq('user_id', user.id)
    .eq('is_active', true);
  
  if (error) {
    console.error('Error fetching organizations:', error);
    throw new Error('Failed to fetch organizations');
  }
  
  return data?.map(item => item.organization).filter(Boolean) || [];
}

/**
 * Ensure request is scoped to current user's organization
 * This prevents accidental data leakage through client-side org_id values
 */
export async function ensureOrganizationContext(
  requestedOrgId?: string
): Promise<string> {
  const currentOrgId = await getUserCurrentOrganization();
  
  // If a specific org was requested, verify user has access
  if (requestedOrgId && requestedOrgId !== currentOrgId) {
    await verifyUserOrganizationMembership(requestedOrgId);
  }
  
  // Return the organization ID to use (requested if verified, else current)
  return requestedOrgId || currentOrgId;
}

/**
 * Verify data belongs to user's organization
 * Use this before returning sensitive data
 */
export async function verifyDataOwnership(
  tableName: string,
  recordId: string,
  expectedOrgId?: string
) {
  const supabase = await getSecureSupabaseClient();
  const userOrgId = expectedOrgId || await getUserCurrentOrganization();
  
  const { data, error } = await supabase
    .from(tableName)
    .select('organization_id')
    .eq('id', recordId)
    .single();
  
  if (error) {
    console.error(`Error verifying ${tableName} ownership:`, error);
    throw new Error(`Failed to verify data ownership`);
  }
  
  if (!data || data.organization_id !== userOrgId) {
    throw new Error('User does not have access to this record');
  }
  
  return data;
}

/**
 * Safe wrapper for creating records with organization context
 * Ensures organization_id is always set and validated
 */
export async function createRecordWithOrgContext(
  supabase: any,
  tableName: string,
  recordData: any,
  overrideOrgId?: string
) {
  const orgId = await ensureOrganizationContext(overrideOrgId);
  
  // Ensure organization_id is set
  const dataWithOrg = {
    ...recordData,
    organization_id: orgId,
  };
  
  const { data, error } = await supabase
    .from(tableName)
    .insert(dataWithOrg)
    .select()
    .single();
  
  if (error) {
    console.error(`Error creating record in ${tableName}:`, error);
    throw new Error(`Failed to create record`);
  }
  
  return data;
}

/**
 * Safe wrapper for updating records with organization validation
 */
export async function updateRecordWithOrgContext(
  supabase: any,
  tableName: string,
  recordId: string,
  updateData: any
) {
  // Verify user has access to this record
  await verifyDataOwnership(tableName, recordId);
  
  // Prevent organization_id from being modified
  const sanitizedData = { ...updateData };
  delete sanitizedData.organization_id;
  
  const { data, error } = await supabase
    .from(tableName)
    .update(sanitizedData)
    .eq('id', recordId)
    .select()
    .single();
  
  if (error) {
    console.error(`Error updating record in ${tableName}:`, error);
    throw new Error(`Failed to update record`);
  }
  
  return data;
}

/**
 * Safe wrapper for deleting records with organization validation
 */
export async function deleteRecordWithOrgContext(
  supabase: any,
  tableName: string,
  recordId: string
) {
  // Verify user has access to this record
  await verifyDataOwnership(tableName, recordId);
  
  const { error } = await supabase
    .from(tableName)
    .delete()
    .eq('id', recordId);
  
  if (error) {
    console.error(`Error deleting record from ${tableName}:`, error);
    throw new Error(`Failed to delete record`);
  }
}

/**
 * Safe wrapper for querying records scoped to organization
 */
export async function queryOrgRecords(
  supabase: any,
  tableName: string,
  filters?: Record<string, any>,
  select?: string
) {
  const orgId = await getUserCurrentOrganization();
  
  let query = supabase
    .from(tableName)
    .select(select || '*')
    .eq('organization_id', orgId);
  
  // Apply additional filters
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error(`Error querying ${tableName}:`, error);
    throw new Error(`Failed to fetch records`);
  }
  
  return data || [];
}
