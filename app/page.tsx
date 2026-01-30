import { Suspense } from 'react';
import { AuthRedirect } from '@/components/auth-redirect';

export default function Home() {
  return (
    <Suspense>
      <AuthRedirect />
    </Suspense>
  );
}
