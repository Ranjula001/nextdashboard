// Database type definitions for BIMBARA ERP System

// ============================================================================
// ENUMS
// ============================================================================

export type RoomType = 'AC' | 'NON_AC';
export type RoomStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'BLOCKED';
export type DurationType = 'HOURS' | 'DAYS';
export type BookingStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID';
export type PaymentMethod = 'CASH' | 'BANK' | 'DIGITAL';
export type BookingSource = 'WALKIN' | 'PHONE' | 'ONLINE';
export type ExpenseCategory =
  | 'ELECTRICITY'
  | 'WATER'
  | 'CLEANING'
  | 'REPAIRS'
  | 'INTERNET'
  | 'STAFF'
  | 'OTHER';

// ============================================================================
// TABLE TYPES
// ============================================================================

export interface Room {
  id: string;
  owner_id: string;
  room_name: string;
  room_type: RoomType;
  hourly_rate: number;
  daily_rate: number;
  status: RoomStatus;
  maintenance_notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  owner_id: string;
  name: string;
  phone_number: string;
  email: string | null;
  visit_count: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  owner_id: string;
  room_id: string;
  customer_id: string;
  check_in_date: string;
  check_out_date: string;
  duration_type: DurationType;
  duration_value: number;
  room_rate: number;
  subtotal: number;
  advance_paid: number;
  balance: number;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod | null;
  booking_source: BookingSource;
  notes: string | null;
  status: BookingStatus;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  owner_id: string;
  booking_id: string;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  notes: string | null;
  created_at: string;
}

export interface Expense {
  id: string;
  owner_id: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Settings {
  id: string;
  owner_id: string;
  business_name: string;
  currency: string;
  timezone: string;
  default_ac_hourly_rate: number;
  default_ac_daily_rate: number;
  default_nonac_hourly_rate: number;
  default_nonac_daily_rate: number;
  tax_percentage: number | null;
  service_charge_percentage: number | null;
  updated_at: string;
}

// ============================================================================
// FORM/INPUT TYPES
// ============================================================================

export interface CreateRoomInput {
  room_name: string;
  room_type: RoomType;
  hourly_rate: number;
  daily_rate: number;
  maintenance_notes?: string;
}

export interface UpdateRoomInput extends Partial<CreateRoomInput> {
  status?: RoomStatus;
  is_active?: boolean;
}

export interface CreateCustomerInput {
  name: string;
  phone_number: string;
  email?: string;
  notes?: string;
}

export interface UpdateCustomerInput extends Partial<CreateCustomerInput> {
  visit_count?: number;
}

export interface CreateBookingInput {
  room_id: string;
  customer_id: string;
  check_in_date: string;
  check_out_date: string;
  duration_type: DurationType;
  duration_value: number;
  room_rate: number;
  subtotal: number;
  advance_paid: number;
  payment_method?: PaymentMethod;
  booking_source: BookingSource;
  notes?: string;
}

export interface UpdateBookingInput extends Partial<CreateBookingInput> {
  status?: BookingStatus;
}

export interface CreatePaymentInput {
  booking_id: string;
  amount: number;
  payment_method: PaymentMethod;
  notes?: string;
}

export interface CreateExpenseInput {
  category: ExpenseCategory;
  amount: number;
  date: string;
  description?: string;
}

export interface UpdateExpenseInput extends Partial<CreateExpenseInput> {}

export interface UpdateSettingsInput {
  business_name?: string;
  currency?: string;
  timezone?: string;
  default_ac_hourly_rate?: number;
  default_ac_daily_rate?: number;
  default_nonac_hourly_rate?: number;
  default_nonac_daily_rate?: number;
  tax_percentage?: number | null;
  service_charge_percentage?: number | null;
}

// ============================================================================
// VIEW TYPES
// ============================================================================

export interface DailyRevenueView {
  revenue_date: string;
  total_revenue: number;
  booking_count: number;
  rooms_occupied: number;
}

export interface OccupancyView {
  room_id: string;
  room_name: string;
  total_bookings: number;
  total_days_booked: number;
}

export interface CurrentOccupancyStatus {
  id: string;
  room_name: string;
  room_type: RoomType;
  status: RoomStatus;
  current_status: 'OCCUPIED' | 'AVAILABLE';
  current_booking_id: string | null;
}

// ============================================================================
// CALCULATION TYPES
// ============================================================================

export interface PriceCalculation {
  base_price: number;
  tax_amount: number;
  service_charge: number;
  total_price: number;
}

export interface BookingWithRelations extends Booking {
  room?: Room;
  customer?: Customer;
  payments?: Payment[];
}

export interface RoomWithOccupancy extends Room {
  current_booking?: Booking | null;
  is_currently_occupied: boolean;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ============================================================================
// DASHBOARD STATS TYPES
// ============================================================================

export interface DashboardStats {
  occupied_rooms: number;
  available_rooms: number;
  total_rooms: number;
  today_expected_income: number;
  upcoming_checkins: Booking[];
  upcoming_checkouts: Booking[];
  today_bookings: Booking[];
  monthly_revenue: number;
  monthly_expenses: number;
}

export interface MonthlySnapshot {
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
  profit_margin: number;
  total_bookings: number;
  occupancy_rate: number;
}
