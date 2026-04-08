/**
 * storage.js — localStorage helpers for Drew AI
 * Keys:
 *   drew_chats          → array of chat metadata objects
 *   drew_messages_{id}  → messages array for a specific chat
 *   drew_memories       → array of memory objects
 */

const KEYS = {
  chats: 'drew_chats',
  memories: 'drew_memories',
  messages: (id) => `drew_messages_${id}`,
}

// ── Chats ────────────────────────────────────────────────
export function loadChats() {
  try {
    const raw = localStorage.getItem(KEYS.chats)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveChats(chats) {
  try {
    localStorage.setItem(KEYS.chats, JSON.stringify(chats))
  } catch (e) {
    console.warn('[storage] saveChats failed:', e)
  }
}

// ── Messages (per chat) ──────────────────────────────────
export function loadMessages(chatId) {
  try {
    const raw = localStorage.getItem(KEYS.messages(chatId))
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveMessages(chatId, messages) {
  try {
    localStorage.setItem(KEYS.messages(chatId), JSON.stringify(messages))
  } catch (e) {
    console.warn('[storage] saveMessages failed:', e)
  }
}

export function deleteMessages(chatId) {
  try {
    localStorage.removeItem(KEYS.messages(chatId))
  } catch (e) {
    console.warn('[storage] deleteMessages failed:', e)
  }
}

// ── Memories ─────────────────────────────────────────────
export function loadMemories() {
  try {
    const raw = localStorage.getItem(KEYS.memories)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveMemories(memories) {
  try {
    localStorage.setItem(KEYS.memories, JSON.stringify(memories))
  } catch (e) {
    console.warn('[storage] saveMemories failed:', e)
  }
}

// ── Clear All ─────────────────────────────────────────────
export function clearAll() {
  Object.keys(localStorage)
    .filter((k) => k.startsWith('drew_'))
    .forEach((k) => localStorage.removeItem(k))
}
