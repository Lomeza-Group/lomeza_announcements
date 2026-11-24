export type AnnouncementPriority = 'low' | 'normal' | 'high' | 'urgent'

export type AnnouncementStatus = 'draft' | 'published' | 'archived'

export interface AcknowledgeResult {
  success: boolean
  error: string | null
}

export interface AnnouncementAttachment {
  id: string
  announcementId: string
  fileName: string
  fileType: string
  fileSize: number
  uploadedBy: string
  createdAt: string
  filePath?: string | null
  file?: File | null
  previewUrl?: string | null
}

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
  attachments: AnnouncementAttachment[]
  coverImagePath: string | null
  coverImageAlt: string | null
  coverImageFile?: File | null
  coverImagePreviewUrl?: string | null
}

export type AnnouncementSeed = Omit<
  Announcement,
  'attachments' | 'coverImageFile'
>

export interface AnnouncementDraft {
  title: string
  content: string
  category: string
  priority: AnnouncementPriority
  acknowledgementEnabled: boolean
  commentsEnabled: boolean
  reactionsEnabled: boolean
  targetLocations: string[]
  coverImagePath?: string | null
  coverImageAlt?: string | null
  coverImageFile?: File | null
  coverImagePreviewUrl?: string | null
}

export interface AnnouncementAcknowledgement {
  id: string
  announcement_id: string
  employee_id: string
  first_opened_at: string
}

export const CATEGORIES = [
  'General',
  'Safety',
  'Operations',
  'Human Resources',
  'IT',
  'Maintenance',
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
