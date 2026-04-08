import TripAssessmentCard from './cards/TripAssessmentCard'
import RecoveryCard from './cards/RecoveryCard'

export default function MessageBubble({ message, onAction }) {
  const isUser = message.role === 'user'
  const isDrew = message.role === 'drew'
  const isError = isDrew && isErrorMessage(message.content)

  return (
    <article className={`message ${isDrew ? 'drew-message' : 'user-message'}`}>
      <div className="message-avatar">
        {isDrew ? 'D' : 'U'}
      </div>
      <div className="message-content-wrap">
        <span className="message-sender-label">{isDrew ? 'Drew' : 'You'}</span>

        {/* Text bubble */}
        {(message.content || message.streaming) && (
          <div className={`message-bubble${message.streaming ? ' is-streaming' : ''}${isError ? ' message-bubble-error' : ''}`}>
            {message.content.split('\n').map((line, i, arr) => (
              <span key={i}>
                {renderLine(line)}
                {i < arr.length - 1 && <br />}
              </span>
            ))}
          </div>
        )}


        {/* Rich card — rendered below the text bubble */}
        {message.card && renderCard(message.card, onAction)}

        {message.time && (
          <span className="message-time">{message.time}</span>
        )}
      </div>
    </article>
  )
}

function isErrorMessage(content = '') {
  return content.startsWith('⚠️') || content.toLowerCase().startsWith('error:')
}

function renderCard(card, onAction) {
  switch (card.type) {
    case 'trip-assessment':
      return <TripAssessmentCard data={card} onAction={onAction} />
    case 'recovery':
      return <RecoveryCard data={card} />
    default:
      return null
  }
}

// Minimal inline markdown: **bold**, *italic*, `code`
function renderLine(line) {
  // Split on **bold**, *italic*, `code`
  const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i}>{part.slice(1, -1)}</em>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="message-inline-code">{part.slice(1, -1)}</code>
    }
    return part
  })
}
