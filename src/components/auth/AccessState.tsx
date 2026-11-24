import { useState } from 'react'
import { AlertTriangle, Loader2, LogOut, RotateCw, ShieldAlert } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import type { EmployeeProfile } from '../../types/auth'
import { BrandMark } from './Brand'

export function LoadingScreen() {
  return (
    <div className="app-loading" role="status" aria-live="polite">
      <div className="app-loading-card">
        <BrandMark />
        <span className="loading-spinner" aria-hidden="true" />
        <p>Preparing your workspace…</p>
      </div>
    </div>
  )
}

interface AccessStateProps {
  variant: 'error' | 'warning'
  title: string
  message: string
  employee?: EmployeeProfile | null
  onRetry?: () => void
}

export function AccessState({
  variant,
  title,
  message,
  employee,
  onRetry,
}: AccessStateProps) {
  const { user, logout } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState<string | null>(null)

  const accountEmail = employee?.company_email ?? user?.email ?? null

  const handleSignOut = async () => {
    setIsSigningOut(true)
    setSignOutError(null)

    const error = await logout()

    if (error) {
      setSignOutError(error)
      setIsSigningOut(false)
    }
  }

  return (
    <div className="state-screen">
      <div className="state-card">
        <BrandMark />
        <div className={`state-icon is-${variant}`}>
          {variant === 'warning' ? (
            <ShieldAlert aria-hidden="true" />
          ) : (
            <AlertTriangle aria-hidden="true" />
          )}
        </div>
        <h1>{title}</h1>
        <p>{message}</p>
        {accountEmail && <span className="state-account">{accountEmail}</span>}
        {signOutError && (
          <div className="alert alert-error" role="alert">
            {signOutError}
          </div>
        )}
        <div className="state-actions">
          {onRetry && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onRetry}
            >
              <RotateCw aria-hidden="true" />
              Try again
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            {isSigningOut ? (
              <Loader2 className="spin" aria-hidden="true" />
            ) : (
              <LogOut aria-hidden="true" />
            )}
            {isSigningOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </div>
    </div>
  )
}
