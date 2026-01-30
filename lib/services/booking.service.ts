import { PriceCalculation, DurationType } from '@/lib/db/types';
import { getBookingsForRoomInDateRange } from '@/lib/db/bookings';

/**
 * Calculate booking price based on duration, rate, and settings
 */
export function calculateBookingPrice(
  durationValue: number,
  roomRate: number,
  taxPercentage: number | null = null,
  serviceChargePercentage: number | null = null
): PriceCalculation {
  // Calculate base price
  const basePrice = roomRate * durationValue;

  // Calculate tax
  const taxAmount = taxPercentage ? (basePrice * taxPercentage) / 100 : 0;

  // Calculate service charge
  const serviceCharge = serviceChargePercentage
    ? (basePrice * serviceChargePercentage) / 100
    : 0;

  // Calculate total
  const totalPrice = basePrice + taxAmount + serviceCharge;

  return {
    base_price: Math.round(basePrice * 100) / 100,
    tax_amount: Math.round(taxAmount * 100) / 100,
    service_charge: Math.round(serviceCharge * 100) / 100,
    total_price: Math.round(totalPrice * 100) / 100,
  };
}

/**
 * Calculate duration between two dates in hours or days
 */
export function calculateDuration(
  checkInDate: Date,
  checkOutDate: Date,
  durationType: DurationType
): number {
  const diffMs = checkOutDate.getTime() - checkInDate.getTime();

  if (durationType === 'HOURS') {
    return Math.ceil(diffMs / (1000 * 60 * 60));
  } else {
    // For days, calculate the number of full days
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }
}

/**
 * Check if a room is available for the given date range
 */
export async function isRoomAvailable(
  roomId: string,
  checkInDate: string,
  checkOutDate: string,
  excludeBookingId?: string
): Promise<boolean> {
  try {
    const conflictingBookings = await getBookingsForRoomInDateRange(
      roomId,
      checkInDate,
      checkOutDate
    );

    // Filter out the current booking if it's being edited
    const relevantBookings = excludeBookingId
      ? conflictingBookings.filter((b) => b.id !== excludeBookingId)
      : conflictingBookings;

    return relevantBookings.length === 0;
  } catch (error) {
    console.error('Error checking room availability:', error);
    return false;
  }
}

/**
 * Get the appropriate room rate based on room type and duration
 */
export function getRateForDuration(
  durationType: DurationType,
  acHourlyRate: number,
  acDailyRate: number,
  nonAcHourlyRate: number,
  nonAcDailyRate: number,
  isAC: boolean
): number {
  if (isAC) {
    return durationType === 'HOURS' ? acHourlyRate : acDailyRate;
  } else {
    return durationType === 'HOURS' ? nonAcHourlyRate : nonAcDailyRate;
  }
}

/**
 * Validate booking input
 */
export function validateBookingInput(
  checkInDate: Date,
  checkOutDate: Date,
  durationValue: number,
  durationType: DurationType
): { isValid: boolean; error?: string } {
  // Check if dates are in the future
  const now = new Date();
  if (checkInDate < now) {
    return { isValid: false, error: 'Check-in date must be in the future' };
  }

  // Check if check-out is after check-in
  if (checkOutDate <= checkInDate) {
    return { isValid: false, error: 'Check-out date must be after check-in date' };
  }

  // Check if duration value is positive
  if (durationValue <= 0) {
    return { isValid: false, error: 'Duration must be greater than 0' };
  }

  // Calculate actual duration and compare with provided duration
  const actualDuration = calculateDuration(checkInDate, checkOutDate, durationType);

  // Allow a small variance (±1 unit) due to rounding
  if (Math.abs(actualDuration - durationValue) > 1) {
    return {
      isValid: false,
      error: `Duration mismatch: expected ${durationValue} ${durationType.toLowerCase()}, got ${actualDuration}`,
    };
  }

  return { isValid: true };
}

/**
 * Calculate occupancy rate for a room over a period
 */
export function calculateOccupancyRate(
  bookedDays: number,
  totalDaysInPeriod: number
): number {
  if (totalDaysInPeriod === 0) return 0;
  const rate = (bookedDays / totalDaysInPeriod) * 100;
  return Math.round(rate * 100) / 100; // Round to 2 decimal places
}

/**
 * Get status badge color based on payment status
 */
export function getPaymentStatusColor(
  status: 'PENDING' | 'PARTIAL' | 'PAID'
): string {
  switch (status) {
    case 'PAID':
      return 'bg-green-100 text-green-800';
    case 'PARTIAL':
      return 'bg-yellow-100 text-yellow-800';
    case 'PENDING':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Get status badge color based on room status
 */
export function getRoomStatusColor(status: string): string {
  switch (status) {
    case 'AVAILABLE':
      return 'bg-green-100 text-green-800';
    case 'OCCUPIED':
      return 'bg-blue-100 text-blue-800';
    case 'MAINTENANCE':
      return 'bg-red-100 text-red-800';
    case 'BLOCKED':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency: string = 'LKR'): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return formatter.format(amount);
}
