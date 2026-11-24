import {
  AlertTriangle,
  CalendarClock,
  ClipboardCheck,
  Megaphone,
} from 'lucide-react'
import type { AppView } from '../../layouts/navigation'
import type { EmployeeProfile } from '../../types/auth'
import { getFirstName } from '../../utils/format'
import { useAnnouncements } from '../announcements/announcementsContext'
import { useEmployees } from '../employees/employeesContext'
import { useLocations } from '../locations/locationsContext'
import { RecentAnnouncements } from './RecentAnnouncements'
import { StatCard } from './StatCard'

function getGreeting(): string {
  const hour = new Date().getHours()

  if (hour < 12) {
    return 'Good morning'
  }

  if (hour < 18) {
    return 'Good afternoon'
  }

  return 'Good evening'
}

interface DashboardProps {
  employee: EmployeeProfile
  onNavigate: (view: AppView) => void
}

export function Dashboard({ employee, onNavigate }: DashboardProps) {
  const { announcements } = useAnnouncements()
  const { getEmployeeById } = useEmployees()
  const { isEmployeeTargeted } = useLocations()

  const currentLocationId =
    getEmployeeById(employee.id)?.location_id ?? employee.location_id

  const published = announcements.filter(
    (announcement) =>
      announcement.status === 'published' &&
      isEmployeeTargeted(announcement.targetLocations, currentLocationId),
  )
  const sorted = [...published].sort(
    (a, b) =>
      new Date(b.publishedAt ?? b.updatedAt).getTime() -
      new Date(a.publishedAt ?? a.updatedAt).getTime(),
  )
  const recent = sorted.slice(0, 4)

  const newestTimestamp = sorted[0]
    ? new Date(sorted[0].publishedAt ?? sorted[0].updatedAt).getTime()
    : 0
  const weekInMs = 7 * 24 * 60 * 60 * 1000

  const totalPublished = published.length
  const requiringAcknowledgement = published.filter(
    (announcement) => announcement.acknowledgementEnabled,
  ).length
  const urgent = published.filter(
    (announcement) => announcement.priority === 'urgent',
  ).length
  const recentlyPublished = published.filter(
    (announcement) =>
      newestTimestamp -
        new Date(announcement.publishedAt ?? announcement.updatedAt).getTime() <=
      weekInMs,
  ).length

  return (
    <div>
      <div className="dashboard-greeting">
        <h1>
          {getGreeting()}, {getFirstName(employee.full_name)}
        </h1>
        <p>Here's what's happening across Lomeza.</p>
      </div>

      <div className="stat-grid">
        <StatCard
          label="Published announcements"
          value={totalPublished}
          icon={Megaphone}
          tone="primary"
        />
        <StatCard
          label="Requiring acknowledgement"
          value={requiringAcknowledgement}
          icon={ClipboardCheck}
          tone="success"
        />
        <StatCard
          label="Urgent announcements"
          value={urgent}
          icon={AlertTriangle}
          tone="warning"
        />
        <StatCard
          label="Published recently"
          value={recentlyPublished}
          icon={CalendarClock}
          tone="info"
        />
      </div>

      <RecentAnnouncements
        announcements={recent}
        employee={employee}
        onViewAll={() => onNavigate('announcements')}
      />
    </div>
  )
}
