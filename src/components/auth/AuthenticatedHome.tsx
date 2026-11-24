import { useState } from 'react'
import {
  CheckCircle2,
  LayoutDashboard,
  Loader2,
  LogOut,
  Mail,
  ShieldCheck,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import type { EmployeeProfile } from '../../types/auth'
import { BrandLockup } from './Brand'

function formatRole(role: string): string {
  return role
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)

  if (parts.length === 0) {
    return 'L'
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export function AuthenticatedHome({
  employee,
}: {
  employee: EmployeeProfile
}) {
  const { roleNames, logout } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState<string | null>(null)

  const displayRoles =
    roleNames.length > 0 ? roleNames : employee.roles.map(formatRole)
  const primaryRole = displayRoles[0] ?? 'Employee'

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
    <div className="app-page">
      <header className="app-header">
        <div className="app-header-inner">
          <BrandLockup tone="dark" compact />

          <div className="header-actions">
            <div className="header-user">
              <span className="header-user-name">{employee.full_name}</span>
              <span className="header-user-role">{primaryRole}</span>
            </div>
            <div className="avatar" aria-hidden="true">
              {getInitials(employee.full_name)}
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleSignOut}
              disabled={isSigningOut}
            >
              {isSigningOut ? (
                <Loader2 className="spin" aria-hidden="true" />
              ) : (
                <LogOut aria-hidden="true" />
              )}
              <span>{isSigningOut ? 'Signing out…' : 'Sign out'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        <section className="welcome-card">
          <p className="eyebrow">Authenticated workspace</p>
          <h1>Welcome, {employee.full_name}</h1>
          <p>
            You are signed in to the Lomeza Communication Platform. Company
            announcements will appear here once the dashboard is live.
          </p>
          <div className="welcome-meta">
            <span className="meta-pill">
              <Mail aria-hidden="true" />
              {employee.company_email}
            </span>
            <span className="meta-pill">
              <ShieldCheck aria-hidden="true" />
              {primaryRole}
            </span>
            <span className="meta-pill">
              <CheckCircle2 aria-hidden="true" />
              Account active
            </span>
          </div>
        </section>

        {signOutError && (
          <div className="alert alert-error" role="alert">
            {signOutError}
          </div>
        )}

        <div className="content-grid">
          <section className="panel" aria-labelledby="profile-heading">
            <div className="panel-header">
              <div>
                <h2 id="profile-heading">Employee profile</h2>
                <p>Your current company record.</p>
              </div>
              <span className="status-badge">
                <CheckCircle2 aria-hidden="true" />
                Active
              </span>
            </div>

            <div className="profile-grid">
              <div className="profile-item">
                <span className="profile-label">Full name</span>
                <span className="profile-value">{employee.full_name}</span>
              </div>
              <div className="profile-item">
                <span className="profile-label">Company email</span>
                <span className="profile-value">{employee.company_email}</span>
              </div>
              <div className="profile-item">
                <span className="profile-label">Employee number</span>
                <span className="profile-value">
                  {employee.employee_number ?? 'Not assigned'}
                </span>
              </div>
              <div className="profile-item">
                <span className="profile-label">Account status</span>
                <span className="profile-value">Active</span>
              </div>
            </div>
          </section>

          <section className="panel" aria-labelledby="roles-heading">
            <div className="panel-header">
              <div>
                <h2 id="roles-heading">Your access</h2>
                <p>Roles assigned by your administrator.</p>
              </div>
              <ShieldCheck className="panel-icon" aria-hidden="true" />
            </div>

            {displayRoles.length > 0 ? (
              <div className="role-list">
                {displayRoles.map((role) => (
                  <span className="role-chip" key={role}>
                    {role}
                  </span>
                ))}
              </div>
            ) : (
              <p className="empty-note">
                No roles have been assigned yet. Contact your administrator if
                you need access.
              </p>
            )}

            <p className="panel-note">
              Permissions are enforced by database security policies, not by
              this screen.
            </p>
          </section>
        </div>

        <section className="panel next-phase" aria-labelledby="next-heading">
          <div className="next-phase-icon">
            <LayoutDashboard aria-hidden="true" />
          </div>
          <h2 id="next-heading">Communication Dashboard coming next</h2>
          <p>
            The live announcement feed, location targeting, acknowledgements,
            comments and reactions will be implemented in the next phase. Your
            authenticated session and employee profile are ready.
          </p>
        </section>
      </main>

      <footer className="app-footer">
        Lomeza Mining Services · Internal communications · Authorised users
        only
      </footer>
    </div>
  )
}
