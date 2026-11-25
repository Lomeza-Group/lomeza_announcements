import { useEffect } from 'react'
import { CalendarDays, MapPin, User, X } from 'lucide-react'
import type { EmployeeProfile } from '../../types/auth'
import { formatDate } from '../../utils/format'
import { canManageAnnouncements } from '../../utils/roles'
import { useLocations } from '../locations/locationsContext'
import { AcknowledgementTracking } from './AcknowledgementTracking'
import { AttachmentPreview } from './AttachmentPreview'
import { PollBlock } from './PollBlock'
import { StatusBadge } from './StatusBadge'
import type { Announcement } from './types'
import { PRIORITY_LABELS } from './types'

interface AnnouncementDetailProps {
  announcement: Announcement | null
  employee: EmployeeProfile
  onClose: () => void
}

export function AnnouncementDetail({
  announcement,
  employee,
  onClose,
}: AnnouncementDetailProps) {
  const { getAudienceLabel } = useLocations()

  useEffect(() => {
    if (!announcement) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [announcement, onClose])

  if (!announcement) {
    return null
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-label={announcement.title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div className="announcement-card-top-right">
            <span className="announcement-category">
              {announcement.category}
            </span>
            <span
              className={`priority-badge priority-${announcement.priority}`}
            >
              {PRIORITY_LABELS[announcement.priority]}
            </span>
            <StatusBadge status={announcement.status} />
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X aria-hidden="true" />
          </button>
        </div>

        <h2>{announcement.title}</h2>

        <div className="modal-meta">
          <span>
            <User aria-hidden="true" />
            {announcement.author}
          </span>
          {announcement.publishedAt && (
            <span>
              <CalendarDays aria-hidden="true" />
              {formatDate(announcement.publishedAt)}
            </span>
          )}
          <span>
            <MapPin aria-hidden="true" />
            {getAudienceLabel(announcement.targetLocations)}
          </span>
        </div>

        <p className="modal-body">{announcement.content}</p>

        {announcement.attachments.length > 0 && (
          <AttachmentPreview attachments={announcement.attachments} />
        )}

        {announcement.poll && canManageAnnouncements(employee) && (
          <PollBlock
            announcement={announcement}
            employee={employee}
            resultsOnly
          />
        )}

        {canManageAnnouncements(employee) &&
          announcement.status === 'published' &&
          announcement.acknowledgementEnabled && (
            <AcknowledgementTracking announcement={announcement} />
          )}

        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  )
}
