<a href="https://demo-nextjs-with-supabase.vercel.app/">
  <img alt="9Tailed ERP - Complete booking and property management system" src="https://demo-nextjs-with-supabase.vercel.app/opengraph-image.png">
  <h1 align="center">BIMBARA Holiday Home ERP</h1>
</a>

<p align="center">
 Complete holiday home booking and property management system built with Next.js and Supabase
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#demo"><strong>Demo</strong></a> ·
  <a href="#deploy-to-vercel"><strong>Deploy to Vercel</strong></a> ·
  <a href="#clone-and-run-locally"><strong>Clone and run locally</strong></a> ·
  <a href="#database-setup"><strong>Database Setup</strong></a> ·
  <a href="#feedback-and-issues"><strong>Feedback and issues</strong></a>
</p>
<br/>

## Features

### 🏠 **Complete Holiday Home Management System**
- **Room Management**: Add, edit, delete rooms with status tracking (Available, Occupied, Maintenance, Out of Order)
- **Booking System**: Full booking lifecycle with real-time availability checking and conflict prevention
- **Customer Management**: Complete customer database with contact information and booking history
- **Financial Management**: Revenue tracking, expense management, and automated billing
- **Real-time Dashboard**: Live occupancy stats, upcoming check-ins/check-outs, and financial metrics
- **Mobile Responsive**: Optimized for all devices - phones, tablets, and desktops

### 🔧 **Technical Features**
- Built on [Next.js 15](https://nextjs.org) with App Router
- [Supabase](https://supabase.com) for authentication and real-time database
- [TypeScript](https://www.typescriptlang.org/) for type safety
- [Tailwind CSS](https://tailwindcss.com) for styling
- [shadcn/ui](https://ui.shadcn.com/) components
- Real-time digital clock with terminal styling
- Advanced room availability checking with date/time overlap detection
- Automatic booking status management (Active → Expired → Cancelled)
- Mobile-first responsive design with hamburger navigation

### 💼 **Business Features**
- **Multi-currency Support**: Configurable currency settings
- **Customizable Branding**: Change business name in settings
- **Advance Payment Tracking**: Partial payment management
- **Automated Calculations**: Real-time profit/loss calculations
- **Status Management**: Room and booking status workflows
- **Conflict Prevention**: Prevents double-booking with smart availability checking

## Demo

You can view a fully working demo at [your-demo-url.vercel.app](https://your-demo-url.vercel.app/).

**Demo Credentials:**
- Email: demo@bimbara.com
- Password: demo123

**Demo Features:**
- Pre-loaded sample rooms and bookings
- Real-time dashboard with live data
- Mobile responsive interface
- Complete booking workflow

## Deploy to Vercel

Vercel deployment will guide you through creating a Supabase account and project.

After installation of the Supabase integration, all relevant environment variables will be assigned to the project so the deployment is fully functioning.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-username%2Fbimbara-erp&project-name=bimbara-holiday-home-erp&repository-name=bimbara-erp&demo-title=BIMBARA+Holiday+Home+ERP&demo-description=Complete+holiday+home+booking+and+property+management+system&demo-url=https%3A%2F%2Fyour-demo-url.vercel.app%2F&demo-image=https%3A%2F%2Fyour-demo-url.vercel.app%2Fopengraph-image.png)

The above will also clone the repository to your GitHub, you can clone that locally and develop locally.

If you wish to just develop locally and not deploy to Vercel, [follow the steps below](#clone-and-run-locally).

## Clone and run locally

1. You'll first need a Supabase project which can be made [via the Supabase dashboard](https://database.new)

2. Clone this repository

   ```bash
   git clone https://github.com/your-username/bimbara-erp.git
   cd bimbara-erp
   ```

3. Install dependencies

   ```bash
   npm install
   ```

   ```bash
   yarn install
   ```

   ```bash
   pnpm install
   ```

4. Rename `.env.example` to `.env.local` and update the following:

  ```env
  NEXT_PUBLIC_SUPABASE_URL=[INSERT SUPABASE PROJECT URL]
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=[INSERT SUPABASE PROJECT API PUBLISHABLE OR ANON KEY]
  ```
  > [!NOTE]
  > This example uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, which refers to Supabase's new **publishable** key format.
  > Both legacy **anon** keys and new **publishable** keys can be used with this variable name during the transition period. Supabase's dashboard may show `NEXT_PUBLIC_SUPABASE_ANON_KEY`; its value can be used in this example.
  > See the [full announcement](https://github.com/orgs/supabase/discussions/29260) for more information.

  Both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` can be found in [your Supabase project's API settings](https://supabase.com/dashboard/project/_?showConnect=true)

5. Set up the database schema (see [Database Setup](#database-setup) section below)

6. You can now run the Next.js local development server:

   ```bash
   npm run dev
   ```

   The application should now be running on [localhost:3000](http://localhost:3000/).

7. Create your first account by visiting `/auth/signup` and then access the dashboard at `/dashboard`

> Check out [the docs for Local Development](https://supabase.com/docs/guides/getting-started/local-development) to also run Supabase locally.

## Database Setup

After setting up your Supabase project, you need to create the required database tables. Run the following SQL commands in your Supabase SQL Editor:

### 1. Enable Row Level Security and Create Tables

```sql
-- Enable RLS
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create settings table
CREATE TABLE settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT DEFAULT 'BIMBARA Holiday Home',
  currency TEXT DEFAULT 'LKR',
  timezone TEXT DEFAULT 'Asia/Colombo',
  default_ac_hourly_rate DECIMAL(10,2) DEFAULT 1500,
  default_ac_daily_rate DECIMAL(10,2) DEFAULT 5000,
  default_nonac_hourly_rate DECIMAL(10,2) DEFAULT 1000,
  default_nonac_daily_rate DECIMAL(10,2) DEFAULT 3500,
  tax_percentage DECIMAL(5,2),
  service_charge_percentage DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rooms table
CREATE TABLE rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  room_name TEXT NOT NULL,
  room_type TEXT CHECK (room_type IN ('AC', 'NON_AC')) NOT NULL,
  status TEXT CHECK (status IN ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'OUT_OF_ORDER')) DEFAULT 'AVAILABLE',
  hourly_rate DECIMAL(10,2),
  daily_rate DECIMAL(10,2),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customers table
CREATE TABLE customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  check_in_date TIMESTAMP WITH TIME ZONE NOT NULL,
  check_out_date TIMESTAMP WITH TIME ZONE NOT NULL,
  booking_type TEXT CHECK (booking_type IN ('HOURLY', 'DAILY')) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  advance_paid DECIMAL(10,2) DEFAULT 0,
  status TEXT CHECK (status IN ('ACTIVE', 'EXPIRED', 'CANCELLED', 'CHECKED_OUT')) DEFAULT 'ACTIVE',
  payment_status TEXT CHECK (payment_status IN ('PENDING', 'PARTIAL', 'PAID')) DEFAULT 'PENDING',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create expenses table
CREATE TABLE expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  expense_date DATE NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Set up Row Level Security Policies

```sql
-- Enable RLS on all tables
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Create policies for settings
CREATE POLICY "Users can view own settings" ON settings FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own settings" ON settings FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own settings" ON settings FOR UPDATE USING (auth.uid() = owner_id);

-- Create policies for rooms
CREATE POLICY "Users can view own rooms" ON rooms FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own rooms" ON rooms FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own rooms" ON rooms FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own rooms" ON rooms FOR DELETE USING (auth.uid() = owner_id);

-- Create policies for customers
CREATE POLICY "Users can view own customers" ON customers FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own customers" ON customers FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own customers" ON customers FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own customers" ON customers FOR DELETE USING (auth.uid() = owner_id);

-- Create policies for bookings
CREATE POLICY "Users can view own bookings" ON bookings FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own bookings" ON bookings FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own bookings" ON bookings FOR DELETE USING (auth.uid() = owner_id);

-- Create policies for expenses
CREATE POLICY "Users can view own expenses" ON expenses FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own expenses" ON expenses FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own expenses" ON expenses FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own expenses" ON expenses FOR DELETE USING (auth.uid() = owner_id);
```

### 3. Create Indexes for Better Performance

```sql
-- Create indexes
CREATE INDEX idx_rooms_owner_id ON rooms(owner_id);
CREATE INDEX idx_customers_owner_id ON customers(owner_id);
CREATE INDEX idx_bookings_owner_id ON bookings(owner_id);
CREATE INDEX idx_bookings_dates ON bookings(check_in_date, check_out_date);
CREATE INDEX idx_expenses_owner_id ON expenses(owner_id);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
```

## Project Structure

```
bimbara-erp/
├── app/
│   ├── auth/                 # Authentication pages
│   ├── dashboard/            # Main application pages
│   │   ├── bookings/        # Booking management
│   │   ├── customers/       # Customer management
│   │   ├── rooms/           # Room management
│   │   ├── expenses/        # Expense tracking
│   │   ├── billing/         # Billing and invoices
│   │   ├── reports/         # Analytics and reports
│   │   └── settings/        # System settings
│   └── globals.css          # Global styles
├── components/
│   ├── dashboard/           # Dashboard-specific components
│   ├── ui/                  # Reusable UI components
│   ├── bookings/           # Booking-related components
│   ├── rooms/              # Room-related components
│   └── customers/          # Customer-related components
├── lib/
│   ├── db/                 # Database functions and types
│   ├── services/           # Business logic services
│   └── utils.ts            # Utility functions
└── public/                 # Static assets
```

## Key Features Explained

### 🏠 Room Management
- **Real-time Status**: Track room availability, occupancy, maintenance
- **Rate Management**: Set different rates for AC/Non-AC rooms
- **Conflict Prevention**: Automatic booking conflict detection

### 📅 Booking System
- **Smart Scheduling**: Prevents double-booking with overlap detection
- **Payment Tracking**: Advance payment and balance management
- **Status Workflow**: Automatic status updates (Active → Expired → Cancelled)

### 💰 Financial Management
- **Revenue Tracking**: Real-time income calculations
- **Expense Management**: Track all business expenses
- **Profit Analysis**: Automated profit/loss calculations

### 📱 Mobile Experience
- **Responsive Design**: Optimized for all screen sizes
- **Touch-friendly**: Large tap targets and smooth interactions
- **Hamburger Navigation**: Collapsible sidebar for mobile

### ⚙️ Customization
- **Business Branding**: Change business name in settings
- **Currency Support**: Multi-currency configuration
- **Rate Settings**: Default hourly and daily rates

## Feedback and issues

Please file feedback and issues over on the [GitHub Issues](https://github.com/your-username/bimbara-erp/issues/new/choose).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you find this project helpful, please consider giving it a ⭐ on GitHub!
