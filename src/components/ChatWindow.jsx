import { useRef, useEffect, useState } from 'react'
import MessageBubble from './MessageBubble'
import WelcomeScreen from './WelcomeScreen'
import TypingIndicator from './TypingIndicator'

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
)
const MenuIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
)
const SearchIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)
const DotsIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="5" r="1.2" fill="currentColor"/>
    <circle cx="12" cy="12" r="1.2" fill="currentColor"/>
    <circle cx="12" cy="19" r="1.2" fill="currentColor"/>
  </svg>
)
const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const PlusIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)
const BrainIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.14Z"/>
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.14Z"/>
  </svg>
)

export default function ChatWindow({
  messages,
  isTyping,
  onSendMessage,
  onToggleSidebar,
  sidebarOpen,
  onCardAction,
  onDeleteActiveChat,
  onNewChat,
  onOpenMemories,
}) {
  const [inputValue, setInputValue] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const textareaRef = useRef(null)
  const messagesEndRef = useRef(null)
  const searchInputRef = useRef(null)
  const menuRef = useRef(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Focus search input when it opens
  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus()
    else setSearchQuery('')
  }, [searchOpen])

  // Close dots menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleSend = () => {
    if (!inputValue.trim()) return
    onSendMessage(inputValue)
    setInputValue('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  const handleInput = (e) => {
    setInputValue(e.target.value)
    const ta = textareaRef.current
    if (ta) { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 160) + 'px' }
  }

  // Filter messages by search query
  const displayMessages = searchQuery.trim()
    ? messages.filter(m => m.content?.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages

  const matchCount = searchQuery.trim() ? displayMessages.length : null

  // Dots menu actions
  const handleScrollToTop = () => {
    document.getElementById('messages-area')?.scrollTo({ top: 0, behavior: 'smooth' })
    setMenuOpen(false)
  }
  const handleCopyChat = () => {
    const text = messages.map(m => `${m.role === 'drew' ? 'Drew' : 'You'}: ${m.content}`).join('\n\n')
    navigator.clipboard.writeText(text).catch(() => {})
    setMenuOpen(false)
  }
  const handleDeleteChat = () => {
    if (window.confirm('Delete this chat and all its messages? This cannot be undone.')) {
      onDeleteActiveChat?.()
    }
    setMenuOpen(false)
  }

  return (
    <main className="chat-main">
      {/* Header */}
      <header className="chat-header">
        <div className="chat-header-agent">
          <button
            className={`header-icon-btn${sidebarOpen ? ' sidebar-toggle-open' : ''}`}
            onClick={onToggleSidebar}
            id="toggle-sidebar-btn"
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            <MenuIcon />
          </button>
          <div className="agent-avatar">D</div>
          <div className="agent-info">
            <span className="agent-name">Drew</span>
            <span className="agent-status">Online</span>
          </div>
        </div>

        <div className="header-actions">
          {/* Search toggle */}
          <button
            className={`header-icon-btn${searchOpen ? ' icon-btn-active' : ''}`}
            onClick={() => { setSearchOpen(v => !v); setMenuOpen(false) }}
            aria-label="Toggle search"
            title="Search messages"
          >
            <SearchIcon />
          </button>

          {/* Dots menu */}
          <div className="header-menu-wrap" ref={menuRef}>
            <button
              className={`header-icon-btn${menuOpen ? ' icon-btn-active' : ''}`}
              onClick={() => { setMenuOpen(v => !v); setSearchOpen(false) }}
              aria-label="More options"
              title="More options"
            >
              <DotsIcon />
            </button>
            {menuOpen && (
              <div className="header-dropdown" role="menu">
                <button className="header-dropdown-item" onClick={handleScrollToTop} role="menuitem">
                  ↑ Scroll to top
                </button>
                <button className="header-dropdown-item" onClick={handleCopyChat} role="menuitem">
                  📋 Copy chat
                </button>
                <div className="header-dropdown-divider" />
                <button className="header-dropdown-item" onClick={handleDeleteChat} role="menuitem" style={{ color: '#f87171' }}>
                  🗑 Delete this chat
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Search bar */}
      {searchOpen && (
        <div className="header-search-bar">
          <SearchIcon />
          <input
            ref={searchInputRef}
            className="header-search-input"
            type="text"
            placeholder="Search messages…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Escape' && setSearchOpen(false)}
            aria-label="Search messages"
          />
          {matchCount !== null && (
            <span className="header-search-count">{matchCount} result{matchCount !== 1 ? 's' : ''}</span>
          )}
          <button className="header-icon-btn" onClick={() => setSearchOpen(false)} aria-label="Close search">
            <CloseIcon />
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="messages-area" id="messages-area" role="log" aria-live="polite">
        {messages.length === 0 ? (
          <WelcomeScreen onSuggestionClick={onSendMessage} />
        ) : (
          <>
            {searchQuery && displayMessages.length === 0 ? (
              <div className="search-no-results">No messages matching "{searchQuery}"</div>
            ) : (
              displayMessages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} onAction={onCardAction} />
              ))
            )}
            {!searchQuery && isTyping && <TypingIndicator />}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="composer-shell">
        <div className="input-container">
          <div className="input-wrapper">
            <div className="input-field-stack">
              <textarea
                ref={textareaRef}
                id="chat-input"
                className="chat-input"
                placeholder="Search or ask anything"
                value={inputValue}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                rows={1}
                aria-label="Chat input"
              />
              <div className="input-bottom-row">
                <div className="input-mini-actions">
                  <button className="input-action-btn" aria-label="Start new chat" onClick={() => onNewChat?.()} type="button">
                    <PlusIcon />
                  </button>
                  <button className="input-action-btn" aria-label="Open memories" onClick={() => onOpenMemories?.()} type="button">
                    <BrainIcon />
                  </button>
                </div>
                <div className="input-mode-pill">
                  <span className="input-mode-dot" />
                  Focused
                </div>
              </div>
            </div>
            <div className="input-actions">
              <button
                className="send-btn"
                id="send-btn"
                onClick={handleSend}
                disabled={!inputValue.trim()}
                aria-label="Send message"
              >
                <SendIcon />
              </button>
            </div>
          </div>
        </div>
        <p className="input-hint">
          Press <kbd>Enter</kbd> to send and <kbd>Shift + Enter</kbd> for a new line
        </p>
      </div>
    </main>
  )
}
