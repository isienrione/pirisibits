import { useState } from 'react'
import { setAnalyticsConsent } from '../lib/track'

export default function ConsentBar() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false
    return !window.localStorage.getItem('cw_analytics_consent')
  })

  if (!visible) return null

  const accept = () => {
    setAnalyticsConsent(true)
    setVisible(false)
  }

  const decline = () => {
    setAnalyticsConsent(false)
    setVisible(false)
  }

  return (
    <div
      role="dialog"
      aria-label="Analytics consent"
      style={{
        position: 'fixed',
        left: 'var(--edge)',
        right: 'var(--edge)',
        bottom: 'max(1rem, env(safe-area-inset-bottom))',
        zIndex: 80,
        padding: '12px 14px',
        borderRadius: 'var(--r-card)',
        background: 'var(--ink)',
        color: 'var(--warm-white)',
        fontFamily: 'var(--font-ui)',
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
      }}
    >
      <span>We count moments, never people.</span>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button type="button" onClick={decline} style={btnStyle(false)}>
          No thanks
        </button>
        <button type="button" onClick={accept} style={btnStyle(true)}>
          OK
        </button>
      </div>
    </div>
  )
}

function btnStyle(primary) {
  return {
    padding: '6px 12px',
    borderRadius: 999,
    border: primary ? 'none' : '1px solid color-mix(in srgb, var(--warm-white) 30%, transparent)',
    background: primary ? 'var(--accent)' : 'transparent',
    color: primary ? 'var(--ink-900)' : 'var(--warm-white)',
    fontSize: 13,
    fontWeight: 500,
  }
}
