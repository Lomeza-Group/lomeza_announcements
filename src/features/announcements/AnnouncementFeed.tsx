import { useMemo, useState } from 'react'
import { Inbox, Search } from 'lucide-react'
import type { EmployeeProfile } from '../../types/auth'
import { useEmployees } from '../employees/employeesContext'
import { useLocations } from '../locations/locationsContext'
import { AnnouncementCard } from './AnnouncementCard'
import { useAnnouncements } from './announcementsContext'
import { CATEGORIES, PRIORITIES } from './types'
import type { AnnouncementPriority } from './types'

const PRIORITY_FILTERS: ('all' | AnnouncementPriority)[] = [
  'all',
  ...PRIORITIES,
]

export function AnnouncementFeed({
  employee,
}: {
  employee: EmployeeProfile
}) {
  const { announcements } = useAnnouncements()
  const { getEmployeeById } = useEmployees()
  const { isEmployeeTargeted } = useLocations()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [priority, setPriority] = useState<'all' | AnnouncementPriority>('all')

  const currentLocationId =
    getEmployeeById(employee.id)?.location_id ?? employee.location_id

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()

    return announcements
      .filter((announcement) => announcement.status === 'published')
      .filter((announcement) =>
        isEmployeeTargeted(announcement.targetLocations, currentLocationId),
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
          new Date(b.publishedAt ?? b.updatedAt).getTime() -
          new Date(a.publishedAt ?? a.updatedAt).getTime(),
      )
  }, [
    announcements,
    currentLocationId,
    query,
    category,
    priority,
    isEmployeeTargeted,
  ])

  return (
    <div>
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
          <span className="filter-label">Priority</span>
          <div className="filter-chips">
            {PRIORITY_FILTERS.map((value) => (
              <button
                key={value}
                type="button"
                className={`filter-chip${priority === value ? ' is-active' : ''}`}
                onClick={() => setPriority(value)}
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

      {filtered.length > 0 ? (
        <div className="feed-list">
          {filtered.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              employee={employee}
              expandable
            />
          ))}
        </div>
      ) : (
        <div className="feed-empty">
          <Inbox aria-hidden="true" />
          <h2>No announcements found</h2>
          <p>Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  )
}
