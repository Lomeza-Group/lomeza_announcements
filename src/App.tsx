import { lazy, Suspense } from 'react'
import { AccessState, LoadingScreen } from './components/auth/AccessState'
import { ChangePassword } from './components/auth/ChangePassword'
import { DemoAuthProvider } from './components/auth/DemoAuthProvider'
import { DemoLogin } from './components/auth/DemoLogin'
import { Login } from './components/auth/Login'
import { isDemoModeEnabled } from './features/demo/demoMode'
import { useAuth } from './hooks/useAuth'
import { AppLayout } from './layouts/AppLayout'

const AuthProvider = lazy(() =>
  import('./components/auth/AuthProvider').then((module) => ({
    default: module.AuthProvider,
  })),
)

function AppContent() {
  const {
    isLoading,
    session,
    employee,
    profileError,
    mustChangePassword,
    isPasswordRecovery,
    isDemoMode,
    retryProfile,
  } = useAuth()

  if (isDemoMode) {
    return employee ? (
      <AppLayout employee={employee} />
    ) : (
      <DemoLogin />
    )
  }

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

  return <AppLayout employee={employee} />
}

export default function App() {
  if (isDemoModeEnabled) {
    return (
      <DemoAuthProvider>
        <AppContent />
      </DemoAuthProvider>
    )
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Suspense>
  )
}
