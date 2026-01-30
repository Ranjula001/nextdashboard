import { getCustomers } from '@/lib/db/customers-server';
import { getRooms } from '@/lib/db/rooms-server';
import { createBooking } from '@/lib/db/bookings-server';
import { getSettings } from '@/lib/db/settings';
import { BookingForm } from '@/components/bookings/booking-form';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function CreateBookingPage() {
  const [customers, rooms, settings] = await Promise.all([
    getCustomers(),
    getRooms(),
    getSettings(),
  ]);

  const handleSubmit = async (formData: any) => {
    'use server';
    try {
      await createBooking(formData);
      redirect('/dashboard/bookings');
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/bookings">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">New Booking</h1>
          <p className="text-slate-600 mt-1">Create a new guest booking</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <BookingForm
          customers={customers}
          rooms={rooms}
          settings={settings}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
