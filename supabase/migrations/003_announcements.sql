
-- =========================================================
-- LOMEZA ANNOUNCEMENTS
-- 003: Core announcement functionality
-- =========================================================

begin;

-- ---------------------------------------------------------
-- 1. ANNOUNCEMENTS
-- ---------------------------------------------------------

create table public.announcements (
    id uuid primary key default gen_random_uuid(),

    author_id uuid not null
        references public.employees(id),

    title text not null,
    content text not null,
    category text not null default 'General',

    priority text not null default 'normal'
        check (priority in ('low', 'normal', 'high', 'urgent')),

    status text not null default 'draft'
        check (status in ('draft', 'published', 'archived')),

    acknowledgement_enabled boolean not null default false,
    comments_enabled boolean not null default true,
    reactions_enabled boolean not null default true,

    published_at timestamptz,
    expires_at timestamptz,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint announcements_title_not_empty
        check (length(trim(title)) > 0),

    constraint announcements_content_not_empty
        check (length(trim(content)) > 0),

    constraint announcements_expiry_valid
        check (expires_at is null or published_at is null
               or expires_at > published_at)
);

create index idx_announcements_status
    on public.announcements(status);

create index idx_announcements_author
    on public.announcements(author_id);

create index idx_announcements_published
    on public.announcements(published_at desc);

-- ---------------------------------------------------------
-- 2. ANNOUNCEMENT TARGETS
--
-- One row per target location.
-- location_id NULL means the entire company.
--
-- Targeting Head Office includes its child locations.
-- Multiple target rows use OR logic.
-- ---------------------------------------------------------

create table public.announcement_targets (
    id uuid primary key default gen_random_uuid(),

    announcement_id uuid not null
        references public.announcements(id) on delete cascade,

    location_id uuid
        references public.locations(id) on delete restrict,

    created_at timestamptz not null default now(),

    constraint announcement_targets_unique
        unique nulls not distinct (announcement_id, location_id)
);

create index idx_announcement_targets_announcement
    on public.announcement_targets(announcement_id);

create index idx_announcement_targets_location
    on public.announcement_targets(location_id);

-- ---------------------------------------------------------
-- 3. ACKNOWLEDGEMENTS
-- First opening is recorded once per employee.
-- ---------------------------------------------------------

create table public.announcement_acknowledgements (
    id uuid primary key default gen_random_uuid(),

    announcement_id uuid not null
        references public.announcements(id) on delete cascade,

    employee_id uuid not null
        references public.employees(id) on delete cascade,

    first_opened_at timestamptz not null default now(),

    unique (announcement_id, employee_id)
);

create index idx_acknowledgements_announcement
    on public.announcement_acknowledgements(announcement_id);

-- ---------------------------------------------------------
-- 4. COMMENTS
-- ---------------------------------------------------------

create table public.announcement_comments (
    id uuid primary key default gen_random_uuid(),

    announcement_id uuid not null
        references public.announcements(id) on delete cascade,

    employee_id uuid not null
        references public.employees(id) on delete cascade,

    content text not null,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint announcement_comments_not_empty
        check (length(trim(content)) > 0)
);

create index idx_announcement_comments_announcement
    on public.announcement_comments(announcement_id, created_at);

-- ---------------------------------------------------------
-- 5. REACTIONS
-- One reaction per employee per announcement.
-- Employees can change their reaction.
-- ---------------------------------------------------------

create table public.announcement_reactions (
    id uuid primary key default gen_random_uuid(),

    announcement_id uuid not null
        references public.announcements(id) on delete cascade,

    employee_id uuid not null
        references public.employees(id) on delete cascade,

    reaction text not null,

    created_at timestamptz not null default now(),

    unique (announcement_id, employee_id),

    constraint announcement_reactions_not_empty
        check (length(trim(reaction)) > 0)
);

create index idx_announcement_reactions_announcement
    on public.announcement_reactions(announcement_id);

-- ---------------------------------------------------------
-- 6. SHARED HELPER: AUDIENCE MEMBERSHIP
-- ---------------------------------------------------------

create or replace function public.can_view_announcement(
    target_announcement_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select exists (
        select 1
        from public.announcements a
        join public.employees e
            on e.id = public.current_employee_id()
        join public.locations employee_location
            on employee_location.id = e.location_id
        join public.announcement_targets t
            on t.announcement_id = a.id
        where a.id = target_announcement_id
          and a.status = 'published'
          and (a.expires_at is null or a.expires_at > now())
          and (
              t.location_id is null
              or t.location_id = employee_location.id
              or t.location_id = employee_location.parent_id
          )
    );
$$;

-- ---------------------------------------------------------
-- 7. ANNOUNCEMENT PUBLISHING VALIDATION
-- An announcement must have at least one target before
-- it can be published.
-- ---------------------------------------------------------

create or replace function public.validate_announcement_publish()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
    if new.status = 'published' then

        if not exists (
            select 1
            from public.announcement_targets t
            where t.announcement_id = new.id
        ) then
            raise exception
                'An announcement must have at least one target before publishing.';
        end if;

        if old.status is distinct from 'published'
           and new.published_at is null then
            new.published_at = now();
        end if;

    end if;

    return new;
end;
$$;

create trigger announcements_validate_publish
before update on public.announcements
for each row
execute function public.validate_announcement_publish();

create trigger announcements_updated_at
before update on public.announcements
for each row
execute function public.set_updated_at();

create trigger comments_updated_at
before update on public.announcement_comments
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------
-- 8. ROW LEVEL SECURITY
-- ---------------------------------------------------------

alter table public.announcements enable row level security;
alter table public.announcement_targets enable row level security;
alter table public.announcement_acknowledgements enable row level security;
alter table public.announcement_comments enable row level security;
alter table public.announcement_reactions enable row level security;

-- ANNOUNCEMENTS: READ

create policy "Employees can view relevant announcements"
on public.announcements
for select
to authenticated
using (
    public.can_view_announcement(id)
    or author_id = public.current_employee_id()
    or public.is_platform_admin()
);

-- ANNOUNCEMENTS: CREATE

create policy "Publishers and administrators can create announcements"
on public.announcements
for insert
to authenticated
with check (
    author_id = public.current_employee_id()
    and (
        public.has_role('publisher')
        or public.is_platform_admin()
    )
);

-- ANNOUNCEMENTS: UPDATE

create policy "Authors and administrators can update announcements"
on public.announcements
for update
to authenticated
using (
    (
        author_id = public.current_employee_id()
        and (
            public.has_role('publisher')
            or public.is_platform_admin()
        )
    )
    or public.is_platform_admin()
)
with check (
    (
        author_id = public.current_employee_id()
        and (
            public.has_role('publisher')
            or public.is_platform_admin()
        )
    )
    or public.is_platform_admin()
);

-- ANNOUNCEMENTS: DELETE

create policy "Authors and administrators can delete announcements"
on public.announcements
for delete
to authenticated
using (
    (
        author_id = public.current_employee_id()
        and public.has_role('publisher')
    )
    or public.is_platform_admin()
);

-- TARGETS: READ

create policy "Employees can view relevant announcement targets"
on public.announcement_targets
for select
to authenticated
using (
    public.can_view_announcement(announcement_id)
    or exists (
        select 1
        from public.announcements a
        where a.id = announcement_id
          and (
              a.author_id = public.current_employee_id()
              or public.is_platform_admin()
          )
    )
);

-- TARGETS: CREATE

create policy "Authors and administrators can add targets"
on public.announcement_targets
for insert
to authenticated
with check (
    exists (
        select 1
        from public.announcements a
        where a.id = announcement_id
          and (
              (
                  a.author_id = public.current_employee_id()
                  and (
                      public.has_role('publisher')
                      or public.is_platform_admin()
                  )
              )
              or public.is_platform_admin()
          )
    )
);

-- TARGETS: UPDATE

create policy "Authors and administrators can update targets"
on public.announcement_targets
for update
to authenticated
using (
    exists (
        select 1
        from public.announcements a
        where a.id = announcement_id
          and (
              a.author_id = public.current_employee_id()
              or public.is_platform_admin()
          )
    )
)
with check (
    exists (
        select 1
        from public.announcements a
        where a.id = announcement_id
          and (
              a.author_id = public.current_employee_id()
              or public.is_platform_admin()
          )
    )
);

-- TARGETS: DELETE

create policy "Authors and administrators can delete targets"
on public.announcement_targets
for delete
to authenticated
using (
    exists (
        select 1
        from public.announcements a
        where a.id = announcement_id
          and (
              a.author_id = public.current_employee_id()
              or public.is_platform_admin()
          )
    )
);

-- ACKNOWLEDGEMENTS: READ

create policy "Employees can view their own acknowledgements"
on public.announcement_acknowledgements
for select
to authenticated
using (
    employee_id = public.current_employee_id()
    or public.is_platform_admin()
);

-- ACKNOWLEDGEMENTS: CREATE

create policy "Employees can acknowledge relevant announcements"
on public.announcement_acknowledgements
for insert
to authenticated
with check (
    employee_id = public.current_employee_id()
    and exists (
        select 1
        from public.announcements a
        where a.id = announcement_id
          and a.acknowledgement_enabled = true
          and public.can_view_announcement(a.id)
    )
);

-- COMMENTS: READ

create policy "Employees can view relevant announcement comments"
on public.announcement_comments
for select
to authenticated
using (
    public.can_view_announcement(announcement_id)
    or public.is_platform_admin()
);

-- COMMENTS: CREATE

create policy "Employees can comment on relevant announcements"
on public.announcement_comments
for insert
to authenticated
with check (
    employee_id = public.current_employee_id()
    and exists (
        select 1
        from public.announcements a
        where a.id = announcement_id
          and a.comments_enabled = true
          and public.can_view_announcement(a.id)
    )
);

-- COMMENTS: DELETE

create policy "Authors can delete their comments"
on public.announcement_comments
for delete
to authenticated
using (
    employee_id = public.current_employee_id()
    or public.is_platform_admin()
);

-- REACTIONS: READ

create policy "Employees can view relevant announcement reactions"
on public.announcement_reactions
for select
to authenticated
using (
    public.can_view_announcement(announcement_id)
    or public.is_platform_admin()
);

-- REACTIONS: CREATE

create policy "Employees can react to relevant announcements"
on public.announcement_reactions
for insert
to authenticated
with check (
    employee_id = public.current_employee_id()
    and exists (
        select 1
        from public.announcements a
        where a.id = announcement_id
          and a.reactions_enabled = true
          and public.can_view_announcement(a.id)
    )
);

-- REACTIONS: UPDATE

create policy "Employees can change their reactions"
on public.announcement_reactions
for update
to authenticated
using (
    employee_id = public.current_employee_id()
)
with check (
    employee_id = public.current_employee_id()
    and exists (
        select 1
        from public.announcements a
        where a.id = announcement_id
          and a.reactions_enabled = true
          and public.can_view_announcement(a.id)
    )
);

-- REACTIONS: DELETE

create policy "Employees can remove their reactions"
on public.announcement_reactions
for delete
to authenticated
using (
    employee_id = public.current_employee_id()
    or public.is_platform_admin()
);

-- ---------------------------------------------------------
-- 9. TABLE PERMISSIONS
-- ---------------------------------------------------------

grant select, insert, update, delete
on public.announcements to authenticated;

grant select, insert, update, delete
on public.announcement_targets to authenticated;

grant select, insert
on public.announcement_acknowledgements to authenticated;

grant select, insert, delete
on public.announcement_comments to authenticated;

grant select, insert, update, delete
on public.announcement_reactions to authenticated;

-- ---------------------------------------------------------
-- 10. FUNCTION PERMISSIONS
-- ---------------------------------------------------------

revoke all on function public.can_view_announcement(uuid)
from public, anon;

grant execute on function public.can_view_announcement(uuid)
to authenticated;

commit;
