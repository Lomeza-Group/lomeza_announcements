import { useState } from 'react'
import { getCategoryCoverStyle } from './coverImage'
import './announcementCover.css'

export type AnnouncementCoverVariant = 'thumb' | 'card' | 'hero'

type Props = {
  category: string
  coverImagePreviewUrl?: string | null
  coverImageAlt?: string | null
  variant?: AnnouncementCoverVariant
  className?: string
}

/**
 * Renders an announcement cover image. Returns nothing when the announcement
 * has no cover, so cards without covers keep their existing layout.
 */
export function AnnouncementCover({
  category,
  coverImagePreviewUrl,
  coverImageAlt,
  variant = 'card',
  className,
}: Props) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)

  if (!coverImagePreviewUrl) {
    return null
  }

  const showImage = failedUrl !== coverImagePreviewUrl
  const { gradient, icon: Icon } = getCategoryCoverStyle(category)

  return (
    <div
      className={`announcement-cover announcement-cover-${variant}${
        className ? ` ${className}` : ''
      }`}
      style={showImage ? undefined : { background: gradient }}
    >
      {showImage ? (
        <img
          src={coverImagePreviewUrl}
          alt={coverImageAlt ?? ''}
          loading="lazy"
          onError={() => setFailedUrl(coverImagePreviewUrl)}
        />
      ) : (
        <Icon className="announcement-cover-icon" />
      )}
    </div>
  )
}
