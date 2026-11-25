import { Plus, X } from 'lucide-react'
import {
  createPollOptionDraft,
  fromDateTimeLocalValue,
  MAX_POLL_OPTION_LENGTH,
  MAX_POLL_OPTIONS,
  MAX_POLL_QUESTION_LENGTH,
  MIN_POLL_OPTIONS,
  POLL_RESULTS_VISIBILITY_LABELS,
  toDateTimeLocalValue,
} from './pollUtils'
import type { PollDraft, PollResultsVisibility } from './types'

interface PollEditorProps {
  enabled: boolean
  locked: boolean
  poll: PollDraft
  errors: string[]
  onEnabledChange: (enabled: boolean) => void
  onChange: (poll: PollDraft) => void
}

export function PollEditor({
  enabled,
  locked,
  poll,
  errors,
  onEnabledChange,
  onChange,
}: PollEditorProps) {
  const update = (patch: Partial<PollDraft>) => {
    onChange({ ...poll, ...patch })
  }

  const updateOption = (index: number, label: string) => {
    onChange({
      ...poll,
      options: poll.options.map((option, optionIndex) =>
        optionIndex === index ? { ...option, label } : option,
      ),
    })
  }

  const addOption = () => {
    if (poll.options.length >= MAX_POLL_OPTIONS) {
      return
    }

    onChange({
      ...poll,
      options: [...poll.options, createPollOptionDraft()],
    })
  }

  const removeOption = (index: number) => {
    if (poll.options.length <= MIN_POLL_OPTIONS) {
      return
    }

    onChange({
      ...poll,
      options: poll.options.filter((_, optionIndex) => optionIndex !== index),
    })
  }

  return (
    <div className="poll-editor">
      <label className="toggle-row">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => onEnabledChange(event.target.checked)}
          disabled={locked}
        />
        <span className="toggle-switch" aria-hidden="true" />
        <span className="toggle-copy">
          <span className="toggle-label">Add a poll to this announcement</span>
          <span className="toggle-description">
            Optional. Ask employees one question with up to 10 answer options.
          </span>
        </span>
      </label>

      {enabled && (
        <div className="poll-editor-fields">
          {locked && (
            <p className="poll-locked-note">
              This poll already has responses. The question, options, voting
              mode, results visibility, and vote-change policy can no longer be
              changed.
            </p>
          )}

          <div className="form-field">
            <label htmlFor="poll-question">Poll question</label>
            <input
              id="poll-question"
              className="editor-input"
              value={poll.question}
              maxLength={MAX_POLL_QUESTION_LENGTH}
              disabled={locked}
              onChange={(event) => update({ question: event.target.value })}
              placeholder="Ask a question"
            />
            <p className="field-hint">
              {poll.question.length}/{MAX_POLL_QUESTION_LENGTH} characters
            </p>
          </div>

          <fieldset className="poll-options-editor" disabled={locked}>
            <legend className="poll-options-legend">Answer options</legend>

            {poll.options.map((option, index) => (
              <div className="poll-option-row" key={option.id ?? index}>
                <span className="poll-option-number" aria-hidden="true">
                  {index + 1}
                </span>
                <input
                  className="editor-input"
                  value={option.label}
                  maxLength={MAX_POLL_OPTION_LENGTH}
                  onChange={(event) =>
                    updateOption(index, event.target.value)
                  }
                  placeholder={`Option ${index + 1}`}
                  aria-label={`Option ${index + 1}`}
                />
                <button
                  type="button"
                  className="attachment-remove"
                  onClick={() => removeOption(index)}
                  disabled={
                    locked || poll.options.length <= MIN_POLL_OPTIONS
                  }
                  aria-label={`Remove option ${index + 1}`}
                >
                  <X aria-hidden="true" />
                </button>
              </div>
            ))}

            <button
              type="button"
              className="btn btn-secondary btn-sm poll-add-option"
              onClick={addOption}
              disabled={locked || poll.options.length >= MAX_POLL_OPTIONS}
            >
              <Plus aria-hidden="true" />
              Add option
            </button>
          </fieldset>

          <div className="poll-config-grid">
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={poll.allowMultiple}
                onChange={(event) =>
                  update({ allowMultiple: event.target.checked })
                }
                disabled={locked}
              />
              <span className="toggle-switch" aria-hidden="true" />
              <span className="toggle-copy">
                <span className="toggle-label">Allow multiple choices</span>
                <span className="toggle-description">
                  Employees can select more than one option.
                </span>
              </span>
            </label>

            <label className="toggle-row">
              <input
                type="checkbox"
                checked={poll.allowVoteChanges}
                onChange={(event) =>
                  update({ allowVoteChanges: event.target.checked })
                }
                disabled={locked}
              />
              <span className="toggle-switch" aria-hidden="true" />
              <span className="toggle-copy">
                <span className="toggle-label">Allow vote changes</span>
                <span className="toggle-description">
                  Employees can update their vote before the poll closes.
                </span>
              </span>
            </label>
          </div>

          <div className="editor-row">
            <div className="form-field">
              <label htmlFor="poll-closes">
                Closing date and time (optional)
              </label>
              <input
                id="poll-closes"
                type="datetime-local"
                className="editor-input"
                value={toDateTimeLocalValue(poll.closesAt)}
                onChange={(event) =>
                  update({
                    closesAt: fromDateTimeLocalValue(event.target.value),
                  })
                }
              />
              <p className="field-hint">
                Leave empty to keep the poll open.
              </p>
            </div>

            <div className="form-field">
              <label htmlFor="poll-results">Show results</label>
              <select
                id="poll-results"
                className="editor-select"
                value={poll.resultsVisibility}
                disabled={locked}
                onChange={(event) =>
                  update({
                    resultsVisibility: event.target
                      .value as PollResultsVisibility,
                  })
                }
              >
                {(
                  Object.keys(
                    POLL_RESULTS_VISIBILITY_LABELS,
                  ) as PollResultsVisibility[]
                ).map((value) => (
                  <option key={value} value={value}>
                    {POLL_RESULTS_VISIBILITY_LABELS[value]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {errors.length > 0 && (
            <div className="alert alert-error" role="alert">
              {errors.map((error) => (
                <p key={error}>{error}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
