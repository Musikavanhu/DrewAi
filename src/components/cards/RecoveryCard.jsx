const COMFORT_ICONS = ['', '😐', '😑', '🙂', '😊', '😌', '🌟']

const colorsMap = {
  blue: {
    border: '#38bdf8',
    glow: 'rgba(56, 189, 248, 0.15)',
    bg: 'rgba(56, 189, 248, 0.06)',
    badge: 'rgba(56, 189, 248, 0.2)',
    badgeText: '#38bdf8',
  },
  green: {
    border: '#4ade80',
    glow: 'rgba(74, 222, 128, 0.15)',
    bg: 'rgba(74, 222, 128, 0.06)',
    badge: 'rgba(74, 222, 128, 0.2)',
    badgeText: '#4ade80',
  },
  purple: {
    border: '#a78bfa',
    glow: 'rgba(167, 139, 250, 0.15)',
    bg: 'rgba(167, 139, 250, 0.06)',
    badge: 'rgba(167, 139, 250, 0.2)',
    badgeText: '#a78bfa',
  },
}

function ComfortStars({ rating }) {
  return (
    <div className="recovery-comfort">
      {[1,2,3,4,5].map(i => (
        <span key={i} className={`comfort-star${i <= rating ? ' active' : ''}`}>★</span>
      ))}
    </div>
  )
}

function RecoveryOption({ option, label }) {
  const c = colorsMap[option.color] || colorsMap.blue
  return (
    <div className="recovery-option" style={{ borderTopColor: c.border, background: c.bg }}>
      <div className="recovery-option-header" style={{ borderBottomColor: `${c.border}30` }}>
        <span className="recovery-emoji">{option.emoji}</span>
        <span className="recovery-label" style={{ background: c.badge, color: c.badgeText }}>{label}</span>
      </div>
      <div className="recovery-title">{option.title}</div>

      <div className="recovery-stats">
        <div className="recovery-stat">
          <span className="recovery-stat-label">ETA Delta</span>
          <span className="recovery-stat-value">{option.etaDelta}</span>
        </div>
        <div className="recovery-stat">
          <span className="recovery-stat-label">Cost Delta</span>
          <span className="recovery-stat-value">{option.costDelta}</span>
          {option.costNote && <span className="recovery-stat-note">{option.costNote}</span>}
        </div>
        <div className="recovery-stat">
          <span className="recovery-stat-label">Comfort</span>
          <ComfortStars rating={option.comfort} />
        </div>
      </div>

      <div className="recovery-steps-label">Steps</div>
      <ol className="recovery-steps">
        {option.steps.map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ol>

      <div className="recovery-tradeoff">
        <span className="recovery-tradeoff-icon">⚖️</span>
        <span>{option.tradeoff}</span>
      </div>
      <div className="recovery-pro">
        <span className="recovery-pro-icon">✓</span>
        <span>{option.pro}</span>
      </div>
    </div>
  )
}

export default function RecoveryCard({ data }) {
  const { disruption, options } = data

  if (!options) return (
    <div className="recovery-card">
      <p style={{ color: 'var(--text-muted)', padding: '16px' }}>No recovery options available for this scenario.</p>
    </div>
  )

  return (
    <div className="recovery-card">
      <div className="recovery-card-header">
        <span className="recovery-disruption-icon">{disruption.icon}</span>
        <div>
          <div className="recovery-disruption-title">Disruption: {disruption.label}</div>
          <div className="recovery-disruption-sub">Here are your 3 best recovery paths</div>
        </div>
      </div>

      <div className="recovery-grid">
        <RecoveryOption option={options.fastest} label="Fastest" />
        <RecoveryOption option={options.cheapest} label="Cheapest" />
        <RecoveryOption option={options.mostComfortable} label="Most Comfortable" />
      </div>

      <div className="recovery-footer">
        💡 <strong>Pro tip:</strong> Always keep airline apps installed and notifications on — the fastest rebook window is the first 5 minutes after a disruption is announced.
      </div>
    </div>
  )
}
