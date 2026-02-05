'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Organization, UserProfile } from '@/lib/db/types';

interface OrganizationContextType {
  currentOrganization: Organization | null;
  organizations: Organization[];
  userProfile: UserProfile | null;
  switchOrganization: (orgId: string) => Promise<void>;
  loading: boolean;
  refreshOrganizations: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  const fetchUserData = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      // Get user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userData.user.id)
        .single();

      setUserProfile(profile);

      // Get user's organizations
      const { data: orgUsers } = await supabase
        .from('organization_users')
        .select(`
          organization:organizations(*)
        `)
        .eq('user_id', userData.user.id)
        .eq('is_active', true);

      const userOrgs = orgUsers?.map(item => item.organization).filter(Boolean) || [];
      setOrganizations(userOrgs);

      // Set current organization
      if (profile?.current_organization_id) {
        const currentOrg = userOrgs.find(org => org.id === profile.current_organization_id);
        setCurrentOrganization(currentOrg || userOrgs[0] || null);
      } else if (userOrgs.length > 0) {
        setCurrentOrganization(userOrgs[0]);
        // Update user profile with first organization
        await supabase
          .from('user_profiles')
          .upsert({
            user_id: userData.user.id,
            current_organization_id: userOrgs[0].id,
            updated_at: new Date().toISOString(),
          });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const switchOrganization = async (orgId: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      await supabase
        .from('user_profiles')
        .upsert({
          user_id: userData.user.id,
          current_organization_id: orgId,
          updated_at: new Date().toISOString(),
        });

      const newOrg = organizations.find(org => org.id === orgId);
      setCurrentOrganization(newOrg || null);
      
      // Refresh the page to update all data
      window.location.reload();
    } catch (error) {
      console.error('Error switching organization:', error);
    }
  };

  const refreshOrganizations = async () => {
    await fetchUserData();
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  return (
    <OrganizationContext.Provider
      value={{
        currentOrganization,
        organizations,
        userProfile,
        switchOrganization,
        loading,
        refreshOrganizations,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}