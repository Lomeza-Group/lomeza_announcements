
-- =========================================================
-- LOMEZA ANNOUNCEMENTS
-- 001: Core database foundation
-- =========================================================

begin;

-- ---------------------------------------------------------
-- 1. LOCATIONS
-- ---------------------------------------------------------

create table public.locations (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    code text not null unique,
    parent_id uuid references public.locations(id) on delete restrict,
    is_assignable boolean not null default true,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),

    constraint locations_name_not_empty
        check (length(trim(name)) > 0),

    constraint locations_code_not_empty
        check (length(trim(code)) > 0),

    constraint locations_not_own_parent
        check (parent_id is null or parent_id <> id)
);

create index idx_locations_parent_id
    on public.locations(parent_id);

-- ---------------------------------------------------------
-- 2. EMPLOYEES
-- ---------------------------------------------------------

create table public.employees (
    id uuid primary key default gen_random_uuid(),
    employee_number text not null unique,
    full_name text not null,
    company_email text not null,
    location_id uuid not null references public.locations(id),
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint employees_name_not_empty
        check (length(trim(full_name)) > 0),

    constraint employees_number_not_empty
        check (length(trim(employee_number)) > 0),

    constraint employees_email_not_empty
        check (length(trim(company_email)) > 0)
);

create unique index idx_employees_company_email
    on public.employees(lower(company_email));

create index idx_employees_location_id
    on public.employees(location_id);

-- ---------------------------------------------------------
-- 3. EMPLOYEE ACCOUNT PROFILES
-- Links a Supabase Auth account to an employee record.
-- Employee records can exist before an account is created.
-- ---------------------------------------------------------

create table public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    employee_id uuid not null unique
        references public.employees(id) on delete restrict,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index idx_profiles_employee_id
    on public.profiles(employee_id);

-- ---------------------------------------------------------
-- 4. ROLES
-- ---------------------------------------------------------

create table public.roles (
    id uuid primary key default gen_random_uuid(),
    code text not null unique,
    name text not null,
    description text,
    created_at timestamptz not null default now(),

    constraint roles_code_not_empty
        check (length(trim(code)) > 0)
);

-- ---------------------------------------------------------
-- 5. EMPLOYEE ROLE ASSIGNMENTS
-- Roles are global, not location-specific.
-- A publisher can publish to every location.
-- ---------------------------------------------------------

create table public.employee_roles (
    id uuid primary key default gen_random_uuid(),
    employee_id uuid not null
        references public.employees(id) on delete cascade,
    role_id uuid not null
        references public.roles(id) on delete restrict,
    created_at timestamptz not null default now(),

    constraint employee_roles_unique
        unique (employee_id, role_id)
);

create index idx_employee_roles_employee_id
    on public.employee_roles(employee_id);

create index idx_employee_roles_role_id
    on public.employee_roles(role_id);

-- ---------------------------------------------------------
-- 6. SEED LOCATIONS
-- ---------------------------------------------------------

insert into public.locations
    (name, code, parent_id, is_assignable)
values
    ('Head Office', 'HO', null, false),
    ('Kalagadi', 'KAL', null, true),
    ('Sundra', 'SUN', null, true),
    ('Devon', 'DEV', null, true);

insert into public.locations
    (name, code, parent_id, is_assignable)
select
    'Time Square',
    'TMM',
    id,
    true
from public.locations
where code = 'HO';

insert into public.locations
    (name, code, parent_id, is_assignable)
select
    'Princeton',
    'PRN',
    id,
    true
from public.locations
where code = 'HO';

-- ---------------------------------------------------------
-- 7. SEED ROLES
-- ---------------------------------------------------------

insert into public.roles (code, name, description)
values
    (
        'super_administrator',
        'Super Administrator',
        'Full platform access.'
    ),
    (
        'administrator',
        'Administrator',
        'Manages employees, accounts and platform configuration.'
    ),
    (
        'publisher',
        'Publisher',
        'Creates and publishes announcements across all locations.'
    ),
    (
        'employee',
        'Employee',
        'Views announcements and uses available interactions.'
    );

-- ---------------------------------------------------------
-- 8. ENABLE ROW LEVEL SECURITY
-- Policies will be introduced in a later migration.
-- No client access is permitted until policies are added.
-- ---------------------------------------------------------

alter table public.locations enable row level security;
alter table public.employees enable row level security;
alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.employee_roles enable row level security;

commit;
