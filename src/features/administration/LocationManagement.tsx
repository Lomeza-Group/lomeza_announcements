import { useState } from 'react'
import {
  Building2,
  CheckCircle2,
  MapPin,
  Pencil,
  Plus,
  Power,
  PowerOff,
  Search,
  ShieldX,
  UserCheck,
} from 'lucide-react'
import { PlaceholderPage } from '../../components/layout/PlaceholderPage'
import type { EmployeeProfile } from '../../types/auth'
import { canAccessAdministration } from '../../utils/roles'
import { StatCard } from '../dashboard/StatCard'
import { useLocations } from '../locations/locationsContext'
import type {
  LocationInput,
  LocationRecord,
  LocationResult,
} from '../locations/locationTypes'
import { LocationForm } from './LocationForm'

type StatusFilter = 'all' | 'active' | 'inactive'
type AssignableFilter = 'all' | 'assignable' | 'not-assignable'

const STATUS_FILTERS: StatusFilter[] = ['all', 'active', 'inactive']
const ASSIGNABLE_FILTERS: AssignableFilter[] = [
  'all',
  'assignable',
  'not-assignable',
]

interface Notice {
  type: 'success' | 'error'
  message: string
}

export function LocationManagement({
  employee,
}: {
  employee: EmployeeProfile
}) {
  const {
    locations,
    createLocation,
    updateLocation,
    setLocationActive,
    getLocationById,
    getChildren,
    getActiveEmployeeCount,
    canDeactivateLocation,
  } = useLocations()

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [assignableFilter, setAssignableFilter] =
    useState<AssignableFilter>('all')
  const [formState, setFormState] = useState<LocationRecord | 'new' | null>(
    null,
  )
  const [deactivating, setDeactivating] = useState<LocationRecord | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)

  if (!canAccessAdministration(employee)) {
    return (
      <PlaceholderPage
        icon={ShieldX}
        title="Access restricted"
        description="You do not have permission to manage locations."
      />
    )
  }

  const total = locations.length
  const activeCount = locations.filter((location) => location.is_active).length
  const assignableCount = locations.filter(
    (location) => location.is_assignable,
  ).length
  const parentCount = locations.filter((location) =>
    locations.some((child) => child.parent_id === location.id),
  ).length

  const ordered: { location: LocationRecord; depth: number }[] = []
  const visit = (parentId: string | null, depth: number) => {
    const children = locations
      .filter((location) => location.parent_id === parentId)
      .sort((a, b) => a.name.localeCompare(b.name))

    for (const child of children) {
      ordered.push({ location: child, depth })
      visit(child.id, depth + 1)
    }
  }
  visit(null, 0)

  const normalized = query.trim().toLowerCase()
  const filtered = ordered.filter(({ location }) => {
    const matchesQuery =
      normalized === '' ||
      `${location.name} ${location.code}`.toLowerCase().includes(normalized)
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' ? location.is_active : !location.is_active)
    const matchesAssignable =
      assignableFilter === 'all' ||
      (assignableFilter === 'assignable'
        ? location.is_assignable
        : !location.is_assignable)

    return matchesQuery && matchesStatus && matchesAssignable
  })

  const handleFormSubmit = (input: LocationInput): LocationResult => {
    const isEdit = formState && formState !== 'new'
    const result = isEdit
      ? updateLocation(formState.id, input)
      : createLocation(input)

    if (result.success) {
      setNotice({
        type: 'success',
        message: isEdit
          ? `${input.name.trim()} has been updated.`
          : `${input.name.trim()} has been added.`,
      })
      setFormState(null)
    }

    return result
  }

  const confirmDeactivate = () => {
    if (!deactivating) {
      return
    }

    const result = setLocationActive(deactivating.id, false)

    if (result.success) {
      setNotice({
        type: 'success',
        message: `${deactivating.name} has been deactivated.`,
      })
    } else {
      setNotice({
        type: 'error',
        message: result.error ?? 'Unable to deactivate location.',
      })
    }

    setDeactivating(null)
  }

  const reactivate = (location: LocationRecord) => {
    const result = setLocationActive(location.id, true)

    if (result.success) {
      setNotice({
        type: 'success',
        message: `${location.name} has been activated.`,
      })
    } else {
      setNotice({
        type: 'error',
        message: result.error ?? 'Unable to activate location.',
      })
    }
  }

  return (
    <div>
      <div className="management-header">
        <div>
          <h1>Location Management</h1>
          <p>
            Manage company locations, hierarchy and assignment availability.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setFormState('new')}
        >
          <Plus aria-hidden="true" />
          Add Location
        </button>
      </div>

      {notice && (
        <div
          className={`alert ${
            notice.type === 'success' ? 'alert-success' : 'alert-error'
          }`}
          role="status"
        >
          {notice.message}
        </div>
      )}

      <div className="stat-grid">
        <StatCard
          label="Total locations"
          value={total}
          icon={MapPin}
          tone="primary"
        />
        <StatCard
          label="Active locations"
          value={activeCount}
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          label="Assignable locations"
          value={assignableCount}
          icon={UserCheck}
          tone="info"
        />
        <StatCard
          label="Parent locations"
          value={parentCount}
          icon={Building2}
          tone="warning"
        />
      </div>

      <div className="feed-toolbar">
        <div className="feed-search">
          <Search className="search-icon" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or code"
            aria-label="Search locations"
          />
        </div>

        <div className="filter-group">
          <span className="filter-label">Status</span>
          <div className="filter-chips">
            {STATUS_FILTERS.map((value) => (
              <button
                key={value}
                type="button"
                className={`filter-chip${
                  statusFilter === value ? ' is-active' : ''
                }`}
                onClick={() => setStatusFilter(value)}
              >
                {value === 'all' ? 'All' : value[0].toUpperCase() + value.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <span className="filter-label">Assignable</span>
          <div className="filter-chips">
            {ASSIGNABLE_FILTERS.map((value) => (
              <button
                key={value}
                type="button"
                className={`filter-chip${
                  assignableFilter === value ? ' is-active' : ''
                }`}
                onClick={() => setAssignableFilter(value)}
              >
                {value === 'all'
                  ? 'All'
                  : value === 'assignable'
                    ? 'Assignable'
                    : 'Not assignable'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="location-tree">
          {filtered.map(({ location, depth }) => {
            const parentName = location.parent_id
              ? (getLocationById(location.parent_id)?.name ?? '—')
              : '—'
            const childCount = getChildren(location.id).length
            const activeEmployees = getActiveEmployeeCount(location.id)

            return (
              <div
                className="location-row"
                key={location.id}
                style={{ paddingLeft: `${0.85 + depth * 1.5}rem` }}
              >
                <div className="location-row-main">
                  <div className="location-name-line">
                    <span className="location-name">{location.name}</span>
                    <span className="location-code">{location.code}</span>
                    <span
                      className={`location-badge ${
                        location.is_assignable
                          ? 'is-assignable'
                          : 'is-not-assignable'
                      }`}
                    >
                      {location.is_assignable
                        ? 'Assignable'
                        : 'Not assignable'}
                    </span>
                    <span
                      className={`location-badge ${
                        location.is_active ? 'is-active' : 'is-inactive'
                      }`}
                    >
                      {location.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="location-meta">
                    <span>Parent: {parentName}</span>
                    <span>
                      {activeEmployees} active{' '}
                      {activeEmployees === 1 ? 'employee' : 'employees'}
                    </span>
                    <span>
                      {childCount}{' '}
                      {childCount === 1 ? 'child location' : 'child locations'}
                    </span>
                  </div>
                </div>

                <div className="location-actions">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setFormState(location)}
                  >
                    <Pencil aria-hidden="true" />
                    Edit
                  </button>
                  {location.is_active ? (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setDeactivating(location)}
                    >
                      <PowerOff aria-hidden="true" />
                      Deactivate
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => reactivate(location)}
                    >
                      <Power aria-hidden="true" />
                      Reactivate
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="feed-empty">
          <MapPin aria-hidden="true" />
          <h2>No locations found</h2>
          <p>Try adjusting your search or filters.</p>
        </div>
      )}

      {formState && (
        <LocationForm
          editingLocation={formState === 'new' ? null : formState}
          locations={locations}
          onSubmit={handleFormSubmit}
          onCancel={() => setFormState(null)}
        />
      )}

      {deactivating &&
        (() => {
          const check = canDeactivateLocation(deactivating.id)

          return (
            <div
              className="modal-overlay"
              onClick={() => setDeactivating(null)}
            >
              <div
                className="modal-card modal-card-confirm"
                role="dialog"
                aria-modal="true"
                aria-label="Deactivate location"
                onClick={(event) => event.stopPropagation()}
              >
                <div
                  className={`state-icon ${
                    check.allowed ? 'is-warning' : 'is-error'
                  }`}
                >
                  <MapPin aria-hidden="true" />
                </div>
                <h2>
                  {check.allowed
                    ? 'Deactivate location?'
                    : 'Unable to deactivate'}
                </h2>
                <p>
                  {check.allowed
                    ? `${deactivating.name} will no longer be selectable for new employee assignments or announcements. It can be reactivated later.`
                    : check.reason}
                </p>
                <div className="editor-actions">
                  {check.allowed && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={confirmDeactivate}
                    >
                      Deactivate
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setDeactivating(null)}
                  >
                    {check.allowed ? 'Cancel' : 'Close'}
                  </button>
                </div>
              </div>
            </div>
          )
        })()}
    </div>
  )
}
