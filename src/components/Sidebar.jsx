import React from 'react'

const icons = {
  chat: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  plus: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  brain: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.14Z"/>
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.14Z"/>
    </svg>
  ),
  settings: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  trash: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
    </svg>
  ),
}

export default function Sidebar({ chats, open, memoryCount, onNewChat, onSelectChat, onDeleteChat, onToggle, onOpenMemories }) {
  return (
    <aside className={`sidebar${open ? '' : ' closed'}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">D</div>
        <div className="sidebar-brand-block">
          <span className="sidebar-brand">Drew</span>
          <span className="sidebar-caption">Ambient assistant</span>
        </div>
      </div>

      <button className="sidebar-new-chat" onClick={onNewChat} id="new-chat-btn">
        {icons.plus}
        Start a new thread
      </button>

      <div className="sidebar-section-label">Recent</div>

      <div className="sidebar-chat-list" role="list">
        {chats.map((chat) => (
          <div
            key={chat.id}
              className={`sidebar-chat-item${chat.active ? ' active' : ''}`}
              onClick={() => onSelectChat(chat.id)}
              role="listitem"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onSelectChat(chat.id)}
          >
            <span className="sidebar-chat-icon">{icons.chat}</span>
            <span className="sidebar-chat-title">{chat.title}</span>
            <button
              className="sidebar-chat-delete"
              onClick={(e) => { e.stopPropagation(); onDeleteChat(chat.id) }}
              aria-label={`Delete chat: ${chat.title}`}
              title="Delete chat"
            >
              {icons.trash}
            </button>
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <div
          className="sidebar-footer-item sidebar-memories-btn"
          onClick={onOpenMemories}
          role="button"
          tabIndex={0}
          id="open-memories-btn"
          onKeyDown={(e) => e.key === 'Enter' && onOpenMemories()}
        >
          {icons.brain}
          <span>Memories</span>
          {memoryCount > 0 && (
            <span className="memory-count-badge">{memoryCount}</span>
          )}
        </div>
        <div className="sidebar-footer-item">
          {icons.settings}
          Studio settings
        </div>
      </div>
    </aside>
  )
}
