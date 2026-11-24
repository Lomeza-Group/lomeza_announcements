import { useRef, useState } from 'react'
import {
  Image as ImageIcon,
  RefreshCw,
  Trash2,
  UploadCloud,
} from 'lucide-react'

interface CoverImageUploaderProps {
  previewUrl: string | null
  alt: string
  error: string | null
  onSelectFile: (file: File) => void
  onRemove: () => void
  onAltChange: (value: string) => void
}

export function CoverImageUploader({
  previewUrl,
  alt,
  error,
  onSelectFile,
  onRemove,
  onAltChange,
}: CoverImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const browse = () => inputRef.current?.click()

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) {
      return
    }

    const file = files[0]

    if (file) {
      onSelectFile(file)
    }
  }

  return (
    <div className="cover-uploader">
      <p className="cover-hint">
        Optional. Used as the visual header on the announcement card, not as a
        downloadable attachment. JPG, PNG or WEBP · Max 5 MB · 16:9
        recommended.
      </p>

      <div
        className={`cover-dropzone${isDragging ? ' is-dragging' : ''}${
          previewUrl ? ' has-preview' : ''
        }`}
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setIsDragging(false)
          handleFiles(event.dataTransfer.files)
        }}
      >
        {previewUrl ? (
          <img
            className="cover-preview-image"
            src={previewUrl}
            alt={alt || ''}
          />
        ) : (
          <div className="cover-empty">
            <ImageIcon aria-hidden="true" />
            <span className="cover-empty-title">
              Drag and drop a cover image, or choose a file
            </span>
            <span className="cover-empty-hint">
              JPG, PNG or WEBP · Max 5 MB
            </span>
          </div>
        )}
      </div>

      <div className="cover-actions">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={browse}
        >
          {previewUrl ? (
            <RefreshCw aria-hidden="true" />
          ) : (
            <UploadCloud aria-hidden="true" />
          )}
          {previewUrl ? 'Replace image' : 'Choose image'}
        </button>

        {previewUrl && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onRemove}
          >
            <Trash2 aria-hidden="true" />
            Remove image
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          className="cover-input"
          onChange={(event) => {
            handleFiles(event.target.files)
            event.target.value = ''
          }}
          hidden
        />
      </div>

      {previewUrl && (
        <div className="form-field">
          <label htmlFor="cover-alt">Image description (optional)</label>
          <input
            id="cover-alt"
            className="editor-input"
            value={alt}
            onChange={(event) => onAltChange(event.target.value)}
            placeholder="Describe the cover image for accessibility"
          />
          <p className="field-hint">
            Used as alternative text for the cover image.
          </p>
        </div>
      )}

      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
