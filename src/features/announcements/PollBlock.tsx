import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import type { EmployeeProfile } from '../../types/auth'
import { formatDateTime } from '../../utils/format'
import { canManageAnnouncements } from '../../utils/roles'
import { useEmployees } from '../employees/employeesContext'
import { useLocations } from '../locations/locationsContext'
import { useAnnouncements } from './announcementsContext'
import {
  canSeePollResults,
  getPollResponse,
  isPollClosed,
} from './pollUtils'
import { PollResults } from './PollResults'
import type { Announcement, AnnouncementPoll } from './types'

interface PollBlockProps {
  announcement: Announcement
  employee: EmployeeProfile
  resultsOnly?: boolean
}

export function PollBlock({
  announcement,
  employee,
  resultsOnly = false,
}: PollBlockProps) {
  if (!announcement.poll) {
    return null
  }

  return (
    <PollBlockContent
      announcement={announcement}
      employee={employee}
      poll={announcement.poll}
      resultsOnly={resultsOnly}
    />
  )
}

interface PollBlockContentProps {
  announcement: Announcement
  employee: EmployeeProfile
  poll: AnnouncementPoll
  resultsOnly: boolean
}

function PollBlockContent({
  announcement,
  employee,
  poll,
  resultsOnly,
}: PollBlockContentProps) {
  const { castPollVote } = useAnnouncements()
  const { getEmployeeById } = useEmployees()
  const { isEmployeeTargeted } = useLocations()
  const [selected, setSelected] = useState<string[]>(
    () => getPollResponse(poll, employee.id)?.selectedOptionIds ?? [],
  )
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const response = getPollResponse(poll, employee.id)
  const closed = isPollClosed(poll)
  const isManager = canManageAnnouncements(employee)
  const employeeLocationId =
    getEmployeeById(employee.id)?.location_id ?? employee.location_id
  const isTargeted = isEmployeeTargeted(
    announcement.targetLocations,
    employeeLocationId,
  )
  const canVote =
    !resultsOnly &&
    announcement.status === 'published' &&
    isTargeted &&
    !closed &&
    (!response || poll.allowVoteChanges)
  const showResults =
    resultsOnly || canSeePollResults(poll, Boolean(response), isManager)
  const sortedOptions = [...poll.options].sort((a, b) => a.order - b.order)

  const toggleOption = (optionId: string) => {
    if (!canVote) {
      return
    }

    setError(null)
    setSuccess(null)
    setSelected((current) =>
      poll.allowMultiple
        ? current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId]
        : [optionId],
    )
  }

  const handleVote = () => {
    const result = castPollVote(announcement.id, selected)

    if (!result.success) {
      setError(result.error)
      setSuccess(null)
      return
    }

    setError(null)
    setSuccess(
      response ? 'Your vote has been updated.' : 'Your vote has been recorded.',
    )
  }

  const resultsNote =
    poll.resultsVisibility === 'after_vote'
      ? closed
        ? 'Results are only available to employees who voted.'
        : 'Results will be available after you vote.'
      : closed
        ? 'Results are not available.'
        : 'Results will be available after the poll closes.'

  return (
    <div className="poll-block">
      <div className="poll-block-header">
        <span className="poll-eyebrow">Poll</span>
        {closed && <span className="poll-closed-badge">Closed</span>}
      </div>

      {closed && poll.closesAt && (
        <p className="poll-status">
          Voting ended {formatDateTime(poll.closesAt)}.
        </p>
      )}

      {resultsOnly ? (
        <h3 className="poll-question">{poll.question}</h3>
      ) : (
        <fieldset className="poll-vote" disabled={!canVote}>
          <legend className="poll-question">{poll.question}</legend>

          <div className="poll-option-list">
            {sortedOptions.map((option) => {
              const isSelected = selected.includes(option.id)

              return (
                <label
                  className={`poll-option${isSelected ? ' is-selected' : ''}`}
                  key={option.id}
                >
                  <input
                    type={poll.allowMultiple ? 'checkbox' : 'radio'}
                    name={`poll-${poll.id}`}
                    checked={isSelected}
                    onChange={() => toggleOption(option.id)}
                    disabled={!canVote}
                  />
                  <span>{option.label}</span>
                </label>
              )
            })}
          </div>

          {canVote && (
            <div className="poll-actions">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleVote}
              >
                {response && poll.allowVoteChanges
                  ? 'Update vote'
                  : 'Submit vote'}
              </button>
            </div>
          )}

          {!canVote && !closed && response && !poll.allowVoteChanges && (
            <p className="poll-note">Your vote has been recorded.</p>
          )}

          {error && (
            <p className="poll-error" role="alert">
              {error}
            </p>
          )}

          {success && (
            <p className="poll-success" role="status">
              <CheckCircle2 aria-hidden="true" />
              {success}
            </p>
          )}
        </fieldset>
      )}

      {showResults ? (
        <PollResults poll={poll} />
      ) : (
        <p className="poll-note">{resultsNote}</p>
      )}
    </div>
  )
}
