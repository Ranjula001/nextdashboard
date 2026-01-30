-- Sample data for BIMBARA Holiday Home
-- Run this AFTER the main migration and AFTER signing up a user

-- Insert default settings (replace 'your-user-id' with actual user ID from auth.users)
INSERT INTO settings (owner_id, business_name, currency, timezone, check_in_time, check_out_time, tax_rate)
VALUES (auth.uid(), 'BIMBARA Holiday Home', 'LKR', 'Asia/Colombo', '14:00:00', '12:00:00', 0.00)
ON CONFLICT (owner_id) DO NOTHING;

-- Insert 5 rooms (4 AC, 1 Non-AC)
INSERT INTO rooms (owner_id, room_name, room_type, status, hourly_rate, daily_rate, maintenance_notes, is_active) VALUES
(auth.uid(), 'Room 101', 'AC', 'AVAILABLE', 1500.00, 8000.00, NULL, true),
(auth.uid(), 'Room 102', 'AC', 'AVAILABLE', 1500.00, 8000.00, NULL, true),
(auth.uid(), 'Room 103', 'AC', 'AVAILABLE', 1500.00, 8000.00, NULL, true),
(auth.uid(), 'Room 104', 'AC', 'AVAILABLE', 1500.00, 8000.00, NULL, true),
(auth.uid(), 'Room 201', 'NON_AC', 'AVAILABLE', 1000.00, 5000.00, 'Small room', true);

-- Insert sample customers
INSERT INTO customers (owner_id, name, phone_number, email, address, visit_count, notes) VALUES
(auth.uid(), 'John Silva', '+94771234567', 'john@email.com', 'Colombo', 0, 'Regular customer'),
(auth.uid(), 'Mary Fernando', '+94772345678', 'mary@email.com', 'Kandy', 0, 'VIP guest'),
(auth.uid(), 'David Perera', '+94773456789', 'david@email.com', 'Galle', 0, NULL);

-- Insert sample expense categories data
INSERT INTO expenses (owner_id, category, description, amount, expense_date, notes) VALUES
(auth.uid(), 'Electricity', 'Monthly electricity bill', 15000.00, CURRENT_DATE - INTERVAL '1 day', 'CEB bill'),
(auth.uid(), 'Cleaning', 'Room cleaning supplies', 3500.00, CURRENT_DATE - INTERVAL '2 days', 'Detergents and towels'),
(auth.uid(), 'Maintenance', 'AC servicing', 8000.00, CURRENT_DATE - INTERVAL '3 days', 'All AC units serviced');