import { useState } from 'react'
import type { FormEvent } from 'react'
import { X } from 'lucide-react'
import type { LocationRecord } from '../locations/locationTypes'
import type { EmployeeInput, EmployeeRecord } from '../employees/employeeTypes'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface EmployeeFormErrors {
  fullName?: string
  employeeNumber?: string
  email?: string
  location?: string
}

interface EmployeeFormProps {
  editingEmployee?: EmployeeRecord | null
  existingEmployees: EmployeeRecord[]
  locations: LocationRecord[]
  onSubmit: (input: EmployeeInput) => void
  onCancel: () => void
}

export function EmployeeForm({
  editingEmployee = null,
  existingEmployees,
  locations,
  onSubmit,
  onCancel,
}: EmployeeFormProps) {
  const [fullName, setFullName] = useState(editingEmployee?.full_name ?? '')
  const [employeeNumber, setEmployeeNumber] = useState(
    editingEmployee?.employee_number ?? '',
  )
  const [email, setEmail] = useState(editingEmployee?.company_email ?? '')
  const [locationId, setLocationId] = useState(
    editingEmployee?.location_id ?? locations[0]?.id ?? '',
  )
  const [isActive, setIsActive] = useState(editingEmployee?.is_active ?? true)
  const [errors, setErrors] = useState<EmployeeFormErrors>({})

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedName = fullName.trim()
    const trimmedNumber = employeeNumber.trim()
    const trimmedEmail = email.trim()
    const editingId = editingEmployee?.id
    const selectedLocation = locations.find(
      (location) => location.id === locationId,
    )
    const nextErrors: EmployeeFormErrors = {}

    if (!trimmedName) {
      nextErrors.fullName = "Enter the employee's full name."
    }

    if (!trimmedEmail) {
      nextErrors.email = 'Enter the company email address.'
    } else if (!emailPattern.test(trimmedEmail)) {
      nextErrors.email = 'Enter a valid email address.'
    }

    if (!locationId || !selectedLocation) {
      nextErrors.location = 'Select a valid active location.'
    }

    if (
      trimmedNumber &&
      existingEmployees.some(
        (employee) =>
          employee.id !== editingId &&
          (employee.employee_number ?? '').trim().toLowerCase() ===
            trimmedNumber.toLowerCase(),
      )
    ) {
      nextErrors.employeeNumber = 'This employee number is already in use.'
    }

    if (
      trimmedEmail &&
      existingEmployees.some(
        (employee) =>
          employee.id !== editingId &&
          employee.company_email.trim().toLowerCase() ===
            trimmedEmail.toLowerCase(),
      )
    ) {
      nextErrors.email = 'This email address is already in use.'
    }

    if (
      nextErrors.fullName ||
      nextErrors.employeeNumber ||
      nextErrors.email ||
      nextErrors.location ||
      !selectedLocation
    ) {
      setErrors(nextErrors)
      return
    }

    onSubmit({
      full_name: trimmedName,
      employee_number: trimmedNumber || null,
      company_email: trimmedEmail,
      location_id: selectedLocation.id,
      locationName: selectedLocation.name,
      is_active: isActive,
      roles: editingEmployee?.roles ?? ['employee'],
    })
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal-card modal-card-form"
        role="dialog"
        aria-modal="true"
        aria-label={editingEmployee ? 'Edit employee' : 'Add employee'}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">
            {editingEmployee ? 'Edit employee' : 'Add employee'}
          </h2>
          <button
            type="button"
            className="modal-close"
            onClick={onCancel}
            aria-label="Close"
          >
            <X aria-hidden="true" />
          </button>
        </div>

        <form className="employee-form" onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <label htmlFor="employee-name">Full name</label>
            <input
              id="employee-name"
              className="editor-input"
              value={fullName}
              onChange={(event) => {
                setFullName(event.target.value)
                setErrors((current) => ({ ...current, fullName: undefined }))
              }}
              placeholder="Employee full name"
            />
            {errors.fullName && <p className="field-error">{errors.fullName}</p>}
          </div>

          <div className="form-field">
            <label htmlFor="employee-number">Employee number (optional)</label>
            <input
              id="employee-number"
              className="editor-input"
              value={employeeNumber}
              onChange={(event) => {
                setEmployeeNumber(event.target.value)
                setErrors((current) => ({
                  ...current,
                  employeeNumber: undefined,
                }))
              }}
              placeholder="e.g. LMS-1005"
            />
            {errors.employeeNumber && (
              <p className="field-error">{errors.employeeNumber}</p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="employee-email">Company email</label>
            <input
              id="employee-email"
              type="email"
              className="editor-input"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                setErrors((current) => ({ ...current, email: undefined }))
              }}
              placeholder="name@lomeza.co.za"
              spellCheck={false}
            />
            {errors.email && <p className="field-error">{errors.email}</p>}
          </div>

          <div className="form-field">
            <label htmlFor="employee-location">Location</label>
            <select
              id="employee-location"
              className="editor-select"
              value={locationId}
              onChange={(event) => {
                setLocationId(event.target.value)
                setErrors((current) => ({ ...current, location: undefined }))
              }}
            >
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                  {!location.is_active ? ' (inactive)' : ''}
                  {!location.is_assignable ? ' (not assignable)' : ''}
                </option>
              ))}
            </select>
            {errors.location && <p className="field-error">{errors.location}</p>}
          </div>

          <label className="toggle-row">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
            />
            <span className="toggle-switch" aria-hidden="true" />
            <span className="toggle-copy">
              <span className="toggle-label">Active employee</span>
              <span className="toggle-description">
                Active employees appear in directories and announcement
                targeting.
              </span>
            </span>
          </label>

          <div className="editor-actions">
            <button type="submit" className="btn btn-primary">
              Save employee
            </button>
            <button type="button" className="btn btn-ghost" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
