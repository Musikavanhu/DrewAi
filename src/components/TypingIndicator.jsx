export default function TypingIndicator() {
  return (
    <div className="typing-indicator" aria-label="Drew is typing">
      <div className="message-avatar typing-avatar">D</div>
      <div className="typing-bubble-wrap">
        <div className="typing-status-label">Drew is thinking</div>
        <div className="typing-bubble">
          <div className="typing-dot" />
          <div className="typing-dot" />
          <div className="typing-dot" />
        </div>
      </div>
    </div>
  )
}
