import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  MapPin,
  User,
} from 'lucide-react'
import type { EmployeeProfile } from '../../types/auth'
import {
  formatDate,
  formatDateTime,
  getExcerpt,
} from '../../utils/format'
import { useLocations } from '../locations/locationsContext'
import { useAnnouncements } from './announcementsContext'
import type { Announcement } from './types'
import { PRIORITY_LABELS } from './types'

interface AnnouncementCardProps {
  announcement: Announcement
  employee: EmployeeProfile
  acknowledgedAt?: string
  onOpen?: (announcement: Announcement) => void
}

export function AnnouncementCard({
  announcement,
  employee,
  acknowledgedAt,
  onOpen,
}: AnnouncementCardProps) {
  const { hasAcknowledged } = useAnnouncements()
  const { getAudienceLabel } = useLocations()

  const isPublished = announcement.status === 'published'
  const acknowledged =
    isPublished &&
    announcement.acknowledgementEnabled &&
    hasAcknowledged(announcement.id, employee.id)

  return (
    <article
      className={`announcement-card${
        announcement.priority === 'urgent' ? ' is-urgent' : ''
      }`}
    >
      <div className="announcement-card-top">
        <span className="announcement-category">{announcement.category}</span>
        <div className="announcement-card-top-right">
          {!announcement.read && <span className="unread-pill">New</span>}
          <span className={`priority-badge priority-${announcement.priority}`}>
            {PRIORITY_LABELS[announcement.priority]}
          </span>
        </div>
      </div>

      <h3 className="announcement-title">{announcement.title}</h3>
      <p className="announcement-excerpt">{getExcerpt(announcement.content)}</p>

      <div className="announcement-meta">
        <span>
          <User aria-hidden="true" />
          {announcement.author}
        </span>
        <span>
          <CalendarDays aria-hidden="true" />
          {formatDate(announcement.publishedAt ?? announcement.updatedAt)}
        </span>
        <span>
          <MapPin aria-hidden="true" />
          {getAudienceLabel(announcement.targetLocations)}
        </span>
      </div>

      {(isPublished && announcement.acknowledgementEnabled) || onOpen ? (
        <div className="announcement-footer">
          <div className="announcement-footer-left">
            {isPublished &&
              announcement.acknowledgementEnabled &&
              (acknowledged ? (
                <>
                  <span className="ack-indicator is-acknowledged">
                    <CheckCircle2 aria-hidden="true" />
                    Acknowledged
                  </span>
                  {acknowledgedAt && (
                    <span className="ack-date">
                      {formatDateTime(acknowledgedAt)}
                    </span>
                  )}
                </>
              ) : (
                <span className="ack-indicator is-pending">
                  <AlertCircle aria-hidden="true" />
                  Action required
                </span>
              ))}
          </div>

          {onOpen && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onOpen(announcement)}
            >
              View
            </button>
          )}
        </div>
      ) : null}
    </article>
  )
}
