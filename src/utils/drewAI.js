/**
 * drewAI.js
 * Drew's AI engine — powered by the local backend proxy.
 * The server routes requests to Hugging Face's OpenAI-compatible chat API.
 *
 * Exports:
 *   streamDrewResponse(userMessage, history, memories, onToken) — streaming
 *   generateDrewResponse(userMessage, history, memories)        — one-shot fallback
 */

import { formatMemoriesForPrompt } from './memoryManager'

// All requests go to the backend proxy — never directly to Hugging Face.
// The server injects the real provider URL, token, and model from server/.env.
const API_URL = '/api/chat'
const LOCAL_SERVER_URL = 'http://localhost:3001'

const DREW_BASE_PROMPT = `You are Drew, a focused and concise AI assistant. Follow these rules strictly:

RULES (never break these):
1. ONLY respond to what the user actually asked. Never add unrequested content.
2. Do NOT generate HTML, CSS, code blocks, or markdown tables unless the user explicitly asks for code.
3. Do NOT greet the user with "Welcome" or "Great to hear" — respond naturally to the actual message.
4. If the user asks how you are or greets you, respond briefly and naturally (1-2 sentences max).
5. If the user asks a simple short question, give a short direct answer. Do not pad or elaborate.
6. Never fabricate facts, memories, or context that wasn't in the conversation.
7. Stay on topic. If you don't know something, say so plainly.
8. Use markdown only for structure (bullet lists, bold, headings) when it genuinely helps readability.

PERSONA:
- Name: Drew
- Tone: direct, slightly warm, never sycophantic
- Style: concise first, then detailed only if asked

OUTPUT FORMAT:
- Short questions → short answers (1-5 sentences)
- Complex questions → structured but still minimal
- No filler phrases like "Certainly!", "Of course!", "Absolutely!", "Great question!"
`

function buildMessages(userMessage, history, memories) {
  const memoriesBlock = formatMemoriesForPrompt(memories)
  return [
    { role: 'system', content: DREW_BASE_PROMPT + memoriesBlock },
    ...history.map((m) => ({
      role: m.role === 'drew' ? 'assistant' : 'user',
      content: m.content,
    })),
    { role: 'user', content: userMessage },
  ]
}

// Strip DeepSeek <think>…</think> reasoning blocks
function stripThinkTags(text) {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trimStart()
}

async function readProxyError(response) {
  const text = await response.text()

  try {
    const parsed = JSON.parse(text)
    return parsed.error || text
  } catch {
    return text
  }
}

function formatProxyFailure(err) {
  if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
    return `⚠️ I can't reach the local AI server right now. Make sure the backend is running on \`${LOCAL_SERVER_URL}\`.`
  }

  if (err.message.includes('HF_API_KEY')) {
    return '⚠️ The backend is not configured for Hugging Face yet. Add `HF_API_KEY` to `server/.env` and restart the server.'
  }

  return `⚠️ Something went wrong: ${err.message}`
}

/**
 * Stream Drew's response token-by-token via SSE.
 * @param {string}   userMessage
 * @param {Array}    history     - Previous messages [{ role, content }]
 * @param {Array}    memories    - Saved personal memories
 * @param {Function} onToken     - Called with (partialText, isDone)
 *                                 isDone=true on the final call
 * @returns {Promise<string>}    - Full accumulated response
 */
export async function streamDrewResponse(userMessage, history = [], memories = [], onToken) {
  const messages = buildMessages(userMessage, history, memories)

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        temperature: 0.7,
        max_tokens: 1024,
        stream: true,
      }),
    })

    if (!response.ok) {
      const errText = await readProxyError(response)
      throw new Error(`AI server error ${response.status}: ${errText}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let accumulated = ''
    let displayText = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n')

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed === 'data: [DONE]') continue
        if (!trimmed.startsWith('data: ')) continue

        try {
          const json = JSON.parse(trimmed.slice(6))
          const delta = json.choices?.[0]?.delta?.content ?? ''
          if (!delta) continue

          accumulated += delta

          // Track <think> blocks and only surface non-think content
          const cleaned = stripThinkTags(accumulated)
          if (cleaned !== displayText) {
            displayText = cleaned
            onToken?.(displayText, false)
          }
        } catch {
          // Skip malformed SSE lines
        }
      }
    }

    const final = displayText || "I'm sorry, I didn't get a response. Please try again."
    onToken?.(final, true)
    return final
  } catch (err) {
    console.error('[Drew AI] Streaming error:', err)
    const errMsg = formatProxyFailure(err)

    onToken?.(errMsg, true)
    return errMsg
  }
}

/**
 * Non-streaming fallback (kept for use in tripAgent.js extraction calls).
 */
export async function generateDrewResponse(userMessage, history = [], memories = []) {
  const messages = buildMessages(userMessage, history, memories)

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, temperature: 0.7, max_tokens: 1024, stream: false }),
    })

    if (!response.ok) {
      const errText = await readProxyError(response)
      throw new Error(`AI server error ${response.status}: ${errText}`)
    }

    const data = await response.json()
    const rawContent = data.choices?.[0]?.message?.content ?? ''
    return stripThinkTags(rawContent) || "I'm sorry, I didn't get a response. Please try again."
  } catch (err) {
    console.error('[Drew AI] Error:', err)
    return formatProxyFailure(err)
  }
}
