import { useRef, useState } from 'react'
import { UploadCloud } from 'lucide-react'
import { ACCEPTED_FILE_TYPES } from './attachmentUtils'

interface AttachmentUploaderProps {
  attachmentCount: number
  maxAttachments: number
  errors: string[]
  onAddFiles: (files: File[]) => void
  onDismissErrors: () => void
}

export function AttachmentUploader({
  attachmentCount,
  maxAttachments,
  errors,
  onAddFiles,
  onDismissErrors,
}: AttachmentUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const atLimit = attachmentCount >= maxAttachments

  const browse = () => {
    if (!atLimit) {
      inputRef.current?.click()
    }
  }

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) {
      return
    }

    onAddFiles(Array.from(files))
  }

  return (
    <div className="attachment-uploader">
      <div className="attachment-uploader-top">
        <p className="attachment-hint">
          Images (JPG, PNG, WEBP) and documents (PDF, Word, Excel, PowerPoint).
          Maximum 20 MB per file.
        </p>
        <span className="attachment-count">
          {attachmentCount} of {maxAttachments} attachments
        </span>
      </div>

      <button
        type="button"
        className={`attachment-dropzone${isDragging ? ' is-dragging' : ''}`}
        onClick={browse}
        onDragOver={(event) => {
          event.preventDefault()
          if (!atLimit) {
            setIsDragging(true)
          }
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setIsDragging(false)
          if (!atLimit) {
            handleFiles(event.dataTransfer.files)
          }
        }}
        disabled={atLimit}
      >
        <UploadCloud aria-hidden="true" />
        <span className="attachment-dropzone-title">
          {atLimit
            ? 'Attachment limit reached'
            : 'Drag and drop files here, or browse'}
        </span>
        <span className="attachment-dropzone-hint">
          JPG, PNG, WEBP, PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED_FILE_TYPES}
        className="attachment-input"
        onChange={(event) => {
          handleFiles(event.target.files)
          event.target.value = ''
        }}
        disabled={atLimit}
        hidden
      />

      {errors.length > 0 && (
        <div className="attachment-errors" role="alert">
          <div className="attachment-errors-header">
            <span>Some files could not be added</span>
            <button
              type="button"
              className="attachment-errors-dismiss"
              onClick={onDismissErrors}
            >
              Dismiss
            </button>
          </div>
          {errors.map((error, index) => (
            <p key={`${error}-${index}`}>{error}</p>
          ))}
        </div>
      )}
    </div>
  )
}
