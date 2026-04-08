/**
 * itineraryData.js — Test itinerary data for Drew Trip Agent MVP
 * Route coverage: SFO→JFK, LAX→ORD, BOS→MIA and generic fallback
 */

export const AIRPORTS = {
  SFO: { name: 'San Francisco Intl', city: 'San Francisco', delayRisk: 'LOW', note: 'Fog can cause morning delays' },
  JFK: { name: 'John F. Kennedy Intl', city: 'New York', delayRisk: 'HIGH', note: 'Heavy ATC volume, frequent delays' },
  LGA: { name: 'LaGuardia', city: 'New York', delayRisk: 'HIGH', note: 'Capacity-constrained, weather-sensitive' },
  ORD: { name: "O'Hare Intl", city: 'Chicago', delayRisk: 'HIGH', note: 'Weather-prone hub, high connection risk' },
  LAX: { name: 'Los Angeles Intl', city: 'Los Angeles', delayRisk: 'MEDIUM', note: 'Ground delays common' },
  BOS: { name: 'Logan Intl', city: 'Boston', delayRisk: 'MEDIUM', note: 'Winter weather sensitive' },
  MIA: { name: 'Miami Intl', city: 'Miami', delayRisk: 'MEDIUM', note: 'Afternoon thunderstorms common' },
  DFW: { name: 'Dallas/Fort Worth Intl', city: 'Dallas', delayRisk: 'MEDIUM', note: 'Large hub, long transit times' },
  SEA: { name: 'Seattle-Tacoma Intl', city: 'Seattle', delayRisk: 'LOW', note: 'Generally reliable' },
  DEN: { name: 'Denver Intl', city: 'Denver', delayRisk: 'MEDIUM', note: 'Winter weather risk Nov–Mar' },
}

export const TEST_ITINERARIES = {
  // ── SFO → JFK (1-stop via ORD) ──────────────────────────
  'SFO-JFK': {
    id: 'SFO-JFK-1',
    routeKey: 'SFO-JFK',
    option: '1 Stop via Chicago',
    airline: 'United Airlines',
    class: 'Economy',
    price: 847,
    totalDuration: '10h 45m',
    segments: [
      {
        flightNumber: 'UA 857',
        airline: 'United Airlines',
        origin: 'SFO',
        destination: 'ORD',
        departure: '07:30',
        arrival: '13:45',
        duration: '4h 15m',
        aircraft: 'Boeing 737-900',
      },
      {
        flightNumber: 'UA 423',
        airline: 'United Airlines',
        origin: 'ORD',
        destination: 'JFK',
        departure: '14:40',
        arrival: '18:15',
        duration: '2h 35m',
        aircraft: 'Airbus A319',
      },
    ],
    layovers: [
      {
        airport: 'ORD',
        durationMinutes: 55,
        selfTransfer: false, // same airline
        terminalChange: false,
      },
    ],
    hotel: {
      name: 'JW Marriott Essex House',
      neighborhood: 'Midtown Manhattan',
      checkIn: '15:00',
      checkInCutoff: 23,
      estimatedArrival: '19:45', // ~1.5h after landing for transport
    },
    arrivalTime: '18:15',
  },

  // ── SFO → JFK (Direct) ──────────────────────────────────
  'SFO-JFK-DIRECT': {
    id: 'SFO-JFK-2',
    routeKey: 'SFO-JFK',
    option: 'Nonstop',
    airline: 'JetBlue',
    class: 'Economy',
    price: 892,
    totalDuration: '5h 30m',
    segments: [
      {
        flightNumber: 'B6 1191',
        airline: 'JetBlue',
        origin: 'SFO',
        destination: 'JFK',
        departure: '09:15',
        arrival: '17:45',
        duration: '5h 30m',
        aircraft: 'Airbus A321',
      },
    ],
    layovers: [],
    hotel: {
      name: 'The Standard, High Line',
      neighborhood: 'Meatpacking District',
      checkIn: '16:00',
      checkInCutoff: 23,
      estimatedArrival: '18:45',
    },
    arrivalTime: '17:45',
  },

  // ── LAX → ORD ───────────────────────────────────────────
  'LAX-ORD': {
    id: 'LAX-ORD-1',
    routeKey: 'LAX-ORD',
    option: 'Nonstop',
    airline: 'American Airlines',
    class: 'Economy',
    price: 621,
    totalDuration: '4h 10m',
    segments: [
      {
        flightNumber: 'AA 2456',
        airline: 'American Airlines',
        origin: 'LAX',
        destination: 'ORD',
        departure: '06:50',
        arrival: '12:00',
        duration: '4h 10m',
        aircraft: 'Boeing 737 MAX 8',
      },
    ],
    layovers: [],
    hotel: {
      name: 'Loews Chicago Hotel',
      neighborhood: 'Streeterville',
      checkIn: '15:00',
      checkInCutoff: 23,
      estimatedArrival: '13:30',
    },
    arrivalTime: '12:00',
  },

  // ── Generic Fallback ─────────────────────────────────────
  'GENERIC': {
    id: 'GENERIC-1',
    routeKey: 'GENERIC',
    option: '1 Stop',
    airline: 'United Airlines',
    class: 'Economy',
    price: 763,
    totalDuration: '8h 20m',
    segments: [
      {
        flightNumber: 'UA 512',
        airline: 'United Airlines',
        origin: '???',
        destination: 'ORD',
        departure: '08:00',
        arrival: '12:30',
        duration: '4h 30m',
        aircraft: 'Boeing 737-900',
      },
      {
        flightNumber: 'UA 891',
        airline: 'United Airlines',
        origin: 'ORD',
        destination: '???',
        departure: '14:00',
        arrival: '17:20',
        duration: '3h 20m',
        aircraft: 'Airbus A320',
      },
    ],
    layovers: [
      {
        airport: 'ORD',
        durationMinutes: 90,
        selfTransfer: false,
        terminalChange: false,
      },
    ],
    hotel: {
      name: 'Marriott Downtown',
      neighborhood: 'City Center',
      checkIn: '15:00',
      checkInCutoff: 23,
      estimatedArrival: '19:00',
    },
    arrivalTime: '17:20',
  },
}

/**
 * Find best matching itinerary for a given route.
 */
export function findItinerary(origin, destination) {
  const key = `${origin}-${destination}`
  if (TEST_ITINERARIES[key]) return TEST_ITINERARIES[key]
  // Check reverse + prefer fewer connections
  const directKey = `${key}-DIRECT`
  if (TEST_ITINERARIES[directKey]) return TEST_ITINERARIES[directKey]

  // Patch generic fallback with actual origin/destination
  const fallback = { ...TEST_ITINERARIES['GENERIC'] }
  fallback.segments = fallback.segments.map((s, i) => ({
    ...s,
    origin: i === 0 ? origin : s.origin,
    destination: i === fallback.segments.length - 1 ? destination : s.destination,
  }))
  fallback.routeKey = key
  return fallback
}

/**
 * Resolve natural language date references to a display string.
 */
export function resolveDate(dateStr) {
  const now = new Date()
  const lower = (dateStr || '').toLowerCase()

  const dayMap = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 }

  for (const [dayName, dayNum] of Object.entries(dayMap)) {
    if (lower.includes(dayName) || lower.includes(dayName.slice(0, 3))) {
      const current = now.getDay()
      let diff = dayNum - current
      if (lower.includes('next') || diff <= 0) diff += 7
      const target = new Date(now)
      target.setDate(now.getDate() + diff)
      return target.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    }
  }

  // Tomorrow
  if (lower.includes('tomorrow')) {
    const t = new Date(now); t.setDate(now.getDate() + 1)
    return t.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  return dateStr || 'TBD'
}
