import { CheckCircle2 } from 'lucide-react'
import { formatDateTime } from '../../utils/format'
import { useEmployees } from '../employees/employeesContext'
import { useLocations } from '../locations/locationsContext'
import { useAnnouncements } from './announcementsContext'
import type { Announcement } from './types'

export function AcknowledgementTracking({
  announcement,
}: {
  announcement: Announcement
}) {
  const { getAcknowledgements } = useAnnouncements()
  const { employees } = useEmployees()
  const { isEmployeeTargeted } = useLocations()

  const targeted = employees.filter(
    (employee) =>
      employee.is_active &&
      isEmployeeTargeted(announcement.targetLocations, employee.location_id),
  )
  const acknowledgements = getAcknowledgements(announcement.id)

  const targetedCount = targeted.length
  const acknowledgedCount = acknowledgements.length
  const pendingCount = Math.max(targetedCount - acknowledgedCount, 0)
  const percent =
    targetedCount > 0
      ? Math.round((acknowledgedCount / targetedCount) * 100)
      : 0

  const acknowledgedRows = acknowledgements
    .map((item) => {
      const employee = employees.find(
        (candidate) => candidate.id === item.employee_id,
      )

      return {
        name: employee?.full_name ?? 'Unknown employee',
        firstOpenedAt: item.first_opened_at,
      }
    })
    .sort(
      (a, b) =>
        new Date(b.firstOpenedAt).getTime() -
        new Date(a.firstOpenedAt).getTime(),
    )

  return (
    <div className="ack-tracking">
      <h3 className="ack-tracking-heading">Acknowledgement progress</h3>

      <div className="ack-tracking-stats">
        <div className="ack-tracking-stat">
          <span className="ack-tracking-value">{acknowledgedCount}</span>
          <span className="ack-tracking-label">Acknowledged</span>
        </div>
        <div className="ack-tracking-stat">
          <span className="ack-tracking-value">{targetedCount}</span>
          <span className="ack-tracking-label">Targeted</span>
        </div>
        <div className="ack-tracking-stat">
          <span className="ack-tracking-value">{pendingCount}</span>
          <span className="ack-tracking-label">Pending</span>
        </div>
      </div>

      <div
        className="progress-track"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
      <span className="ack-tracking-percent">{percent}% complete</span>

      <div className="ack-tracking-list">
        {acknowledgedRows.length > 0 ? (
          acknowledgedRows.map((row) => (
            <div
              className="ack-tracking-row"
              key={`${row.name}-${row.firstOpenedAt}`}
            >
              <CheckCircle2 aria-hidden="true" />
              <span className="ack-tracking-name">{row.name}</span>
              <span className="ack-tracking-date">
                {formatDateTime(row.firstOpenedAt)}
              </span>
            </div>
          ))
        ) : (
          <p className="ack-tracking-empty">No acknowledgements yet.</p>
        )}
      </div>
    </div>
  )
}
