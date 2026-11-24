import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { AuthContext } from '../../hooks/useAuth'
import { demoEmployees } from '../../features/demo/demoData'
import type {
  AuthContextValue,
  DemoEmployee,
  EmployeeProfile,
} from '../../types/auth'

export function DemoAuthProvider({ children }: { children: ReactNode }) {
  const [employee, setEmployee] = useState<EmployeeProfile | null>(null)

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
        setEmployee(selected)
      },
      login: async () => null,
      logout: async () => {
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
