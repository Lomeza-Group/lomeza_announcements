import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { AnnouncementsContext } from './announcementsContext'
import type { AnnouncementsContextValue } from './announcementsContext'
import { mockAnnouncements } from './mockAnnouncements'
import type {
  Announcement,
  AnnouncementDraft,
  AnnouncementStatus,
} from './types'

function generateId(): string {
  return `ann-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function AnnouncementsProvider({ children }: { children: ReactNode }) {
  const [announcements, setAnnouncements] =
    useState<Announcement[]>(mockAnnouncements)

  const createAnnouncement = useCallback(
    (draft: AnnouncementDraft, author: string, status: AnnouncementStatus = 'draft') => {
      const now = new Date().toISOString()
      const id = generateId()

      const announcement: Announcement = {
        ...draft,
        id,
        status,
        publishedAt: status === 'published' ? now : null,
        expiresAt: null,
        author,
        read: true,
        updatedAt: now,
      }

      setAnnouncements((current) => [announcement, ...current])
      return id
    },
    [],
  )

  const updateAnnouncement = useCallback(
    (id: string, draft: AnnouncementDraft, status?: AnnouncementStatus) => {
      const now = new Date().toISOString()

      setAnnouncements((current) =>
        current.map((announcement) => {
          if (announcement.id !== id) {
            return announcement
          }

          const nextStatus = status ?? announcement.status

          return {
            ...announcement,
            ...draft,
            status: nextStatus,
            publishedAt:
              nextStatus === 'published'
                ? (announcement.publishedAt ?? now)
                : announcement.publishedAt,
            updatedAt: now,
          }
        }),
      )
    },
    [],
  )

  const publishAnnouncement = useCallback((id: string) => {
    const now = new Date().toISOString()

    setAnnouncements((current) =>
      current.map((announcement) =>
        announcement.id === id && announcement.status !== 'archived'
          ? {
              ...announcement,
              status: 'published',
              publishedAt: announcement.publishedAt ?? now,
              updatedAt: now,
            }
          : announcement,
      ),
    )
  }, [])

  const archiveAnnouncement = useCallback((id: string) => {
    const now = new Date().toISOString()

    setAnnouncements((current) =>
      current.map((announcement) =>
        announcement.id === id
          ? { ...announcement, status: 'archived', updatedAt: now }
          : announcement,
      ),
    )
  }, [])

  const returnToDraft = useCallback((id: string) => {
    const now = new Date().toISOString()

    setAnnouncements((current) =>
      current.map((announcement) =>
        announcement.id === id && announcement.status === 'archived'
          ? {
              ...announcement,
              status: 'draft',
              publishedAt: null,
              updatedAt: now,
            }
          : announcement,
      ),
    )
  }, [])

  const value = useMemo<AnnouncementsContextValue>(
    () => ({
      announcements,
      createAnnouncement,
      updateAnnouncement,
      publishAnnouncement,
      archiveAnnouncement,
      returnToDraft,
    }),
    [
      announcements,
      createAnnouncement,
      updateAnnouncement,
      publishAnnouncement,
      archiveAnnouncement,
      returnToDraft,
    ],
  )

  return (
    <AnnouncementsContext.Provider value={value}>
      {children}
    </AnnouncementsContext.Provider>
  )
}
