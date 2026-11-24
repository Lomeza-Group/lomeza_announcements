import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { AuthContext } from '../../hooks/useAuth'
import { demoEmployees } from '../../features/demo/demoData'
import type {
  AuthContextValue,
  DemoEmployee,
  EmployeeProfile,
} from '../../types/auth'

const DEMO_EMPLOYEE_STORAGE_KEY = 'lomeza-demo-employee-id'

function getStoredEmployee(): DemoEmployee | null {
  const storedEmployeeId = window.localStorage.getItem(
    DEMO_EMPLOYEE_STORAGE_KEY,
  )

  if (!storedEmployeeId) {
    return null
  }

  const employee =
    demoEmployees.find((candidate) => candidate.id === storedEmployeeId) ?? null

  if (!employee) {
    window.localStorage.removeItem(DEMO_EMPLOYEE_STORAGE_KEY)
  }

  return employee
}

export function DemoAuthProvider({ children }: { children: ReactNode }) {
  const [employee, setEmployee] = useState<EmployeeProfile | null>(
    getStoredEmployee,
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user: null,
      session: null,
      employee,
      roleNames: [],
      isInitializing: false,
      isProfileLoading: false,
      isLoading: false,
      authError: null,
      profileError: null,
      mustChangePassword: false,
      isPasswordRecovery: false,
      isDemoMode: true,
      demoEmployees,
      demoSignIn: (selected: DemoEmployee) => {
        window.localStorage.setItem(DEMO_EMPLOYEE_STORAGE_KEY, selected.id)
        setEmployee(selected)
      },
      login: async () => null,
      logout: async () => {
        window.localStorage.removeItem(DEMO_EMPLOYEE_STORAGE_KEY)
        setEmployee(null)
        return null
      },
      changePassword: async () => null,
      completePasswordChange: () => {},
      retryProfile: () => {},
    }),
    [employee],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
