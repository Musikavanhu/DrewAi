/**
 * memoryManager.js — Extract personal facts from user messages
 * and format them for injection into Drew's system prompt.
 */

// Patterns for common personal facts
const MEMORY_PATTERNS = [
  // Name
  { regex: /\bmy name is ([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)?)/i, label: (m) => `User's name is ${m[1]}` },
  { regex: /\bcall me ([A-Z][a-zA-Z]+)/i, label: (m) => `User goes by ${m[1]}` },
  { regex: /\bi(?:'m| am) ([A-Z][a-zA-Z]+)/i, label: (m) => `User's name may be ${m[1]}` },

  // Location
  { regex: /\bi(?:'m| am) (?:from|based in|in|living in) ([\w\s,]+?)(?:\.|,|$)/i, label: (m) => `User is from / based in ${m[1].trim()}` },
  { regex: /\bi live in ([\w\s,]+?)(?:\.|,|$)/i, label: (m) => `User lives in ${m[1].trim()}` },

  // Profession / Role
  { regex: /\bi(?:'m| am) a(?:n)? ([\w\s]+?(?:developer|engineer|designer|doctor|teacher|manager|student|writer|founder|ceo|analyst|architect|scientist|researcher))/i, label: (m) => `User is a ${m[1].trim()}` },
  { regex: /\bi work (?:as a(?:n)?|at) ([\w\s]+?)(?:\.|,|$)/i, label: (m) => `User works as/at ${m[1].trim()}` },

  // Preferences
  { regex: /\bi (?:love|really love|enjoy|like|prefer) ([\w\s]+?)(?:\.|,|and|$)/i, label: (m) => `User loves/enjoys ${m[1].trim()}` },
  { regex: /\bmy (?:favorite|favourite) (?:[\w]+) is ([\w\s]+?)(?:\.|,|$)/i, label: (m) => `User's favorite: ${m[1].trim()}` },
  { regex: /\bi (?:hate|dislike|don't like|do not like) ([\w\s]+?)(?:\.|,|$)/i, label: (m) => `User dislikes ${m[1].trim()}` },

  // Languages / Tools
  { regex: /\bi(?:'m| am) (?:learning|using|building with|working with) ([\w\s]+?)(?:\.|,|$)/i, label: (m) => `User is working with ${m[1].trim()}` },
  { regex: /\bmy (?:main )?(?:programming )?language is ([\w\s]+?)(?:\.|,|$)/i, label: (m) => `User's main language is ${m[1].trim()}` },

  // Explicit remember request
  { regex: /\bremember that (.+?)(?:\.|$)/i, label: (m) => m[1].trim() },
  { regex: /\bplease remember (.+?)(?:\.|$)/i, label: (m) => m[1].trim() },
]

/**
 * Extract memorable facts from a single user message.
 * Returns an array of new memory objects.
 */
export function extractMemoriesFromMessage(userText) {
  const found = []

  for (const pattern of MEMORY_PATTERNS) {
    const match = userText.match(pattern.regex)
    if (match) {
      const text = pattern.label(match)
      // Basic quality filter — skip very short or duplicate-looking results
      if (text && text.length > 6) {
        found.push({
          id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          text,
          createdAt: new Date().toISOString(),
          source: 'auto',
        })
      }
    }
  }

  return found
}

/**
 * Deduplicate new memories against existing ones.
 * Simple word-overlap check to avoid near-duplicates.
 */
export function deduplicateMemories(existing, incoming) {
  return incoming.filter((newMem) => {
    const newWords = new Set(newMem.text.toLowerCase().split(/\s+/))
    return !existing.some((ex) => {
      const exWords = ex.text.toLowerCase().split(/\s+/)
      const overlap = exWords.filter((w) => newWords.has(w)).length
      return overlap >= 3 // likely a duplicate if 3+ words match
    })
  })
}

/**
 * Format memories array into a system prompt block for Drew.
 */
export function formatMemoriesForPrompt(memories) {
  if (!memories || memories.length === 0) return ''

  const items = memories.map((m) => `- ${m.text}`).join('\n')
  return `\n\n## What I know about you\n${items}\n\nUse this context naturally in your responses — don't announce that you're referencing it, just let it inform how you talk to the user.`
}
