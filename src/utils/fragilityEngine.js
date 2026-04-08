/**
 * fragilityEngine.js — Score a trip itinerary and generate a fragility map.
 * Starts at 100, deducts per risk factor found.
 */

import { AIRPORTS } from '../data/itineraryData'

const HIGH_RISK_AIRPORTS = new Set(['JFK', 'LGA', 'EWR', 'ORD', 'DFW', 'MIA', 'BOS', 'DEN'])

/**
 * @param {object} itinerary — from itineraryData.js
 * @returns {{ score: number, grade: string, factors: Factor[] }}
 */
export function scoreItinerary(itinerary) {
  let score = 100
  const factors = []
  const seenAirports = new Set()

  // ── Layover analysis ─────────────────────────────────
  for (const layover of itinerary.layovers || []) {
    const { airport, durationMinutes, selfTransfer, terminalChange } = layover

    if (durationMinutes < 45) {
      score -= 30
      factors.push({
        label: `${durationMinutes}min layover at ${airport}`,
        detail: 'Dangerously short — a 10-min delay kills this connection',
        risk: 'HIGH',
        icon: '⚡',
        impact: -30,
      })
    } else if (durationMinutes < 75) {
      score -= 15
      factors.push({
        label: `${durationMinutes}min layover at ${airport}`,
        detail: 'Tight connection — very little buffer for gate changes or delays',
        risk: 'HIGH',
        icon: '⚡',
        impact: -15,
      })
    } else if (durationMinutes < 120) {
      score -= 8
      factors.push({
        label: `${durationMinutes}min layover at ${airport}`,
        detail: 'Manageable but worth monitoring for delays',
        risk: 'MEDIUM',
        icon: '⚠️',
        impact: -8,
      })
    }

    if (selfTransfer) {
      score -= 20
      factors.push({
        label: 'Self-transfer required',
        detail: 'Bags won\'t auto-transfer — you must recheck at the connection',
        risk: 'HIGH',
        icon: '🎒',
        impact: -20,
      })
    }

    if (terminalChange) {
      score -= 5
      factors.push({
        label: `Terminal change at ${airport}`,
        detail: 'Adds 15–30 min to your connection time',
        risk: 'MEDIUM',
        icon: '🚶',
        impact: -5,
      })
    }

    seenAirports.add(airport)
  }

  // ── Airport delay risk ────────────────────────────────
  for (const segment of itinerary.segments || []) {
    for (const code of [segment.destination]) {
      if (HIGH_RISK_AIRPORTS.has(code) && !seenAirports.has(`delay-${code}`)) {
        const airport = AIRPORTS[code]
        const penalty = code === 'JFK' || code === 'LGA' || code === 'ORD' ? 10 : 6
        score -= penalty
        factors.push({
          label: `${code} delay risk`,
          detail: airport?.note || `${code} is a high-volume airport with above-average delays`,
          risk: penalty >= 10 ? 'MEDIUM' : 'LOW',
          icon: '🏙️',
          impact: -penalty,
        })
        seenAirports.add(`delay-${code}`)
      }
    }
  }

  // ── Arrival time analysis ─────────────────────────────
  const arrivalStr = itinerary.arrivalTime || '12:00'
  const arrHour = parseInt(arrivalStr.split(':')[0], 10)
  if (arrHour >= 22 || arrHour < 5) {
    score -= 10
    factors.push({
      label: 'Late night arrival',
      detail: `Landing at ${arrivalStr} — limited re-booking options if disrupted`,
      risk: 'MEDIUM',
      icon: '🌙',
      impact: -10,
    })
  } else if (arrHour >= 20) {
    score -= 4
    factors.push({
      label: 'Evening arrival',
      detail: `Landing at ${arrivalStr} — some risk of missing last connections`,
      risk: 'LOW',
      icon: '🌆',
      impact: -4,
    })
  }

  // ── Hotel check-in analysis ───────────────────────────
  const hotel = itinerary.hotel
  if (hotel) {
    const estHour = parseInt((hotel.estimatedArrival || '18:00').split(':')[0], 10)
    const checkInHour = parseInt((hotel.checkIn || '15:00').split(':')[0], 10)
    if (estHour < checkInHour) {
      score -= 5
      factors.push({
        label: 'Early hotel arrival',
        detail: `Estimated arrival ${hotel.estimatedArrival}, check-in opens at ${hotel.checkIn}`,
        risk: 'LOW',
        icon: '🏨',
        impact: -5,
      })
    }
  }

  // ── Multi-airline transfer risk ───────────────────────
  const airlines = [...new Set((itinerary.segments || []).map(s => s.airline))]
  if (airlines.length > 1) {
    score -= 10
    factors.push({
      label: 'Multi-airline itinerary',
      detail: 'If first leg delays, second airline won\'t rebook you — you\'re on your own',
      risk: 'HIGH',
      icon: '🔀',
      impact: -10,
    })
  }

  const finalScore = Math.max(0, Math.round(score))
  return {
    score: finalScore,
    grade: gradeScore(finalScore),
    factors,
  }
}

function gradeScore(score) {
  if (score >= 85) return 'EXCELLENT'
  if (score >= 70) return 'GOOD'
  if (score >= 50) return 'FRAGILE'
  return 'RISKY'
}

export function gradeColor(grade) {
  switch (grade) {
    case 'EXCELLENT': return '#22c55e'
    case 'GOOD': return '#a78bfa'
    case 'FRAGILE': return '#f59e0b'
    case 'RISKY': return '#ef4444'
    default: return '#9494aa'
  }
}

export function riskColor(risk) {
  switch (risk) {
    case 'HIGH': return { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', text: '#f87171' }
    case 'MEDIUM': return { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', text: '#fbbf24' }
    case 'LOW': return { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)', text: '#4ade80' }
    default: return { bg: 'transparent', border: 'var(--border-subtle)', text: 'var(--text-muted)' }
  }
}
