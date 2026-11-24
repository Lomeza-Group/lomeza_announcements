export type AnnouncementPriority = 'low' | 'normal' | 'high' | 'urgent'

export type AnnouncementStatus = 'draft' | 'published' | 'archived'

export interface Announcement {
  id: string
  title: string
  content: string
  category: string
  priority: AnnouncementPriority
  status: AnnouncementStatus
  acknowledgementEnabled: boolean
  commentsEnabled: boolean
  reactionsEnabled: boolean
  publishedAt: string | null
  expiresAt: string | null
  targetLocations: string[]
  author: string
  read: boolean
  updatedAt: string
}

export interface AnnouncementDraft {
  title: string
  content: string
  category: string
  priority: AnnouncementPriority
  acknowledgementEnabled: boolean
  commentsEnabled: boolean
  reactionsEnabled: boolean
  targetLocations: string[]
}

export const CATEGORIES = [
  'General',
  'Safety',
  'Operations',
  'Human Resources',
  'IT',
  'Maintenance',
] as const

export const LOCATIONS = [
  'All locations',
  'Head Office',
  'Princeton Office',
  'Time Square Office',
  'Devon',
  'Kalagadi',
  'Sundra',
] as const

export const PRIORITIES: AnnouncementPriority[] = [
  'low',
  'normal',
  'high',
  'urgent',
]

export const PRIORITY_LABELS: Record<AnnouncementPriority, string> = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
  urgent: 'Urgent',
}
