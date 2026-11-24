import { useEffect, useRef, useState } from 'react'
import { ChevronDown, LogOut, MapPin, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useLocations } from '../../features/locations/locationsContext'
import type { EmployeeProfile } from '../../types/auth'
import { formatRole, getInitials } from '../../utils/format'

export function EmployeeMenu({ employee }: { employee: EmployeeProfile }) {
  const { logout } = useAuth()
  const { getLocationName } = useLocations()
  const [open, setOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const roleLabel =
    employee.roleLabel ??
    (employee.roles[0] ? formatRole(employee.roles[0]) : 'Employee')
  const location = getLocationName(employee.location_id) ?? employee.locationName

  const handleSignOut = async () => {
    setIsSigningOut(true)
    setError(null)

    const result = await logout()

    if (result) {
      setError(result)
      setIsSigningOut(false)
    }
  }

  return (
    <div className="employee-menu" ref={menuRef}>
      <button
        type="button"
        className="employee-menu-trigger"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="avatar" aria-hidden="true">
          {getInitials(employee.full_name)}
        </span>
        <span className="employee-menu-name">{employee.full_name}</span>
        <ChevronDown className="employee-menu-caret" aria-hidden="true" />
      </button>

      {open && (
        <div className="employee-menu-dropdown" role="menu">
          <div className="dropdown-header">
            <span className="avatar" aria-hidden="true">
              {getInitials(employee.full_name)}
            </span>
            <div className="dropdown-identity">
              <div className="dropdown-name">{employee.full_name}</div>
              <div className="dropdown-email">{employee.company_email}</div>
            </div>
          </div>

          <div className="dropdown-meta">
            <span>
              <ShieldCheck aria-hidden="true" />
              {roleLabel}
            </span>
            {location && (
              <span>
                <MapPin aria-hidden="true" />
                {location}
              </span>
            )}
          </div>

          {error && (
            <p className="dropdown-error" role="alert">
              {error}
            </p>
          )}

          <div className="dropdown-divider" />

          <button
            type="button"
            className="dropdown-item is-danger"
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            <LogOut aria-hidden="true" />
            {isSigningOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      )}
    </div>
  )
}
