import { hasAnyRole, hasRole } from '../../utils/roles'
import type { EmployeeRecord, RoleAssignmentRules } from './employeeTypes'
import { ROLE_CODES } from './roleDefinitions'

export function normalizeRoleCodes(roles: string[]): string[] {
  return Array.from(
    new Set(roles.filter((code) => ROLE_CODES.includes(code))),
  )
}

export function validateRoleSelection(
  employees: EmployeeRecord[],
  currentEmployeeId: string,
  targetId: string,
  roles: string[],
): string | null {
  const actor = employees.find((employee) => employee.id === currentEmployeeId)
  const target = employees.find((employee) => employee.id === targetId)

  if (!target) {
    return 'Employee not found.'
  }

  const uniqueRoles = normalizeRoleCodes(roles)

  if (uniqueRoles.length === 0) {
    return 'Select at least one role.'
  }

  if (!actor || !hasAnyRole(actor, ['administrator', 'super_administrator'])) {
    return 'You do not have permission to manage roles.'
  }

  const actorIsSuper = hasRole(actor, 'super_administrator')
  const targetIsSuper = hasRole(target, 'super_administrator')

  if (!actorIsSuper && targetIsSuper) {
    return 'Administrators cannot modify super administrator roles.'
  }

  if (targetIsSuper && !uniqueRoles.includes('super_administrator')) {
    const remainingSuperAdministrators = employees.filter(
      (employee) =>
        employee.id !== target.id && hasRole(employee, 'super_administrator'),
    ).length

    if (remainingSuperAdministrators === 0) {
      return 'The last super administrator role cannot be removed.'
    }
  }

  if (target.id === currentEmployeeId) {
    const currentlyAdministrative = hasAnyRole(target, [
      'administrator',
      'super_administrator',
    ])
    const remainsAdministrative = hasAnyRole(
      { ...target, roles: uniqueRoles },
      ['administrator', 'super_administrator'],
    )

    if (currentlyAdministrative && !remainsAdministrative) {
      return 'You cannot remove your own administrative access.'
    }
  }

  return null
}

export function getRoleAssignmentRules(
  employees: EmployeeRecord[],
  currentEmployeeId: string,
  targetId: string,
): RoleAssignmentRules {
  const actor = employees.find((employee) => employee.id === currentEmployeeId)
  const target = employees.find((employee) => employee.id === targetId)

  if (!target) {
    return { canModify: false, reason: 'Employee not found.' }
  }

  if (!actor || !hasAnyRole(actor, ['administrator', 'super_administrator'])) {
    return {
      canModify: false,
      reason: 'You do not have permission to manage roles.',
    }
  }

  if (
    !hasRole(actor, 'super_administrator') &&
    hasRole(target, 'super_administrator')
  ) {
    return {
      canModify: false,
      reason: 'Administrators cannot modify super administrator roles.',
    }
  }

  return { canModify: true, reason: null }
}
