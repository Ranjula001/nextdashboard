'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CustomerForm } from './customer-form';
import { createCustomer } from '@/lib/db/customers';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';

interface CreateCustomerDialogProps {
  asChild?: boolean;
  children?: React.ReactNode;
}

export function CreateCustomerDialog({
  asChild = false,
  children,
}: CreateCustomerDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (formData: any) => {
    setIsLoading(true);
    try {
      await createCustomer(formData);
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild={asChild}>
        {children ? (
          children
        ) : (
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
          <DialogDescription>
            Add a new guest to your customer database
          </DialogDescription>
        </DialogHeader>
        <CustomerForm onSubmit={handleSubmit} isLoading={isLoading} />
      </DialogContent>
    </Dialog>
  );
}
