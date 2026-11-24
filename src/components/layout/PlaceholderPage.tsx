import type { LucideIcon } from 'lucide-react'

interface PlaceholderPageProps {
  icon: LucideIcon
  title: string
  description: string
}

export function PlaceholderPage({
  icon: Icon,
  title,
  description,
}: PlaceholderPageProps) {
  return (
    <div className="placeholder-page">
      <div className="placeholder-icon">
        <Icon aria-hidden="true" />
      </div>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  )
}
