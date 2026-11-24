import type { EmployeeRecord } from '../employees/employeeTypes'
import type {
  LocationDeactivationCheck,
  LocationInput,
  LocationRecord,
} from './locationTypes'
import {
  ALL_LOCATIONS,
  collectDescendantIds,
  normalizeLocationCode,
} from './locationTypes'

export function validateLocationInput(
  locations: LocationRecord[],
  input: LocationInput,
  excludeId?: string,
): string | null {
  const name = input.name.trim()
  const code = normalizeLocationCode(input.code)

  if (!name) {
    return 'Location name is required.'
  }

  if (!code) {
    return 'Location code is required.'
  }

  if (
    locations.some(
      (location) =>
        location.id !== excludeId &&
        normalizeLocationCode(location.code) === code,
    )
  ) {
    return 'A location with this code already exists.'
  }

  if (input.parent_id) {
    const parent = locations.find(
      (location) => location.id === input.parent_id,
    )

    if (!parent) {
      return 'The selected parent location was not found.'
    }

    if (excludeId && parent.id === excludeId) {
      return 'A location cannot be its own parent.'
    }

    if (excludeId) {
      const currentParentId =
        locations.find((location) => location.id === excludeId)?.parent_id ??
        null

      if (!parent.is_active && input.parent_id !== currentParentId) {
        return 'An inactive location cannot be selected as a parent.'
      }

      if (collectDescendantIds(locations, excludeId).includes(parent.id)) {
        return 'A location cannot be nested under its own child.'
      }
    } else if (!parent.is_active) {
      return 'An inactive location cannot be selected as a parent.'
    }
  }

  return null
}

export function canDeactivateLocation(
  locations: LocationRecord[],
  employees: EmployeeRecord[],
  id: string,
): LocationDeactivationCheck {
  const location = locations.find((item) => item.id === id)

  if (!location) {
    return { allowed: false, reason: 'Location not found.' }
  }

  const activeEmployees = employees.filter(
    (employee) => employee.is_active && employee.location_id === id,
  ).length

  if (activeEmployees > 0) {
    return {
      allowed: false,
      reason: `${activeEmployees} active ${
        activeEmployees === 1 ? 'employee is' : 'employees are'
      } assigned to this location. Reassign them before deactivating it.`,
    }
  }

  const activeChildren = locations.filter(
    (item) => item.parent_id === id && item.is_active,
  ).length

  if (activeChildren > 0) {
    return {
      allowed: false,
      reason: `${activeChildren} active child ${
        activeChildren === 1 ? 'location must' : 'locations must'
      } be deactivated first.`,
    }
  }

  return { allowed: true, reason: null }
}

export function expandTargetIds(
  locations: LocationRecord[],
  targetIds: string[],
): string[] {
  if (targetIds.includes(ALL_LOCATIONS)) {
    return [ALL_LOCATIONS]
  }

  const expanded = new Set<string>()

  for (const id of targetIds) {
    expanded.add(id)

    for (const descendant of collectDescendantIds(locations, id)) {
      expanded.add(descendant)
    }
  }

  return Array.from(expanded)
}

export function isEmployeeTargeted(
  locations: LocationRecord[],
  targetIds: string[],
  employeeLocationId?: string | null,
): boolean {
  if (targetIds.includes(ALL_LOCATIONS)) {
    return true
  }

  if (!employeeLocationId) {
    return false
  }

  return expandTargetIds(locations, targetIds).includes(employeeLocationId)
}
