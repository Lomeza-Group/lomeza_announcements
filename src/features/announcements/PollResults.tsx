import { getPollResults } from './pollUtils'
import type { AnnouncementPoll } from './types'

export function PollResults({ poll }: { poll: AnnouncementPoll }) {
  const { totalResponses, options } = getPollResults(poll)

  return (
    <div className="poll-results">
      <div className="poll-results-header">
        <span>Results</span>
        <span>
          {totalResponses}{' '}
          {totalResponses === 1 ? 'response' : 'responses'}
        </span>
      </div>

      {options.map(({ option, votes, percent }) => (
        <div className="poll-result-row" key={option.id}>
          <div className="poll-result-top">
            <span className="poll-result-label">{option.label}</span>
            <span className="poll-result-count">
              {votes} ({percent}%)
            </span>
          </div>
          <div
            className="poll-result-track"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${option.label}: ${percent}%`}
          >
            <div
              className="poll-result-fill"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      ))}

      {totalResponses === 0 && (
        <p className="poll-results-note">No votes yet.</p>
      )}

      {poll.allowMultiple && totalResponses > 0 && (
        <p className="poll-results-note">
          Percentages show the share of respondents who selected each option
          and may total more than 100%.
        </p>
      )}
    </div>
  )
}
