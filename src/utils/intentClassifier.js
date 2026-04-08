/**
 * intentClassifier.js
 *
 * Deterministic first-pass layer that intercepts common intents BEFORE
 * the message ever reaches the LLM. This avoids hallucinated, off-topic,
 * or nonsensical responses from small models on simple inputs.
 *
 * Flow:
 *   classify(msg) → { intent, response } | null
 *   If null → fall through to LLM normally.
 */

// ── Helpers ───────────────────────────────────────────────────────────────────
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function test(msg, patterns) {
  return patterns.some((p) => p.test(msg.trim()))
}

// ── Intent Map ────────────────────────────────────────────────────────────────
const INTENTS = [
  {
    id: 'greeting',
    match: (msg) => test(msg, [
      /^(hi|hello|hey|sup|what'?s up|howdy|hola|greetings?|yo|good (morning|afternoon|evening|day))\b/i,
    ]),
    response: () => pick([
      "Hey! I'm Drew — your AI assistant. What can I help you with today?",
      "Hello! What's on your mind?",
      "Hey there! Ready when you are.",
    ]),
  },
  {
    id: 'howAreYou',
    match: (msg) => test(msg, [
      /how (are you|r u|are u|you doing|is it going|have you been)/i,
      /you (doing|good|okay|alright|well)\?/i,
    ]),
    response: () => pick([
      "Doing great, thanks for asking! What can I help you with?",
      "All good on my end! What's up?",
      "Running at full capacity 😄 — what do you need?",
    ]),
  },
  {
    id: 'thanks',
    match: (msg) => test(msg, [
      /^(thanks|thank you|thx|ty|thank u|many thanks|cheers|much appreciated|appreciate (it|that))[!.]?$/i,
      /^(perfect|great|awesome|nice|cool|got it|sounds good)[!.]?$/i,
    ]),
    response: () => pick([
      "You're welcome! Let me know if you need anything else.",
      "Happy to help! Anything else?",
      "Anytime! 👋",
    ]),
  },
  {
    id: 'whoAreYou',
    match: (msg) => test(msg, [
      /who are you/i,
      /what (are you|can you do|do you do)/i,
      /tell me about yourself/i,
      /your (name|purpose)/i,
    ]),
    response: () =>
      "I'm **Drew** — an AI assistant built to help you with conversations, travel planning, and more. I can:\n- Plan and assess trips (fragility scores, disruption recovery)\n- Remember things about you across sessions\n- Answer questions and help you think through problems\n\nWhat would you like to do?",
  },
  {
    id: 'ok',
    match: (msg) => test(msg, [
      /^(ok|okay|k|sure|yep|yup|alright|roger|noted|understood)[!.]?$/i,
    ]),
    response: () => pick([
      "Got it! What would you like to do next?",
      "Sure, I'm here whenever you're ready.",
      "Sounds good — what's next?",
    ]),
  },
]

// ── Classifier ─────────────────────────────────────────────────────────────────
/**
 * @param {string} message
 * @returns {{ intent: string, response: string } | null}
 */
export function classify(message) {
  if (!message?.trim()) return null
  // Skip classifier for messages that look like they need real reasoning
  // (contains a question mark with substance, or is more than ~6 words)
  const words = message.trim().split(/\s+/)
  const isSubstantive = words.length > 6
  if (isSubstantive) return null

  for (const intent of INTENTS) {
    if (intent.match(message)) {
      return { intent: intent.id, response: intent.response() }
    }
  }
  return null
}

/**
 * Quick sanity check on LLM output.
 * Returns true if the response looks like it might be hallucinated/off-topic.
 * Used to decide whether to show a fallback.
 */
export function looksOffTopic(userMessage, llmResponse) {
  // If model returns HTML when the user asked a conversational question
  const hasHtml = /<\/?(?:html|head|body|div|style|script)\b/i.test(llmResponse)
  const isConversational = !/code|html|page|website|css|function|script/i.test(userMessage)
  if (hasHtml && isConversational) return true

  // If the response is empty or just whitespace
  if (!llmResponse.trim()) return true

  return false
}
