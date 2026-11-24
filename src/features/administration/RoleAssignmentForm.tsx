import { useState } from 'react'
import type { FormEvent } from 'react'
import { X } from 'lucide-react'
import type {
  EmployeeRecord,
  RoleAssignmentRules,
  RoleUpdateResult,
} from '../employees/employeeTypes'
import type { RoleDefinition } from '../employees/roleDefinitions'

interface RoleAssignmentFormProps {
  employee: EmployeeRecord
  roles: RoleDefinition[]
  rules: RoleAssignmentRules
  validate: (codes: string[]) => string | null
  onSave: (codes: string[]) => RoleUpdateResult
  onCancel: () => void
}

export function RoleAssignmentForm({
  employee,
  roles,
  rules,
  validate,
  onSave,
  onCancel,
}: RoleAssignmentFormProps) {
  const [selected, setSelected] = useState<string[]>(employee.roles)
  const [confirming, setConfirming] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const validationError = rules.canModify ? validate(selected) : null
  const removedRoles = employee.roles.filter(
    (code) => !selected.includes(code),
  )
  const removesSensitive =
    removedRoles.includes('administrator') ||
    removedRoles.includes('super_administrator')

  const roleName = (code: string) =>
    roles.find((role) => role.code === code)?.name ?? code

  const toggleRole = (code: string) => {
    setSelected((current) =>
      current.includes(code)
        ? current.filter((item) => item !== code)
        : [...current, code],
    )
    setFormError(null)
  }

  const commit = () => {
    const result = onSave(selected)

    if (!result.success) {
      setFormError(result.error)
      setConfirming(false)
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (validationError) {
      return
    }

    if (removesSensitive) {
      setConfirming(true)
      return
    }

    commit()
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal-card modal-card-form"
        role="dialog"
        aria-modal="true"
        aria-label={`Manage roles for ${employee.full_name}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">Manage roles</h2>
          <button
            type="button"
            className="modal-close"
            onClick={onCancel}
            aria-label="Close"
          >
            <X aria-hidden="true" />
          </button>
        </div>

        <p className="role-form-subtitle">
          {employee.full_name} · {employee.company_email}
        </p>

        {!rules.canModify ? (
          <>
            <div className="alert alert-error" role="alert">
              {rules.reason}
            </div>
            <div className="role-option-list">
              {roles
                .filter((role) => employee.roles.includes(role.code))
                .map((role) => (
                  <div className="role-option is-readonly" key={role.code}>
                    <span className="role-option-body">
                      <span className="role-option-name">{role.name}</span>
                      <span className="role-option-desc">
                        {role.description}
                      </span>
                    </span>
                  </div>
                ))}
            </div>
            <div className="editor-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onCancel}
              >
                Close
              </button>
            </div>
          </>
        ) : confirming ? (
          <>
            <p className="role-confirm-text">
              You are about to remove the following sensitive role
              {removedRoles.length > 1 ? 's' : ''} from {employee.full_name}:{' '}
              <strong>{removedRoles.map(roleName).join(', ')}</strong>. This
              changes their platform access immediately.
            </p>
            {formError && (
              <div className="alert alert-error" role="alert">
                {formError}
              </div>
            )}
            <div className="editor-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={commit}
              >
                Confirm changes
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setConfirming(false)}
              >
                Go back
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="role-option-list">
              {roles.map((role) => {
                const isSelected = selected.includes(role.code)

                return (
                  <label
                    className={`role-option${
                      isSelected ? ' is-selected' : ''
                    }`}
                    key={role.code}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleRole(role.code)}
                    />
                    <span className="role-option-body">
                      <span className="role-option-name">{role.name}</span>
                      <span className="role-option-desc">
                        {role.description}
                      </span>
                    </span>
                  </label>
                )
              })}
            </div>

            {validationError && (
              <p className="role-warning">{validationError}</p>
            )}
            {formError && (
              <div className="alert alert-error" role="alert">
                {formError}
              </div>
            )}

            <div className="editor-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={Boolean(validationError)}
              >
                Save changes
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={onCancel}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
