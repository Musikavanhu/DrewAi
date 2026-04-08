import { useState, useEffect } from 'react'
import { gradeColor, riskColor } from '../../utils/fragilityEngine'
import { DISRUPTION_TYPES } from '../../utils/recoveryEngine'

export default function TripAssessmentCard({ data, onAction }) {
  const { tripData, itinerary, assessment, budgetNote } = data
  const [animatedScore, setAnimatedScore] = useState(0)
  const [selectedDisruption, setSelectedDisruption] = useState(null)

  // Animate score ring on mount
  useEffect(() => {
    const timeout = setTimeout(() => setAnimatedScore(assessment.score), 100)
    return () => clearTimeout(timeout)
  }, [assessment.score])

  const mainFlight = itinerary.segments[0]
  const lastFlight = itinerary.segments[itinerary.segments.length - 1]
  const color = gradeColor(assessment.grade)

  // SVG confidence ring
  const r = 52
  const circumference = 2 * Math.PI * r
  const filled = (animatedScore / 100) * circumference

  const handleSimulate = () => {
    if (!selectedDisruption) return
    onAction('simulate-disruption', { disruptionId: selectedDisruption, itinerary })
  }

  return (
    <div className="trip-card">
      {/* Route Header */}
      <div className="trip-card-header">
        <div className="trip-route">
          <span className="trip-airport">{itinerary.segments[0]?.origin}</span>
          <span className="trip-route-arrow">
            <svg width="24" height="10" viewBox="0 0 24 10" fill="none">
              <path d="M0 5h20M16 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </span>
          <span className="trip-airport">{lastFlight?.destination}</span>
        </div>
        <div className="trip-meta-row">
          <span className="trip-badge trip-badge-date">📅 {tripData.displayDate}</span>
          <span className="trip-badge">{itinerary.airline}</span>
          <span className="trip-badge">{itinerary.option}</span>
          <span className="trip-badge trip-badge-price">${itinerary.price}</span>
          <span className="trip-badge">{itinerary.class}</span>
        </div>
        {/* Segments */}
        <div className="trip-segments">
          {itinerary.segments.map((seg, i) => (
            <div key={i} className="trip-segment-row">
              <div className="trip-segment-time">{seg.departure}</div>
              <div className="trip-segment-info">
                <span className="trip-fn">{seg.flightNumber}</span>
                <span className="trip-seg-route">{seg.origin} → {seg.destination}</span>
                <span className="trip-duration">{seg.duration}</span>
              </div>
              <div className="trip-segment-time">{seg.arrival}</div>
              {itinerary.layovers?.[i] && (
                <div className="trip-layover-chip">
                  <span>⏱ {itinerary.layovers[i].durationMinutes}min layover @ {itinerary.layovers[i].airport}</span>
                </div>
              )}
            </div>
          ))}
        </div>
        {budgetNote && (
          <div className={`trip-budget-note ${itinerary.price > (tripData.budget || Infinity) ? 'over' : 'ok'}`}>
            {budgetNote}
          </div>
        )}
      </div>

      {/* Confidence Score */}
      <div className="trip-confidence-section">
        <div className="trip-confidence-ring-wrap">
          <svg viewBox="0 0 120 120" width="120" height="120">
            <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="9"/>
            <circle
              cx="60" cy="60" r={r} fill="none"
              stroke={color} strokeWidth="9"
              strokeDasharray={`${filled} ${circumference}`}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
              style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)' }}
            />
            <text x="60" y="54" textAnchor="middle" fill="white" fontSize="22" fontWeight="700" fontFamily="Space Grotesk, sans-serif">{assessment.score}</text>
            <text x="60" y="70" textAnchor="middle" fill={color} fontSize="8.5" fontWeight="700" letterSpacing="1.5" fontFamily="Manrope, sans-serif">{assessment.grade}</text>
          </svg>
          <div className="trip-confidence-label">
            <span style={{ color }}>Trip Confidence</span>
          </div>
        </div>

        {/* Fragility Map */}
        <div className="trip-fragility-map">
          <div className="trip-section-label">🗺 Trip Fragility Map</div>
          {assessment.factors.length === 0 ? (
            <div className="trip-fragility-empty">✅ No significant risk factors found</div>
          ) : (
            assessment.factors.map((f, i) => {
              const { bg, border, text } = riskColor(f.risk)
              return (
                <div key={i} className="trip-factor" style={{ background: bg, borderColor: border }}>
                  <div className="trip-factor-top">
                    <span className="trip-factor-icon">{f.icon}</span>
                    <span className="trip-factor-label">{f.label}</span>
                    <span className="trip-factor-badge" style={{ background: bg, borderColor: border, color: text }}>
                      {f.risk}
                    </span>
                  </div>
                  <p className="trip-factor-detail">{f.detail}</p>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Hotel info */}
      {itinerary.hotel && (
        <div className="trip-hotel-row">
          <span>🏨</span>
          <div>
            <span className="trip-hotel-name">{itinerary.hotel.name}</span>
            <span className="trip-hotel-detail">{itinerary.hotel.neighborhood} · Check-in {itinerary.hotel.checkIn} · Est. arrival {itinerary.hotel.estimatedArrival}</span>
          </div>
        </div>
      )}

      {/* Disruption Simulator */}
      <div className="trip-disruption-section">
        <div className="trip-section-label">⚡ Simulate a Disruption</div>
        <p className="trip-disruption-desc">What if something goes wrong? Select a scenario and Drew will show you the fastest recovery path.</p>
        <div className="trip-disruption-options">
          {DISRUPTION_TYPES.map((d) => (
            <button
              key={d.id}
              className={`trip-disruption-btn${selectedDisruption === d.id ? ' selected' : ''}`}
              onClick={() => setSelectedDisruption(d.id)}
            >
              <span>{d.icon}</span>
              <span>{d.label}</span>
            </button>
          ))}
        </div>
        <button
          className="trip-simulate-btn"
          disabled={!selectedDisruption}
          onClick={handleSimulate}
        >
          Show Recovery Options →
        </button>
      </div>
    </div>
  )
}
