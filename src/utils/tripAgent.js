/**
 * tripAgent.js — Orchestrates the 3-flow trip agent pipeline.
 * 1. Detect trip requests from user messages
 * 2. Extract structured data via the backend AI proxy
 * 3. Score the itinerary and return a rich card payload
 */

import { findItinerary, resolveDate } from '../data/itineraryData'
import { scoreItinerary } from './fragilityEngine'

// Proxy URL — never the real provider endpoint (kept in server/.env)
const API_URL = '/api/chat'

// ── Detection ────────────────────────────────────────────

const TRIP_KEYWORDS = /\b(fly|flight|flying|travel|trip|traveling|going from|need to go|get from|book a flight|book a trip|head to|depart|departure|arrive|arrival|layover|connection|itinerary|airport)\b/i
const AIRPORT_PAIR = /\b([A-Z]{3})\b.*\b([A-Z]{3})\b/

export function isTripRequest(msg) {
  if (TRIP_KEYWORDS.test(msg)) return true
  const match = AIRPORT_PAIR.exec(msg)
  if (match && match[1] !== match[2]) return true
  // "from X to Y" pattern
  if (/\bfrom\s+\w[\w\s]+\s+to\s+\w[\w\s]+/i.test(msg)) return true
  return false
}

// ── LLM Extraction ────────────────────────────────────────

const EXTRACTION_PROMPT = `You are a travel data extractor. Extract travel details from the user message and return ONLY a valid JSON object with no explanation.

Required JSON fields:
- "origin": IATA airport code (3 letters, e.g. "SFO"). If city name given, infer the main airport code.
- "destination": IATA airport code (3 letters, e.g. "JFK"). If city name given, infer the main airport code.
- "departureDate": the date or day mentioned (e.g. "next Tuesday", "tomorrow", "April 7")
- "budget": maximum budget as a number, null if not mentioned
- "tripType": "business" or "leisure" based on context
- "preferences": array of preference strings mentioned (e.g. ["fewer connections", "morning departure"])
- "travelers": number of travelers, default 1

City → Airport mappings to use:
New York → JFK, Los Angeles → LAX, Chicago → ORD, San Francisco → SFO,
Boston → BOS, Miami → MIA, Seattle → SEA, Dallas → DFW, Denver → DEN,
Atlanta → ATL, Houston → IAH, Phoenix → PHX, Las Vegas → LAS

Respond with ONLY the JSON object. No markdown, no explanation.`

async function extractTripData(userMessage) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: EXTRACTION_PROMPT },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.1, // Low temp for structured extraction
        max_tokens: 300,
        stream: false,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`AI server ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    let raw = data.choices?.[0]?.message?.content || ''

    // Strip DeepSeek <think> tags
    raw = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()

    // Extract JSON from markdown fences if present
    const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]+?)\s*```/)
    if (fenceMatch) raw = fenceMatch[1]

    // Find first { ... } block
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found')

    return JSON.parse(jsonMatch[0])
  } catch (err) {
    console.warn('[tripAgent] LLM extraction failed, using regex fallback:', err.message)
    return regexFallback(userMessage)
  }
}

function regexFallback(msg) {
  // Airport codes
  const codes = msg.match(/\b([A-Z]{3})\b/g) || []
  const origin = codes[0] || inferAirport(msg, 'from') || 'SFO'
  const destination = codes[1] || inferAirport(msg, 'to') || 'JFK'

  // Budget
  const budgetMatch = msg.match(/\$?([\d,]+)\s*(?:budget|max|maximum|under|below|or less)/i)
    || msg.match(/under\s+\$?([\d,]+)/i)
    || msg.match(/\$\s*([\d,]+)/i)
  const budget = budgetMatch ? parseInt(budgetMatch[1].replace(',', '')) : null

  // Date
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  let departureDate = 'TBD'
  for (const day of days) {
    if (msg.toLowerCase().includes(day)) {
      departureDate = msg.toLowerCase().includes('next') ? `next ${day}` : day
      break
    }
  }
  if (msg.toLowerCase().includes('tomorrow')) departureDate = 'tomorrow'

  const tripType = /\b(client|meeting|conference|work|business|presentation)\b/i.test(msg) ? 'business' : 'leisure'

  return { origin, destination, departureDate, budget, tripType, preferences: [], travelers: 1 }
}

function inferAirport(msg, direction) {
  const cityMap = {
    'san francisco': 'SFO', 'new york': 'JFK', 'los angeles': 'LAX', 'chicago': 'ORD',
    'boston': 'BOS', 'miami': 'MIA', 'seattle': 'SEA', 'dallas': 'DFW', 'denver': 'DEN',
    'atlanta': 'ATL', 'houston': 'IAH', 'las vegas': 'LAS', 'phoenix': 'PHX',
  }
  const pattern = direction === 'from'
    ? /\bfrom\s+([\w\s]+?)(?:\s+to|\s+on|\s+next|\s+this|,|\.)/i
    : /\bto\s+([\w\s]+?)(?:\s+on|\s+next|\s+this|\s+for|,|\.)/i
  const match = msg.match(pattern)
  if (!match) return null
  const city = match[1].trim().toLowerCase()
  for (const [name, code] of Object.entries(cityMap)) {
    if (city.includes(name)) return code
  }
  return null
}

// ── Main Orchestrator ────────────────────────────────────

export async function processTripMessage(userMessage, memories = []) {
  // 1. Extract trip data via LLM
  const tripData = await extractTripData(userMessage)

  // 2. Resolve date
  const displayDate = resolveDate(tripData.departureDate)

  // 3. Find matching itinerary
  const itinerary = findItinerary(tripData.origin, tripData.destination)

  // 4. Update itinerary origin/destination to match extracted data
  if (itinerary.routeKey === 'GENERIC') {
    itinerary.segments[0].origin = tripData.origin
    itinerary.segments[itinerary.segments.length - 1].destination = tripData.destination
  }

  // 5. Score the itinerary
  const assessment = scoreItinerary(itinerary)

  // 6. Check budget fit
  const budgetFit = !tripData.budget || itinerary.price <= tripData.budget
  const budgetNote = tripData.budget
    ? budgetFit
      ? `✓ Within your $${tripData.budget} budget ($${itinerary.price})`
      : `⚠ Over budget by $${itinerary.price - tripData.budget} — best available option shown`
    : null

  // 7. Build Drew's intro text
  const gradeEmoji = { EXCELLENT: '🟢', GOOD: '🟣', FRAGILE: '🟡', RISKY: '🔴' }[assessment.grade] || '⚪'
  const content = `Got it${tripData.tripType === 'business' ? ' — business trip' : ''}. I've analyzed the best available itinerary for **${tripData.origin} → ${tripData.destination}** on **${displayDate}**.\n\nConfidence score: **${assessment.score}/100** ${gradeEmoji} ${assessment.grade}${budgetNote ? `\n${budgetNote}` : ''}\n\nHere's the full trip brief 👇`

  return {
    content,
    card: {
      type: 'trip-assessment',
      tripData: { ...tripData, displayDate },
      itinerary,
      assessment,
      budgetNote,
    },
  }
}
