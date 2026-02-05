'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createBrowserClient } from '@supabase/ssr';

export function OrganizationSetupForm() {
  const [formData, setFormData] = useState({
    name: '',
    business_type: '',
    subscription_plan: 'BASIC' as 'BASIC' | 'PREMIUM' | 'ENTERPRISE',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
      );

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('User not authenticated');
      }

      // Generate unique slug
      const slug = formData.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      
      // Create organization and owner via server RPC to avoid RLS insert issues
      const res = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          slug,
          business_type: formData.business_type,
          subscription_plan: formData.subscription_plan,
          subscription_status: 'ACTIVE',
          max_rooms: formData.subscription_plan === 'BASIC' ? 10 : formData.subscription_plan === 'PREMIUM' ? 50 : 200,
          max_users: formData.subscription_plan === 'BASIC' ? 3 : formData.subscription_plan === 'PREMIUM' ? 10 : 50,
        }),
      });

      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Failed to create organization');

      router.push('/dashboard');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setError(message || 'Failed to create organization');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Your Business</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Business Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Your Hotel/Lodge Name"
              required
            />
          </div>

          <div>
            <Label htmlFor="business_type">Business Type</Label>
            <Input
              id="business_type"
              value={formData.business_type}
              onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
              placeholder="Hotel, Lodge, Guest House, etc."
              required
            />
          </div>

          <div>
            <Label htmlFor="plan">Subscription Plan</Label>
            <Select
              value={formData.subscription_plan}
              onValueChange={(value: 'BASIC' | 'PREMIUM' | 'ENTERPRISE') => setFormData({ ...formData, subscription_plan: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BASIC">Basic (10 rooms, 3 users)</SelectItem>
                <SelectItem value="PREMIUM">Premium (50 rooms, 10 users)</SelectItem>
                <SelectItem value="ENTERPRISE">Enterprise (200 rooms, 50 users)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Business'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}