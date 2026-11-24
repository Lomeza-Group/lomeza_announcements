import { useState } from 'react'
import type { FormEvent } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  LogOut,
  ShieldCheck,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { BrandLockup, BrandMark } from './Brand'

interface PasswordErrors {
  newPassword?: string
  confirmPassword?: string
}

function validatePassword(
  newPassword: string,
  confirmPassword: string,
): PasswordErrors {
  const errors: PasswordErrors = {}

  if (newPassword.length < 12) {
    errors.newPassword = 'Use at least 12 characters.'
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Re-enter your new password.'
  } else if (confirmPassword !== newPassword) {
    errors.confirmPassword = 'Passwords do not match.'
  }

  return errors
}

export function ChangePassword() {
  const {
    user,
    changePassword,
    completePasswordChange,
    logout,
    isPasswordRecovery,
  } = useAuth()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<PasswordErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleNewPasswordChange = (value: string) => {
    setNewPassword(value)
    setErrors((current) => ({ ...current, newPassword: undefined }))
    setFormError(null)
  }

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value)
    setErrors((current) => ({ ...current, confirmPassword: undefined }))
    setFormError(null)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors = validatePassword(newPassword, confirmPassword)

    if (nextErrors.newPassword || nextErrors.confirmPassword) {
      setErrors(nextErrors)
      setFormError(null)
      return
    }

    setErrors({})
    setFormError(null)
    setIsSubmitting(true)

    const error = await changePassword(newPassword)

    if (error) {
      setFormError(error)
      setIsSubmitting(false)
      return
    }

    setNewPassword('')
    setConfirmPassword('')
    setIsSubmitting(false)
    setIsComplete(true)
  }

  const handleSignOut = async () => {
    setIsSigningOut(true)
    const error = await logout()

    if (error) {
      setFormError(error)
      setIsSigningOut(false)
    }
  }

  const brandPanel = (
    <aside className="auth-brand-panel">
      <BrandLockup />

      <div className="brand-panel-content">
        <p className="eyebrow">Account security</p>
        <h1>Set a permanent password</h1>
        <p className="brand-lead">
          Your temporary password must be replaced before you can access
          company communications.
        </p>
        <ul className="brand-points">
          <li>
            <ShieldCheck aria-hidden="true" />
            Minimum of 12 characters
          </li>
          <li>
            <LockKeyhole aria-hidden="true" />
            Only you will know your password
          </li>
          <li>
            <ShieldCheck aria-hidden="true" />
            Passwords are never stored in the browser
          </li>
        </ul>
      </div>

      <p className="brand-footnote">
        Lomeza Mining Services · Internal use only
      </p>
    </aside>
  )

  if (isComplete) {
    return (
      <div className="auth-shell">
        {brandPanel}
        <main className="auth-form-panel">
          <div className="auth-card auth-card-centered">
            <BrandMark />
            <div className="state-icon is-success">
              <CheckCircle2 aria-hidden="true" />
            </div>
            <h2>Password updated</h2>
            <p className="auth-card-copy">
              Your new password has been saved. You can now continue to the
              Communication Platform.
            </p>
            {formError && (
              <div className="alert alert-error" role="alert">
                <AlertCircle aria-hidden="true" />
                <span>{formError}</span>
              </div>
            )}
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={completePasswordChange}
            >
              Continue
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-block"
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
        </main>
      </div>
    )
  }

  return (
    <div className="auth-shell">
      {brandPanel}

      <main className="auth-form-panel">
        <div className="auth-card">
          <header className="auth-card-header">
            <p className="eyebrow">
              {isPasswordRecovery ? 'Password recovery' : 'First-time sign-in'}
            </p>
            <h2>
              {isPasswordRecovery
                ? 'Choose a new password'
                : 'Create a new password'}
            </h2>
            <p>
              {isPasswordRecovery
                ? 'Enter a new password for your account to complete the password reset.'
                : 'Replace your temporary password with a permanent password before continuing.'}
            </p>
            {user?.email && (
              <p className="auth-signed-in">
                Signed in as <strong>{user.email}</strong>
              </p>
            )}
          </header>

          <form onSubmit={handleSubmit} noValidate>
            {formError && (
              <div className="alert alert-error" role="alert">
                <AlertCircle aria-hidden="true" />
                <span>{formError}</span>
              </div>
            )}

            <div className="form-field">
              <label htmlFor="new-password">New password</label>
              <div
                className={`input-shell has-toggle${
                  errors.newPassword ? ' has-error' : ''
                }`}
              >
                <LockKeyhole className="input-icon" aria-hidden="true" />
                <input
                  id="new-password"
                  name="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(event) =>
                    handleNewPasswordChange(event.target.value)
                  }
                  placeholder="Enter a new password"
                  autoComplete="new-password"
                  autoFocus
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.newPassword)}
                  aria-describedby={
                    errors.newPassword
                      ? 'new-password-error'
                      : 'new-password-hint'
                  }
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowNewPassword((current) => !current)}
                  aria-label={
                    showNewPassword ? 'Hide new password' : 'Show new password'
                  }
                  aria-pressed={showNewPassword}
                  disabled={isSubmitting}
                >
                  {showNewPassword ? (
                    <EyeOff aria-hidden="true" />
                  ) : (
                    <Eye aria-hidden="true" />
                  )}
                </button>
              </div>
              {errors.newPassword ? (
                <p className="field-error" id="new-password-error">
                  {errors.newPassword}
                </p>
              ) : (
                <p className="field-hint" id="new-password-hint">
                  Use at least 12 characters. Avoid passwords you use
                  elsewhere.
                </p>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="confirm-password">Confirm new password</label>
              <div
                className={`input-shell has-toggle${
                  errors.confirmPassword ? ' has-error' : ''
                }`}
              >
                <LockKeyhole className="input-icon" aria-hidden="true" />
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(event) =>
                    handleConfirmPasswordChange(event.target.value)
                  }
                  placeholder="Re-enter your new password"
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.confirmPassword)}
                  aria-describedby={
                    errors.confirmPassword
                      ? 'confirm-password-error'
                      : undefined
                  }
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowConfirmPassword((current) => !current)
                  }
                  aria-label={
                    showConfirmPassword
                      ? 'Hide confirmed password'
                      : 'Show confirmed password'
                  }
                  aria-pressed={showConfirmPassword}
                  disabled={isSubmitting}
                >
                  {showConfirmPassword ? (
                    <EyeOff aria-hidden="true" />
                  ) : (
                    <Eye aria-hidden="true" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="field-error" id="confirm-password-error">
                  {errors.confirmPassword}
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
                  Updating password…
                </>
              ) : (
                <>
                  Save new password
                  <ShieldCheck aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          <button
            type="button"
            className="btn btn-ghost btn-block auth-signout"
            onClick={handleSignOut}
            disabled={isSigningOut || isSubmitting}
          >
            {isSigningOut ? (
              <Loader2 className="spin" aria-hidden="true" />
            ) : (
              <LogOut aria-hidden="true" />
            )}
            {isSigningOut ? 'Signing out…' : 'Sign out instead'}
          </button>
        </div>
      </main>
    </div>
  )
}
