import { createContext, useContext } from 'react'
import type { Announcement, AnnouncementDraft, AnnouncementStatus } from './types'

export interface AnnouncementsContextValue {
  announcements: Announcement[]
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
