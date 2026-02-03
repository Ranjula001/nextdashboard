import { getBookingById, completeBooking, cancelBooking } from '@/lib/db/bookings';
import { getPaymentsForBooking, createPayment } from '@/lib/db/payments';
import { getSettings } from '@/lib/db/settings';
import { formatCurrency, getPaymentStatusColor } from '@/lib/services/booking.service';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Clock, MapPin, User, CreditCard, CheckCircle, X } from 'lucide-react';

interface BookingDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function BookingDetailPage({
  params,
}: BookingDetailPageProps) {
  const { id } = await params;
  const [booking, settings] = await Promise.all([
    getBookingById(id),
    getSettings(),
  ]);

  if (!booking) {
    notFound();
  }

  const handleCompleteBooking = async () => {
    'use server';
    await completeBooking(id);
    redirect('/dashboard/bookings');
  };

  const handleCancelBooking = async () => {
    'use server';
    await cancelBooking(id);
    redirect('/dashboard/bookings');
  };

  const totalPaid = 0; // No payments table, so always 0
  const remainingBalance = booking.total_amount;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/bookings">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Booking Details</h1>
          <p className="text-slate-600 mt-1">ID: {id}</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Booking Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Guest Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Guest Information
            </h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-slate-400 mt-1" />
                <div>
                  <p className="text-sm text-slate-600">Name</p>
                  <p className="font-medium text-slate-900">
                    {booking.customer?.name}
                  </p>
                  <p className="text-sm text-slate-600">
                    {booking.customer?.phone_number}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stay Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Stay Details
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-slate-400 mt-1" />
                <div>
                  <p className="text-sm text-slate-600">Room</p>
                  <p className="font-medium text-slate-900">
                    {booking.room?.room_name}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-slate-400 mt-1" />
                <div>
                  <p className="text-sm text-slate-600">Check-in</p>
                  <p className="font-medium text-slate-900">
                    {new Date(booking.check_in_date).toLocaleString('en-US')}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-slate-400 mt-1" />
                <div>
                  <p className="text-sm text-slate-600">Check-out</p>
                  <p className="font-medium text-slate-900">
                    {new Date(booking.check_out_date).toLocaleString('en-US')}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-2">Booking Type</p>
                <p className="font-medium text-slate-900">
                  {booking.booking_type}
                </p>
              </div>
            </div>
          </div>

          {/* Payment History */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Payment History
            </h2>
            <p className="text-slate-600">Payment tracking not available - payments table not configured</p>
          </div>
        </div>

        {/* Right Column - Summary & Actions */}
        <div className="space-y-6">
          {/* Price Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Price Summary
            </h2>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-slate-600">Subtotal</span>
                <span className="text-slate-900">
                  {formatCurrency(booking.subtotal, settings.currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Discount</span>
                <span className="text-slate-900">
                  {formatCurrency(booking.discount, settings.currency)}
                </span>
              </div>
              <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
                <span>Total</span>
                <span>
                  {formatCurrency(booking.total_amount, settings.currency)}
                </span>
              </div>
            </div>

            {/* Payment Status */}
            <div className="mb-4">
              <p className="text-sm text-slate-600 mb-2">Payment Status</p>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(
                  booking.payment_status
                )}`}
              >
                {booking.payment_status}
              </span>
            </div>

            {/* Amount Breakdown */}
            <div className="space-y-2 text-sm bg-slate-50 p-3 rounded-lg">
              <div className="flex justify-between">
                <span className="text-slate-600">Total Amount</span>
                <span className="font-medium">
                  {formatCurrency(booking.total_amount, settings.currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Payment Status</span>
                <span className={`font-medium ${booking.payment_status === 'PAID' ? 'text-green-600' : 'text-red-600'}`}>
                  {booking.payment_status}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Actions
            </h2>
            <div className="space-y-2">
              {booking.status === 'ACTIVE' && (
                <>
                  {/* Complete Booking Button */}
                  <form action={handleCompleteBooking}>
                    <Button
                      type="submit"
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Check Out
                    </Button>
                  </form>
                  <form action={handleCancelBooking}>
                    <Button
                      type="submit"
                      variant="destructive"
                      className="w-full bg-red-600 hover:bg-red-700"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel Booking
                    </Button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
