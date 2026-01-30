'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CreateBookingInput, DurationType, Customer, Room } from '@/lib/db/types';
import {
  calculateDuration,
  calculateBookingPrice,
  formatCurrency,
} from '@/lib/services/booking.service';

interface BookingFormProps {
  customers: Customer[];
  rooms: Room[];
  settings: any;
  onSubmit: (data: CreateBookingInput) => Promise<void>;
  isLoading?: boolean;
}

export function BookingForm({
  customers,
  rooms,
  settings,
  onSubmit,
  isLoading = false,
}: BookingFormProps) {
  const [formData, setFormData] = useState({
    room_id: '',
    customer_id: '',
    check_in_date: '',
    check_in_time: '00:00',
    check_out_date: '',
    check_out_time: '00:00',
    duration_type: 'DAYS' as DurationType,
    payment_method: 'CASH' as const,
    booking_source: 'WALKIN' as const,
    notes: '',
  });

  const [advancePaid, setAdvancePaid] = useState(0);
  const [priceBreakdown, setPriceBreakdown] = useState<any>(null);
  const [error, setError] = useState('');

  // Recalculate price when relevant fields change
  useEffect(() => {
    if (!formData.check_in_date || !formData.check_out_date || !formData.room_id) {
      setPriceBreakdown(null);
      return;
    }

    try {
      const checkIn = new Date(`${formData.check_in_date}T${formData.check_in_time}`);
      const checkOut = new Date(`${formData.check_out_date}T${formData.check_out_time}`);

      if (checkOut <= checkIn) {
        setError('Check-out must be after check-in');
        setPriceBreakdown(null);
        return;
      }

      const room = rooms.find((r) => r.id === formData.room_id);
      if (!room) return;

      const duration = calculateDuration(checkIn, checkOut, formData.duration_type);
      const roomRate =
        formData.duration_type === 'HOURS'
          ? room.hourly_rate
          : room.daily_rate;

      const priceCalculation = calculateBookingPrice(
        duration,
        roomRate,
        settings.tax_percentage,
        settings.service_charge_percentage
      );

      setPriceBreakdown({
        duration,
        roomRate,
        ...priceCalculation,
        balance: priceCalculation.total_price - advancePaid,
      });

      setError('');
    } catch (err) {
      console.error('Price calculation error:', err);
      setError('Failed to calculate price');
      setPriceBreakdown(null);
    }
  }, [
    formData.check_in_date,
    formData.check_in_time,
    formData.check_out_date,
    formData.check_out_time,
    formData.duration_type,
    formData.room_id,
    advancePaid,
    rooms,
    settings,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.room_id) {
      setError('Room is required');
      return;
    }

    if (!formData.customer_id) {
      setError('Customer is required');
      return;
    }

    if (!priceBreakdown) {
      setError('Unable to calculate price');
      return;
    }

    if (advancePaid < 0 || advancePaid > priceBreakdown.total_price) {
      setError('Advance paid must be between 0 and total price');
      return;
    }

    try {
      const bookingData: CreateBookingInput = {
        room_id: formData.room_id,
        customer_id: formData.customer_id,
        check_in_date: new Date(
          `${formData.check_in_date}T${formData.check_in_time}`
        ).toISOString(),
        check_out_date: new Date(
          `${formData.check_out_date}T${formData.check_out_time}`
        ).toISOString(),
        duration_type: formData.duration_type,
        duration_value: priceBreakdown.duration,
        room_rate: priceBreakdown.roomRate,
        subtotal: priceBreakdown.total_price,
        advance_paid: advancePaid,
        payment_method: formData.payment_method,
        booking_source: formData.booking_source,
        notes: formData.notes,
      };

      await onSubmit(bookingData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create booking');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Customer Selection */}
      <div>
        <Label htmlFor="customer_id" className="text-sm font-medium">
          Customer
        </Label>
        <Select
          value={formData.customer_id}
          onValueChange={(value) =>
            setFormData({ ...formData, customer_id: value })
          }
        >
          <SelectTrigger id="customer_id">
            <SelectValue placeholder="Select customer..." />
          </SelectTrigger>
          <SelectContent>
            {customers.map((customer) => (
              <SelectItem key={customer.id} value={customer.id}>
                {customer.name} ({customer.phone_number})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Room Selection */}
      <div>
        <Label htmlFor="room_id" className="text-sm font-medium">
          Room
        </Label>
        <Select
          value={formData.room_id}
          onValueChange={(value) =>
            setFormData({ ...formData, room_id: value })
          }
        >
          <SelectTrigger id="room_id">
            <SelectValue placeholder="Select room..." />
          </SelectTrigger>
          <SelectContent>
            {rooms
              .filter((r) => r.status === 'AVAILABLE' && r.is_active)
              .map((room) => (
                <SelectItem key={room.id} value={room.id}>
                  {room.room_name} ({room.room_type === 'AC' ? 'AC' : 'Non-AC'})
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {/* Check-in Date & Time */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="check_in_date" className="text-sm font-medium">
            Check-in Date
          </Label>
          <Input
            id="check_in_date"
            type="date"
            value={formData.check_in_date}
            onChange={(e) =>
              setFormData({ ...formData, check_in_date: e.target.value })
            }
            disabled={isLoading}
          />
        </div>
        <div>
          <Label htmlFor="check_in_time" className="text-sm font-medium">
            Check-in Time
          </Label>
          <Input
            id="check_in_time"
            type="time"
            value={formData.check_in_time}
            onChange={(e) =>
              setFormData({ ...formData, check_in_time: e.target.value })
            }
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Check-out Date & Time */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="check_out_date" className="text-sm font-medium">
            Check-out Date
          </Label>
          <Input
            id="check_out_date"
            type="date"
            value={formData.check_out_date}
            onChange={(e) =>
              setFormData({ ...formData, check_out_date: e.target.value })
            }
            disabled={isLoading}
          />
        </div>
        <div>
          <Label htmlFor="check_out_time" className="text-sm font-medium">
            Check-out Time
          </Label>
          <Input
            id="check_out_time"
            type="time"
            value={formData.check_out_time}
            onChange={(e) =>
              setFormData({ ...formData, check_out_time: e.target.value })
            }
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Duration Type */}
      <div>
        <Label htmlFor="duration_type" className="text-sm font-medium">
          Billing Type
        </Label>
        <Select
          value={formData.duration_type}
          onValueChange={(value) =>
            setFormData({ ...formData, duration_type: value as DurationType })
          }
        >
          <SelectTrigger id="duration_type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="HOURS">Hourly</SelectItem>
            <SelectItem value="DAYS">Daily</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Price Breakdown */}
      {priceBreakdown && (
        <div className="p-4 bg-slate-50 rounded-lg space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">
              {priceBreakdown.duration} {formData.duration_type.toLowerCase()}
            </span>
            <span className="text-slate-900 font-medium">
              @ {formatCurrency(priceBreakdown.roomRate, settings.currency)}{' '}
              {formData.duration_type === 'HOURS' ? '/hr' : '/day'}
            </span>
          </div>
          <div className="border-t border-slate-200 pt-2 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Subtotal</span>
              <span className="text-slate-900">
                {formatCurrency(priceBreakdown.base_price, settings.currency)}
              </span>
            </div>
            {priceBreakdown.tax_amount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">
                  Tax ({settings.tax_percentage}%)
                </span>
                <span className="text-slate-900">
                  {formatCurrency(priceBreakdown.tax_amount, settings.currency)}
                </span>
              </div>
            )}
            {priceBreakdown.service_charge > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">
                  Service Charge ({settings.service_charge_percentage}%)
                </span>
                <span className="text-slate-900">
                  {formatCurrency(
                    priceBreakdown.service_charge,
                    settings.currency
                  )}
                </span>
              </div>
            )}
            <div className="flex justify-between font-semibold border-t border-slate-300 pt-2">
              <span className="text-slate-900">Total</span>
              <span className="text-slate-900">
                {formatCurrency(priceBreakdown.total_price, settings.currency)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Advance Paid */}
      <div>
        <Label htmlFor="advance_paid" className="text-sm font-medium">
          Advance Paid ({settings.currency})
        </Label>
        <Input
          id="advance_paid"
          type="number"
          placeholder="0"
          value={advancePaid}
          onChange={(e) => setAdvancePaid(parseFloat(e.target.value) || 0)}
          disabled={isLoading}
          min="0"
          step="100"
        />
        {priceBreakdown && (
          <p className="text-xs text-slate-600 mt-1">
            Balance:{' '}
            {formatCurrency(
              Math.max(0, priceBreakdown.total_price - advancePaid),
              settings.currency
            )}
          </p>
        )}
      </div>

      {/* Payment Method */}
      <div>
        <Label htmlFor="payment_method" className="text-sm font-medium">
          Payment Method
        </Label>
        <Select
          value={formData.payment_method}
          onValueChange={(value) =>
            setFormData({ ...formData, payment_method: value as any })
          }
        >
          <SelectTrigger id="payment_method">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CASH">Cash</SelectItem>
            <SelectItem value="BANK">Bank Transfer</SelectItem>
            <SelectItem value="DIGITAL">Digital Payment</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Booking Source */}
      <div>
        <Label htmlFor="booking_source" className="text-sm font-medium">
          Booking Source
        </Label>
        <Select
          value={formData.booking_source}
          onValueChange={(value) =>
            setFormData({ ...formData, booking_source: value as any })
          }
        >
          <SelectTrigger id="booking_source">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="WALKIN">Walk-in</SelectItem>
            <SelectItem value="PHONE">Phone</SelectItem>
            <SelectItem value="ONLINE">Online</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Notes */}
      <div>
        <Label htmlFor="notes" className="text-sm font-medium">
          Notes (Optional)
        </Label>
        <textarea
          id="notes"
          placeholder="Special requests, dietary preferences, etc."
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          disabled={isLoading}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
        />
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        {isLoading ? 'Creating Booking...' : 'Create Booking'}
      </Button>
    </form>
  );
}
