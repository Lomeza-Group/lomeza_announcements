import { useState } from 'react'
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Circle,
  LockKeyhole,
  Mail,
  MapPin,
  ShieldCheck,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { BrandLockup } from './Brand'

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

export function DemoLogin() {
  const { demoEmployees = [], demoSignIn } = useAuth()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selectedEmployee =
    demoEmployees.find((employee) => employee.id === selectedId) ?? null

  const handleEnter = () => {
    if (selectedEmployee && demoSignIn) {
      demoSignIn(selectedEmployee)
    }
  }

  return (
    <div className="auth-shell">
      <aside className="auth-brand-panel">
        <BrandLockup />

        <div className="brand-panel-content">
          <p className="eyebrow">Lomeza Mining Services</p>
          <h1>Welcome to Lomeza</h1>
          <p className="brand-lead">
            Sign in to access company announcements and updates.
          </p>
          <ul className="brand-points">
            <li>
              <ShieldCheck aria-hidden="true" />
              Role-based access for every site and team
            </li>
            <li>
              <LockKeyhole aria-hidden="true" />
              Secure company sign-in
            </li>
            <li>
              <Building2 aria-hidden="true" />
              Built for the Lomeza workforce
            </li>
          </ul>
        </div>

        <p className="brand-footnote">
          Lomeza Mining Services · Internal use only
        </p>
      </aside>

      <main className="auth-form-panel">
        <div className="auth-card auth-card-wide">
          <header className="auth-card-header">
            <p className="eyebrow">Employee access</p>
            <h2>Employee sign in</h2>
            <p>Select your profile to continue to the Communication Platform.</p>
          </header>

          <div
            className="demo-employee-list"
            role="radiogroup"
            aria-label="Select your profile"
          >
            {demoEmployees.map((employee) => {
              const selected = selectedEmployee?.id === employee.id

              return (
                <button
                  key={employee.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={`demo-employee-card${
                    selected ? ' is-selected' : ''
                  }`}
                  onClick={() => setSelectedId(employee.id)}
                >
                  <span className="demo-employee-avatar" aria-hidden="true">
                    {getInitials(employee.full_name)}
                  </span>

                  <span className="demo-employee-info">
                    <span className="demo-employee-name">
                      {employee.full_name}
                    </span>
                    <span className="demo-employee-meta">
                      <Mail aria-hidden="true" />
                      {employee.company_email}
                    </span>
                  </span>

                  <span className="demo-employee-badges">
                    <span className="demo-badge demo-badge-role">
                      <ShieldCheck aria-hidden="true" />
                      {employee.roleLabel}
                    </span>
                    <span className="demo-badge demo-badge-location">
                      <MapPin aria-hidden="true" />
                      {employee.locationName}
                    </span>
                  </span>

                  <span className="demo-select-indicator" aria-hidden="true">
                    {selected ? <CheckCircle2 /> : <Circle />}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="demo-card-actions">
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={handleEnter}
              disabled={!selectedEmployee}
            >
              Sign In
              <ArrowRight aria-hidden="true" />
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
