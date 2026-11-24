import { useState } from 'react'
import type { FormEvent } from 'react'
import { X } from 'lucide-react'
import type {
  LocationInput,
  LocationRecord,
  LocationResult,
} from '../locations/locationTypes'
import { collectDescendantIds } from '../locations/locationTypes'

interface LocationFormProps {
  editingLocation?: LocationRecord | null
  locations: LocationRecord[]
  onSubmit: (input: LocationInput) => LocationResult
  onCancel: () => void
}

export function LocationForm({
  editingLocation = null,
  locations,
  onSubmit,
  onCancel,
}: LocationFormProps) {
  const [name, setName] = useState(editingLocation?.name ?? '')
  const [code, setCode] = useState(editingLocation?.code ?? '')
  const [parentId, setParentId] = useState<string>(
    editingLocation?.parent_id ?? '',
  )
  const [isAssignable, setIsAssignable] = useState(
    editingLocation?.is_assignable ?? true,
  )
  const [isActive, setIsActive] = useState(editingLocation?.is_active ?? true)
  const [error, setError] = useState<string | null>(null)

  const editingId = editingLocation?.id
  const descendantIds = editingId
    ? collectDescendantIds(locations, editingId)
    : []

  const parentOptions = locations
    .filter((location) => {
      if (location.id === editingId) {
        return false
      }

      if (descendantIds.includes(location.id)) {
        return false
      }

      if (!location.is_active) {
        return editingLocation?.parent_id === location.id
      }

      return true
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    const result = onSubmit({
      name,
      code,
      parent_id: parentId || null,
      is_assignable: isAssignable,
      is_active: isActive,
    })

    if (!result.success) {
      setError(result.error)
    }
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal-card modal-card-form"
        role="dialog"
        aria-modal="true"
        aria-label={editingLocation ? 'Edit location' : 'Add location'}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">
            {editingLocation ? 'Edit location' : 'Add location'}
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
            <label htmlFor="location-name">Location name</label>
            <input
              id="location-name"
              className="editor-input"
              value={name}
              onChange={(event) => {
                setName(event.target.value)
                setError(null)
              }}
              placeholder="Location name"
            />
          </div>

          <div className="form-field">
            <label htmlFor="location-code">Location code</label>
            <input
              id="location-code"
              className="editor-input"
              value={code}
              onChange={(event) => {
                setCode(event.target.value.toUpperCase())
                setError(null)
              }}
              placeholder="e.g. HO"
            />
          </div>

          <div className="form-field">
            <label htmlFor="location-parent">Parent location (optional)</label>
            <select
              id="location-parent"
              className="editor-select"
              value={parentId}
              onChange={(event) => {
                setParentId(event.target.value)
                setError(null)
              }}
            >
              <option value="">No parent (top level)</option>
              {parentOptions.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                  {!location.is_active ? ' (inactive)' : ''}
                </option>
              ))}
            </select>
          </div>

          <label className="toggle-row">
            <input
              type="checkbox"
              checked={isAssignable}
              onChange={(event) => setIsAssignable(event.target.checked)}
            />
            <span className="toggle-switch" aria-hidden="true" />
            <span className="toggle-copy">
              <span className="toggle-label">Assignable location</span>
              <span className="toggle-description">
                Employees can be assigned to this location.
              </span>
            </span>
          </label>

          <label className="toggle-row">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
            />
            <span className="toggle-switch" aria-hidden="true" />
            <span className="toggle-copy">
              <span className="toggle-label">Active location</span>
              <span className="toggle-description">
                Active locations can be used for new assignments and
                announcement targeting.
              </span>
            </span>
          </label>

          {error && (
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          )}

          <div className="editor-actions">
            <button type="submit" className="btn btn-primary">
              Save location
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
