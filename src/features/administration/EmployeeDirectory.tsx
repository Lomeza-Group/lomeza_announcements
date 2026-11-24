import { useState } from 'react'
import {
  MapPin,
  Pencil,
  Plus,
  Search,
  ShieldX,
  UserCheck,
  UserMinus,
  Users,
} from 'lucide-react'
import { PlaceholderPage } from '../../components/layout/PlaceholderPage'
import type { EmployeeProfile } from '../../types/auth'
import { formatRole } from '../../utils/format'
import { canAccessAdministration } from '../../utils/roles'
import { useLocations } from '../locations/locationsContext'
import { StatCard } from '../dashboard/StatCard'
import { useEmployees } from '../employees/employeesContext'
import type { EmployeeInput, EmployeeRecord } from '../employees/employeeTypes'
import { EmployeeForm } from './EmployeeForm'

type StatusFilter = 'all' | 'active' | 'inactive'

const STATUS_FILTERS: StatusFilter[] = ['all', 'active', 'inactive']

export function EmployeeDirectory({
  employee,
}: {
  employee: EmployeeProfile
}) {
  const { employees, addEmployee, updateEmployee, setEmployeeActive } =
    useEmployees()
  const { locations, getAssignableLocations, getLocationName } = useLocations()

  const [query, setQuery] = useState('')
  const [locationFilter, setLocationFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [formState, setFormState] = useState<EmployeeRecord | 'new' | null>(
    null,
  )
  const [deactivating, setDeactivating] = useState<EmployeeRecord | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  if (!canAccessAdministration(employee)) {
    return (
      <PlaceholderPage
        icon={ShieldX}
        title="Access restricted"
        description="You do not have permission to manage employees."
      />
    )
  }

  const total = employees.length
  const activeCount = employees.filter((record) => record.is_active).length
  const inactiveCount = total - activeCount
  const representedLocations = new Set(
    employees.map((record) => record.location_id).filter(Boolean),
  ).size

  const assignableLocations = getAssignableLocations()
  const locationFilterOptions = [...locations].sort((a, b) =>
    a.name.localeCompare(b.name),
  )

  const formLocations = (() => {
    if (formState && formState !== 'new') {
      const currentLocation = locations.find(
        (location) => location.id === formState.location_id,
      )

      if (
        currentLocation &&
        !assignableLocations.some(
          (location) => location.id === currentLocation.id,
        )
      ) {
        return [...assignableLocations, currentLocation]
      }
    }

    return assignableLocations
  })()

  const normalized = query.trim().toLowerCase()
  const filtered = employees
    .filter(
      (record) =>
        locationFilter === 'All' || record.location_id === locationFilter,
    )
    .filter((record) =>
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
          ? record.is_active
          : !record.is_active,
    )
    .filter(
      (record) =>
        normalized === '' ||
        `${record.full_name} ${record.employee_number ?? ''} ${record.company_email}`
          .toLowerCase()
          .includes(normalized),
    )
    .sort((a, b) => a.full_name.localeCompare(b.full_name))

  const handleFormSubmit = (input: EmployeeInput) => {
    if (formState && formState !== 'new') {
      updateEmployee(formState.id, input)
      setNotice(`${input.full_name} has been updated.`)
    } else {
      addEmployee(input)
      setNotice(`${input.full_name} has been added.`)
    }

    setFormState(null)
  }

  const confirmDeactivate = () => {
    if (!deactivating) {
      return
    }

    setEmployeeActive(deactivating.id, false)
    setNotice(`${deactivating.full_name} has been deactivated.`)
    setDeactivating(null)
  }

  const reactivate = (record: EmployeeRecord) => {
    setEmployeeActive(record.id, true)
    setNotice(`${record.full_name} has been activated.`)
  }

  return (
    <div>
      <div className="management-header">
        <div>
          <h1>Employee Directory</h1>
          <p>Manage employee records, assigned locations and account status.</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setFormState('new')}
        >
          <Plus aria-hidden="true" />
          Add Employee
        </button>
      </div>

      {notice && (
        <div className="alert alert-success" role="status">
          {notice}
        </div>
      )}

      <div className="stat-grid">
        <StatCard
          label="Total employees"
          value={total}
          icon={Users}
          tone="primary"
        />
        <StatCard
          label="Active employees"
          value={activeCount}
          icon={UserCheck}
          tone="success"
        />
        <StatCard
          label="Inactive employees"
          value={inactiveCount}
          icon={UserMinus}
          tone="warning"
        />
        <StatCard
          label="Locations represented"
          value={representedLocations}
          icon={MapPin}
          tone="info"
        />
      </div>

      <div className="feed-toolbar">
        <div className="feed-search">
          <Search className="search-icon" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, number or email"
            aria-label="Search employees"
          />
        </div>

        <div className="filter-group">
          <span className="filter-label">Location</span>
          <select
            className="editor-select directory-filter-select"
            value={locationFilter}
            onChange={(event) => setLocationFilter(event.target.value)}
            aria-label="Filter by location"
          >
            <option value="All">All locations</option>
            {locationFilterOptions.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
                {!location.is_active ? ' (inactive)' : ''}
              </option>
            ))}
          </select>
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
      </div>

      {filtered.length > 0 ? (
        <div className="directory-table-wrap">
          <table className="directory-table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Employee no.</th>
                <th scope="col">Company email</th>
                <th scope="col">Location</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((record) => (
                <tr key={record.id}>
                  <td>
                    <div className="directory-name">{record.full_name}</div>
                    <div className="directory-sub">
                      {record.roles.map(formatRole).join(', ') || 'Employee'}
                    </div>
                  </td>
                  <td>{record.employee_number ?? '—'}</td>
                  <td>{record.company_email}</td>
                  <td>
                    {getLocationName(record.location_id) ??
                      record.locationName ??
                      '—'}
                  </td>
                  <td>
                    <span
                      className={`employee-status ${
                        record.is_active ? 'is-active' : 'is-inactive'
                      }`}
                    >
                      {record.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="directory-actions">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setFormState(record)}
                      >
                        <Pencil aria-hidden="true" />
                        Edit
                      </button>
                      {record.is_active ? (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setDeactivating(record)}
                        >
                          <UserMinus aria-hidden="true" />
                          Deactivate
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => reactivate(record)}
                        >
                          <UserCheck aria-hidden="true" />
                          Reactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="feed-empty">
          <Users aria-hidden="true" />
          <h2>No employees found</h2>
          <p>Try adjusting your search or filters.</p>
        </div>
      )}

      {formState && (
        <EmployeeForm
          editingEmployee={formState === 'new' ? null : formState}
          existingEmployees={employees}
          locations={formLocations}
          onSubmit={handleFormSubmit}
          onCancel={() => setFormState(null)}
        />
      )}

      {deactivating && (
        <div
          className="modal-overlay"
          onClick={() => setDeactivating(null)}
        >
          <div
            className="modal-card modal-card-confirm"
            role="dialog"
            aria-modal="true"
            aria-label="Deactivate employee"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="state-icon is-warning">
              <UserMinus aria-hidden="true" />
            </div>
            <h2>Deactivate employee?</h2>
            <p>
              {deactivating.full_name} will no longer appear in active employee
              listings or announcement targeting. Their acknowledgement history
              is retained.
            </p>
            <div className="editor-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={confirmDeactivate}
              >
                Deactivate
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setDeactivating(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
