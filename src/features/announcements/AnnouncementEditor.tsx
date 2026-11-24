import { useEffect, useRef, useState } from 'react'
import { Check, MapPin, ShieldX } from 'lucide-react'
import { PlaceholderPage } from '../../components/layout/PlaceholderPage'
import type { EmployeeProfile } from '../../types/auth'
import { canManageAnnouncements } from '../../utils/roles'
import { ALL_LOCATIONS } from '../locations/locationTypes'
import { useLocations } from '../locations/locationsContext'
import { AttachmentList } from './AttachmentList'
import { AttachmentUploader } from './AttachmentUploader'
import {
  createAttachment,
  isDuplicateAttachment,
  MAX_ATTACHMENTS,
  validateAttachmentFile,
} from './attachmentUtils'
import { CoverImageUploader } from './CoverImageUploader'
import { validateCoverFile } from './coverImage'
import { useAnnouncements } from './announcementsContext'
import type {
  Announcement,
  AnnouncementAttachment,
  AnnouncementDraft,
} from './types'
import { CATEGORIES, PRIORITIES, PRIORITY_LABELS } from './types'

const EMPTY_DRAFT: AnnouncementDraft = {
  title: '',
  content: '',
  category: 'General',
  priority: 'normal',
  acknowledgementEnabled: false,
  commentsEnabled: false,
  reactionsEnabled: false,
  targetLocations: [],
}

function toDraft(announcement: Announcement): AnnouncementDraft {
  return {
    title: announcement.title,
    content: announcement.content,
    category: announcement.category,
    priority: announcement.priority,
    acknowledgementEnabled: announcement.acknowledgementEnabled,
    commentsEnabled: announcement.commentsEnabled,
    reactionsEnabled: announcement.reactionsEnabled,
    targetLocations: announcement.targetLocations,
  }
}

interface EditorErrors {
  title?: string
  content?: string
  targetLocations?: string
}

interface AnnouncementEditorProps {
  employee: EmployeeProfile
  initial?: Announcement | null
  onCancel: () => void
  onSaved: () => void
}

export function AnnouncementEditor({
  employee,
  initial,
  onCancel,
  onSaved,
}: AnnouncementEditorProps) {
  const { createAnnouncement, updateAnnouncement } = useAnnouncements()
  const { getActiveLocations, getLocationName } = useLocations()

  const [form, setForm] = useState<AnnouncementDraft>(() =>
    initial ? toDraft(initial) : EMPTY_DRAFT,
  )
  const [errors, setErrors] = useState<EditorErrors>({})
  const [isSaving, setIsSaving] = useState(false)
  const [attachments, setAttachments] = useState<AnnouncementAttachment[]>(
    () => initial?.attachments ?? [],
  )
  const [attachmentErrors, setAttachmentErrors] = useState<string[]>([])
  const [coverImagePath, setCoverImagePath] = useState<string | null>(
    initial?.coverImagePath ?? null,
  )
  const [coverImageAlt, setCoverImageAlt] = useState(
    initial?.coverImageAlt ?? '',
  )
  const [coverImageFile, setCoverImageFile] = useState<File | null>(
    initial?.coverImageFile ?? null,
  )
  const [coverImagePreviewUrl, setCoverImagePreviewUrl] = useState<
    string | null
  >(initial?.coverImagePreviewUrl ?? null)
  const [coverError, setCoverError] = useState<string | null>(null)
  const sessionUrlsRef = useRef<Set<string>>(new Set())
  const savedRef = useRef(false)

  useEffect(() => {
    const urls = sessionUrlsRef.current

    return () => {
      if (savedRef.current) {
        return
      }

      for (const url of urls) {
        URL.revokeObjectURL(url)
      }

      urls.clear()
    }
  }, [])

  if (!canManageAnnouncements(employee)) {
    return (
      <PlaceholderPage
        icon={ShieldX}
        title="Access restricted"
        description="You do not have permission to manage announcements."
      />
    )
  }

  const isPublishedEdit = initial?.status === 'published'

  const setField = <K extends keyof AnnouncementDraft>(
    key: K,
    value: AnnouncementDraft[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const toggleLocation = (locationId: string) => {
    setForm((current) => {
      let locations = current.targetLocations

      if (locationId === ALL_LOCATIONS) {
        locations = locations.includes(ALL_LOCATIONS) ? [] : [ALL_LOCATIONS]
      } else {
        const withoutAll = locations.filter((item) => item !== ALL_LOCATIONS)
        locations = withoutAll.includes(locationId)
          ? withoutAll.filter((item) => item !== locationId)
          : [...withoutAll, locationId]
      }

      return { ...current, targetLocations: locations }
    })
    setErrors((current) => ({ ...current, targetLocations: undefined }))
  }

  const activeLocations = getActiveLocations()
  const activeLocationIds = new Set(
    activeLocations.map((location) => location.id),
  )
  const inactiveReferencedLocations = form.targetLocations
    .filter(
      (id) => id !== ALL_LOCATIONS && !activeLocationIds.has(id),
    )
    .map((id) => ({
      id,
      name: getLocationName(id) ?? id,
      inactive: true,
    }))
  const targetOptions = [
    ...activeLocations.map((location) => ({
      id: location.id,
      name: location.name,
      inactive: false,
    })),
    ...inactiveReferencedLocations,
  ]

  const handleAddFiles = (files: File[]) => {
    const errors: string[] = []
    const additions: AnnouncementAttachment[] = []

    for (const file of files) {
      if (attachments.length + additions.length >= MAX_ATTACHMENTS) {
        errors.push(`A maximum of ${MAX_ATTACHMENTS} attachments is allowed.`)
        break
      }

      const validationError = validateAttachmentFile(file)

      if (validationError) {
        errors.push(validationError)
        continue
      }

      if (
        isDuplicateAttachment([...attachments, ...additions], file)
      ) {
        errors.push(`"${file.name}" is already attached.`)
        continue
      }

      const attachment = createAttachment(
        file,
        employee.full_name,
        initial?.id ?? '',
      )

      if (attachment.previewUrl) {
        sessionUrlsRef.current.add(attachment.previewUrl)
      }

      additions.push(attachment)
    }

    if (additions.length > 0) {
      setAttachments((current) => [...current, ...additions])
    }

    setAttachmentErrors(errors)
  }

  const handleRemoveAttachment = (id: string) => {
    const target = attachments.find((attachment) => attachment.id === id)

    if (target?.previewUrl && sessionUrlsRef.current.has(target.previewUrl)) {
      URL.revokeObjectURL(target.previewUrl)
      sessionUrlsRef.current.delete(target.previewUrl)
    }

    setAttachments((current) =>
      current.filter((attachment) => attachment.id !== id),
    )
  }

  const handleCoverSelect = (file: File) => {
    const validationError = validateCoverFile(file)

    if (validationError) {
      setCoverError(validationError)
      return
    }

    if (
      coverImagePreviewUrl &&
      sessionUrlsRef.current.has(coverImagePreviewUrl)
    ) {
      URL.revokeObjectURL(coverImagePreviewUrl)
      sessionUrlsRef.current.delete(coverImagePreviewUrl)
    }

    const previewUrl = URL.createObjectURL(file)
    sessionUrlsRef.current.add(previewUrl)
    setCoverImagePreviewUrl(previewUrl)
    setCoverImageFile(file)
    setCoverImagePath(null)
    setCoverError(null)
  }

  const handleCoverRemove = () => {
    if (
      coverImagePreviewUrl &&
      sessionUrlsRef.current.has(coverImagePreviewUrl)
    ) {
      URL.revokeObjectURL(coverImagePreviewUrl)
      sessionUrlsRef.current.delete(coverImagePreviewUrl)
    }

    setCoverImagePreviewUrl(null)
    setCoverImageFile(null)
    setCoverImagePath(null)
    setCoverImageAlt('')
    setCoverError(null)
  }

  const submit = (status?: 'draft' | 'published') => {
    const nextErrors: EditorErrors = {}

    if (!form.title.trim()) {
      nextErrors.title = 'Enter an announcement title.'
    }

    if (!form.content.trim()) {
      nextErrors.content = 'Enter announcement content.'
    }

    if (status === 'published' && form.targetLocations.length === 0) {
      nextErrors.targetLocations = 'Select at least one target audience before publishing.'
    }

    if (nextErrors.title || nextErrors.content || nextErrors.targetLocations) {
      setErrors(nextErrors)
      return
    }

    setErrors({})
    setIsSaving(true)

    const draft: AnnouncementDraft = {
      ...form,
      coverImagePath,
      coverImageAlt: coverImageAlt.trim() || null,
      coverImageFile,
      coverImagePreviewUrl,
    }

    if (initial) {
      updateAnnouncement(initial.id, draft, status, attachments)
    } else {
      createAnnouncement(draft, employee.full_name, status, attachments)
    }

    savedRef.current = true
    sessionUrlsRef.current.clear()
    setIsSaving(false)
    onSaved()
  }

  return (
    <div className="editor-page">
      <div className="editor-header">
        <div>
          <h1>{initial ? 'Edit announcement' : 'Create announcement'}</h1>
          <p>
            {initial
              ? 'Update the announcement details below.'
              : 'Compose a new announcement for the Lomeza workforce.'}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </button>
      </div>

      <form className="editor-form" onSubmit={(event) => event.preventDefault()}>
        <section className="editor-section">
          <h2>Basic information</h2>

          <div className="form-field">
            <label htmlFor="editor-title">Title</label>
            <input
              id="editor-title"
              className="editor-input"
              value={form.title}
              onChange={(event) => setField('title', event.target.value)}
              placeholder="Enter a clear announcement title"
            />
            {errors.title && <p className="field-error">{errors.title}</p>}
          </div>

          <div className="form-field">
            <label htmlFor="editor-content">Content</label>
            <textarea
              id="editor-content"
              className="editor-textarea"
              rows={8}
              value={form.content}
              onChange={(event) => setField('content', event.target.value)}
              placeholder="Write the announcement content"
            />
            {errors.content && <p className="field-error">{errors.content}</p>}
          </div>

          <div className="editor-row">
            <div className="form-field">
              <label htmlFor="editor-category">Category</label>
              <select
                id="editor-category"
                className="editor-select"
                value={form.category}
                onChange={(event) => setField('category', event.target.value)}
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="editor-priority">Priority</label>
              <select
                id="editor-priority"
                className="editor-select"
                value={form.priority}
                onChange={(event) =>
                  setField(
                    'priority',
                    event.target.value as AnnouncementDraft['priority'],
                  )
                }
              >
                {PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {PRIORITY_LABELS[priority]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="editor-section">
          <h2>Announcement Cover Image</h2>
          <CoverImageUploader
            previewUrl={coverImagePreviewUrl}
            alt={coverImageAlt}
            error={coverError}
            onSelectFile={handleCoverSelect}
            onRemove={handleCoverRemove}
            onAltChange={setCoverImageAlt}
          />
        </section>

        <section className="editor-section">
          <h2>Attachments</h2>
          <AttachmentUploader
            attachmentCount={attachments.length}
            maxAttachments={MAX_ATTACHMENTS}
            errors={attachmentErrors}
            onAddFiles={handleAddFiles}
            onDismissErrors={() => setAttachmentErrors([])}
          />
          <AttachmentList
            attachments={attachments}
            onRemove={handleRemoveAttachment}
          />
        </section>

        <section className="editor-section">
          <h2>Target audience</h2>
          <p className="editor-hint">Select one or more locations.</p>

          <div className="location-options">
            <button
              type="button"
              className={`location-option${
                form.targetLocations.includes(ALL_LOCATIONS)
                  ? ' is-selected'
                  : ''
              }`}
              onClick={() => toggleLocation(ALL_LOCATIONS)}
              aria-pressed={form.targetLocations.includes(ALL_LOCATIONS)}
            >
              <MapPin aria-hidden="true" />
              <span>All locations</span>
              {form.targetLocations.includes(ALL_LOCATIONS) && (
                <Check aria-hidden="true" />
              )}
            </button>

            {targetOptions.map((option) => {
              const selected = form.targetLocations.includes(option.id)

              return (
                <button
                  key={option.id}
                  type="button"
                  className={`location-option${
                    selected ? ' is-selected' : ''
                  }`}
                  onClick={() => toggleLocation(option.id)}
                  aria-pressed={selected}
                >
                  <MapPin aria-hidden="true" />
                  <span>
                    {option.name}
                    {option.inactive ? ' (inactive)' : ''}
                  </span>
                  {selected && <Check aria-hidden="true" />}
                </button>
              )
            })}
          </div>

          {errors.targetLocations && (
            <p className="field-error">{errors.targetLocations}</p>
          )}
        </section>

        <section className="editor-section">
          <h2>Interaction settings</h2>

          <div className="toggle-list">
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={form.acknowledgementEnabled}
                onChange={(event) =>
                  setField('acknowledgementEnabled', event.target.checked)
                }
              />
              <span className="toggle-switch" aria-hidden="true" />
              <span className="toggle-copy">
                <span className="toggle-label">Require acknowledgement</span>
                <span className="toggle-description">
                  Record when each employee opens this announcement.
                </span>
              </span>
            </label>

            <label className="toggle-row">
              <input
                type="checkbox"
                checked={form.commentsEnabled}
                onChange={(event) =>
                  setField('commentsEnabled', event.target.checked)
                }
              />
              <span className="toggle-switch" aria-hidden="true" />
              <span className="toggle-copy">
                <span className="toggle-label">Allow comments</span>
                <span className="toggle-description">
                  Employees can comment on this announcement.
                </span>
              </span>
            </label>

            <label className="toggle-row">
              <input
                type="checkbox"
                checked={form.reactionsEnabled}
                onChange={(event) =>
                  setField('reactionsEnabled', event.target.checked)
                }
              />
              <span className="toggle-switch" aria-hidden="true" />
              <span className="toggle-copy">
                <span className="toggle-label">Allow reactions</span>
                <span className="toggle-description">
                  Employees can react to this announcement.
                </span>
              </span>
            </label>
          </div>
        </section>

        <div className="editor-actions">
          {isPublishedEdit ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => submit(undefined)}
              disabled={isSaving}
            >
              Save changes
            </button>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => submit('draft')}
                disabled={isSaving}
              >
                Save as Draft
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => submit('published')}
                disabled={isSaving}
              >
                Publish Announcement
              </button>
            </>
          )}
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
