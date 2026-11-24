import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { mockEmployees } from '../announcements/mockEmployees'
import { EmployeesContext } from './employeesContext'
import type { EmployeesContextValue } from './employeesContext'
import type {
  EmployeeInput,
  EmployeeRecord,
  RoleAssignmentRules,
  RoleUpdateResult,
} from './employeeTypes'
import { ROLE_DEFINITIONS } from './roleDefinitions'
import {
  getRoleAssignmentRules as resolveRoleAssignmentRules,
  normalizeRoleCodes,
  validateRoleSelection as validateRoleSelectionRules,
} from './roleRules'

function daysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString()
}

const SEED_EMPLOYEES: EmployeeRecord[] = mockEmployees.map(
  (employee, index) => ({
    ...employee,
    created_at: daysAgo(150 - index * 4),
    updated_at: daysAgo(6 + (index % 10)),
  }),
)

function generateEmployeeId(): string {
  return `emp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

interface EmployeesProviderProps {
  currentEmployeeId: string
  children: ReactNode
}

export function EmployeesProvider({
  currentEmployeeId,
  children,
}: EmployeesProviderProps) {
  const [employees, setEmployees] =
    useState<EmployeeRecord[]>(SEED_EMPLOYEES)

  const addEmployee = useCallback((input: EmployeeInput) => {
    const now = new Date().toISOString()

    const employee: EmployeeRecord = {
      ...input,
      id: generateEmployeeId(),
      created_at: now,
      updated_at: now,
    }

    setEmployees((current) => [employee, ...current])
    return employee
  }, [])

  const updateEmployee = useCallback((id: string, input: EmployeeInput) => {
    const now = new Date().toISOString()

    setEmployees((current) =>
      current.map((employee) =>
        employee.id === id
          ? {
              ...employee,
              ...input,
              id: employee.id,
              created_at: employee.created_at,
              updated_at: now,
            }
          : employee,
      ),
    )
  }, [])

  const setEmployeeActive = useCallback((id: string, isActive: boolean) => {
    const now = new Date().toISOString()

    setEmployees((current) =>
      current.map((employee) =>
        employee.id === id
          ? { ...employee, is_active: isActive, updated_at: now }
          : employee,
      ),
    )
  }, [])

  const getEmployeeById = useCallback(
    (id: string) => employees.find((employee) => employee.id === id),
    [employees],
  )

  const validateRoleSelection = useCallback(
    (targetId: string, roles: string[]): string | null =>
      validateRoleSelectionRules(
        employees,
        currentEmployeeId,
        targetId,
        roles,
      ),
    [employees, currentEmployeeId],
  )

  const updateEmployeeRoles = useCallback(
    (targetId: string, roles: string[]): RoleUpdateResult => {
      const error = validateRoleSelection(targetId, roles)

      if (error) {
        return { success: false, error }
      }

      const uniqueRoles = normalizeRoleCodes(roles)
      const now = new Date().toISOString()

      setEmployees((current) =>
        current.map((employee) =>
          employee.id === targetId
            ? { ...employee, roles: uniqueRoles, updated_at: now }
            : employee,
        ),
      )

      return { success: true, error: null }
    },
    [validateRoleSelection],
  )

  const getRoleAssignmentRules = useCallback(
    (targetId: string): RoleAssignmentRules =>
      resolveRoleAssignmentRules(employees, currentEmployeeId, targetId),
    [employees, currentEmployeeId],
  )

  const value = useMemo<EmployeesContextValue>(
    () => ({
      employees,
      roleDefinitions: ROLE_DEFINITIONS,
      addEmployee,
      updateEmployee,
      setEmployeeActive,
      getEmployeeById,
      updateEmployeeRoles,
      validateRoleSelection,
      getRoleAssignmentRules,
    }),
    [
      employees,
      addEmployee,
      updateEmployee,
      setEmployeeActive,
      getEmployeeById,
      updateEmployeeRoles,
      validateRoleSelection,
      getRoleAssignmentRules,
    ],
  )

  return (
    <EmployeesContext.Provider value={value}>
      {children}
    </EmployeesContext.Provider>
  )
}
