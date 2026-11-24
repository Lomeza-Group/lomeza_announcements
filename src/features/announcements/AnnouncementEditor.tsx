import { useState } from 'react'
import { Check, MapPin, ShieldX } from 'lucide-react'
import { PlaceholderPage } from '../../components/layout/PlaceholderPage'
import type { EmployeeProfile } from '../../types/auth'
import { canManageAnnouncements } from '../../utils/roles'
import { useAnnouncements } from './announcementsContext'
import type { Announcement, AnnouncementDraft } from './types'
import { CATEGORIES, LOCATIONS, PRIORITIES, PRIORITY_LABELS } from './types'

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

  const [form, setForm] = useState<AnnouncementDraft>(() =>
    initial ? toDraft(initial) : EMPTY_DRAFT,
  )
  const [errors, setErrors] = useState<EditorErrors>({})
  const [isSaving, setIsSaving] = useState(false)

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

  const toggleLocation = (location: string) => {
    setForm((current) => {
      let locations = current.targetLocations

      if (location === 'All locations') {
        locations = locations.includes('All locations')
          ? []
          : ['All locations']
      } else {
        const withoutAll = locations.filter((item) => item !== 'All locations')
        locations = withoutAll.includes(location)
          ? withoutAll.filter((item) => item !== location)
          : [...withoutAll, location]
      }

      return { ...current, targetLocations: locations }
    })
    setErrors((current) => ({ ...current, targetLocations: undefined }))
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

    if (initial) {
      updateAnnouncement(initial.id, form, status)
    } else {
      createAnnouncement(form, employee.full_name, status)
    }

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
          <h2>Target audience</h2>
          <p className="editor-hint">Select one or more locations.</p>

          <div className="location-options">
            {LOCATIONS.map((location) => {
              const selected = form.targetLocations.includes(location)

              return (
                <button
                  key={location}
                  type="button"
                  className={`location-option${selected ? ' is-selected' : ''}`}
                  onClick={() => toggleLocation(location)}
                  aria-pressed={selected}
                >
                  <MapPin aria-hidden="true" />
                  <span>{location}</span>
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
