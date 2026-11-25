import type {
  AnnouncementPoll,
  PollDraft,
  PollOption,
  PollOptionDraft,
  PollResponse,
  PollResultsVisibility,
} from './types'

export const MAX_POLL_QUESTION_LENGTH = 200
export const MAX_POLL_OPTION_LENGTH = 100
export const MIN_POLL_OPTIONS = 2
export const MAX_POLL_OPTIONS = 10

export const POLL_RESULTS_VISIBILITY_LABELS: Record<
  PollResultsVisibility,
  string
> = {
  after_vote: 'After an employee votes',
  after_close: 'After the poll closes',
}

export interface PollValidationResult {
  valid: boolean
  errors: string[]
}

export interface PollOptionResult {
  option: PollOption
  votes: number
  percent: number
}

export interface PollAggregateResults {
  totalResponses: number
  options: PollOptionResult[]
}

export function generatePollId(): string {
  return `poll-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function generatePollOptionId(): string {
  return `poll-option-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function generatePollResponseId(): string {
  return `poll-response-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function createPollOptionDraft(): PollOptionDraft {
  return { id: generatePollOptionId(), label: '' }
}

export function createEmptyPollDraft(): PollDraft {
  return {
    question: '',
    options: [createPollOptionDraft(), createPollOptionDraft()],
    allowMultiple: false,
    allowVoteChanges: false,
    closesAt: null,
    resultsVisibility: 'after_vote',
  }
}

export function toPollDraft(poll: AnnouncementPoll): PollDraft {
  return {
    question: poll.question,
    options: [...poll.options]
      .sort((a, b) => a.order - b.order)
      .map((option) => ({ id: option.id, label: option.label })),
    allowMultiple: poll.allowMultiple,
    allowVoteChanges: poll.allowVoteChanges,
    closesAt: poll.closesAt,
    resultsVisibility: poll.resultsVisibility,
  }
}

export function normalizePollClosesAt(
  value: string | null | undefined,
): string | null {
  if (!value) {
    return null
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return parsed.toISOString()
}

export function toDateTimeLocalValue(
  iso: string | null | undefined,
): string {
  if (!iso) {
    return ''
  }

  const date = new Date(iso)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const pad = (value: number) => String(value).padStart(2, '0')

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function fromDateTimeLocalValue(value: string): string | null {
  if (!value) {
    return null
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date.toISOString()
}

export function validatePollDraft(poll: PollDraft): PollValidationResult {
  const errors: string[] = []
  const question = poll.question.trim()

  if (!question) {
    errors.push('Enter a poll question.')
  } else if (question.length > MAX_POLL_QUESTION_LENGTH) {
    errors.push(
      `The poll question must be ${MAX_POLL_QUESTION_LENGTH} characters or fewer.`,
    )
  }

  if (poll.options.length < MIN_POLL_OPTIONS) {
    errors.push(`Add at least ${MIN_POLL_OPTIONS} answer options.`)
  } else if (poll.options.length > MAX_POLL_OPTIONS) {
    errors.push(`A poll can have at most ${MAX_POLL_OPTIONS} answer options.`)
  }

  const seenLabels = new Map<string, number>()

  poll.options.forEach((option, index) => {
    const label = option.label.trim()

    if (!label) {
      errors.push(`Option ${index + 1} needs a label.`)
      return
    }

    if (label.length > MAX_POLL_OPTION_LENGTH) {
      errors.push(
        `Option ${index + 1} must be ${MAX_POLL_OPTION_LENGTH} characters or fewer.`,
      )
    }

    const key = label.toLowerCase()
    const firstIndex = seenLabels.get(key)

    if (firstIndex !== undefined) {
      errors.push(
        `Option ${index + 1} duplicates option ${firstIndex + 1}.`,
      )
    } else {
      seenLabels.set(key, index)
    }
  })

  const closesAt = normalizePollClosesAt(poll.closesAt)

  if (poll.closesAt && !closesAt) {
    errors.push('Enter a valid closing date.')
  }

  if (poll.resultsVisibility === 'after_close' && !closesAt) {
    errors.push(
      'Choose a closing date to show results after the poll closes.',
    )
  }

  return { valid: errors.length === 0, errors: Array.from(new Set(errors)) }
}

export function buildPollFromDraft(
  draft: PollDraft,
  existing: AnnouncementPoll | null,
  now: string,
): AnnouncementPoll {
  const usedIds = new Set<string>()

  const options: PollOption[] = draft.options.map((option, index) => {
    const candidate = option.id?.trim()
    const id =
      candidate && !usedIds.has(candidate)
        ? candidate
        : generatePollOptionId()

    usedIds.add(id)
    return { id, label: option.label.trim(), order: index }
  })

  return {
    id: existing?.id ?? generatePollId(),
    question: draft.question.trim(),
    options,
    allowMultiple: draft.allowMultiple,
    allowVoteChanges: draft.allowVoteChanges,
    closesAt: normalizePollClosesAt(draft.closesAt),
    resultsVisibility: draft.resultsVisibility,
    responses: existing?.responses ?? [],
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }
}

export function isPollClosed(poll: AnnouncementPoll): boolean {
  if (!poll.closesAt) {
    return false
  }

  return new Date(poll.closesAt).getTime() <= new Date().getTime()
}

export function getPollResponse(
  poll: AnnouncementPoll,
  employeeId: string,
): PollResponse | null {
  return (
    poll.responses.find((response) => response.employeeId === employeeId) ??
    null
  )
}

export function validatePollVote(
  poll: AnnouncementPoll,
  employeeId: string,
  selectedOptionIds: string[],
): string | null {
  const uniqueOptionIds = Array.from(new Set(selectedOptionIds))

  if (uniqueOptionIds.length === 0) {
    return 'Select at least one option.'
  }

  if (isPollClosed(poll)) {
    return 'Voting has ended for this poll.'
  }

  const validOptionIds = new Set(poll.options.map((option) => option.id))

  if (uniqueOptionIds.some((id) => !validOptionIds.has(id))) {
    return 'One or more selected options are invalid.'
  }

  const existingResponse = getPollResponse(poll, employeeId)

  if (existingResponse && !poll.allowVoteChanges) {
    return 'Your vote has already been submitted and cannot be changed.'
  }

  if (!poll.allowMultiple && uniqueOptionIds.length !== 1) {
    return 'Select exactly one option.'
  }

  return null
}

export function canSeePollResults(
  poll: AnnouncementPoll,
  hasVoted: boolean,
  isManager: boolean,
): boolean {
  if (isManager) {
    return true
  }

  if (poll.resultsVisibility === 'after_vote') {
    return hasVoted
  }

  return isPollClosed(poll)
}

export function getPollResults(
  poll: AnnouncementPoll,
): PollAggregateResults {
  const totalResponses = poll.responses.length

  const options = [...poll.options]
    .sort((a, b) => a.order - b.order)
    .map((option) => {
      const votes = poll.responses.filter((response) =>
        response.selectedOptionIds.includes(option.id),
      ).length
      const percent =
        totalResponses > 0
          ? Math.round((votes / totalResponses) * 100)
          : 0

      return { option, votes, percent }
    })

  return { totalResponses, options }
}
