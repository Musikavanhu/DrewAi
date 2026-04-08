/**
 * recoveryEngine.js — Generate 3 recovery options for a given disruption type.
 */

export const DISRUPTION_TYPES = [
  { id: 'delayed-first-leg', label: 'First leg delayed 2+ hours', icon: '✈️', shortLabel: 'Delayed flight' },
  { id: 'missed-connection', label: 'Missed connection at hub', icon: '⛔', shortLabel: 'Missed connection' },
  { id: 'hotel-late-arrival', label: 'Hotel after check-in cutoff', icon: '🏨', shortLabel: 'Late hotel arrival' },
]

/**
 * @param {string} disruptionId — one of DISRUPTION_TYPES[].id
 * @param {object} itinerary — from itineraryData.js
 * @returns {{ fastest, cheapest, mostComfortable }}
 */
export function generateRecoveryOptions(disruptionId, itinerary) {
  const dest = getLastDestination(itinerary)
  const layoverAirport = itinerary.layovers?.[0]?.airport || 'hub'
  const hotel = itinerary.hotel?.name || 'your hotel'
  const checkIn = itinerary.hotel?.checkIn || '15:00'

  switch (disruptionId) {
    case 'delayed-first-leg':
      return {
        fastest: {
          title: 'Next Available Same-Airline Flight',
          emoji: '⚡',
          color: 'blue',
          etaDelta: '+2h – 3h',
          costDelta: '$0',
          costNote: 'Covered by airline',
          comfort: 2,
          steps: [
            'Open airline app immediately — tap "Rebook" before the gate agent queue forms',
            'Filter for next departure to ' + dest + ' with any stops',
            'Accept the auto-rebook offer if available — fastest path',
            'Request a meal voucher at the gate (you\'re entitled to it for 2h+ delays)',
          ],
          tradeoff: 'Middle seat likely, rushed boarding — but you arrive soonest',
          pro: 'Fastest arrival, zero extra cost',
        },
        cheapest: {
          title: 'Standby + Full-Day Wait',
          emoji: '💰',
          color: 'green',
          etaDelta: '+4h – 6h',
          costDelta: '+$45',
          costNote: 'Lounge day pass only',
          comfort: 3,
          steps: [
            'Ask gate agent to add you to standby list for the next 3 departures',
            'Buy airport lounge day pass ($45) — work, eat, shower comfortably',
            'Board standby on the first flight with open seats',
            'If no standby opens, you\'re guaranteed on the guaranteed-seat next flight',
          ],
          tradeoff: 'Longest wait, but minimal cost. Great if meeting isn\'t until tomorrow',
          pro: 'Zero ticket cost, comfortable wait',
        },
        mostComfortable: {
          title: 'Business Upgrade on Next Departure',
          emoji: '🛋️',
          color: 'purple',
          etaDelta: '+2h 30m – 4h',
          costDelta: '+$180 – $400',
          costNote: 'One-way upgrade from economy',
          comfort: 5,
          steps: [
            'Check business/first cabin availability on next 2 departures (airline app → "Manage Trip")',
            'Upgrade via miles (best value) or one-time cash purchase',
            'Priority security + boarding means you\'re settled before chaos hits',
            'Arrive refreshed — flat bed if it becomes an overnight situation',
          ],
          tradeoff: 'Most expensive option, but best recovery especially for client meetings',
          pro: 'Premium cabin, priority everything, arrive in best shape',
        },
      }

    case 'missed-connection':
      return {
        fastest: {
          title: 'Sprint to Airline Customer Service',
          emoji: '⚡',
          color: 'blue',
          etaDelta: '+1h 30m – 3h',
          costDelta: '$0',
          costNote: 'Airline responsibility',
          comfort: 2,
          steps: [
            `You\'re at ${layoverAirport} — run (don\'t walk) to the airline\'s service desk, not the gate`,
            'Text ahead: open the airline app and tap rebook while running — faster than the queue',
            'Ask specifically for the next flight with a confirmed seat (not standby)',
            'Demand a meal voucher + lounge access if wait exceeds 2 hours — it\'s your right',
          ],
          tradeoff: 'Physical hustle required, but this gets you to ' + dest + ' fastest',
          pro: 'Airline covers everything, next flight out',
        },
        cheapest: {
          title: 'One-Way Budget Airline + Lounge',
          emoji: '💰',
          color: 'green',
          etaDelta: '+3h – 5h',
          costDelta: '+$89 – $160',
          costNote: 'Budget airline one-way ticket',
          comfort: 3,
          steps: [
            'Check Google Flights for next 6 hours — budget carriers often have open seats',
            'Book one-way to ' + dest + ' independently if cheaper than rebooking fee',
            'File airline delay claim for original ticket refund (EU261 or DOT rules)',
            'Use airport lounge day pass ($45) for comfort while you wait',
          ],
          tradeoff: 'Requires independent booking, but you control the timeline',
          pro: 'Often faster than waiting for airline rebook + possible refund',
        },
        mostComfortable: {
          title: 'Hotel Tonight + Morning Flight',
          emoji: '🛋️',
          color: 'purple',
          etaDelta: '+12h – 16h',
          costDelta: '+$0 – $50',
          costNote: 'Airline owes you hotel (IDB policy)',
          comfort: 5,
          steps: [
            'Declare the connection missed — demand a hotel voucher (airlines must provide for irregular ops)',
            `Book a good airport hotel near ${layoverAirport} for tonight`,
            'Request first flight out to ' + dest + ' tomorrow morning — confirmed seat, not standby',
            'Use the rest of today to rest, work from the hotel, prep for your meeting',
          ],
          tradeoff: 'Arrives latest, but you show up to ' + dest + ' rested and ready',
          pro: 'Most restorative — hotel covered, morning arrival, professional state of mind',
        },
      }

    case 'hotel-late-arrival':
      return {
        fastest: {
          title: 'Airport Hotel + Taxi at Dawn',
          emoji: '⚡',
          color: 'blue',
          etaDelta: 'Check in within 20 min',
          costDelta: '+$189 – $240',
          costNote: 'Airport hotel + transportation',
          comfort: 3,
          steps: [
            'Book an airport hotel right now while still in transit (Hotels Tonight app)',
            'Most airport hotels have 24/7 front desks — walk in, check in immediately',
            'Set alarm for 2 hours before your first commitment',
            'Grab an Uber/taxi to ' + hotel + ' first thing in the morning',
          ],
          tradeoff: 'Extra hotel night, but you\'re rested and at your actual hotel by morning',
          pro: 'Instant check-in guarantee, no waiting, sleep tonight',
        },
        cheapest: {
          title: 'Call Hotel → Late Arrival Guarantee',
          emoji: '💰',
          color: 'green',
          etaDelta: 'Proceed normally',
          costDelta: '$0',
          costNote: 'No extra cost if card is on file',
          comfort: 4,
          steps: [
            `Call ${hotel} NOW — tell them your estimated arrival time`,
            'Confirm your credit card is on file — this legally holds the room until 2am at most hotels',
            'Ask for the name of the front desk agent you spoke with (accountability)',
            'Get an Uber directly from the airport — do not stop anywhere',
          ],
          tradeoff: 'Only works if hotel cooperates — verify verbally before hanging up',
          pro: 'Zero extra cost, uses existing reservation',
        },
        mostComfortable: {
          title: 'Suite Upgrade + VIP Late Arrival',
          emoji: '🛋️',
          color: 'purple',
          etaDelta: 'Proceed normally',
          costDelta: '+$80 – $200',
          costNote: 'Suite upgrade one-night cost',
          comfort: 5,
          steps: [
            `Call ${hotel} and request an upgrade — hotels are significantly more flexible with suite guests`,
            'Ask for a dedicated late-arrival escort (luxury hotels often provide this)',
            `Check in at ${checkIn} — upgraded room is typically held for VIP arrivals`,
            'Pre-arrange: request your breakfast be delivered at your wake time',
          ],
          tradeoff: 'Most expensive, but you arrive like a VIP regardless of the delay',
          pro: 'Seamless check-in, premium room, zero friction — perfect for client trips',
        },
      }

    default:
      return null
  }
}

function getLastDestination(itinerary) {
  const segs = itinerary?.segments || []
  return segs.length > 0 ? segs[segs.length - 1].destination : 'your destination'
}
