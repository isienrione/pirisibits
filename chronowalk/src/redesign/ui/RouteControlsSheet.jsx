import { GhostButton } from './GhostButton.jsx'
import { PrimaryButton } from './PrimaryButton.jsx'
import { F, T } from '../tokens.js'
import { R } from './RouteSurface.jsx'
import { formatDurationLabel } from '../../lib/route/why.js'
import { estimateRouteTotals } from '../../lib/route/model.js'

export default function RouteControlsSheet({ open, route, onClose, onAction }) {
  if (!open || !route) return null
  const totals = estimateRouteTotals(route.items)
  const paused = route.status === 'paused'
  const actions = [
    { id: 'adjust', label: 'Change the plan', testId: 'route-controls-adjust' },
    { id: 'reorder', label: 'Reorder stops', testId: 'route-controls-reorder' },
    { id: 'add', label: 'Add something', testId: 'route-controls-add' },
    { id: 'add-saved', label: 'Add a saved item', testId: 'route-controls-add-saved' },
    { id: 'food', label: 'I need food / a break', testId: 'route-controls-food', placeholder: true },
    { id: 'finish-by', label: 'I need to finish by…', testId: 'route-controls-finish', placeholder: true },
    { id: paused ? 'resume' : 'pause', label: paused ? 'Resume route' : 'Pause route', testId: 'route-controls-pause' },
    { id: 'end', label: 'End route', testId: 'route-controls-end' },
  ]
  return (
    <div data-testid="route-controls-sheet" role="dialog" aria-modal="true" style={overlay}>
      <button type="button" aria-label="Close" onClick={onClose} style={{ position: 'absolute', inset: 0, border: 'none', background: 'transparent' }} />
      <div style={sheet}>
        <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: R.muted }}>Your afternoon</p>
        <h2 style={{ fontFamily: F.display, fontWeight: 400, fontSize: 26, margin: '8px 0 6px' }}>
          {formatDurationLabel(totals.estimatedDurationMin)} remaining
        </h2>
        {actions.map((action) =>
          action.placeholder ? (
            <p key={action.id} data-testid={action.testId} style={{ margin: '10px 0 0', color: R.muted, fontSize: 14 }}>
              {action.label} — coming later
            </p>
          ) : (
            <GhostButton
              key={action.id}
              data-testid={action.testId}
              onClick={() => onAction?.(action.id)}
              style={{ marginTop: 10, minHeight: 48, color: R.ink, borderColor: R.line, background: 'transparent' }}
            >
              {action.label}
            </GhostButton>
          ),
        )}
        <PrimaryButton color={T.gold} data-testid="route-controls-close" onClick={onClose} style={{ marginTop: 14, minHeight: 48 }}>
          Close
        </PrimaryButton>
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
  maxHeight: '88dvh',
  overflowY: 'auto',
  background: R.bg,
  borderRadius: '24px 24px 0 0',
  padding: '22px 22px max(22px, calc(env(safe-area-inset-bottom) + 14px))',
  boxSizing: 'border-box',
}
