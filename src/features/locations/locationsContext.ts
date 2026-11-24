import { createContext, useContext } from 'react'
import type {
  LocationDeactivationCheck,
  LocationInput,
  LocationRecord,
  LocationResult,
} from './locationTypes'

export interface LocationsContextValue {
  locations: LocationRecord[]
  createLocation: (input: LocationInput) => LocationResult
  updateLocation: (id: string, input: LocationInput) => LocationResult
  setLocationActive: (id: string, isActive: boolean) => LocationResult
  getLocationById: (id: string) => LocationRecord | undefined
  getLocationName: (id: string | null | undefined) => string | undefined
  getChildren: (id: string) => LocationRecord[]
  getActiveEmployeeCount: (id: string) => number
  canDeactivateLocation: (id: string) => LocationDeactivationCheck
  expandTargetIds: (targetIds: string[]) => string[]
  isEmployeeTargeted: (
    targetIds: string[],
    employeeLocationId?: string | null,
  ) => boolean
  getAssignableLocations: () => LocationRecord[]
  getActiveLocations: () => LocationRecord[]
  getAudienceLabel: (targetIds: string[]) => string
}

export const LocationsContext =
  createContext<LocationsContextValue | null>(null)

export function useLocations(): LocationsContextValue {
  const context = useContext(LocationsContext)

  if (!context) {
    throw new Error('useLocations must be used within a LocationsProvider')
  }

  return context
}
