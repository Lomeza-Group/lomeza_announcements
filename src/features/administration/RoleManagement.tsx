import { useState } from 'react'
import {
  Crown,
  Megaphone,
  Search,
  ShieldCheck,
  ShieldX,
  User,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { PlaceholderPage } from '../../components/layout/PlaceholderPage'
import type { EmployeeProfile } from '../../types/auth'
import { canAccessAdministration } from '../../utils/roles'
import { StatCard } from '../dashboard/StatCard'
import { useEmployees } from '../employees/employeesContext'
import type {
  EmployeeRecord,
  RoleUpdateResult,
} from '../employees/employeeTypes'
import { RoleAssignmentForm } from './RoleAssignmentForm'

function roleIcon(code: string): LucideIcon {
  switch (code) {
    case 'publisher':
      return Megaphone
    case 'administrator':
      return ShieldCheck
    case 'super_administrator':
      return Crown
    default:
      return User
  }
}

function roleTone(
  code: string,
): 'primary' | 'success' | 'warning' | 'info' {
  switch (code) {
    case 'publisher':
      return 'info'
    case 'administrator':
      return 'primary'
    case 'super_administrator':
      return 'warning'
    default:
      return 'success'
  }
}

export function RoleManagement({
  employee,
}: {
  employee: EmployeeProfile
}) {
  const {
    employees,
    roleDefinitions,
    getRoleAssignmentRules,
    validateRoleSelection,
    updateEmployeeRoles,
  } = useEmployees()

  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [locationFilter, setLocationFilter] = useState('All')
  const [assigning, setAssigning] = useState<EmployeeRecord | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  if (!canAccessAdministration(employee)) {
    return (
      <PlaceholderPage
        icon={ShieldX}
        title="Access restricted"
        description="You do not have permission to manage role assignments."
      />
    )
  }

  const roleName = (code: string) =>
    roleDefinitions.find((role) => role.code === code)?.name ?? code

  const locationOptions = Array.from(
    new Set(
      employees
        .map((record) => record.locationName)
        .filter((name): name is string => Boolean(name)),
    ),
  ).sort()

  const normalized = query.trim().toLowerCase()
  const filtered = employees
    .filter(
      (record) => roleFilter === 'all' || record.roles.includes(roleFilter),
    )
    .filter(
      (record) =>
        locationFilter === 'All' || record.locationName === locationFilter,
    )
    .filter(
      (record) =>
        normalized === '' ||
        `${record.full_name} ${record.employee_number ?? ''} ${record.company_email}`
          .toLowerCase()
          .includes(normalized),
    )
    .sort((a, b) => a.full_name.localeCompare(b.full_name))

  const handleSaveRoles = (codes: string[]): RoleUpdateResult => {
    if (!assigning) {
      return { success: false, error: 'No employee selected.' }
    }

    const result = updateEmployeeRoles(assigning.id, codes)

    if (result.success) {
      setNotice(`${assigning.full_name}'s roles have been updated.`)
      setAssigning(null)
    }

    return result
  }

  return (
    <div>
      <div className="management-header">
        <div>
          <h1>Role Management</h1>
          <p>Assign and review employee roles and their platform access.</p>
        </div>
      </div>

      {notice && (
        <div className="alert alert-success" role="status">
          {notice}
        </div>
      )}

      <div className="stat-grid">
        {roleDefinitions.map((role) => {
          const count = employees.filter((record) =>
            record.roles.includes(role.code),
          ).length

          return (
            <StatCard
              key={role.code}
              label={`${role.name}s`}
              value={count}
              icon={roleIcon(role.code)}
              tone={roleTone(role.code)}
            />
          )
        })}
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
          <span className="filter-label">Role</span>
          <select
            className="editor-select directory-filter-select"
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            aria-label="Filter by role"
          >
            <option value="all">All roles</option>
            {roleDefinitions.map((role) => (
              <option key={role.code} value={role.code}>
                {role.name}
              </option>
            ))}
          </select>
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
            {locationOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="directory-table-wrap">
          <table className="directory-table">
            <thead>
              <tr>
                <th scope="col">Employee</th>
                <th scope="col">Roles</th>
                <th scope="col">Location</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((record) => {
                const rules = getRoleAssignmentRules(record.id)

                return (
                  <tr key={record.id}>
                    <td>
                      <div className="directory-name">{record.full_name}</div>
                      <div className="directory-sub">
                        {record.company_email}
                      </div>
                    </td>
                    <td>
                      <div className="role-list">
                        {record.roles.map((code) => (
                          <span className="role-chip" key={code}>
                            {roleName(code)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>{record.locationName ?? '—'}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setAssigning(record)}
                      >
                        {rules.canModify ? (
                          <ShieldCheck aria-hidden="true" />
                        ) : (
                          <ShieldX aria-hidden="true" />
                        )}
                        {rules.canModify ? 'Manage roles' : 'View roles'}
                      </button>
                    </td>
                  </tr>
                )
              })}
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

      {assigning && (
        <RoleAssignmentForm
          employee={assigning}
          roles={roleDefinitions}
          rules={getRoleAssignmentRules(assigning.id)}
          validate={(codes) => validateRoleSelection(assigning.id, codes)}
          onSave={handleSaveRoles}
          onCancel={() => setAssigning(null)}
        />
      )}
    </div>
  )
}
