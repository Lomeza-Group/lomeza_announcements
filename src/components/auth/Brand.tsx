export function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      L
    </span>
  )
}

interface BrandLockupProps {
  tone?: 'light' | 'dark'
  compact?: boolean
}

export function BrandLockup({
  tone = 'light',
  compact = false,
}: BrandLockupProps) {
  return (
    <div className={`brand-lockup ${tone === 'light' ? 'is-light' : 'is-dark'}`}>
      <BrandMark />
      <div className="brand-copy">
        <span className="brand-name">Lomeza</span>
        <span className="brand-subtitle">
          {compact ? 'Communication Platform' : 'Mining Services'}
        </span>
      </div>
    </div>
  )
}
