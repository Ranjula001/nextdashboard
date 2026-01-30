-- BIMBARA Holiday Home ERP System - Database Schema
-- Run this migration in your Supabase SQL editor

-- ============================================================================
-- 1. CREATE ENUMS
-- ============================================================================

CREATE TYPE room_type_enum AS ENUM ('AC', 'NON_AC');
CREATE TYPE room_status_enum AS ENUM ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'BLOCKED');
CREATE TYPE duration_type_enum AS ENUM ('HOURS', 'DAYS');
CREATE TYPE booking_status_enum AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');
CREATE TYPE payment_status_enum AS ENUM ('PENDING', 'PARTIAL', 'PAID');
CREATE TYPE payment_method_enum AS ENUM ('CASH', 'BANK', 'DIGITAL');
CREATE TYPE booking_source_enum AS ENUM ('WALKIN', 'PHONE', 'ONLINE');
CREATE TYPE expense_category_enum AS ENUM ('ELECTRICITY', 'WATER', 'CLEANING', 'REPAIRS', 'INTERNET', 'STAFF', 'OTHER');

-- ============================================================================
-- 2. CREATE TABLES
-- ============================================================================

-- Rooms Table
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  room_name TEXT NOT NULL,
  room_type room_type_enum NOT NULL,
  hourly_rate DECIMAL(10, 2) NOT NULL,
  daily_rate DECIMAL(10, 2) NOT NULL,
  status room_status_enum NOT NULL DEFAULT 'AVAILABLE',
  maintenance_notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(owner_id, room_name)
);

-- Customers Table
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT,
  visit_count INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Bookings Table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  check_in_date TIMESTAMP WITH TIME ZONE NOT NULL,
  check_out_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_type duration_type_enum NOT NULL,
  duration_value INTEGER NOT NULL,
  room_rate DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  advance_paid DECIMAL(10, 2) DEFAULT 0,
  balance DECIMAL(10, 2) NOT NULL,
  payment_status payment_status_enum NOT NULL DEFAULT 'PENDING',
  payment_method payment_method_enum,
  booking_source booking_source_enum NOT NULL DEFAULT 'WALKIN',
  notes TEXT,
  status booking_status_enum NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Payments Table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  payment_method payment_method_enum NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Expenses Table
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category expense_category_enum NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Settings Table
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL DEFAULT 'BIMBARA Holiday Home',
  currency TEXT NOT NULL DEFAULT 'LKR',
  timezone TEXT NOT NULL DEFAULT 'Asia/Colombo',
  default_ac_hourly_rate DECIMAL(10, 2) NOT NULL DEFAULT 1500,
  default_ac_daily_rate DECIMAL(10, 2) NOT NULL DEFAULT 5000,
  default_nonac_hourly_rate DECIMAL(10, 2) NOT NULL DEFAULT 1000,
  default_nonac_daily_rate DECIMAL(10, 2) NOT NULL DEFAULT 3500,
  tax_percentage DECIMAL(5, 2),
  service_charge_percentage DECIMAL(5, 2),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================================================
-- 3. CREATE INDEXES
-- ============================================================================

-- Booking indexes for fast range queries
CREATE INDEX idx_bookings_room_dates ON bookings(room_id, check_in_date, check_out_date);
CREATE INDEX idx_bookings_owner_id ON bookings(owner_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_payment_status ON bookings(payment_status);

-- Rooms indexes
CREATE INDEX idx_rooms_owner_id ON rooms(owner_id);
CREATE INDEX idx_rooms_status ON rooms(status);

-- Customers indexes
CREATE INDEX idx_customers_owner_id ON customers(owner_id);
CREATE INDEX idx_customers_phone ON customers(phone_number);

-- Payments indexes
CREATE INDEX idx_payments_booking_id ON payments(booking_id);
CREATE INDEX idx_payments_owner_id ON payments(owner_id);

-- Expenses indexes
CREATE INDEX idx_expenses_owner_id ON expenses(owner_id);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_category ON expenses(category);

-- ============================================================================
-- 4. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. CREATE RLS POLICIES
-- ============================================================================

-- ROOMS RLS Policies
CREATE POLICY "Users can only view their own rooms" ON rooms
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can only insert rooms for themselves" ON rooms
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can only update their own rooms" ON rooms
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can only delete their own rooms" ON rooms
  FOR DELETE USING (auth.uid() = owner_id);

-- CUSTOMERS RLS Policies
CREATE POLICY "Users can only view their own customers" ON customers
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can only insert customers for themselves" ON customers
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can only update their own customers" ON customers
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can only delete their own customers" ON customers
  FOR DELETE USING (auth.uid() = owner_id);

-- BOOKINGS RLS Policies
CREATE POLICY "Users can only view their own bookings" ON bookings
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can only insert bookings for themselves" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can only update their own bookings" ON bookings
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can only delete their own bookings" ON bookings
  FOR DELETE USING (auth.uid() = owner_id);

-- PAYMENTS RLS Policies
CREATE POLICY "Users can only view their own payments" ON payments
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can only insert payments for themselves" ON payments
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can only update their own payments" ON payments
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can only delete their own payments" ON payments
  FOR DELETE USING (auth.uid() = owner_id);

-- EXPENSES RLS Policies
CREATE POLICY "Users can only view their own expenses" ON expenses
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can only insert expenses for themselves" ON expenses
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can only update their own expenses" ON expenses
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can only delete their own expenses" ON expenses
  FOR DELETE USING (auth.uid() = owner_id);

-- SETTINGS RLS Policies
CREATE POLICY "Users can only view their own settings" ON settings
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can only insert their own settings" ON settings
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can only update their own settings" ON settings
  FOR UPDATE USING (auth.uid() = owner_id);

-- ============================================================================
-- 6. CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate booking price based on room type, duration, and rates
CREATE OR REPLACE FUNCTION calculate_booking_price(
  p_duration_type duration_type_enum,
  p_duration_value INTEGER,
  p_room_rate DECIMAL,
  p_tax_percentage DECIMAL DEFAULT NULL,
  p_service_charge_percentage DECIMAL DEFAULT NULL
)
RETURNS TABLE (
  base_price DECIMAL,
  tax_amount DECIMAL,
  service_charge DECIMAL,
  total_price DECIMAL
) AS $$
BEGIN
  -- Calculate base price
  RETURN QUERY
  SELECT
    (p_room_rate * p_duration_value)::DECIMAL as base_price,
    CASE
      WHEN p_tax_percentage IS NOT NULL THEN
        ((p_room_rate * p_duration_value) * (p_tax_percentage / 100))::DECIMAL
      ELSE 0
    END as tax_amount,
    CASE
      WHEN p_service_charge_percentage IS NOT NULL THEN
        ((p_room_rate * p_duration_value) * (p_service_charge_percentage / 100))::DECIMAL
      ELSE 0
    END as service_charge,
    (
      (p_room_rate * p_duration_value) +
      CASE WHEN p_tax_percentage IS NOT NULL THEN
        ((p_room_rate * p_duration_value) * (p_tax_percentage / 100))
      ELSE 0 END +
      CASE WHEN p_service_charge_percentage IS NOT NULL THEN
        ((p_room_rate * p_duration_value) * (p_service_charge_percentage / 100))
      ELSE 0 END
    )::DECIMAL as total_price;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to check room availability
CREATE OR REPLACE FUNCTION is_room_available(
  p_room_id UUID,
  p_check_in TIMESTAMP WITH TIME ZONE,
  p_check_out TIMESTAMP WITH TIME ZONE,
  p_exclude_booking_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_conflict_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_conflict_count
  FROM bookings
  WHERE
    room_id = p_room_id
    AND status = 'ACTIVE'
    AND (
      (check_in_date < p_check_out AND check_out_date > p_check_in)
    )
    AND (p_exclude_booking_id IS NULL OR id != p_exclude_booking_id);
  
  RETURN v_conflict_count = 0;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to update payment status based on advance_paid
CREATE OR REPLACE FUNCTION update_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.advance_paid >= NEW.subtotal THEN
    NEW.payment_status := 'PAID';
  ELSIF NEW.advance_paid > 0 THEN
    NEW.payment_status := 'PARTIAL';
  ELSE
    NEW.payment_status := 'PENDING';
  END IF;
  
  -- Update balance
  NEW.balance := NEW.subtotal - NEW.advance_paid;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update payment status
CREATE TRIGGER trigger_update_payment_status
BEFORE INSERT OR UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_payment_status();

-- ============================================================================
-- 7. CREATE VIEWS
-- ============================================================================

-- Daily Revenue View
CREATE OR REPLACE VIEW daily_revenue_view AS
SELECT
  CAST(b.check_in_date AS DATE) as revenue_date,
  SUM(b.subtotal) as total_revenue,
  COUNT(b.id) as booking_count,
  COUNT(DISTINCT b.room_id) as rooms_occupied
FROM bookings b
WHERE b.status IN ('ACTIVE', 'COMPLETED')
GROUP BY CAST(b.check_in_date AS DATE)
ORDER BY revenue_date DESC;

-- Occupancy View
CREATE OR REPLACE VIEW occupancy_view AS
SELECT
  b.room_id,
  r.room_name,
  COUNT(b.id) as total_bookings,
  SUM(EXTRACT(DAY FROM (b.check_out_date - b.check_in_date))) as total_days_booked
FROM bookings b
JOIN rooms r ON b.room_id = r.id
WHERE b.status IN ('ACTIVE', 'COMPLETED')
GROUP BY b.room_id, r.room_name
ORDER BY total_days_booked DESC;

-- Current Occupancy Status
CREATE OR REPLACE VIEW current_occupancy_status AS
SELECT
  r.id,
  r.room_name,
  r.room_type,
  r.status,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.room_id = r.id
        AND b.status = 'ACTIVE'
        AND NOW() BETWEEN b.check_in_date AND b.check_out_date
    ) THEN 'OCCUPIED'
    ELSE 'AVAILABLE'
  END as current_status,
  (
    SELECT b.id FROM bookings b
    WHERE b.room_id = r.id
      AND b.status = 'ACTIVE'
      AND NOW() BETWEEN b.check_in_date AND b.check_out_date
    LIMIT 1
  ) as current_booking_id
FROM rooms r
ORDER BY r.room_name;
