-- ============================================================================
-- CRITICAL FIX: Enable Row Level Security on ALL data tables
-- This script fixes the multi-tenancy data isolation issue
-- ============================================================================

-- ============================================================================
-- STEP 1: Enable RLS on all data tables
-- ============================================================================

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: Drop old policies that relied on owner_id (single-tenant approach)
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own rooms" ON rooms;
DROP POLICY IF EXISTS "Users can insert own rooms" ON rooms;
DROP POLICY IF EXISTS "Users can update own rooms" ON rooms;
DROP POLICY IF EXISTS "Users can delete own rooms" ON rooms;

DROP POLICY IF EXISTS "Users can view own customers" ON customers;
DROP POLICY IF EXISTS "Users can insert own customers" ON customers;
DROP POLICY IF EXISTS "Users can update own customers" ON customers;
DROP POLICY IF EXISTS "Users can delete own customers" ON customers;

DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can insert own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can delete own bookings" ON bookings;

DROP POLICY IF EXISTS "Users can view own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can insert own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can update own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can delete own expenses" ON expenses;

DROP POLICY IF EXISTS "Users can view own settings" ON settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON settings;
DROP POLICY IF EXISTS "Users can update own settings" ON settings;

DROP POLICY IF EXISTS "Users can manage organization rooms" ON rooms;
DROP POLICY IF EXISTS "Users can view organization rooms" ON rooms;
DROP POLICY IF EXISTS "Users can manage organization customers" ON customers;
DROP POLICY IF EXISTS "Users can manage organization bookings" ON bookings;
DROP POLICY IF EXISTS "Users can manage organization expenses" ON expenses;
DROP POLICY IF EXISTS "Users can manage organization settings" ON settings;

-- ============================================================================
-- STEP 3: Create comprehensive multi-tenant RLS policies
-- ============================================================================

-- ROOMS: User can only access rooms in their organization
CREATE POLICY "rooms_select_policy" ON rooms
  FOR SELECT
  USING (
    is_user_org_member(organization_id, auth.uid())
  );

CREATE POLICY "rooms_insert_policy" ON rooms
  FOR INSERT
  WITH CHECK (
    is_user_org_member(organization_id, auth.uid())
  );

CREATE POLICY "rooms_update_policy" ON rooms
  FOR UPDATE
  USING (
    is_user_org_member(organization_id, auth.uid())
  )
  WITH CHECK (
    is_user_org_member(organization_id, auth.uid())
  );

CREATE POLICY "rooms_delete_policy" ON rooms
  FOR DELETE
  USING (
    is_user_org_member(organization_id, auth.uid())
  );

-- CUSTOMERS: User can only access customers in their organization
CREATE POLICY "customers_select_policy" ON customers
  FOR SELECT
  USING (
    is_user_org_member(organization_id, auth.uid())
  );

CREATE POLICY "customers_insert_policy" ON customers
  FOR INSERT
  WITH CHECK (
    is_user_org_member(organization_id, auth.uid())
  );

CREATE POLICY "customers_update_policy" ON customers
  FOR UPDATE
  USING (
    is_user_org_member(organization_id, auth.uid())
  )
  WITH CHECK (
    is_user_org_member(organization_id, auth.uid())
  );

CREATE POLICY "customers_delete_policy" ON customers
  FOR DELETE
  USING (
    is_user_org_member(organization_id, auth.uid())
  );

-- BOOKINGS: User can only access bookings in their organization
CREATE POLICY "bookings_select_policy" ON bookings
  FOR SELECT
  USING (
    is_user_org_member(organization_id, auth.uid())
  );

CREATE POLICY "bookings_insert_policy" ON bookings
  FOR INSERT
  WITH CHECK (
    is_user_org_member(organization_id, auth.uid())
  );

CREATE POLICY "bookings_update_policy" ON bookings
  FOR UPDATE
  USING (
    is_user_org_member(organization_id, auth.uid())
  )
  WITH CHECK (
    is_user_org_member(organization_id, auth.uid())
  );

CREATE POLICY "bookings_delete_policy" ON bookings
  FOR DELETE
  USING (
    is_user_org_member(organization_id, auth.uid())
  );

-- EXPENSES: User can only access expenses in their organization
CREATE POLICY "expenses_select_policy" ON expenses
  FOR SELECT
  USING (
    is_user_org_member(organization_id, auth.uid())
  );

CREATE POLICY "expenses_insert_policy" ON expenses
  FOR INSERT
  WITH CHECK (
    is_user_org_member(organization_id, auth.uid())
  );

CREATE POLICY "expenses_update_policy" ON expenses
  FOR UPDATE
  USING (
    is_user_org_member(organization_id, auth.uid())
  )
  WITH CHECK (
    is_user_org_member(organization_id, auth.uid())
  );

CREATE POLICY "expenses_delete_policy" ON expenses
  FOR DELETE
  USING (
    is_user_org_member(organization_id, auth.uid())
  );

-- SETTINGS: User can only access settings for their organization
CREATE POLICY "settings_select_policy" ON settings
  FOR SELECT
  USING (
    is_user_org_member(organization_id, auth.uid())
  );

CREATE POLICY "settings_insert_policy" ON settings
  FOR INSERT
  WITH CHECK (
    is_user_org_member(organization_id, auth.uid())
  );

CREATE POLICY "settings_update_policy" ON settings
  FOR UPDATE
  USING (
    is_user_org_member(organization_id, auth.uid())
  )
  WITH CHECK (
    is_user_org_member(organization_id, auth.uid())
  );

-- ============================================================================
-- STEP 4: Add database constraints to prevent organization_id null values
-- ============================================================================

ALTER TABLE rooms
  ADD CONSTRAINT check_rooms_org_not_null CHECK (organization_id IS NOT NULL);

ALTER TABLE customers
  ADD CONSTRAINT check_customers_org_not_null CHECK (organization_id IS NOT NULL);

ALTER TABLE bookings
  ADD CONSTRAINT check_bookings_org_not_null CHECK (organization_id IS NOT NULL);

ALTER TABLE expenses
  ADD CONSTRAINT check_expenses_org_not_null CHECK (organization_id IS NOT NULL);

ALTER TABLE settings
  ADD CONSTRAINT check_settings_org_not_null CHECK (organization_id IS NOT NULL);

-- ============================================================================
-- STEP 5: Add foreign key constraints
-- ============================================================================

ALTER TABLE rooms
  ADD CONSTRAINT fk_rooms_organization FOREIGN KEY (organization_id)
    REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE customers
  ADD CONSTRAINT fk_customers_organization FOREIGN KEY (organization_id)
    REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE bookings
  ADD CONSTRAINT fk_bookings_organization FOREIGN KEY (organization_id)
    REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE expenses
  ADD CONSTRAINT fk_expenses_organization FOREIGN KEY (organization_id)
    REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE settings
  ADD CONSTRAINT fk_settings_organization FOREIGN KEY (organization_id)
    REFERENCES organizations(id) ON DELETE CASCADE;

-- ============================================================================
-- STEP 6: Create audit trigger to validate organization_id on inserts
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_organization_context()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure organization_id is set
  IF NEW.organization_id IS NULL THEN
    RAISE EXCEPTION 'organization_id cannot be NULL';
  END IF;
  
  -- Ensure user belongs to the organization
  IF NOT is_user_org_member(NEW.organization_id, auth.uid()) THEN
    RAISE EXCEPTION 'User does not belong to organization %', NEW.organization_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply validation triggers
CREATE TRIGGER rooms_validate_org
  BEFORE INSERT OR UPDATE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION validate_organization_context();

CREATE TRIGGER customers_validate_org
  BEFORE INSERT OR UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION validate_organization_context();

CREATE TRIGGER bookings_validate_org
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION validate_organization_context();

CREATE TRIGGER expenses_validate_org
  BEFORE INSERT OR UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION validate_organization_context();

CREATE TRIGGER settings_validate_org
  BEFORE INSERT OR UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION validate_organization_context();

-- ============================================================================
-- STEP 7: Create view for easier querying with security context
-- ============================================================================

CREATE OR REPLACE VIEW user_accessible_orgs AS
  SELECT DISTINCT organizations.*
  FROM organizations
  INNER JOIN organization_users ON organizations.id = organization_users.organization_id
  WHERE organization_users.user_id = auth.uid()
    AND organization_users.is_active = true;

-- ============================================================================
-- VERIFICATION QUERIES (Run these to test)
-- ============================================================================

-- Test 1: Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('rooms', 'customers', 'bookings', 'expenses', 'settings')
  AND schemaname = 'public'
ORDER BY tablename;

-- Test 2: Verify policies exist
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename IN ('rooms', 'customers', 'bookings', 'expenses', 'settings')
  AND schemaname = 'public'
ORDER BY tablename, policyname;

-- Test 3: Verify user is in organization_users
SELECT organization_id, user_id, role, is_active
FROM organization_users
WHERE user_id = auth.uid();
