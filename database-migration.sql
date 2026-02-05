-- Multi-Tenant SaaS Database Migration
-- Run this SQL in your Supabase SQL Editor

-- 1. Create Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  business_type TEXT,
  subscription_plan TEXT CHECK (subscription_plan IN ('BASIC', 'PREMIUM', 'ENTERPRISE')) DEFAULT 'BASIC',
  subscription_status TEXT CHECK (subscription_status IN ('ACTIVE', 'SUSPENDED', 'CANCELLED')) DEFAULT 'ACTIVE',
  max_rooms INTEGER DEFAULT 10,
  max_users INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Organization Users junction table
CREATE TABLE IF NOT EXISTS organization_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('OWNER', 'MANAGER', 'STAFF')) DEFAULT 'STAFF',
  is_active BOOLEAN DEFAULT true,
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- 3. Create User Profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  current_organization_id UUID REFERENCES organizations(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Add organization_id to existing tables
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE settings ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- 5. Create default organization for existing data
INSERT INTO organizations (name, slug, business_type, subscription_plan)
VALUES ('Default Organization', 'default-org', 'Hotel', 'PREMIUM')
ON CONFLICT (slug) DO NOTHING;

-- 6. Get the default organization ID
DO $$
DECLARE
    default_org_id UUID;
BEGIN
    SELECT id INTO default_org_id FROM organizations WHERE slug = 'default-org';
    
    -- Update existing records to use default organization
    UPDATE rooms SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE customers SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE bookings SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE expenses SET organization_id = default_org_id WHERE organization_id IS NULL;
    UPDATE settings SET organization_id = default_org_id WHERE organization_id IS NULL;
END $$;

-- 7. Make organization_id NOT NULL after migration
ALTER TABLE rooms ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE customers ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE bookings ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE expenses ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE settings ALTER COLUMN organization_id SET NOT NULL;

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rooms_organization_id ON rooms(organization_id);
CREATE INDEX IF NOT EXISTS idx_customers_organization_id ON customers(organization_id);
CREATE INDEX IF NOT EXISTS idx_bookings_organization_id ON bookings(organization_id);
CREATE INDEX IF NOT EXISTS idx_expenses_organization_id ON expenses(organization_id);
CREATE INDEX IF NOT EXISTS idx_settings_organization_id ON settings(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_users_org_id ON organization_users(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_users_user_id ON organization_users(user_id);

-- 9. Enable RLS on new tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Helper functions to safely check organization membership and administrative roles. These are SECURITY DEFINER
-- functions so they execute with the owner's privileges and avoid RLS recursion when called from policies.
CREATE OR REPLACE FUNCTION is_user_org_member(p_org_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_users
    WHERE organization_id = p_org_id
      AND user_id = p_user_id
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_user_org_admin(p_org_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_users
    WHERE organization_id = p_org_id
      AND user_id = p_user_id
      AND role IN ('OWNER','MANAGER')
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 10. Create RLS policies for organizations
DROP POLICY IF EXISTS "Users can view organizations they belong to" ON organizations;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy p JOIN pg_class c ON p.polrelid = c.oid
    WHERE c.relname = 'organizations' AND p.polname = 'Users can view organizations they belong to'
  ) THEN
    EXECUTE $pol$CREATE POLICY "Users can view organizations they belong to" ON organizations
      FOR SELECT USING (
        is_user_org_member(id, auth.uid())
      );$pol$;
  END IF;
END;
$$; 

-- Allow authenticated users to create a new organization. The owner/manager membership is created separately.
-- NOTE: Relaxed to allow inserts unconditionally so setup can create orgs even if session propagation is not present.
-- This is a temporary developer-mode policy. Replace with stricter checks (e.g., server-side RPC) for production.
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy p JOIN pg_class c ON p.polrelid = c.oid
    WHERE c.relname = 'organizations' AND p.polname = 'Users can create organizations'
  ) THEN
    EXECUTE $pol$CREATE POLICY "Users can create organizations" ON organizations
      FOR INSERT WITH CHECK (true);$pol$;
  END IF;
END;
$$; 

DROP POLICY IF EXISTS "Organization owners can update their organization" ON organizations;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy p JOIN pg_class c ON p.polrelid = c.oid
    WHERE c.relname = 'organizations' AND p.polname = 'Organization owners can update their organization'
  ) THEN
    EXECUTE $pol$CREATE POLICY "Organization owners can update their organization" ON organizations
      FOR UPDATE USING (
        is_user_org_admin(id, auth.uid())
      );$pol$;
  END IF;
END;
$$; 

-- 11. Create RLS policies for organization_users
-- Restrict organization_users access to the authenticated user only to avoid RLS recursion.
-- Admin-level management of memberships should be implemented via a secure RPC (service role) to avoid policy complexity.
DROP POLICY IF EXISTS "Users can view organization memberships" ON organization_users;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy p JOIN pg_class c ON p.polrelid = c.oid
    WHERE c.relname = 'organization_users' AND p.polname = 'Users can view organization memberships'
  ) THEN
    EXECUTE $pol$CREATE POLICY "Users can view organization memberships" ON organization_users
      FOR SELECT USING (
        user_id = auth.uid()
      );$pol$;
  END IF;
END;
$$; 

DROP POLICY IF EXISTS "Users can create organization memberships" ON organization_users;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy p JOIN pg_class c ON p.polrelid = c.oid
    WHERE c.relname = 'organization_users' AND p.polname = 'Users can create organization memberships'
  ) THEN
    EXECUTE $pol$CREATE POLICY "Users can create organization memberships" ON organization_users
      FOR INSERT WITH CHECK (
        user_id = auth.uid()
      );$pol$;
  END IF;
END;
$$; 

DROP POLICY IF EXISTS "Users can update organization memberships" ON organization_users;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy p JOIN pg_class c ON p.polrelid = c.oid
    WHERE c.relname = 'organization_users' AND p.polname = 'Users can update organization memberships'
  ) THEN
    EXECUTE $pol$CREATE POLICY "Users can update organization memberships" ON organization_users
      FOR UPDATE USING (
        user_id = auth.uid()
      ) WITH CHECK (
        user_id = auth.uid()
      );$pol$;
  END IF;
END;
$$; 

DROP POLICY IF EXISTS "Users can delete organization memberships" ON organization_users;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy p JOIN pg_class c ON p.polrelid = c.oid
    WHERE c.relname = 'organization_users' AND p.polname = 'Users can delete organization memberships'
  ) THEN
    EXECUTE $pol$CREATE POLICY "Users can delete organization memberships" ON organization_users
      FOR DELETE USING (
        user_id = auth.uid()
      );$pol$;
  END IF;
END;
$$; 


-- 12. Create RLS policies for user_profiles
DROP POLICY IF EXISTS "Users can view and update own profile" ON user_profiles;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy p JOIN pg_class c ON p.polrelid = c.oid
    WHERE c.relname = 'user_profiles' AND p.polname = 'Users can view and update own profile'
  ) THEN
    EXECUTE $pol$CREATE POLICY "Users can view and update own profile" ON user_profiles
      FOR ALL USING (user_id = auth.uid());$pol$;
  END IF;
END;
$$;

-- 13. Update existing RLS policies to use organization_id
DROP POLICY IF EXISTS "Users can view own rooms" ON rooms;
DROP POLICY IF EXISTS "Users can insert own rooms" ON rooms;
DROP POLICY IF EXISTS "Users can update own rooms" ON rooms;
DROP POLICY IF EXISTS "Users can delete own rooms" ON rooms;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy p JOIN pg_class c ON p.polrelid = c.oid
    WHERE c.relname = 'rooms' AND p.polname = 'Users can view organization rooms'
  ) THEN
    EXECUTE $pol$CREATE POLICY "Users can view organization rooms" ON rooms
      FOR SELECT USING (
        is_user_org_member(organization_id, auth.uid())
      );$pol$;
  END IF;
END;
$$; 

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy p JOIN pg_class c ON p.polrelid = c.oid
    WHERE c.relname = 'rooms' AND p.polname = 'Users can manage organization rooms'
  ) THEN
    EXECUTE $pol$CREATE POLICY "Users can manage organization rooms" ON rooms
      FOR ALL USING (
        is_user_org_member(organization_id, auth.uid())
      ) WITH CHECK (
        is_user_org_member(organization_id, auth.uid())
      );$pol$;
  END IF;
END;
$$; 

-- Similar policies for other tables
DROP POLICY IF EXISTS "Users can view own customers" ON customers;
DROP POLICY IF EXISTS "Users can insert own customers" ON customers;
DROP POLICY IF EXISTS "Users can update own customers" ON customers;
DROP POLICY IF EXISTS "Users can delete own customers" ON customers;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy p JOIN pg_class c ON p.polrelid = c.oid
    WHERE c.relname = 'customers' AND p.polname = 'Users can manage organization customers'
  ) THEN
    EXECUTE $pol$CREATE POLICY "Users can manage organization customers" ON customers
      FOR ALL USING (
        is_user_org_member(organization_id, auth.uid())
      ) WITH CHECK (
        is_user_org_member(organization_id, auth.uid())
      );$pol$;
  END IF;
END;
$$; 

DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can insert own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can delete own bookings" ON bookings;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy p JOIN pg_class c ON p.polrelid = c.oid
    WHERE c.relname = 'bookings' AND p.polname = 'Users can manage organization bookings'
  ) THEN
    EXECUTE $pol$CREATE POLICY "Users can manage organization bookings" ON bookings
      FOR ALL USING (
        is_user_org_member(organization_id, auth.uid())
      ) WITH CHECK (
        is_user_org_member(organization_id, auth.uid())
      );$pol$;
  END IF;
END;
$$; 

DROP POLICY IF EXISTS "Users can view own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can insert own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can update own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can delete own expenses" ON expenses;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy p JOIN pg_class c ON p.polrelid = c.oid
    WHERE c.relname = 'expenses' AND p.polname = 'Users can manage organization expenses'
  ) THEN
    EXECUTE $pol$CREATE POLICY "Users can manage organization expenses" ON expenses
      FOR ALL USING (
        is_user_org_member(organization_id, auth.uid())
      ) WITH CHECK (
        is_user_org_member(organization_id, auth.uid())
      );$pol$;
  END IF;
END;
$$; 

DROP POLICY IF EXISTS "Users can view own settings" ON settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON settings;
DROP POLICY IF EXISTS "Users can update own settings" ON settings;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy p JOIN pg_class c ON p.polrelid = c.oid
    WHERE c.relname = 'settings' AND p.polname = 'Users can manage organization settings'
  ) THEN
    EXECUTE $pol$CREATE POLICY "Users can manage organization settings" ON settings
      FOR ALL USING (
        is_user_org_member(organization_id, auth.uid())
      ) WITH CHECK (
        is_user_org_member(organization_id, auth.uid())
      );$pol$;
  END IF;
END;
$$; 

-- 14. Helper function to create an organization with owner (SECURITY DEFINER)
--  Create a single, atomic operation to create an organization, add the owner membership,
--  upsert the user's profile current_organization_id and create default settings.
CREATE OR REPLACE FUNCTION create_organization_with_owner(
  p_name TEXT,
  p_slug TEXT,
  p_business_type TEXT,
  p_subscription_plan TEXT,
  p_subscription_status TEXT,
  p_max_rooms INTEGER,
  p_max_users INTEGER,
  p_owner_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_org_id UUID;
BEGIN
  -- Create organization (no RLS required because SECURITY DEFINER)
  INSERT INTO organizations (name, slug, business_type, subscription_plan, subscription_status, max_rooms, max_users)
  VALUES (p_name, p_slug, p_business_type, p_subscription_plan, p_subscription_status, p_max_rooms, p_max_users)
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_org_id;

  -- If organization already existed, grab the id
  IF v_org_id IS NULL THEN
    SELECT id INTO v_org_id FROM organizations WHERE slug = p_slug LIMIT 1;
  END IF;

  -- Create or update organization_users as OWNER
  INSERT INTO organization_users (organization_id, user_id, role, is_active, joined_at, created_at)
  VALUES (v_org_id, p_owner_id, 'OWNER', true, NOW(), NOW())
  ON CONFLICT (organization_id, user_id) DO UPDATE SET role = EXCLUDED.role, is_active = EXCLUDED.is_active;

  -- Upsert user_profiles current organization
  INSERT INTO user_profiles (user_id, current_organization_id, created_at, updated_at)
  VALUES (p_owner_id, v_org_id, NOW(), NOW())
  ON CONFLICT (user_id) DO UPDATE SET current_organization_id = EXCLUDED.current_organization_id, updated_at = NOW();

  -- Create default settings for the organization if not present
  -- Adapt to whatever schema the settings table currently has (organization_id vs owner_id, default rate columns)
  DECLARE
    has_org_col BOOLEAN := EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'settings' AND column_name = 'organization_id'
    );
    has_defaults BOOLEAN := EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'settings' AND column_name = 'default_ac_hourly_rate'
    );
  BEGIN
    IF has_org_col THEN
      IF has_defaults THEN
        IF NOT EXISTS (SELECT 1 FROM settings WHERE organization_id = v_org_id) THEN
          INSERT INTO settings (organization_id, business_name, currency, timezone, default_ac_hourly_rate, default_ac_daily_rate, default_nonac_hourly_rate, default_nonac_daily_rate, created_at, updated_at)
          VALUES (v_org_id, p_name, 'LKR', 'Asia/Colombo', 1500, 5000, 1000, 3500, NOW(), NOW());
        END IF;
      ELSE
        IF NOT EXISTS (SELECT 1 FROM settings WHERE organization_id = v_org_id) THEN
          INSERT INTO settings (organization_id, business_name, currency, timezone, created_at, updated_at)
          VALUES (v_org_id, p_name, 'LKR', 'Asia/Colombo', NOW(), NOW());
        END IF;
      END IF;
    ELSE
      -- Fall back to owner_id-based settings table (older schema)
      IF has_defaults THEN
        IF NOT EXISTS (SELECT 1 FROM settings WHERE owner_id = p_owner_id) THEN
          INSERT INTO settings (owner_id, business_name, currency, timezone, default_ac_hourly_rate, default_ac_daily_rate, default_nonac_hourly_rate, default_nonac_daily_rate, created_at, updated_at)
          VALUES (p_owner_id, p_name, 'LKR', 'Asia/Colombo', 1500, 5000, 1000, 3500, NOW(), NOW());
        END IF;
      ELSE
        IF NOT EXISTS (SELECT 1 FROM settings WHERE owner_id = p_owner_id) THEN
          INSERT INTO settings (owner_id, business_name, currency, timezone, created_at, updated_at)
          VALUES (p_owner_id, p_name, 'LKR', 'Asia/Colombo', NOW(), NOW());
        END IF;
      END IF;
    END IF;
  END;

  RETURN v_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Compatibility wrapper for PostgREST / Supabase RPC which passes named params alphabetically
CREATE OR REPLACE FUNCTION create_organization_with_owner_rpc(
  p_business_type TEXT,
  p_max_rooms INTEGER,
  p_max_users INTEGER,
  p_name TEXT,
  p_owner_id UUID,
  p_slug TEXT,
  p_subscription_plan TEXT,
  p_subscription_status TEXT
)
RETURNS UUID AS $$
BEGIN
  RETURN create_organization_with_owner(
    p_name := p_name,
    p_slug := p_slug,
    p_business_type := p_business_type,
    p_subscription_plan := p_subscription_plan,
    p_subscription_status := p_subscription_status,
    p_max_rooms := p_max_rooms,
    p_max_users := p_max_users,
    p_owner_id := p_owner_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. Create function to get user's current organization
CREATE OR REPLACE FUNCTION get_current_organization_id()
RETURNS UUID AS $$
DECLARE
    org_id UUID;
BEGIN
    SELECT current_organization_id INTO org_id
    FROM user_profiles
    WHERE user_id = auth.uid();
    
    -- If no current org set, get first active organization
    IF org_id IS NULL THEN
        SELECT organization_id INTO org_id
        FROM organization_users
        WHERE user_id = auth.uid() AND is_active = true
        LIMIT 1;
    END IF;
    
    RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 16. Create default settings (SECURITY DEFINER so it can always insert)
CREATE OR REPLACE FUNCTION create_default_settings(
    p_user_id UUID,
    p_org_id UUID DEFAULT NULL
)
RETURNS json AS $$
DECLARE
    v_org_id UUID := p_org_id;
    settings_row RECORD;
BEGIN
    -- If no org provided, try to get user's current organization
    IF v_org_id IS NULL THEN
        SELECT get_current_organization_id() INTO v_org_id;
    END IF;

    -- Check if settings already exist (try both org and owner scopes)
    IF v_org_id IS NOT NULL THEN
        SELECT * INTO settings_row FROM settings WHERE organization_id = v_org_id;
    ELSE
        SELECT * INTO settings_row FROM settings WHERE owner_id = p_user_id;
    END IF;
    
    -- If settings exist, return them
    IF settings_row IS NOT NULL THEN
        RETURN row_to_json(settings_row);
    END IF;

    -- Create default settings, adapting to existing table schema
    -- First try with organization_id if org exists, then owner_id
    IF v_org_id IS NOT NULL THEN
        BEGIN
            INSERT INTO settings (
                organization_id,
                business_name,
                currency,
                timezone,
                default_ac_hourly_rate,
                default_ac_daily_rate,
                default_nonac_hourly_rate,
                default_nonac_daily_rate
            )
            VALUES (
                v_org_id,
                'BIMBARA Holiday Home',
                'LKR',
                'Asia/Colombo',
                1500,
                5000,
                1000,
                3500
            )
            RETURNING * INTO settings_row;
        EXCEPTION WHEN undefined_column THEN
            -- Column doesn't exist, try without defaults
            BEGIN
                INSERT INTO settings (
                    organization_id,
                    business_name,
                    currency,
                    timezone
                )
                VALUES (
                    v_org_id,
                    'BIMBARA Holiday Home',
                    'LKR',
                    'Asia/Colombo'
                )
                RETURNING * INTO settings_row;
            EXCEPTION WHEN OTHERS THEN
                RETURN json_build_object('error', SQLERRM);
            END;
        END;
    ELSE
        -- Fall back to owner_id
        BEGIN
            INSERT INTO settings (
                owner_id,
                business_name,
                currency,
                timezone,
                default_ac_hourly_rate,
                default_ac_daily_rate,
                default_nonac_hourly_rate,
                default_nonac_daily_rate
            )
            VALUES (
                p_user_id,
                'BIMBARA Holiday Home',
                'LKR',
                'Asia/Colombo',
                1500,
                5000,
                1000,
                3500
            )
            RETURNING * INTO settings_row;
        EXCEPTION WHEN undefined_column THEN
            BEGIN
                INSERT INTO settings (
                    owner_id,
                    business_name,
                    currency,
                    timezone
                )
                VALUES (
                    p_user_id,
                    'BIMBARA Holiday Home',
                    'LKR',
                    'Asia/Colombo'
                )
                RETURNING * INTO settings_row;
            EXCEPTION WHEN OTHERS THEN
                RETURN json_build_object('error', SQLERRM);
            END;
        END;
    END IF;

    IF settings_row IS NULL THEN
        RETURN json_build_object('error', 'Failed to create settings');
    END IF;

    RETURN row_to_json(settings_row);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;