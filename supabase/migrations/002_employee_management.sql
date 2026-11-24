
-- =========================================================
-- LOMEZA ANNOUNCEMENTS
-- 002: Employee management and access control
-- =========================================================

begin;

-- ---------------------------------------------------------
-- 1. HELPER FUNCTIONS
-- SECURITY DEFINER avoids recursive RLS checks.
-- ---------------------------------------------------------

create or replace function public.current_employee_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select p.employee_id
    from public.profiles p
    join public.employees e on e.id = p.employee_id
    where p.id = (select auth.uid())
      and e.is_active = true
    limit 1;
$$;

create or replace function public.has_role(required_role text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select exists (
        select 1
        from public.employee_roles er
        join public.roles r on r.id = er.role_id
        join public.employees e on e.id = er.employee_id
        where er.employee_id = public.current_employee_id()
          and r.code = required_role
          and e.is_active = true
    );
$$;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select
        public.has_role('administrator')
        or public.has_role('super_administrator');
$$;

-- ---------------------------------------------------------
-- 2. UPDATED_AT TRIGGER
-- ---------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger employees_updated_at
before update on public.employees
for each row
execute function public.set_updated_at();

create trigger profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------
-- 3. VALIDATE EMPLOYEE LOCATION
-- Employees must belong to active, assignable locations.
-- ---------------------------------------------------------

create or replace function public.validate_employee_location()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
    if not exists (
        select 1
        from public.locations l
        where l.id = new.location_id
          and l.is_active = true
          and l.is_assignable = true
    ) then
        raise exception
            'Employee must be assigned to an active, assignable location.';
    end if;

    return new;
end;
$$;

create trigger employees_validate_location
before insert or update of location_id on public.employees
for each row
execute function public.validate_employee_location();

-- ---------------------------------------------------------
-- 4. DEFAULT EMPLOYEE ROLE
-- Every newly created employee receives the employee role.
-- Additional roles can be assigned separately.
-- ---------------------------------------------------------

create or replace function public.assign_default_employee_role()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    employee_role_id uuid;
begin
    select id
    into employee_role_id
    from public.roles
    where code = 'employee';

    if employee_role_id is null then
        raise exception 'Default employee role does not exist.';
    end if;

    insert into public.employee_roles (employee_id, role_id)
    values (new.id, employee_role_id);

    return new;
end;
$$;

create trigger employees_assign_default_role
after insert on public.employees
for each row
execute function public.assign_default_employee_role();

-- ---------------------------------------------------------
-- 5. RESTRICT PRIVILEGED ROLE ASSIGNMENTS
-- Administrators can assign publisher and employee roles.
-- Only super administrators can grant admin-level roles.
-- Trusted service-role operations are permitted.
-- ---------------------------------------------------------

create or replace function public.validate_role_assignment()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    assigned_role_code text;
begin
    select code
    into assigned_role_code
    from public.roles
    where id = new.role_id;

    if assigned_role_code in (
        'administrator',
        'super_administrator'
    ) then
        if coalesce(auth.role(), '') <> 'service_role'
           and auth.uid() is not null
           and not public.has_role('super_administrator') then
            raise exception
                'Only a super administrator can assign administrative roles.';
        end if;
    end if;

    return new;
end;
$$;

create trigger employee_roles_validate_assignment
before insert or update on public.employee_roles
for each row
execute function public.validate_role_assignment();

-- ---------------------------------------------------------
-- 6. ROW LEVEL SECURITY
-- ---------------------------------------------------------

-- LOCATIONS

create policy "Authenticated employees can view active locations"
on public.locations
for select
to authenticated
using (
    is_active = true
    and public.current_employee_id() is not null
);

create policy "Administrators can manage locations"
on public.locations
for all
to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

-- EMPLOYEES

create policy "Employees can view their own record"
on public.employees
for select
to authenticated
using (
    id = public.current_employee_id()
    or public.is_platform_admin()
);

create policy "Administrators can create employees"
on public.employees
for insert
to authenticated
with check (public.is_platform_admin());

create policy "Administrators can update employees"
on public.employees
for update
to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

create policy "Administrators can delete employees"
on public.employees
for delete
to authenticated
using (public.is_platform_admin());

-- PROFILES

create policy "Users can view their own profile"
on public.profiles
for select
to authenticated
using (
    id = (select auth.uid())
    or public.is_platform_admin()
);

-- No authenticated insert, update or delete policies.
-- Profile linking will be handled by a trusted backend.

-- ROLES

create policy "Authenticated employees can view roles"
on public.roles
for select
to authenticated
using (
    public.current_employee_id() is not null
);

-- Role definitions are managed through trusted administrative
-- database operations, not ordinary employee requests.

-- EMPLOYEE ROLES

create policy "Employees can view their own role assignments"
on public.employee_roles
for select
to authenticated
using (
    employee_id = public.current_employee_id()
    or public.is_platform_admin()
);

create policy "Administrators can assign roles"
on public.employee_roles
for insert
to authenticated
with check (public.is_platform_admin());

create policy "Administrators can update role assignments"
on public.employee_roles
for update
to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

create policy "Administrators can remove role assignments"
on public.employee_roles
for delete
to authenticated
using (public.is_platform_admin());

-- ---------------------------------------------------------
-- 7. FUNCTION PERMISSIONS
-- ---------------------------------------------------------

revoke all on function public.current_employee_id()
from public, anon;

revoke all on function public.has_role(text)
from public, anon;

revoke all on function public.is_platform_admin()
from public, anon;

grant execute on function public.current_employee_id()
to authenticated;

grant execute on function public.has_role(text)
to authenticated;

grant execute on function public.is_platform_admin()
to authenticated;

-- ---------------------------------------------------------
-- 8. TABLE PERMISSIONS
-- ---------------------------------------------------------

grant select on public.locations to authenticated;
grant insert, update, delete on public.locations to authenticated;

grant select, insert, update, delete
on public.employees to authenticated;

grant select on public.profiles to authenticated;

grant select on public.roles to authenticated;

grant select, insert, update, delete
on public.employee_roles to authenticated;

commit;
