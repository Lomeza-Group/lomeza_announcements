import { createContext, useContext } from 'react'
import type {
  EmployeeInput,
  EmployeeRecord,
  RoleAssignmentRules,
  RoleUpdateResult,
} from './employeeTypes'
import type { RoleDefinition } from './roleDefinitions'

export interface EmployeesContextValue {
  employees: EmployeeRecord[]
  roleDefinitions: RoleDefinition[]
  addEmployee: (input: EmployeeInput) => EmployeeRecord
  updateEmployee: (id: string, input: EmployeeInput) => void
  setEmployeeActive: (id: string, isActive: boolean) => void
  getEmployeeById: (id: string) => EmployeeRecord | undefined
  updateEmployeeRoles: (
    targetId: string,
    roles: string[],
  ) => RoleUpdateResult
  validateRoleSelection: (
    targetId: string,
    roles: string[],
  ) => string | null
  getRoleAssignmentRules: (targetId: string) => RoleAssignmentRules
}

export const EmployeesContext = createContext<EmployeesContextValue | null>(null)

export function useEmployees(): EmployeesContextValue {
  const context = useContext(EmployeesContext)

  if (!context) {
    throw new Error('useEmployees must be used within an EmployeesProvider')
  }

  return context
}
