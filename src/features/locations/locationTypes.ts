export interface LocationRecord {
  id: string
  name: string
  code: string
  parent_id: string | null
  is_assignable: boolean
  is_active: boolean
  created_at: string
}

export interface LocationInput {
  name: string
  code: string
  parent_id: string | null
  is_assignable: boolean
  is_active: boolean
}

export interface LocationResult {
  success: boolean
  error: string | null
}

export interface LocationDeactivationCheck {
  allowed: boolean
  reason: string | null
}

export const ALL_LOCATIONS = 'All locations'

export const INITIAL_LOCATIONS: LocationRecord[] = [
  {
    id: 'head-office',
    name: 'Head Office',
    code: 'HO',
    parent_id: null,
    is_assignable: true,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'princeton-office',
    name: 'Princeton Office',
    code: 'POP',
    parent_id: 'head-office',
    is_assignable: true,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'time-square-office',
    name: 'Time Square Office',
    code: 'TSO',
    parent_id: 'head-office',
    is_assignable: true,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'devon',
    name: 'Devon',
    code: 'DEV',
    parent_id: null,
    is_assignable: true,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'kalagadi',
    name: 'Kalagadi',
    code: 'KAL',
    parent_id: null,
    is_assignable: true,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'sundra',
    name: 'Sundra',
    code: 'SUN',
    parent_id: null,
    is_assignable: true,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
  },
]

export function normalizeLocationCode(code: string): string {
  return code.trim().toUpperCase()
}

export function collectDescendantIds(
  locations: LocationRecord[],
  id: string,
): string[] {
  const result: string[] = []
  const stack = locations.filter((location) => location.parent_id === id)

  while (stack.length > 0) {
    const child = stack.pop()

    if (!child) {
      continue
    }

    result.push(child.id)
    stack.push(
      ...locations.filter((location) => location.parent_id === child.id),
    )
  }

  return result
}
