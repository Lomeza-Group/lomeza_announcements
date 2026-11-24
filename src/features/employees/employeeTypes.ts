import type { EmployeeProfile } from '../../types/auth'

export interface EmployeeRecord extends EmployeeProfile {
  created_at: string
  updated_at: string
}

export interface EmployeeInput {
  full_name: string
  employee_number: string | null
  company_email: string
  location_id: string
  locationName: string
  is_active: boolean
  roles: string[]
}

export interface RoleUpdateResult {
  success: boolean
  error: string | null
}

export interface RoleAssignmentRules {
  canModify: boolean
  reason: string | null
}
