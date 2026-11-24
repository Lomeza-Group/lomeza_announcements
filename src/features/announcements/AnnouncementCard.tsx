import { CalendarDays, CheckCircle2, Info, MapPin, User } from 'lucide-react'
import { formatAudience, formatDate, getExcerpt } from '../../utils/format'
import type { Announcement } from './types'
import { PRIORITY_LABELS } from './types'

interface AnnouncementCardProps {
  announcement: Announcement
  onOpen?: (announcement: Announcement) => void
}

export function AnnouncementCard({
  announcement,
  onOpen,
}: AnnouncementCardProps) {
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
          {formatAudience(announcement.targetLocations)}
        </span>
      </div>

      <div className="announcement-footer">
        {announcement.acknowledgementEnabled ? (
          <span className="ack-required">
            <CheckCircle2 aria-hidden="true" />
            Acknowledgement required
          </span>
        ) : (
          <span className="ack-none">
            <Info aria-hidden="true" />
            No acknowledgement required
          </span>
        )}

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
    </article>
  )
}
