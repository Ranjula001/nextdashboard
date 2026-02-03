'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Customer, CreateCustomerInput } from '@/lib/db/types';

interface CustomerFormProps {
  customer?: Customer;
  onSubmit: (data: CreateCustomerInput | { id: string; data: any }) => Promise<void>;
  isLoading?: boolean;
}

export function CustomerForm({
  customer,
  onSubmit,
  isLoading = false,
}: CustomerFormProps) {
  const [formData, setFormData] = useState<CreateCustomerInput>({
    name: customer?.name || '',
    phone_number: customer?.phone_number || '',
    email: customer?.email || '',
    notes: customer?.notes || '',
  });

  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    if (!formData.phone_number.trim()) {
      setError('Phone number is required');
      return;
    }

    try {
      if (customer) {
        await onSubmit({
          id: customer.id,
          data: formData,
        });
      } else {
        await onSubmit(formData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save customer');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Name */}
      <div>
        <Label htmlFor="name" className="text-sm font-medium text-slate-900">
          Full Name
        </Label>
        <Input
          id="name"
          type="text"
          placeholder="John Doe"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          disabled={isLoading}
        />
      </div>

      {/* Phone Number */}
      <div>
        <Label htmlFor="phone" className="text-sm font-medium text-slate-900">
          Phone Number
        </Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+94701234567"
          value={formData.phone_number}
          onChange={(e) =>
            setFormData({ ...formData, phone_number: e.target.value })
          }
          disabled={isLoading}
        />
      </div>

      {/* Email */}
      <div>
        <Label htmlFor="email" className="text-sm font-medium text-slate-900">
          Email (Optional)
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="john@example.com"
          value={formData.email || ''}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          disabled={isLoading}
        />
      </div>

      {/* Notes */}
      <div>
        <Label htmlFor="notes" className="text-sm font-medium text-slate-900">
          Notes (Optional)
        </Label>
        <textarea
          id="notes"
          placeholder="VIP guest, prefers early check-in, etc."
          value={formData.notes || ''}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          disabled={isLoading}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
          rows={3}
        />
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        {isLoading ? 'Saving...' : customer ? 'Update Customer' : 'Add Customer'}
      </Button>
    </form>
  );
}
