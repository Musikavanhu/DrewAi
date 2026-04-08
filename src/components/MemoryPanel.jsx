import { useState } from 'react'

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
)

const BrainIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.14Z"/>
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.14Z"/>
  </svg>
)

function formatDate(isoString) {
  const d = new Date(isoString)
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' +
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function MemoryPanel({ open, memories, onClose, onAddMemory, onDeleteMemory, onClearAll }) {
  const [newMemoryText, setNewMemoryText] = useState('')
  const [showConfirmClear, setShowConfirmClear] = useState(false)

  const handleAdd = () => {
    if (!newMemoryText.trim()) return
    onAddMemory(newMemoryText)
    setNewMemoryText('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <>
      {/* Backdrop */}
      {open && <div className="memory-backdrop" onClick={onClose} />}

      {/* Panel */}
      <aside className={`memory-panel${open ? ' open' : ''}`} aria-label="Drew's Memories">
        {/* Header */}
        <div className="memory-panel-header">
          <div className="memory-panel-title">
            <BrainIcon />
            <span>Drew's Memories</span>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close memories">
            <CloseIcon />
          </button>
        </div>

        <p className="memory-panel-desc">
          Facts Drew remembers about you. They're injected into every conversation so Drew always knows your context.
        </p>

        {/* Add memory */}
        <div className="memory-add-row">
          <input
            id="add-memory-input"
            className="memory-add-input"
            type="text"
            placeholder="Add a memory…"
            value={newMemoryText}
            onChange={(e) => setNewMemoryText(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Add memory"
          />
          <button
            className="memory-add-btn"
            id="add-memory-btn"
            onClick={handleAdd}
            disabled={!newMemoryText.trim()}
          >
            Save
          </button>
        </div>

        {/* Memory list */}
        <div className="memory-list" role="list">
          {memories.length === 0 ? (
            <div className="memory-empty">
              <span className="memory-empty-icon">🧠</span>
              <p>No memories yet.</p>
              <p>As you chat with Drew or tell it personal facts, they'll appear here.</p>
            </div>
          ) : (
            memories.slice().reverse().map((mem) => (
              <div key={mem.id} className="memory-item" role="listitem" data-source={mem.source === 'auto' ? 'auto' : 'manual'}>
                <div className="memory-item-content">
                  <span className="memory-item-badge">{mem.source === 'auto' ? 'auto' : 'manual'}</span>
                  <p className="memory-item-text">{mem.text}</p>
                  <span className="memory-item-time">{formatDate(mem.createdAt)}</span>
                </div>
                <button
                  className="memory-delete-btn"
                  onClick={() => onDeleteMemory(mem.id)}
                  aria-label={`Delete memory: ${mem.text}`}
                >
                  <TrashIcon />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Clear all */}
        {memories.length > 0 && (
          <div className="memory-footer">
            {showConfirmClear ? (
              <div className="memory-confirm-row">
                <span>Clear all {memories.length} memories?</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="memory-confirm-yes" onClick={() => { onClearAll(); setShowConfirmClear(false) }}>Yes, clear</button>
                  <button className="memory-confirm-no" onClick={() => setShowConfirmClear(false)}>Cancel</button>
                </div>
              </div>
            ) : (
              <button className="memory-clear-btn" onClick={() => setShowConfirmClear(true)}>
                Clear all memories
              </button>
            )}
          </div>
        )}
      </aside>
    </>
  )
}
