import type { Session, User } from '@supabase/supabase-js'

export interface EmployeeProfile {
  id: string
  employee_number: string | null
  full_name: string
  company_email: string
  location_id: string | null
  is_active: boolean
  roles: string[]
  locationName?: string
  roleLabel?: string
}

export interface DemoEmployee extends EmployeeProfile {
  locationName: string
  roleLabel: string
}

export interface AuthContextValue {
  user: User | null
  session: Session | null
  employee: EmployeeProfile | null
  roleNames: string[]
  isInitializing: boolean
  isProfileLoading: boolean
  isLoading: boolean
  authError: string | null
  profileError: string | null
  mustChangePassword: boolean
  isPasswordRecovery: boolean
  isDemoMode?: boolean
  demoEmployees?: DemoEmployee[]
  demoSignIn?: (employee: DemoEmployee) => void
  login: (email: string, password: string) => Promise<string | null>
  logout: () => Promise<string | null>
  changePassword: (newPassword: string) => Promise<string | null>
  completePasswordChange: () => void
  retryProfile: () => void
}
