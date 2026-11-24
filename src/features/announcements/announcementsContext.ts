import { createContext, useContext } from 'react'
import type {
  Announcement,
  AnnouncementAcknowledgement,
  AnnouncementDraft,
  AnnouncementStatus,
} from './types'

export interface PersonalAcknowledgement {
  announcement: Announcement
  acknowledgedAt: string
}

export interface AcknowledgementOverview {
  pending: Announcement[]
  completed: PersonalAcknowledgement[]
  total: number
}

export interface AnnouncementsContextValue {
  announcements: Announcement[]
  acknowledgements: AnnouncementAcknowledgement[]
  createAnnouncement: (
    draft: AnnouncementDraft,
    author: string,
    status?: AnnouncementStatus,
  ) => string
  updateAnnouncement: (
    id: string,
    draft: AnnouncementDraft,
    status?: AnnouncementStatus,
  ) => void
  publishAnnouncement: (id: string) => void
  archiveAnnouncement: (id: string) => void
  returnToDraft: (id: string) => void
  acknowledgeAnnouncement: (announcementId: string) => void
  hasAcknowledged: (announcementId: string, employeeId: string) => boolean
  getAcknowledgementCount: (announcementId: string) => number
  getAcknowledgements: (
    announcementId: string,
  ) => AnnouncementAcknowledgement[]
  getPendingAcknowledgements: (employeeId: string) => Announcement[]
  getAcknowledgementOverview: (employeeId: string) => AcknowledgementOverview
}

export const AnnouncementsContext =
  createContext<AnnouncementsContextValue | null>(null)

export function useAnnouncements(): AnnouncementsContextValue {
  const context = useContext(AnnouncementsContext)

  if (!context) {
    throw new Error('useAnnouncements must be used within an AnnouncementsProvider')
  }

  return context
}
