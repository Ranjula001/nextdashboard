import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/sidebar';
import { getSettings } from '@/lib/db/settings';
import { OrganizationProvider } from '@/components/organization/organization-context';
import { Suspense } from 'react';

async function SidebarWrapper() {
  const settings = await getSettings();
  return <Sidebar businessName={settings.business_name} />;
}

export const metadata = {
  title: '9TAILED ERP SYSTEMS',
  description: 'Manage your stay bookings and operations',
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OrganizationProvider>
      <div className="flex min-h-screen bg-slate-50">
        <Suspense fallback={<div>Loading...</div>}>
          <AuthCheck />
        </Suspense>
        
        <Suspense fallback={<div className="hidden lg:block w-64 bg-white border-r border-slate-200">Loading...</div>}>
          <SidebarWrapper />
        </Suspense>
        
        <main className="flex-1 overflow-auto lg:ml-0">
          <div className="container mx-auto py-4 sm:py-8 px-3 sm:px-6">
            <Suspense fallback={<div>Loading...</div>}>
              {children}
            </Suspense>
          </div>
        </main>
      </div>
    </OrganizationProvider>
  );
}

async function AuthCheck() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
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

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect('/auth/login');
  }

  return null;
}
