import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: number
  icon: LucideIcon
  tone?: 'primary' | 'success' | 'warning' | 'info'
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'primary',
}: StatCardProps) {
  return (
    <div className="stat-card">
      <div className={`stat-icon is-${tone}`}>
        <Icon aria-hidden="true" />
      </div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  )
}
