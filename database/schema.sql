-- Motorwise Used Car CRM: PostgreSQL 15+ schema
-- Authentication identities live in your auth provider (for example auth.users in Supabase).

create extension if not exists pgcrypto;
create schema if not exists crm;
set search_path = crm, public;

create type crm.user_role as enum ('admin', 'manager', 'sales_executive');
create type crm.record_status as enum ('active', 'inactive');
create type crm.lead_priority as enum ('hot', 'warm', 'cold');
create type crm.lead_status as enum ('new', 'contacted', 'interested', 'follow_up', 'test_drive_scheduled', 'test_drive_completed', 'negotiation', 'booking', 'won', 'lost');
create type crm.vehicle_status as enum ('available', 'reserved', 'test_drive', 'booked', 'sold', 'under_inspection', 'under_repair');
create type crm.follow_up_type as enum ('call', 'whatsapp', 'meeting', 'showroom_visit', 'test_drive', 'other');
create type crm.follow_up_status as enum ('pending', 'completed', 'missed', 'rescheduled');
create type crm.test_drive_status as enum ('scheduled', 'completed', 'cancelled', 'no_show', 'rescheduled');
create type crm.deal_status as enum ('negotiation', 'booking_pending', 'booked', 'payment_pending', 'payment_completed', 'delivered', 'cancelled');
create type crm.payment_status as enum ('pending', 'partial', 'paid', 'refunded');

create table crm.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  timezone text not null default 'Asia/Kolkata',
  currency_code char(3) not null default 'INR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table crm.users (
  id uuid primary key, -- reference to auth.users.id
  organization_id uuid not null references crm.organizations(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  role crm.user_role not null default 'sales_executive',
  status crm.record_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, email)
);

-- Configurable lookup sets. System values can be pre-created, and an admin can add custom values.
create table crm.lookup_values (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references crm.organizations(id) on delete cascade,
  set_name text not null check (set_name in ('lead_source', 'lost_reason', 'fuel_type', 'transmission', 'body_type', 'vehicle_colour')),
  value text not null,
  display_order integer not null default 0,
  is_active boolean not null default true,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  unique (organization_id, set_name, value)
);

create table crm.customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references crm.organizations(id) on delete cascade,
  name text not null,
  phone text not null,
  alternate_phone text,
  email text,
  address text,
  city text,
  area text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, phone)
);

create table crm.vehicles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references crm.organizations(id) on delete cascade,
  stock_id text not null,
  registration_number text,
  brand text not null,
  model text not null,
  variant text,
  manufacturing_year smallint check (manufacturing_year between 1900 and 2100),
  registration_year smallint check (registration_year between 1900 and 2100),
  fuel_type text,
  transmission text,
  km_driven integer check (km_driven >= 0),
  owners smallint check (owners >= 0),
  colour text,
  registration_city text,
  insurance_valid_until date,
  asking_price numeric(14,2) check (asking_price >= 0),
  purchase_price numeric(14,2) check (purchase_price >= 0),
  minimum_selling_price numeric(14,2) check (minimum_selling_price >= 0),
  status crm.vehicle_status not null default 'available',
  location text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, stock_id),
  unique nulls not distinct (organization_id, registration_number)
);

create table crm.vehicle_images (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references crm.vehicles(id) on delete cascade,
  storage_path text not null,
  category text check (category in ('front', 'rear', 'left', 'right', 'interior', 'dashboard', 'engine', 'additional')),
  is_primary boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);
create unique index one_primary_vehicle_image on crm.vehicle_images(vehicle_id) where is_primary;

create table crm.leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references crm.organizations(id) on delete cascade,
  lead_number bigint generated always as identity,
  customer_id uuid not null references crm.customers(id) on delete restrict,
  source text,
  assigned_to uuid references crm.users(id) on delete set null,
  priority crm.lead_priority not null default 'warm',
  status crm.lead_status not null default 'new',
  lost_reason text,
  lost_note text,
  preferred_brand text,
  preferred_model text,
  minimum_budget numeric(14,2) check (minimum_budget >= 0),
  maximum_budget numeric(14,2) check (maximum_budget >= minimum_budget),
  fuel_type text,
  transmission text,
  preferred_year smallint check (preferred_year between 1900 and 2100),
  preferred_colour text,
  body_type text,
  next_follow_up_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, lead_number)
);

create table crm.lead_vehicle_interests (
  lead_id uuid not null references crm.leads(id) on delete cascade,
  vehicle_id uuid not null references crm.vehicles(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (lead_id, vehicle_id)
);

create table crm.follow_ups (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references crm.organizations(id) on delete cascade,
  lead_id uuid not null references crm.leads(id) on delete cascade,
  employee_id uuid references crm.users(id) on delete set null,
  due_at timestamptz not null,
  type crm.follow_up_type not null,
  note text,
  reminder_at timestamptz,
  status crm.follow_up_status not null default 'pending',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table crm.test_drives (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references crm.organizations(id) on delete cascade,
  customer_id uuid not null references crm.customers(id) on delete restrict,
  vehicle_id uuid not null references crm.vehicles(id) on delete restrict,
  employee_id uuid references crm.users(id) on delete set null,
  scheduled_at timestamptz not null,
  location text,
  notes text,
  status crm.test_drive_status not null default 'scheduled',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table crm.deals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references crm.organizations(id) on delete cascade,
  customer_id uuid not null references crm.customers(id) on delete restrict,
  vehicle_id uuid not null references crm.vehicles(id) on delete restrict,
  salesperson_id uuid references crm.users(id) on delete set null,
  asking_price numeric(14,2) check (asking_price >= 0),
  negotiated_price numeric(14,2) check (negotiated_price >= 0),
  final_selling_price numeric(14,2) check (final_selling_price >= 0),
  booking_amount numeric(14,2) not null default 0 check (booking_amount >= 0),
  payment_status crm.payment_status not null default 'pending',
  status crm.deal_status not null default 'negotiation',
  deal_date date,
  expected_delivery_date date,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index one_active_deal_per_vehicle on crm.deals(vehicle_id) where status not in ('delivered', 'cancelled');

create table crm.activities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references crm.organizations(id) on delete cascade,
  lead_id uuid references crm.leads(id) on delete cascade,
  customer_id uuid references crm.customers(id) on delete cascade,
  actor_id uuid references crm.users(id) on delete set null,
  action text not null,
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table crm.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references crm.organizations(id) on delete cascade,
  user_id uuid not null references crm.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  resource_type text,
  resource_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index leads_assignee_status_idx on crm.leads(organization_id, assigned_to, status);
create index leads_next_follow_up_idx on crm.leads(organization_id, next_follow_up_at) where next_follow_up_at is not null;
create index customers_phone_idx on crm.customers(organization_id, phone);
create index vehicles_status_idx on crm.vehicles(organization_id, status);
create index follow_ups_due_idx on crm.follow_ups(organization_id, due_at) where status = 'pending';
create index test_drives_schedule_idx on crm.test_drives(organization_id, scheduled_at);
create index deals_status_idx on crm.deals(organization_id, status, deal_date);
create index activities_lead_idx on crm.activities(lead_id, created_at desc);

create or replace function crm.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger organizations_updated before update on crm.organizations for each row execute function crm.touch_updated_at();
create trigger users_updated before update on crm.users for each row execute function crm.touch_updated_at();
create trigger customers_updated before update on crm.customers for each row execute function crm.touch_updated_at();
create trigger vehicles_updated before update on crm.vehicles for each row execute function crm.touch_updated_at();
create trigger leads_updated before update on crm.leads for each row execute function crm.touch_updated_at();
create trigger follow_ups_updated before update on crm.follow_ups for each row execute function crm.touch_updated_at();
create trigger test_drives_updated before update on crm.test_drives for each row execute function crm.touch_updated_at();
create trigger deals_updated before update on crm.deals for each row execute function crm.touch_updated_at();
