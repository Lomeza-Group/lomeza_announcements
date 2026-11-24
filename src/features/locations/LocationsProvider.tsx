import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useEmployees } from '../employees/employeesContext'
import { LocationsContext } from './locationsContext'
import type { LocationsContextValue } from './locationsContext'
import {
  canDeactivateLocation as resolveDeactivationCheck,
  expandTargetIds as expandTargetIdsRules,
  isEmployeeTargeted as isEmployeeTargetedRules,
  validateLocationInput as validateLocationRules,
} from './locationRules'
import type {
  LocationInput,
  LocationRecord,
  LocationResult,
} from './locationTypes'
import {
  ALL_LOCATIONS,
  INITIAL_LOCATIONS,
  normalizeLocationCode,
} from './locationTypes'

function generateLocationId(): string {
  return `loc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function LocationsProvider({ children }: { children: ReactNode }) {
  const { employees } = useEmployees()
  const [locations, setLocations] =
    useState<LocationRecord[]>(INITIAL_LOCATIONS)

  const getLocationById = useCallback(
    (id: string) => locations.find((location) => location.id === id),
    [locations],
  )

  const getLocationName = useCallback(
    (id: string | null | undefined) =>
      id ? locations.find((location) => location.id === id)?.name : undefined,
    [locations],
  )

  const getChildren = useCallback(
    (id: string) =>
      locations.filter((location) => location.parent_id === id),
    [locations],
  )

  const getActiveEmployeeCount = useCallback(
    (id: string) =>
      employees.filter(
        (employee) => employee.is_active && employee.location_id === id,
      ).length,
    [employees],
  )

  const validateLocationInput = useCallback(
    (input: LocationInput, excludeId?: string): string | null =>
      validateLocationRules(locations, input, excludeId),
    [locations],
  )

  const canDeactivateLocation = useCallback(
    (id: string) => resolveDeactivationCheck(locations, employees, id),
    [locations, employees],
  )

  const createLocation = useCallback(
    (input: LocationInput): LocationResult => {
      const error = validateLocationInput(input)

      if (error) {
        return { success: false, error }
      }

      const now = new Date().toISOString()

      const location: LocationRecord = {
        id: generateLocationId(),
        name: input.name.trim(),
        code: normalizeLocationCode(input.code),
        parent_id: input.parent_id,
        is_assignable: input.is_assignable,
        is_active: input.is_active,
        created_at: now,
      }

      setLocations((current) => [...current, location])
      return { success: true, error: null }
    },
    [validateLocationInput],
  )

  const updateLocation = useCallback(
    (id: string, input: LocationInput): LocationResult => {
      const error = validateLocationInput(input, id)

      if (error) {
        return { success: false, error }
      }

      const existing = locations.find((location) => location.id === id)

      if (!existing) {
        return { success: false, error: 'Location not found.' }
      }

      if (!input.is_active && existing.is_active) {
        const deactivation = canDeactivateLocation(id)

        if (!deactivation.allowed) {
          return { success: false, error: deactivation.reason }
        }
      }

      setLocations((current) =>
        current.map((location) =>
          location.id === id
            ? {
                ...location,
                name: input.name.trim(),
                code: normalizeLocationCode(input.code),
                parent_id: input.parent_id,
                is_assignable: input.is_assignable,
                is_active: input.is_active,
              }
            : location,
        ),
      )

      return { success: true, error: null }
    },
    [validateLocationInput, canDeactivateLocation, locations],
  )

  const setLocationActive = useCallback(
    (id: string, isActive: boolean): LocationResult => {
      const location = locations.find((item) => item.id === id)

      if (!location) {
        return { success: false, error: 'Location not found.' }
      }

      if (!isActive && location.is_active) {
        const deactivation = canDeactivateLocation(id)

        if (!deactivation.allowed) {
          return { success: false, error: deactivation.reason }
        }
      }

      setLocations((current) =>
        current.map((item) =>
          item.id === id ? { ...item, is_active: isActive } : item,
        ),
      )

      return { success: true, error: null }
    },
    [locations, canDeactivateLocation],
  )

  const expandTargetIds = useCallback(
    (targetIds: string[]): string[] =>
      expandTargetIdsRules(locations, targetIds),
    [locations],
  )

  const isEmployeeTargeted = useCallback(
    (targetIds: string[], employeeLocationId?: string | null): boolean =>
      isEmployeeTargetedRules(locations, targetIds, employeeLocationId),
    [locations],
  )

  const getAssignableLocations = useCallback(
    () =>
      locations.filter(
        (location) => location.is_active && location.is_assignable,
      ),
    [locations],
  )

  const getActiveLocations = useCallback(
    () => locations.filter((location) => location.is_active),
    [locations],
  )

  const getAudienceLabel = useCallback(
    (targetIds: string[]): string => {
      if (targetIds.length === 0) {
        return 'No target'
      }

      if (targetIds.includes(ALL_LOCATIONS)) {
        return 'All locations'
      }

      return targetIds
        .map(
          (id) =>
            locations.find((location) => location.id === id)?.name ?? id,
        )
        .join(', ')
    },
    [locations],
  )

  const value = useMemo<LocationsContextValue>(
    () => ({
      locations,
      createLocation,
      updateLocation,
      setLocationActive,
      getLocationById,
      getLocationName,
      getChildren,
      getActiveEmployeeCount,
      canDeactivateLocation,
      expandTargetIds,
      isEmployeeTargeted,
      getAssignableLocations,
      getActiveLocations,
      getAudienceLabel,
    }),
    [
      locations,
      createLocation,
      updateLocation,
      setLocationActive,
      getLocationById,
      getLocationName,
      getChildren,
      getActiveEmployeeCount,
      canDeactivateLocation,
      expandTargetIds,
      isEmployeeTargeted,
      getAssignableLocations,
      getActiveLocations,
      getAudienceLabel,
    ],
  )

  return (
    <LocationsContext.Provider value={value}>
      {children}
    </LocationsContext.Provider>
  )
}
