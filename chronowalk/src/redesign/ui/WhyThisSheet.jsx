import { F } from '../tokens.js'
import { GhostButton } from './GhostButton.jsx'
import { R } from './RouteSurface.jsx'

export default function WhyThisSheet({ open, title, body, onClose }) {
  if (!open) return null
  return (
    <div data-testid="why-this-sheet" role="dialog" aria-modal="true" style={overlay}>
      <button type="button" aria-label="Close" onClick={onClose} style={{ position: 'absolute', inset: 0, border: 'none', background: 'transparent' }} />
      <div style={sheet}>
        <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: R.muted }}>Why this?</p>
        <h2 style={{ fontFamily: F.display, fontWeight: 400, fontSize: 26, margin: '8px 0 12px' }}>{title}</h2>
        <p data-testid="why-this-body" style={{ margin: 0, lineHeight: 1.5, color: R.ink }}>{body}</p>
        <GhostButton data-testid="why-this-close" onClick={onClose} style={{ marginTop: 18, minHeight: 48, color: R.ink, borderColor: R.line, background: 'transparent' }}>
          Close
        </GhostButton>
      </div>
    </div>
  )
}

const overlay = {
  position: 'fixed',
  inset: 0,
  zIndex: 130,
  background: 'rgba(26,26,31,0.28)',
  display: 'flex',
  alignItems: 'flex-end',
}

const sheet = {
  position: 'relative',
  width: '100%',
  background: R.bg,
  borderRadius: '24px 24px 0 0',
  padding: '22px 22px max(22px, calc(env(safe-area-inset-bottom) + 14px))',
  boxSizing: 'border-box',
}
