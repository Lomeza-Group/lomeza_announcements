import { AccessState, LoadingScreen } from './components/auth/AccessState'
import { AuthenticatedHome } from './components/auth/AuthenticatedHome'
import { AuthProvider } from './components/auth/AuthProvider'
import { ChangePassword } from './components/auth/ChangePassword'
import { Login } from './components/auth/Login'
import { useAuth } from './hooks/useAuth'

function AppContent() {
  const {
    isLoading,
    session,
    employee,
    profileError,
    mustChangePassword,
    isPasswordRecovery,
    retryProfile,
  } = useAuth()

  if (!session) {
    return isLoading ? <LoadingScreen /> : <Login />
  }

  if (mustChangePassword || isPasswordRecovery) {
    return <ChangePassword />
  }

  if (isLoading) {
    return <LoadingScreen />
  }

  if (profileError) {
    return (
      <AccessState
        variant="error"
        title="Profile unavailable"
        message={profileError}
        employee={employee}
        onRetry={retryProfile}
      />
    )
  }

  if (!employee) {
    return (
      <AccessState
        variant="error"
        title="Access unavailable"
        message="We could not confirm your employee profile. Please try again or contact your administrator."
        onRetry={retryProfile}
      />
    )
  }

  if (!employee.is_active) {
    return (
      <AccessState
        variant="warning"
        title="Account inactive"
        message="Your Lomeza account is currently inactive, so access to the Communication Platform is unavailable. Please contact your administrator to restore access."
        employee={employee}
      />
    )
  }

  return <AuthenticatedHome employee={employee} />
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
