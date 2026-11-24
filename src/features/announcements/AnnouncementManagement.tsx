import { useMemo, useState } from 'react'
import {
  Archive,
  Eye,
  Inbox,
  MapPin,
  Paperclip,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Send,
  ShieldX,
} from 'lucide-react'
import { PlaceholderPage } from '../../components/layout/PlaceholderPage'
import type { EmployeeProfile } from '../../types/auth'
import { formatDate } from '../../utils/format'
import { canManageAnnouncements } from '../../utils/roles'
import { useLocations } from '../locations/locationsContext'
import { AnnouncementDetail } from './AnnouncementDetail'
import { AnnouncementEditor } from './AnnouncementEditor'
import { useAnnouncements } from './announcementsContext'
import { StatusBadge } from './StatusBadge'
import type { Announcement, AnnouncementPriority, AnnouncementStatus } from './types'
import { CATEGORIES, PRIORITIES, PRIORITY_LABELS } from './types'

type EditorState =
  | { type: 'create' }
  | { type: 'edit'; announcement: Announcement }
  | null

const STATUS_FILTERS: ('all' | AnnouncementStatus)[] = [
  'all',
  'draft',
  'published',
  'archived',
]

export function AnnouncementManagement({
  employee,
}: {
  employee: EmployeeProfile
}) {
  const {
    announcements,
    publishAnnouncement,
    archiveAnnouncement,
    returnToDraft,
  } = useAnnouncements()
  const { getAudienceLabel } = useLocations()

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<
    'all' | AnnouncementStatus
  >('all')
  const [category, setCategory] = useState('All')
  const [priority, setPriority] = useState<'all' | AnnouncementPriority>('all')
  const [editor, setEditor] = useState<EditorState>(null)
  const [viewing, setViewing] = useState<Announcement | null>(null)

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()

    return announcements
      .filter(
        (announcement) =>
          statusFilter === 'all' || announcement.status === statusFilter,
      )
      .filter(
        (announcement) =>
          category === 'All' || announcement.category === category,
      )
      .filter(
        (announcement) =>
          priority === 'all' || announcement.priority === priority,
      )
      .filter(
        (announcement) =>
          normalized === '' ||
          `${announcement.title} ${announcement.content}`
            .toLowerCase()
            .includes(normalized),
      )
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
  }, [announcements, query, statusFilter, category, priority])

  if (!canManageAnnouncements(employee)) {
    return (
      <PlaceholderPage
        icon={ShieldX}
        title="Access restricted"
        description="You do not have permission to manage announcements."
      />
    )
  }

  if (editor?.type === 'create') {
    return (
      <AnnouncementEditor
        employee={employee}
        onCancel={() => setEditor(null)}
        onSaved={() => setEditor(null)}
      />
    )
  }

  if (editor?.type === 'edit') {
    return (
      <AnnouncementEditor
        employee={employee}
        initial={editor.announcement}
        onCancel={() => setEditor(null)}
        onSaved={() => setEditor(null)}
      />
    )
  }

  const publishedCount = announcements.filter(
    (announcement) => announcement.status === 'published',
  ).length
  const draftsCount = announcements.filter(
    (announcement) => announcement.status === 'draft',
  ).length
  const archivedCount = announcements.filter(
    (announcement) => announcement.status === 'archived',
  ).length

  return (
    <div>
      <div className="management-header">
        <div>
          <h1>Manage Announcements</h1>
          <p>Create, edit, publish and archive company announcements.</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setEditor({ type: 'create' })}
        >
          <Plus aria-hidden="true" />
          Create Announcement
        </button>
      </div>

      <div className="management-summary">
        <div className="management-summary-item">
          <span className="management-summary-value">{publishedCount}</span>
          <span className="management-summary-label">Published</span>
        </div>
        <div className="management-summary-item">
          <span className="management-summary-value">{draftsCount}</span>
          <span className="management-summary-label">Drafts</span>
        </div>
        <div className="management-summary-item">
          <span className="management-summary-value">{archivedCount}</span>
          <span className="management-summary-label">Archived</span>
        </div>
      </div>

      <div className="feed-toolbar">
        <div className="feed-search">
          <Search className="search-icon" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search announcements"
            aria-label="Search announcements"
          />
        </div>

        <div className="filter-group">
          <span className="filter-label">Status</span>
          <div className="filter-chips">
            {STATUS_FILTERS.map((value) => (
              <button
                key={value}
                type="button"
                className={`filter-chip${
                  statusFilter === value ? ' is-active' : ''
                }`}
                onClick={() => setStatusFilter(value)}
              >
                {value === 'all' ? 'All' : value[0].toUpperCase() + value.slice(1)}
              </button>
            ))}
          </div>
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

      {filtered.length > 0 ? (
        <div className="management-list">
          {filtered.map((announcement) => (
            <article className="management-row" key={announcement.id}>
              <div className="management-row-main">
                <div className="management-row-top">
                  <h3>{announcement.title}</h3>
                  <StatusBadge status={announcement.status} />
                </div>

                <div className="management-row-badges">
                  <span className="announcement-category">
                    {announcement.category}
                  </span>
                  <span
                    className={`priority-badge priority-${announcement.priority}`}
                  >
                    {PRIORITY_LABELS[announcement.priority]}
                  </span>
                  <span className="management-audience">
                    <MapPin aria-hidden="true" />
                    {getAudienceLabel(announcement.targetLocations)}
                  </span>
                  {announcement.attachments.length > 0 && (
                    <span className="management-audience">
                      <Paperclip aria-hidden="true" />
                      {announcement.attachments.length}{' '}
                      {announcement.attachments.length === 1
                        ? 'attachment'
                        : 'attachments'}
                    </span>
                  )}
                </div>

                <div className="management-row-meta">
                  <span>
                    Published:{' '}
                    {announcement.publishedAt
                      ? formatDate(announcement.publishedAt)
                      : 'Not published'}
                  </span>
                  <span>Updated: {formatDate(announcement.updatedAt)}</span>
                </div>
              </div>

              <div className="management-row-actions">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setViewing(announcement)}
                >
                  <Eye aria-hidden="true" />
                  View
                </button>

                {announcement.status === 'draft' && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() =>
                      setEditor({ type: 'edit', announcement })
                    }
                  >
                    <Pencil aria-hidden="true" />
                    Edit
                  </button>
                )}

                {announcement.status === 'draft' && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => publishAnnouncement(announcement.id)}
                  >
                    <Send aria-hidden="true" />
                    Publish
                  </button>
                )}

                {announcement.status === 'published' && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() =>
                      setEditor({ type: 'edit', announcement })
                    }
                  >
                    <Pencil aria-hidden="true" />
                    Edit
                  </button>
                )}

                {announcement.status === 'published' && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => archiveAnnouncement(announcement.id)}
                  >
                    <Archive aria-hidden="true" />
                    Archive
                  </button>
                )}

                {announcement.status === 'archived' && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => returnToDraft(announcement.id)}
                  >
                    <RotateCcw aria-hidden="true" />
                    Return to draft
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="feed-empty">
          <Inbox aria-hidden="true" />
          <h2>No announcements found</h2>
          <p>Try adjusting your search or filters.</p>
        </div>
      )}

      <AnnouncementDetail
        announcement={viewing}
        employee={employee}
        onClose={() => setViewing(null)}
      />
    </div>
  )
}
