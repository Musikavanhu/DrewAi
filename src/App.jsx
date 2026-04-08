import { useState, useEffect, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import ChatWindow from './components/ChatWindow'
import MemoryPanel from './components/MemoryPanel'
import { streamDrewResponse } from './utils/drewAI'
import { classify, looksOffTopic } from './utils/intentClassifier'
import { isTripRequest, processTripMessage } from './utils/tripAgent'
import { generateRecoveryOptions, DISRUPTION_TYPES } from './utils/recoveryEngine'
import {
  loadChats, saveChats,
  loadMessages, saveMessages, deleteMessages,
  loadMemories, saveMemories,
} from './utils/storage'
import { extractMemoriesFromMessage, deduplicateMemories } from './utils/memoryManager'

const DEFAULT_CHATS = [
  { id: 'chat_default', title: 'Getting started with Drew', active: true },
]

function App() {
  const [chats, setChats] = useState(() => loadChats() || DEFAULT_CHATS)
  const [activeChatId, setActiveChatId] = useState(
    () => (loadChats() || DEFAULT_CHATS).find((c) => c.active)?.id || 'chat_default'
  )
  const [messages, setMessages] = useState(() =>
    loadMessages((loadChats() || DEFAULT_CHATS).find((c) => c.active)?.id || 'chat_default')
  )
  const [memories, setMemories] = useState(() => loadMemories())
  const [isTyping, setIsTyping] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [memoryPanelOpen, setMemoryPanelOpen] = useState(false)
  const [lastItinerary, setLastItinerary] = useState(null)

  useEffect(() => { saveChats(chats) }, [chats])
  useEffect(() => { saveMemories(memories) }, [memories])

  // ── Send Message ─────────────────────────────────────────
  const handleSendMessage = useCallback(async (text) => {
    if (!text.trim()) return

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    const currentMessages = messages
    const nextMessages = [...currentMessages, userMsg]
    setMessages(nextMessages)
    saveMessages(activeChatId, nextMessages)

    // Auto-extract memories from user messages
    const newMems = extractMemoriesFromMessage(text)
    if (newMems.length > 0) {
      setMemories((prev) => {
        const deduped = deduplicateMemories(prev, newMems)
        return deduped.length > 0 ? [...prev, ...deduped] : prev
      })
    }

    const drewMsgId = Date.now() + 1
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    if (isTripRequest(text)) {
      // ── Trip Agent Flow (non-streaming — returns a card) ──────────
      setIsTyping(true)
      const result = await processTripMessage(text, memories)
      setLastItinerary(result.card?.itinerary || null)
      const drewMsg = {
        id: drewMsgId, role: 'drew',
        content: result.content, card: result.card, time: timestamp,
      }
      setIsTyping(false)
      const finalMessages = [...nextMessages, drewMsg]
      setMessages(finalMessages)
      saveMessages(activeChatId, finalMessages)
    } else {
      // ── Deterministic intent layer (greetings, thanks, etc.) ──────────
      const classified = classify(text)
      if (classified) {
        const drewMsg = { id: drewMsgId, role: 'drew', content: classified.response, time: timestamp }
        const finalMessages = [...nextMessages, drewMsg]
        setMessages(finalMessages)
        saveMessages(activeChatId, finalMessages)
      } else {
        // ── Normal Drew Chat — stream tokens into a live message ──────────
        const placeholder = { id: drewMsgId, role: 'drew', content: '', time: timestamp, streaming: true }
        setMessages([...nextMessages, placeholder])

        let finalContent = ''
        await streamDrewResponse(text, currentMessages, memories, (partialText, isDone) => {
          finalContent = partialText
          setMessages((prev) => {
            const updated = prev.map((m) =>
              m.id === drewMsgId ? { ...m, content: partialText, streaming: !isDone } : m
            )
            if (isDone) saveMessages(activeChatId, updated)
            return updated
          })
        })

        // Post-stream: detect hallucinated HTML in conversational reply
        if (looksOffTopic(text, finalContent)) {
          const fallback = "I'm not sure I followed that — could you rephrase or give me a bit more detail?"
          setMessages((prev) => {
            const updated = prev.map((m) =>
              m.id === drewMsgId ? { ...m, content: fallback, streaming: false } : m
            )
            saveMessages(activeChatId, updated)
            return updated
          })
        }
      }
    }


    // Name the chat after the first message
    if (currentMessages.length === 0) {
      setChats((prev) =>
        prev.map((c) =>
          c.id === activeChatId
            ? { ...c, title: text.slice(0, 40) + (text.length > 40 ? '…' : '') }
            : c
        )
      )
    }
  }, [messages, memories, activeChatId])


  // ── Card Actions (disruption simulate, etc.) ──────────────
  const handleCardAction = useCallback((action, payload) => {
    if (action === 'simulate-disruption') {
      const { disruptionId, itinerary } = payload
      const disruption = DISRUPTION_TYPES.find((d) => d.id === disruptionId)
      const options = generateRecoveryOptions(disruptionId, itinerary || lastItinerary)

      const userMsg = {
        id: Date.now(),
        role: 'user',
        content: `${disruption?.icon || '⚡'} Simulate: ${disruption?.label || disruptionId}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }

      const drewMsg = {
        id: Date.now() + 1,
        role: 'drew',
        content: `Here are your **3 recovery options** for a *${disruption?.label}* scenario. Drew's ranked them by speed, cost, and comfort 👇`,
        card: {
          type: 'recovery',
          disruption,
          options,
        },
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }

      const updated = [...messages, userMsg, drewMsg]
      setMessages(updated)
      saveMessages(activeChatId, updated)
    }
  }, [messages, activeChatId, lastItinerary])

  // Close sidebar on mobile after any sidebar interaction
  const closeSidebarOnMobile = useCallback(() => {
    if (window.innerWidth <= 768) setSidebarOpen(false)
  }, [])

  // ── Chat Management ───────────────────────────────────────
  const handleNewChat = useCallback(() => {
    const newId = `chat_${Date.now()}`
    const newChat = { id: newId, title: 'New conversation', active: true }
    setChats((prev) => [newChat, ...prev.map((c) => ({ ...c, active: false }))])
    setActiveChatId(newId)
    setMessages([])
    setLastItinerary(null)
    closeSidebarOnMobile()
  }, [closeSidebarOnMobile])

  const handleSelectChat = useCallback((id) => {
    setActiveChatId(id)
    setChats((prev) => prev.map((c) => ({ ...c, active: c.id === id })))
    setMessages(loadMessages(id))
    setMemoryPanelOpen(false)
    setLastItinerary(null)
    closeSidebarOnMobile()
  }, [closeSidebarOnMobile])

  const handleDeleteChat = useCallback((id) => {
    deleteMessages(id)
    setChats((prev) => {
      const remaining = prev.filter((c) => c.id !== id)
      if (remaining.length === 0) {
        const fallback = { id: `chat_${Date.now()}`, title: 'New conversation', active: true }
        setActiveChatId(fallback.id)
        setMessages([])
        return [fallback]
      }
      if (id === activeChatId) {
        const next = remaining[0]
        setActiveChatId(next.id)
        setMessages(loadMessages(next.id))
        return remaining.map((c, i) => ({ ...c, active: i === 0 }))
      }
      return remaining
    })
  }, [activeChatId])

  // ── Memory Actions ────────────────────────────────────────
  const handleAddMemory = useCallback((text) => {
    if (!text.trim()) return
    const mem = { id: `mem_${Date.now()}`, text: text.trim(), createdAt: new Date().toISOString(), source: 'manual' }
    setMemories((prev) => [...prev, mem])
  }, [])
  const handleDeleteMemory = useCallback((id) => setMemories((prev) => prev.filter((m) => m.id !== id)), [])
  const handleClearMemories = useCallback(() => setMemories([]), [])

  // Delete the currently active chat and switch to the next available one
  const handleDeleteActiveChat = useCallback(() => {
    handleDeleteChat(activeChatId)
  }, [activeChatId, handleDeleteChat])

  return (
    <div className="app">
      {/* Mobile backdrop — tap to close sidebar */}
      {sidebarOpen && (
        <div
          className="sidebar-mobile-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      <Sidebar
        chats={chats}
        open={sidebarOpen}
        memoryCount={memories.length}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        onToggle={() => setSidebarOpen((v) => !v)}
        onOpenMemories={() => { setMemoryPanelOpen(true); closeSidebarOnMobile() }}
      />
      <ChatWindow
        messages={messages}
        isTyping={isTyping}
        onSendMessage={handleSendMessage}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        sidebarOpen={sidebarOpen}
        onCardAction={handleCardAction}
        onDeleteActiveChat={handleDeleteActiveChat}
        onNewChat={handleNewChat}
        onOpenMemories={() => setMemoryPanelOpen(true)}
      />
      <MemoryPanel
        open={memoryPanelOpen}
        memories={memories}
        onClose={() => setMemoryPanelOpen(false)}
        onAddMemory={handleAddMemory}
        onDeleteMemory={handleDeleteMemory}
        onClearAll={handleClearMemories}
      />
    </div>
  )

}

export default App
