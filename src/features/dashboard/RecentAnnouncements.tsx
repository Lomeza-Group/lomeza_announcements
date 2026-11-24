import { ArrowRight, Inbox } from 'lucide-react'
import { AnnouncementCard } from '../announcements/AnnouncementCard'
import type { Announcement } from '../announcements/types'

interface RecentAnnouncementsProps {
  announcements: Announcement[]
  onViewAll: () => void
}

export function RecentAnnouncements({
  announcements,
  onViewAll,
}: RecentAnnouncementsProps) {
  return (
    <section className="dashboard-section" aria-labelledby="recent-heading">
      <div className="section-header">
        <div>
          <h2 id="recent-heading">Recent announcements</h2>
          <p>The latest updates from across the company.</p>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={onViewAll}
        >
          View all announcements
          <ArrowRight aria-hidden="true" />
        </button>
      </div>

      {announcements.length > 0 ? (
        <div className="recent-list">
          {announcements.map((announcement) => (
            <AnnouncementCard key={announcement.id} announcement={announcement} />
          ))}
        </div>
      ) : (
        <div className="feed-empty">
          <Inbox aria-hidden="true" />
          <p>No recent announcements.</p>
        </div>
      )}
    </section>
  )
}
