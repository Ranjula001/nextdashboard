import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function AuthRedirect() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // If credentials are missing, redirect to auth/login to show proper error
  if (!supabaseUrl || !supabaseKey) {
    redirect('/auth/login');
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
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
  });

  try {
    // Check if user is authenticated
    const { data } = await supabase.auth.getUser();

    if (data.user) {
      // User is authenticated, redirect to dashboard
      redirect('/dashboard');
    }
  } catch (error) {
    // If there's an error, redirect to login
    console.error('Auth check error:', error);
  }

  // User is not authenticated, redirect to login
  redirect('/auth/login');
}
