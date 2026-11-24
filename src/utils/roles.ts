import type { EmployeeProfile } from '../types/auth'

export function hasRole(employee: EmployeeProfile, role: string): boolean {
  return employee.roles.includes(role)
}

export function hasAnyRole(
  employee: EmployeeProfile,
  roles: string[],
): boolean {
  return roles.some((role) => employee.roles.includes(role))
}

export function canManageAnnouncements(employee: EmployeeProfile): boolean {
  return hasAnyRole(employee, [
    'publisher',
    'administrator',
    'super_administrator',
  ])
}

export function canAccessAdministration(employee: EmployeeProfile): boolean {
  return hasAnyRole(employee, ['administrator', 'super_administrator'])
}
