import { useState } from 'react'
import {
  CheckCircle2,
  ClipboardCheck,
  Inbox,
  ListChecks,
  Search,
} from 'lucide-react'
import type { EmployeeProfile } from '../../types/auth'
import { StatCard } from '../dashboard/StatCard'
import { AnnouncementCard } from './AnnouncementCard'
import { AnnouncementDetail } from './AnnouncementDetail'
import { useAnnouncements } from './announcementsContext'
import { CATEGORIES, PRIORITIES, PRIORITY_LABELS } from './types'
import type { Announcement, AnnouncementPriority } from './types'

type Tab = 'all' | 'pending' | 'acknowledged'

interface Row {
  announcement: Announcement
  acknowledgedAt?: string
}

const TABS: { value: Tab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'acknowledged', label: 'Acknowledged' },
]

export function MyAcknowledgements({
  employee,
}: {
  employee: EmployeeProfile
}) {
  const { getAcknowledgementOverview } = useAnnouncements()
  const [tab, setTab] = useState<Tab>('all')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [priority, setPriority] = useState<'all' | AnnouncementPriority>('all')
  const [selected, setSelected] = useState<Announcement | null>(null)

  const overview = getAcknowledgementOverview(employee.id)

  const pendingRows: Row[] = overview.pending.map((announcement) => ({
    announcement,
  }))
  const completedRows: Row[] = overview.completed.map((entry) => ({
    announcement: entry.announcement,
    acknowledgedAt: entry.acknowledgedAt,
  }))

  const baseRows =
    tab === 'pending'
      ? pendingRows
      : tab === 'acknowledged'
        ? completedRows
        : [...pendingRows, ...completedRows]

  const normalized = query.trim().toLowerCase()
  const rows = baseRows
    .filter(
      (row) => category === 'All' || row.announcement.category === category,
    )
    .filter(
      (row) =>
        priority === 'all' || row.announcement.priority === priority,
    )
    .filter(
      (row) =>
        normalized === '' ||
        `${row.announcement.title} ${row.announcement.content}`
          .toLowerCase()
          .includes(normalized),
    )
    .sort(
      (a, b) =>
        new Date(
          b.announcement.publishedAt ?? b.announcement.updatedAt,
        ).getTime() -
        new Date(
          a.announcement.publishedAt ?? a.announcement.updatedAt,
        ).getTime(),
    )

  const hasFilters =
    normalized !== '' || category !== 'All' || priority !== 'all'

  const emptyTitle = hasFilters
    ? 'No announcements match your search'
    : tab === 'pending'
      ? 'No pending acknowledgements'
      : tab === 'acknowledged'
        ? 'No acknowledged announcements'
        : 'No announcements requiring acknowledgement'

  const emptyDescription = hasFilters
    ? 'Try adjusting your search or filters.'
    : tab === 'pending'
      ? 'You are all caught up. There are no announcements awaiting your acknowledgement.'
      : tab === 'acknowledged'
        ? 'Announcements you acknowledge will appear here.'
        : 'There are no announcements requiring acknowledgement right now.'

  return (
    <div>
      <div className="page-heading">
        <h1>My Acknowledgements</h1>
        <p>
          Announcements that require your acknowledgement and those you have
          already completed.
        </p>
      </div>

      <div className="ack-summary-grid">
        <StatCard
          label="Pending acknowledgements"
          value={overview.pending.length}
          icon={ClipboardCheck}
          tone="warning"
        />
        <StatCard
          label="Completed acknowledgements"
          value={overview.completed.length}
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          label="Total requiring acknowledgement"
          value={overview.total}
          icon={ListChecks}
          tone="primary"
        />
      </div>

      <div className="ack-controls">
        <div
          className="segmented"
          role="group"
          aria-label="Acknowledgement status"
        >
          {TABS.map((item) => (
            <button
              key={item.value}
              type="button"
              className={`segmented-btn${
                tab === item.value ? ' is-active' : ''
              }`}
              aria-pressed={tab === item.value}
              onClick={() => setTab(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="feed-search">
          <Search className="search-icon" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search announcements"
            aria-label="Search acknowledgements"
          />
        </div>
      </div>

      <div className="filter-group filter-group-category">
        <span className="filter-label">Category</span>
        <div className="filter-chips">
          {['All', ...CATEGORIES].map((value) => (
            <button
              key={value}
              type="button"
              className={`filter-chip${category === value ? ' is-active' : ''}`}
              onClick={() => setCategory(value)}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-group filter-group-category">
        <span className="filter-label">Priority</span>
        <div className="filter-chips">
          {['all', ...PRIORITIES].map((value) => (
            <button
              key={value}
              type="button"
              className={`filter-chip${priority === value ? ' is-active' : ''}`}
              onClick={() =>
                setPriority(value as 'all' | AnnouncementPriority)
              }
            >
              {value === 'all'
                ? 'All'
                : PRIORITY_LABELS[value as AnnouncementPriority]}
            </button>
          ))}
        </div>
      </div>

      {rows.length > 0 ? (
        <div className="feed-list">
          {rows.map((row) => (
            <AnnouncementCard
              key={row.announcement.id}
              announcement={row.announcement}
              employee={employee}
              acknowledgedAt={row.acknowledgedAt}
              onOpen={setSelected}
            />
          ))}
        </div>
      ) : (
        <div className="feed-empty">
          <Inbox aria-hidden="true" />
          <h2>{emptyTitle}</h2>
          <p>{emptyDescription}</p>
        </div>
      )}

      <AnnouncementDetail
        announcement={selected}
        employee={employee}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}
