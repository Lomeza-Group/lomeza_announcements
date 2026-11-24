import type { AnnouncementStatus } from './types'

const STATUS_LABELS: Record<AnnouncementStatus, string> = {
  draft: 'Draft',
  published: 'Published',
  archived: 'Archived',
}

export function StatusBadge({ status }: { status: AnnouncementStatus }) {
  return (
    <span className={`announcement-status announcement-status-${status}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}
