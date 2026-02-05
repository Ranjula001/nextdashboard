// Database type definitions for BIMBARA ERP System - Multi-Tenant SaaS

// ============================================================================
// ENUMS
// ============================================================================

export type RoomType = 'AC' | 'NON_AC';
export type RoomStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'OUT_OF_ORDER';
export type DurationType = 'HOURS' | 'DAYS';
export type BookingStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID';
export type PaymentMethod = 'CASH' | 'BANK' | 'DIGITAL';
export type BookingSource = 'WALKIN' | 'PHONE' | 'ONLINE';
export type UserRole = 'OWNER' | 'MANAGER' | 'STAFF';
export type SubscriptionPlan = 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
export type SubscriptionStatus = 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';
export type ExpenseCategory =
  | 'ELECTRICITY'
  | 'WATER'
  | 'CLEANING'
  | 'REPAIRS'
  | 'INTERNET'
  | 'STAFF'
  | 'OTHER';

// ============================================================================
// ORGANIZATION & USER TYPES
// ============================================================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  business_type: string | null;
  subscription_plan: SubscriptionPlan;
  subscription_status: SubscriptionStatus;
  max_rooms: number;
  max_users: number;
  created_at: string;
  updated_at: string;
}

export interface OrganizationUser {
  id: string;
  organization_id: string;
  user_id: string;
  role: UserRole;
  is_active: boolean;
  invited_by: string | null;
  joined_at: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  current_organization_id: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// MAIN ENTITY TYPES (Multi-Tenant)
// ============================================================================

export interface Room {
  id: string;
  organization_id: string;
  owner_id: string; // Keep for backward compatibility
  room_name: string;
  room_type: RoomType;
  hourly_rate: number;
  daily_rate: number;
  status: RoomStatus;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  organization_id: string;
  owner_id: string; // Keep for backward compatibility
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  organization_id: string;
  owner_id: string; // Keep for backward compatibility
  room_id: string;
  customer_id: string;
  check_in_date: string;
  check_out_date: string;
  booking_type: string;
  status: BookingStatus;
  total_amount: number;
  advance_paid: number;
  payment_status: PaymentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  organization_id: string;
  owner_id: string; // Keep for backward compatibility
  category: string;
  description: string;
  amount: number;
  expense_date: string;
  created_at: string;
  updated_at: string;
}

export interface Settings {
  id: string;
  organization_id: string;
  owner_id: string; // Keep for backward compatibility
  business_name: string;
  currency: string;
  timezone: string;
  default_ac_hourly_rate: number;
  default_ac_daily_rate: number;
  default_nonac_hourly_rate: number;
  default_nonac_daily_rate: number;
  tax_percentage: number | null;
  service_charge_percentage: number | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// FORM/INPUT TYPES
// ============================================================================

export interface CreateOrganizationInput {
  name: string;
  business_type: string;
  subscription_plan: SubscriptionPlan;
}

export interface UpdateOrganizationInput extends Partial<CreateOrganizationInput> {
  subscription_status?: SubscriptionStatus;
  max_rooms?: number;
  max_users?: number;
}

export interface InviteUserInput {
  email: string;
  role: UserRole;
  organization_id: string;
}

export interface CreateRoomInput {
  room_name: string;
  room_type: RoomType;
  hourly_rate: number;
  daily_rate: number;
  description?: string;
}

export interface UpdateRoomInput extends Partial<CreateRoomInput> {
  status?: RoomStatus;
}

export interface CreateCustomerInput {
  name: string;
  phone: string;
  email?: string;
  address?: string;
}

export interface UpdateCustomerInput extends Partial<CreateCustomerInput> {}

export interface CreateBookingInput {
  room_id: string;
  customer_id: string;
  check_in_date: string;
  check_out_date: string;
  duration_type?: 'HOURS' | 'DAYS';
  booking_type?: string;
  subtotal?: number;
  total_amount?: number;
  advance_paid: number;
  payment_method?: string;
  notes?: string;
}

export interface UpdateBookingInput extends Partial<CreateBookingInput> {
  status?: BookingStatus;
  payment_status?: PaymentStatus;
}

export interface CreateExpenseInput {
  category: string;
  description: string;
  amount: number;
  expense_date: string;
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

export interface BookingWithRelations extends Booking {
  room?: Room;
  customer?: Customer;
}

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