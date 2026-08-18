import { F } from '../tokens.js'
import { GhostButton } from './GhostButton.jsx'
import { R, routeGhost, routeHeadline, routeOverlay, routeSheet, routeType } from './RouteSurface.jsx'

export default function WhyThisSheet({ open, title, body, onClose }) {
  if (!open) return null
  return (
    <div data-testid="why-this-sheet" role="dialog" aria-modal="true" style={routeOverlay}>
      <button type="button" aria-label="Close" onClick={onClose} style={{ position: 'absolute', inset: 0, border: 'none', background: 'transparent' }} />
      <div style={routeSheet}>
        <p style={routeType}>Why this?</p>
        <h2 style={{ ...routeHeadline, fontSize: 26, margin: '8px 0 12px' }}>{title}</h2>
        <p data-testid="why-this-body" style={{ margin: 0, lineHeight: 1.5, color: R.ink, fontFamily: F.body }}>{body}</p>
        <GhostButton data-testid="why-this-close" onClick={onClose} style={{ marginTop: 18, ...routeGhost }}>
          Close
        </GhostButton>
      </div>
    </div>
  )
}
