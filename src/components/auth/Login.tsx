import { useState } from 'react'
import type { FormEvent } from 'react'
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { BrandLockup } from './Brand'

interface LoginErrors {
  email?: string
  password?: string
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateLogin(email: string, password: string): LoginErrors {
  const errors: LoginErrors = {}
  const trimmedEmail = email.trim()

  if (!trimmedEmail) {
    errors.email = 'Enter your company email address.'
  } else if (!emailPattern.test(trimmedEmail)) {
    errors.email = 'Enter a valid company email address.'
  }

  if (!password) {
    errors.password = 'Enter your password.'
  }

  return errors
}

export function Login() {
  const { login, authError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<LoginErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const errorMessage = formError ?? authError

  const handleEmailChange = (value: string) => {
    setEmail(value)
    setErrors((current) => ({ ...current, email: undefined }))
    setFormError(null)
  }

  const handlePasswordChange = (value: string) => {
    setPassword(value)
    setErrors((current) => ({ ...current, password: undefined }))
    setFormError(null)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors = validateLogin(email, password)

    if (nextErrors.email || nextErrors.password) {
      setErrors(nextErrors)
      setFormError(null)
      return
    }

    setErrors({})
    setFormError(null)
    setIsSubmitting(true)

    const error = await login(email, password)

    if (error) {
      setFormError(error)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-shell">
      <aside className="auth-brand-panel">
        <BrandLockup />

        <div className="brand-panel-content">
          <p className="eyebrow">Lomeza Mining Services</p>
          <h1>Communication Platform</h1>
          <p className="brand-lead">
            Your central place for company announcements, operational updates,
            safety communications and employee notices.
          </p>
          <ul className="brand-points">
            <li>
              <ShieldCheck aria-hidden="true" />
              Role-based access for every site and team
            </li>
            <li>
              <LockKeyhole aria-hidden="true" />
              Secure company-authenticated sign-in
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
        <div className="auth-card">
          <header className="auth-card-header">
            <p className="eyebrow">Employee access</p>
            <h2>Sign in</h2>
            <p>Use your official Lomeza company email and password.</p>
          </header>

          <form onSubmit={handleSubmit} noValidate>
            {errorMessage && (
              <div className="alert alert-error" role="alert">
                <AlertCircle aria-hidden="true" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="form-field">
              <label htmlFor="login-email">Company email</label>
              <div
                className={`input-shell${errors.email ? ' has-error' : ''}`}
              >
                <Mail className="input-icon" aria-hidden="true" />
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(event) => handleEmailChange(event.target.value)}
                  placeholder="name@lomeza.co.za"
                  autoComplete="email"
                  inputMode="email"
                  spellCheck={false}
                  autoFocus
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={
                    errors.email ? 'login-email-error' : undefined
                  }
                />
              </div>
              {errors.email && (
                <p className="field-error" id="login-email-error">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="login-password">Password</label>
              <div
                className={`input-shell has-toggle${
                  errors.password ? ' has-error' : ''
                }`}
              >
                <LockKeyhole className="input-icon" aria-hidden="true" />
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => handlePasswordChange(event.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={
                    errors.password ? 'login-password-error' : undefined
                  }
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={
                    showPassword ? 'Hide password' : 'Show password'
                  }
                  aria-pressed={showPassword}
                  disabled={isSubmitting}
                >
                  {showPassword ? (
                    <EyeOff aria-hidden="true" />
                  ) : (
                    <Eye aria-hidden="true" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="field-error" id="login-password-error">
                  {errors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="spin" aria-hidden="true" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          <p className="auth-help">
            Need access or forgotten your password? Contact your Lomeza
            administrator. Accounts are provisioned internally and are not
            available for public registration.
          </p>
        </div>
      </main>
    </div>
  )
}
