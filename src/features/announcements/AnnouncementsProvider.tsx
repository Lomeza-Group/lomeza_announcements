import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { EmployeeProfile } from '../../types/auth'
import { useEmployees } from '../employees/employeesContext'
import { useLocations } from '../locations/locationsContext'
import { AnnouncementsContext } from './announcementsContext'
import type {
  AcknowledgementOverview,
  AnnouncementsContextValue,
  PersonalAcknowledgement,
} from './announcementsContext'
import { mockAcknowledgements } from './mockAcknowledgements'
import { mockAnnouncements } from './mockAnnouncements'
import { isExpired } from './targeting'
import type {
  Announcement,
  AnnouncementAcknowledgement,
  AnnouncementDraft,
  AnnouncementStatus,
} from './types'

function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

interface AnnouncementsProviderProps {
  employee: EmployeeProfile
  children: ReactNode
}

export function AnnouncementsProvider({
  employee,
  children,
}: AnnouncementsProviderProps) {
  const { getEmployeeById } = useEmployees()
  const { isEmployeeTargeted } = useLocations()

  const [announcements, setAnnouncements] =
    useState<Announcement[]>(mockAnnouncements)
  const [acknowledgements, setAcknowledgements] = useState<
    AnnouncementAcknowledgement[]
  >(mockAcknowledgements)

  const resolveEmployeeLocationId = useCallback(
    (employeeId: string) =>
      getEmployeeById(employeeId)?.location_id ??
      (employee.id === employeeId ? employee.location_id : null),
    [employee, getEmployeeById],
  )

  const createAnnouncement = useCallback(
    (
      draft: AnnouncementDraft,
      author: string,
      status: AnnouncementStatus = 'draft',
    ) => {
      const now = new Date().toISOString()
      const id = generateId('ann')

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

  const acknowledgeAnnouncement = useCallback(
    (announcementId: string) => {
      const announcement = announcements.find(
        (item) => item.id === announcementId,
      )

      if (
        !announcement ||
        announcement.status !== 'published' ||
        !announcement.acknowledgementEnabled ||
        !isEmployeeTargeted(
          announcement.targetLocations,
          resolveEmployeeLocationId(employee.id),
        )
      ) {
        return
      }

      const now = new Date().toISOString()

      setAcknowledgements((current) => {
        if (
          current.some(
            (item) =>
              item.announcement_id === announcementId &&
              item.employee_id === employee.id,
          )
        ) {
          return current
        }

        return [
          ...current,
          {
            id: generateId('ack'),
            announcement_id: announcementId,
            employee_id: employee.id,
            first_opened_at: now,
          },
        ]
      })
    },
    [announcements, employee, resolveEmployeeLocationId, isEmployeeTargeted],
  )

  const hasAcknowledged = useCallback(
    (announcementId: string, employeeId: string) =>
      acknowledgements.some(
        (item) =>
          item.announcement_id === announcementId &&
          item.employee_id === employeeId,
      ),
    [acknowledgements],
  )

  const getAcknowledgementCount = useCallback(
    (announcementId: string) =>
      acknowledgements.filter(
        (item) => item.announcement_id === announcementId,
      ).length,
    [acknowledgements],
  )

  const getAcknowledgements = useCallback(
    (announcementId: string) =>
      acknowledgements.filter(
        (item) => item.announcement_id === announcementId,
      ),
    [acknowledgements],
  )

  const getPendingAcknowledgements = useCallback(
    (employeeId: string) => {
      const employeeLocationId = resolveEmployeeLocationId(employeeId)

      return announcements.filter(
        (announcement) =>
          announcement.status === 'published' &&
          announcement.acknowledgementEnabled &&
          !isExpired(announcement.expiresAt) &&
          isEmployeeTargeted(announcement.targetLocations, employeeLocationId) &&
          !acknowledgements.some(
            (item) =>
              item.announcement_id === announcement.id &&
              item.employee_id === employeeId,
          ),
      )
    },
    [announcements, acknowledgements, resolveEmployeeLocationId, isEmployeeTargeted],
  )

  const getAcknowledgementOverview = useCallback(
    (employeeId: string): AcknowledgementOverview => {
      const employeeLocationId = resolveEmployeeLocationId(employeeId)
      const pending: Announcement[] = []
      const completed: PersonalAcknowledgement[] = []

      for (const announcement of announcements) {
        if (
          announcement.status !== 'published' ||
          !announcement.acknowledgementEnabled ||
          isExpired(announcement.expiresAt) ||
          !isEmployeeTargeted(
            announcement.targetLocations,
            employeeLocationId,
          )
        ) {
          continue
        }

        const record = acknowledgements.find(
          (item) =>
            item.announcement_id === announcement.id &&
            item.employee_id === employeeId,
        )

        if (record) {
          completed.push({
            announcement,
            acknowledgedAt: record.first_opened_at,
          })
        } else {
          pending.push(announcement)
        }
      }

      return { pending, completed, total: pending.length + completed.length }
    },
    [announcements, acknowledgements, resolveEmployeeLocationId, isEmployeeTargeted],
  )

  const value = useMemo<AnnouncementsContextValue>(
    () => ({
      announcements,
      acknowledgements,
      createAnnouncement,
      updateAnnouncement,
      publishAnnouncement,
      archiveAnnouncement,
      returnToDraft,
      acknowledgeAnnouncement,
      hasAcknowledged,
      getAcknowledgementCount,
      getAcknowledgements,
      getPendingAcknowledgements,
      getAcknowledgementOverview,
    }),
    [
      announcements,
      acknowledgements,
      createAnnouncement,
      updateAnnouncement,
      publishAnnouncement,
      archiveAnnouncement,
      returnToDraft,
      acknowledgeAnnouncement,
      hasAcknowledged,
      getAcknowledgementCount,
      getAcknowledgements,
      getPendingAcknowledgements,
      getAcknowledgementOverview,
    ],
  )

  return (
    <AnnouncementsContext.Provider value={value}>
      {children}
    </AnnouncementsContext.Provider>
  )
}
