import { useEffect, useState } from 'react'
import { Download, Eye, X } from 'lucide-react'
import { AttachmentIcon } from './AttachmentIcon'
import {
  downloadAttachmentFile,
  formatFileSize,
  getFileTypeLabel,
  isImageFile,
  isPdfFile,
} from './attachmentUtils'
import type { AnnouncementAttachment } from './types'

interface PdfPreview {
  attachment: AnnouncementAttachment
  url: string
  revokeOnClose: boolean
}

export function AttachmentPreview({
  attachments,
}: {
  attachments: AnnouncementAttachment[]
}) {
  const [activeImage, setActiveImage] = useState<AnnouncementAttachment | null>(
    null,
  )
  const [pdfPreview, setPdfPreview] = useState<PdfPreview | null>(null)

  useEffect(() => {
    return () => {
      if (pdfPreview?.revokeOnClose) {
        URL.revokeObjectURL(pdfPreview.url)
      }
    }
  }, [pdfPreview])

  useEffect(() => {
    if (!activeImage && !pdfPreview) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveImage(null)
        setPdfPreview(null)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [activeImage, pdfPreview])

  if (attachments.length === 0) {
    return null
  }

  const images = attachments.filter(
    (attachment) =>
      isImageFile(attachment.fileName, attachment.fileType) &&
      Boolean(attachment.previewUrl),
  )
  const documents = attachments.filter(
    (attachment) =>
      !(
        isImageFile(attachment.fileName, attachment.fileType) &&
        attachment.previewUrl
      ),
  )

  const closeAll = () => {
    setActiveImage(null)
    setPdfPreview(null)
  }

  const openPdf = (attachment: AnnouncementAttachment) => {
    if (attachment.file) {
      setPdfPreview({
        attachment,
        url: URL.createObjectURL(attachment.file),
        revokeOnClose: true,
      })
      return
    }

    if (attachment.previewUrl) {
      setPdfPreview({
        attachment,
        url: attachment.previewUrl,
        revokeOnClose: false,
      })
    }
  }

  return (
    <div className="attachment-preview">
      <h3 className="attachment-preview-heading">
        Attachments ({attachments.length})
      </h3>

      {images.length > 0 && (
        <div className="attachment-gallery">
          {images.map((attachment) => (
            <button
              type="button"
              className="attachment-gallery-item"
              key={attachment.id}
              onClick={() => setActiveImage(attachment)}
              aria-label={`Preview ${attachment.fileName}`}
            >
              <img src={attachment.previewUrl ?? ''} alt={attachment.fileName} />
            </button>
          ))}
        </div>
      )}

      {documents.length > 0 && (
        <div className="attachment-documents">
          {documents.map((attachment) => {
            const pdf = isPdfFile(attachment.fileName, attachment.fileType)
            const canDownload = Boolean(
              attachment.file || attachment.previewUrl,
            )
            const canPreviewPdf = pdf && canDownload

            return (
              <div className="attachment-document-card" key={attachment.id}>
                <span className="attachment-document-icon">
                  <AttachmentIcon attachment={attachment} />
                </span>

                <span className="attachment-document-info">
                  <span className="attachment-name">{attachment.fileName}</span>
                  <span className="attachment-meta">
                    {formatFileSize(attachment.fileSize)} ·{' '}
                    {getFileTypeLabel(attachment.fileName, attachment.fileType)}
                  </span>
                </span>

                <span className="attachment-actions">
                  {canPreviewPdf && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => openPdf(attachment)}
                    >
                      <Eye aria-hidden="true" />
                      Preview
                    </button>
                  )}
                  {canDownload && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => downloadAttachmentFile(attachment)}
                    >
                      <Download aria-hidden="true" />
                      Download
                    </button>
                  )}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {activeImage?.previewUrl && (
        <div
          className="attachment-lightbox"
          onClick={closeAll}
          role="dialog"
          aria-modal="true"
          aria-label={`Preview ${activeImage.fileName}`}
        >
          <div
            className="attachment-lightbox-content"
            onClick={(event) => event.stopPropagation()}
          >
            <img src={activeImage.previewUrl} alt={activeImage.fileName} />
            <p className="attachment-lightbox-caption">
              {activeImage.fileName}
            </p>
          </div>
          <button
            type="button"
            className="attachment-lightbox-close"
            onClick={closeAll}
            aria-label="Close preview"
          >
            <X aria-hidden="true" />
          </button>
        </div>
      )}

      {pdfPreview && (
        <div
          className="attachment-lightbox"
          onClick={closeAll}
          role="dialog"
          aria-modal="true"
          aria-label={`Preview ${pdfPreview.attachment.fileName}`}
        >
          <div
            className="attachment-pdf-preview"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="attachment-pdf-header">
              <span className="attachment-pdf-name">
                {pdfPreview.attachment.fileName}
              </span>
              <button
                type="button"
                className="modal-close"
                onClick={closeAll}
                aria-label="Close preview"
              >
                <X aria-hidden="true" />
              </button>
            </div>
            <iframe
              title={pdfPreview.attachment.fileName}
              src={pdfPreview.url}
            />
          </div>
        </div>
      )}
    </div>
  )
}
