import { X } from 'lucide-react'
import { AttachmentIcon } from './AttachmentIcon'
import { formatFileSize, getFileTypeLabel } from './attachmentUtils'
import type { AnnouncementAttachment } from './types'

interface AttachmentListProps {
  attachments: AnnouncementAttachment[]
  onRemove: (id: string) => void
}

export function AttachmentList({
  attachments,
  onRemove,
}: AttachmentListProps) {
  if (attachments.length === 0) {
    return null
  }

  return (
    <ul className="attachment-list">
      {attachments.map((attachment) => (
        <li className="attachment-list-item" key={attachment.id}>
          <span className="attachment-thumb">
            {attachment.previewUrl ? (
              <img src={attachment.previewUrl} alt="" />
            ) : (
              <AttachmentIcon attachment={attachment} />
            )}
          </span>

          <span className="attachment-info">
            <span className="attachment-name">{attachment.fileName}</span>
            <span className="attachment-meta">
              {formatFileSize(attachment.fileSize)} ·{' '}
              {getFileTypeLabel(attachment.fileName, attachment.fileType)}
            </span>
          </span>

          <button
            type="button"
            className="attachment-remove"
            onClick={() => onRemove(attachment.id)}
            aria-label={`Remove ${attachment.fileName}`}
          >
            <X aria-hidden="true" />
          </button>
        </li>
      ))}
    </ul>
  )
}
