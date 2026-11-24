export interface RoleDefinition {
  id: string
  code: string
  name: string
  description: string
  created_at: string
}

export const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    id: 'role-employee',
    code: 'employee',
    name: 'Employee',
    description:
      'View announcements, acknowledge notices and access the employee dashboard.',
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'role-publisher',
    code: 'publisher',
    name: 'Publisher',
    description:
      'Create and manage company announcements in addition to employee access.',
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'role-administrator',
    code: 'administrator',
    name: 'Administrator',
    description:
      'Manage employees, role assignments and announcements across the platform.',
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'role-super-administrator',
    code: 'super_administrator',
    name: 'Super Administrator',
    description:
      'Full platform access including administration oversight and role management.',
    created_at: '2026-01-01T00:00:00.000Z',
  },
]

export const ROLE_CODES: string[] = ROLE_DEFINITIONS.map((role) => role.code)
