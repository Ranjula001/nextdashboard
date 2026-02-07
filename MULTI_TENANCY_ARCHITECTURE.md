# 🏗️ Multi-Tenancy Security Architecture

## The Problem (Before Fix)

```
┌──────────────────────────────────┐
│   User A Login → Session Token   │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│   Server Function                │
│   ❌ No org filtering             │
│   SELECT * FROM rooms;           │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│   Database (NO RLS)              │
│   ❌ Returns ALL rooms           │
│   (from all organizations)       │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│   User A See ALL Rooms           │
│   ❌ Including User B's rooms!    │
└──────────────────────────────────┘

🚨 DATA LEAK: User A sees User B's data!
```

---

## The Solution (After Fix)

```
┌──────────────────────────────────────────┐
│   User A Login → Session Token (JWT)     │
└──────────────┬─────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│   Server Function                        │
│   ✅ Validates JWT                       │
│   ✅ Gets current organization (Org A)   │
│   SELECT * FROM rooms WHERE              │
│     organization_id = 'org-a-uuid'       │
└──────────────┬──────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│   RLS Engine (PostgreSQL)                │
│   ✅ RLS ENABLED = true                  │
│   ✅ Policy: is_user_org_member()        │
│   ✅ Filter by organization_id           │
│   ✅ Check auth.uid() in org_users       │
└──────────────┬──────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│   Database Returns                       │
│   ✅ ONLY Org A's rooms                  │
│   ✅ User B's rooms blocked by RLS       │
└──────────────┬──────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│   User A Sees                            │
│   ✅ Only their own business data        │
│   ✅ Org B data is completely blocked    │
└──────────────────────────────────────────┘

✅ SECURE: Multi-layer protection!
```

---

## Multi-Layer Security (Defense in Depth)

```
╔════════════════════════════════════════╗
║         APPLICATION LAYER              ║
║  ✅ UI shows only current org data    ║
║  ✅ Forms validate org membership     ║
╚════════════════════════════╤═══════════╝
                             │
╔════════════════════════════▼═══════════╗
║      SERVER VALIDATION LAYER           ║
║  ✅ getUserCurrentOrganization()       ║
║  ✅ verifyUserOrganizationMembership() ║
║  ✅ All queries filtered by org_id    ║
║  ✅ Prevents null org_id              ║
╚════════════════════════════╤═══════════╝
                             │
╔════════════════════════════▼═══════════╗
║        DATABASE RLS LAYER              ║
║  ✅ RLS ENABLED = true               ║
║  ✅ RLS Policies check:              ║
║     - is_user_org_member()           ║
║     - is_user_org_admin()            ║
║  ✅ Validation Triggers              ║
║  ✅ Foreign Key Constraints          ║
║  ✅ NOT NULL Checks                  ║
╚════════════════════════════╤═══════════╝
                             │
╔════════════════════════════▼═══════════╗
║         DATABASE TABLES                ║
║  ✅ rooms (organization_id required)  ║
║  ✅ customers (organization_id req)   ║
║  ✅ bookings (organization_id req)    ║
║  ✅ expenses (organization_id req)    ║
║  ✅ settings (organization_id req)    ║
╚════════════════════════════════════════╝

Even if one layer fails, others protect data!
```

---

## RLS Policy Flow

```
User tries to SELECT from rooms table:

1️⃣  SQL arrives at PostgreSQL
2️⃣  RLS Check: is table RLS enabled?
    ✅ YES (ALTER TABLE rooms ENABLE RLS;)
3️⃣  Apply SELECT policy: "rooms_select_policy"
4️⃣  Policy condition: is_user_org_member(organization_id, auth.uid())
5️⃣  Function checks:
    - Does auth.uid() belong to this org?
    - SELECT FROM organization_users
    - WHERE organization_id = 'org-uuid'
    - AND user_id = auth.uid()
    - AND is_active = true
6️⃣  Result:
    ✅ If TRUE:  Row is visible to user
    ❌ If FALSE: Row is hidden from user

All of this happens BEFORE your code receives data!
```

---

## Query Execution Comparison

### Before (Vulnerable)
```typescript
// ❌ BAD: No org filtering
async function getRooms() {
  const { data } = await supabase
    .from('rooms')
    .select('*');  // Gets ALL rooms from ALL orgs!
  return data;
}

// Result: User sees all business data 🚨
```

### After (Secure)
```typescript
// ✅ GOOD: Org filtering + RLS
async function getRooms() {
  const orgId = await getUserCurrentOrganization();  // Validates auth
  const { data } = await supabase
    .from('rooms')
    .select('*')
    .eq('organization_id', orgId);  // Server-side filter
  return data;
  
  // PLUS: Database RLS double-checks
  // Even if this line was omitted, RLS would block it!
}

// Result: User sees only their org data ✅
```

---

## RLS Policies Breakdown

### SELECT Policy
```sql
CREATE POLICY "rooms_select_policy" ON rooms
  FOR SELECT
  USING (
    is_user_org_member(organization_id, auth.uid())
  );
  
-- Meaning: A user can only SELECT rows where they're a member
--          of the organization_id
```

### INSERT Policy
```sql
CREATE POLICY "rooms_insert_policy" ON rooms
  FOR INSERT
  WITH CHECK (
    is_user_org_member(organization_id, auth.uid())
  );
  
-- Meaning: A user can only INSERT if they're a member of
--          the specified organization_id
```

### UPDATE Policy
```sql
CREATE POLICY "rooms_update_policy" ON rooms
  FOR UPDATE
  USING (
    is_user_org_member(organization_id, auth.uid())
  )
  WITH CHECK (
    is_user_org_member(organization_id, auth.uid())
  );
  
-- Meaning: Can only UPDATE rows in their organization
--          And cannot change the organization_id
```

### DELETE Policy
```sql
CREATE POLICY "rooms_delete_policy" ON rooms
  FOR DELETE
  USING (
    is_user_org_member(organization_id, auth.uid())
  );
  
-- Meaning: Can only DELETE rows in their organization
```

---

## Org Membership Check

```
When user A tries to access room X:

1️⃣  Extract organization_id from room X
    room.organization_id = "org-uuid-123"

2️⃣  Extract user from auth token
    auth.uid() = "user-uuid-456"

3️⃣  Call is_user_org_member("org-uuid-123", "user-uuid-456")
    ↓
    SELECT 1 FROM organization_users
    WHERE organization_id = "org-uuid-123"
      AND user_id = "user-uuid-456"
      AND is_active = true
      AND role IN ('OWNER', 'MANAGER', 'STAFF')
    ↓
4️⃣  Return TRUE  ✅ Row visible to user
    Return FALSE ❌ Row hidden from user
```

---

## Table Constraints

```
CREATE TABLE rooms (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,  ← REQUIRED
  room_name TEXT NOT NULL,
  hourly_rate DECIMAL,
  ...
  
  -- Constraint 1: Can't be NULL
  CONSTRAINT check_rooms_org_not_null 
    CHECK (organization_id IS NOT NULL),
  
  -- Constraint 2: Must reference valid org
  CONSTRAINT fk_rooms_organization 
    FOREIGN KEY (organization_id)
    REFERENCES organizations(id) 
    ON DELETE CASCADE
);

INSERT INTO rooms (room_name, hourly_rate)  -- Missing org_id
VALUES ('Room 1', 1500);
❌ ERROR: NOT NULL constraint violation

INSERT INTO rooms (organization_id, room_name, hourly_rate)
VALUES ('invalid-uuid', 'Room 1', 1500);
❌ ERROR: Foreign key constraint violation

INSERT INTO rooms (organization_id, room_name, hourly_rate)
VALUES ('org-123', 'Room 1', 1500);
✅ SUCCESS: Constraint satisfied
```

---

## Validation Trigger

```
CREATE FUNCTION validate_organization_context()
RETURNS TRIGGER AS $$
BEGIN
  -- Check 1: organization_id not null
  IF NEW.organization_id IS NULL THEN
    RAISE EXCEPTION 'organization_id cannot be NULL';
  END IF;
  
  -- Check 2: user is member of organization
  IF NOT is_user_org_member(NEW.organization_id, auth.uid()) THEN
    RAISE EXCEPTION 'User does not belong to organization %';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rooms_validate_org
  BEFORE INSERT OR UPDATE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION validate_organization_context();

-- This trigger ensures:
-- 1. Room always belongs to an organization
-- 2. User inserting room is in that organization
-- 3. Cannot accidentally create rooms for wrong org
```

---

## Multiple Organizations (User Can Own Multiple)

```
┌─────────────────────────────┐
│    User A (Email: a@ex)     │
└──────────┬──────────────────┘
           │
           ├─────────────────────────────┐
           │                             │
    ┌──────▼─────────┐        ┌─────────▼──────┐
    │  Organization  │        │  Organization  │
    │  Hotel King    │        │ Resort Paradise│
    │  (Org UUID-1)  │        │ (Org UUID-2)   │
    └──────┬─────────┘        └────────┬───────┘
           │                          │
      ┌────┴────┐              ┌──────┴──────┐
      │          │              │             │
    Rooms  Customers        Rooms      Customers
```

**Data Isolation:**
- User A SELECT rooms → See Org-1 & Org-2 rooms? NO
- User A has `current_organization_id` set to Org-1
- Queries filter by current org
- User A can switch org by changing `current_organization_id`
- Each org data is 100% isolated

```sql
-- User A's current org
SELECT current_organization_id FROM user_profiles
WHERE user_id = 'user-a-uuid';
-- Returns: 'org-uuid-1'

-- User A switches to second org
UPDATE user_profiles 
SET current_organization_id = 'org-uuid-2'
WHERE user_id = 'user-a-uuid';

-- Now queries return org-2 data
SELECT * FROM rooms WHERE organization_id = get_current_organization_id();
-- Now returns rooms from Org 2
```

---

## Summary

| Layer | Protection | Example |
|-------|-----------|---------|
| **Application** | UI isolation | Only show current org dropdown |
| **Server** | Input validation | `getUserCurrentOrganization()` |
| **Server** | Query filtering | `.eq('organization_id', orgId)` |
| **Database RLS** | Automatic row filtering | Policy checks membership |
| **Database Constraints** | Data integrity | `NOT NULL`, Foreign Keys |
| **Database Triggers** | Additional checks | Validate org_id + membership |

**Result:** Even if one layer fails, others protect your data ✅

---

*This architecture ensures enterprise-grade multi-tenancy security.*
