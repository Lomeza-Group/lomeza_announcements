
-- ============================================================
-- LOMEZA ANNOUNCEMENTS
-- Migration: 001_initial_schema.sql
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- ENUMS
-- ------------------------------------------------------------

create type public.announcement_status as enum (
  'draft',
  'scheduled',
  'published',
  'rejected',
  'archived'
);

create type public.announcement_priority as enum (
  'low',
  'normal',
  'high',
  'urgent'
);

create type public.announcement_target_type as enum (
  'company',
  'site',
  'department',
  'role'
);

create type public.announcement_channel_type as enum (
  'portal',
  'email',
  'signage'
);


create type public.delivery_status as enum (
  'pending',
  'sent',
  'delivered',
  'failed'
);

-- ------------------------------------------------------------
-- 1. ORGANISATION
-- ------------------------------------------------------------

create table public.sites (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  address text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  site_id uuid references public.sites(id) on delete restrict,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (name, site_id)
);

create table public.employees (
  id uuid primary key default gen_random_uuid(),
  employee_number text unique,
  full_name text not null,
  company_email text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.employee_assignments (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id),
  site_id uuid not null references public.sites(id),
  department_id uuid references public.departments(id),
  effective_from date not null default current_date,
  effective_to date,
  created_at timestamptz not null default now(),
  check (effective_to is null or effective_to >= effective_from)
);

create unique index one_current_employee_assignment
on public.employee_assignments(employee_id)
where effective_to is null;

-- ------------------------------------------------------------
-- 2. AUTHENTICATION AND PROFILES
-- ------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  employee_id uuid not null unique references public.employees(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 3. ROLES AND PERMISSIONS
-- ------------------------------------------------------------

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  is_system_role boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

-- NULL site_id means the role applies globally.
-- A non-NULL site_id means the role applies only at that site.

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  site_id uuid references public.sites(id) on delete cascade,
  assigned_by uuid references public.employees(id),
  assigned_at timestamptz not null default now(),
  unique nulls not distinct (employee_id, role_id, site_id)
);

-- ------------------------------------------------------------
-- 4. ANNOUNCEMENT CATEGORIES
-- ------------------------------------------------------------

create table public.announcement_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 5. ANNOUNCEMENTS
-- ------------------------------------------------------------

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.employees(id),
  category_id uuid references public.announcement_categories(id),

  title text not null,
  content text not null,

  status public.announcement_status not null default 'draft',
  priority public.announcement_priority not null default 'normal',

  acknowledgement_enabled boolean not null default false,
  comments_enabled boolean not null default false,
  reactions_enabled boolean not null default false,

  is_featured boolean not null default false,

  scheduled_at timestamptz,
  published_at timestamptz,
  expires_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check (expires_at is null or scheduled_at is null
         or expires_at > scheduled_at)
);

create index announcements_status_idx
on public.announcements(status);

create index announcements_published_idx
on public.announcements(published_at desc);

create index announcements_author_idx
on public.announcements(author_id);

create index announcements_category_idx
on public.announcements(category_id);

-- ------------------------------------------------------------
-- 6. ANNOUNCEMENT TARGETING
-- ------------------------------------------------------------

create table public.announcement_targets (
  id uuid primary key default gen_random_uuid(),

  announcement_id uuid not null
    references public.announcements(id) on delete cascade,

  target_type public.announcement_target_type not null,

  site_id uuid references public.sites(id),
  department_id uuid references public.departments(id),
  role_id uuid references public.roles(id),

  created_at timestamptz not null default now(),

  check (
    (target_type = 'company'
      and site_id is null
      and department_id is null
      and role_id is null)
    or
    (target_type = 'site'
      and site_id is not null
      and department_id is null
      and role_id is null)
    or
    (target_type = 'department'
      and department_id is not null
      and site_id is null
      and role_id is null)
    or
    (target_type = 'role'
      and role_id is not null
      and site_id is null
      and department_id is null)
  )
);

create index announcement_targets_announcement_idx
on public.announcement_targets(announcement_id);

-- ------------------------------------------------------------
-- 7. ANNOUNCEMENT CHANNELS
-- ------------------------------------------------------------

create table public.announcement_channels (
  id uuid primary key default gen_random_uuid(),

  announcement_id uuid not null
    references public.announcements(id) on delete cascade,

  channel public.announcement_channel_type not null,
  enabled boolean not null default true,

  created_at timestamptz not null default now(),

  unique (announcement_id, channel)
);

-- ------------------------------------------------------------
-- 8. DESIGNATED APPROVERS
-- ------------------------------------------------------------

-- NULL site_id and category_id means globally applicable.
-- A site or category can be specified to narrow authority.

create table public.announcement_approvers (
  id uuid primary key default gen_random_uuid(),

  employee_id uuid not null references public.employees(id),
  site_id uuid references public.sites(id),
  category_id uuid references public.announcement_categories(id),

  assigned_by uuid references public.employees(id),
  is_active boolean not null default true,

  assigned_at timestamptz not null default now(),

  unique nulls not distinct
    (employee_id, site_id, category_id)
);

-- ------------------------------------------------------------
-- 9. ANNOUNCEMENT APPROVAL HISTORY
-- ------------------------------------------------------------

create table public.announcement_approvals (
  id uuid primary key default gen_random_uuid(),

  announcement_id uuid not null
    references public.announcements(id) on delete cascade,

  approver_id uuid not null references public.employees(id),

  decision public.approval_decision not null,
  comments text,

  decided_at timestamptz not null default now()
);

create index announcement_approvals_announcement_idx
on public.announcement_approvals(announcement_id);

-- ------------------------------------------------------------
-- 10. ANNOUNCEMENT ATTACHMENTS
-- ------------------------------------------------------------

create table public.announcement_attachments (
  id uuid primary key default gen_random_uuid(),

  announcement_id uuid not null
    references public.announcements(id) on delete cascade,

  file_name text not null,
  storage_path text not null unique,
  mime_type text,
  file_size bigint,

  uploaded_by uuid references public.employees(id),
  created_at timestamptz not null default now(),

  check (file_size is null or file_size >= 0)
);

-- ------------------------------------------------------------
-- 11. AUTOMATIC ACKNOWLEDGEMENTS
-- ------------------------------------------------------------

create table public.announcement_acknowledgements (
  id uuid primary key default gen_random_uuid(),

  announcement_id uuid not null
    references public.announcements(id) on delete cascade,

  employee_id uuid not null references public.employees(id),

  first_opened_at timestamptz not null default now(),

  unique (announcement_id, employee_id)
);

create index announcement_acknowledgements_employee_idx
on public.announcement_acknowledgements(employee_id);

-- ------------------------------------------------------------
-- 12. COMMENTS
-- ------------------------------------------------------------

create table public.announcement_comments (
  id uuid primary key default gen_random_uuid(),

  announcement_id uuid not null
    references public.announcements(id) on delete cascade,

  employee_id uuid not null references public.employees(id),

  content text not null,
  is_hidden boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check (length(trim(content)) > 0)
);

create index announcement_comments_announcement_idx
on public.announcement_comments(announcement_id, created_at);

-- ------------------------------------------------------------
-- 13. REACTIONS
-- ------------------------------------------------------------

create table public.announcement_reactions (
  id uuid primary key default gen_random_uuid(),

  announcement_id uuid not null
    references public.announcements(id) on delete cascade,

  employee_id uuid not null references public.employees(id),

  reaction text not null,

  created_at timestamptz not null default now(),

  unique (announcement_id, employee_id, reaction)
);

-- ------------------------------------------------------------
-- 14. NOTIFICATIONS
-- ------------------------------------------------------------

create table public.notifications (
  id uuid primary key default gen_random_uuid(),

  employee_id uuid not null references public.employees(id)
    on delete cascade,

  announcement_id uuid references public.announcements(id)
    on delete cascade,

  type text not null,
  title text not null,
  message text,

  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_employee_idx
on public.notifications(employee_id, created_at desc);

-- ------------------------------------------------------------
-- 15. EMAIL AND CHANNEL DELIVERY TRACKING
-- ------------------------------------------------------------

create table public.announcement_deliveries (
  id uuid primary key default gen_random_uuid(),

  announcement_id uuid not null
    references public.announcements(id) on delete cascade,

  employee_id uuid references public.employees(id),

  channel public.announcement_channel_type not null,
  status public.delivery_status not null default 'pending',

  recipient text,
  provider_reference text,
  error_message text,

  attempted_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);

create index announcement_deliveries_announcement_idx
on public.announcement_deliveries(announcement_id);

-- ------------------------------------------------------------
-- 16. AUDIT LOGS
-- ------------------------------------------------------------

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),

  actor_id uuid references public.employees(id),

  action text not null,
  entity_type text not null,
  entity_id uuid,

  old_values jsonb,
  new_values jsonb,

  ip_address inet,
  created_at timestamptz not null default now()
);

create index audit_logs_entity_idx
on public.audit_logs(entity_type, entity_id);

create index audit_logs_actor_idx
on public.audit_logs(actor_id, created_at desc);

-- ------------------------------------------------------------
-- END OF INITIAL STRUCTURAL MIGRATION
-- ------------------------------------------------------------
