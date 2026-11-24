import { useState } from 'react'
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  MapPin,
  Paperclip,
  User,
} from 'lucide-react'
import type { EmployeeProfile } from '../../types/auth'
import {
  formatDate,
  formatDateTime,
  getExcerpt,
} from '../../utils/format'
import { useLocations } from '../locations/locationsContext'
import { AttachmentPreview } from './AttachmentPreview'
import { useAnnouncements } from './announcementsContext'
import type { Announcement } from './types'
import { PRIORITY_LABELS } from './types'

interface AnnouncementCardProps {
  announcement: Announcement
  employee: EmployeeProfile
  expandable?: boolean
}

export function AnnouncementCard({
  announcement,
  employee,
  expandable = false,
}: AnnouncementCardProps) {
  const { acknowledgeAnnouncement, getAcknowledgements } = useAnnouncements()
  const { getAudienceLabel } = useLocations()
  const [isExpanded, setIsExpanded] = useState(false)
  const [ackError, setAckError] = useState<string | null>(null)

  const isPublished = announcement.status === 'published'
  const requiresAcknowledgement =
    isPublished && announcement.acknowledgementEnabled
  const ackRecord = getAcknowledgements(announcement.id).find(
    (item) => item.employee_id === employee.id,
  )
  const acknowledged = requiresAcknowledgement && Boolean(ackRecord)
  const panelId = `announcement-panel-${announcement.id}`

  const toggleExpanded = () => {
    if (isExpanded) {
      setIsExpanded(false)
      return
    }

    setIsExpanded(true)

    if (!requiresAcknowledgement || acknowledged) {
      return
    }

    const result = acknowledgeAnnouncement(announcement.id)

    if (!result.success) {
      setAckError(result.error)
    } else {
      setAckError(null)
    }
  }

  const retryAcknowledgement = () => {
    const result = acknowledgeAnnouncement(announcement.id)

    if (result.success) {
      setAckError(null)
    } else {
      setAckError(result.error)
    }
  }

  return (
    <article
      className={`announcement-card${
        announcement.priority === 'urgent' ? ' is-urgent' : ''
      }${isExpanded ? ' is-expanded' : ''}`}
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
        {announcement.attachments.length > 0 && (
          <span className="attachment-indicator">
            <Paperclip aria-hidden="true" />
            {announcement.attachments.length}
          </span>
        )}
      </div>

      {isExpanded && (
        <div className="announcement-expanded" id={panelId}>
          <p className="announcement-full-content">{announcement.content}</p>

          {announcement.attachments.length > 0 && (
            <AttachmentPreview attachments={announcement.attachments} />
          )}

          {ackError && (
            <div className="inline-ack-error" role="alert">
              <span>{ackError}</span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={retryAcknowledgement}
              >
                Retry
              </button>
            </div>
          )}
        </div>
      )}

      {(requiresAcknowledgement || expandable) && (
        <div className="announcement-footer">
          <div className="announcement-footer-left">
            {requiresAcknowledgement &&
              (acknowledged ? (
                <>
                  <span className="ack-indicator is-acknowledged">
                    <CheckCircle2 aria-hidden="true" />
                    Acknowledged
                  </span>
                  {ackRecord && (
                    <span className="ack-date">
                      {formatDateTime(ackRecord.first_opened_at)}
                    </span>
                  )}
                </>
              ) : (
                <span className="ack-indicator is-pending">
                  <AlertCircle aria-hidden="true" />
                  Acknowledgement required
                </span>
              ))}
          </div>

          {expandable && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={toggleExpanded}
              aria-expanded={isExpanded}
              aria-controls={isExpanded ? panelId : undefined}
            >
              {isExpanded ? 'See Less' : 'See More'}
              {isExpanded ? (
                <ChevronUp aria-hidden="true" />
              ) : (
                <ChevronDown aria-hidden="true" />
              )}
            </button>
          )}
        </div>
      )}
    </article>
  )
}
