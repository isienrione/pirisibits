import { GhostButton } from './GhostButton.jsx'
import { PrimaryButton } from './PrimaryButton.jsx'
import { F, T } from '../tokens.js'
import { R, routeGhost, routeHeadline, routeOverlay, routePrimary, routeSheet, routeType } from './RouteSurface.jsx'
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
    { id: 'add-saved', label: 'Add a must-see', testId: 'route-controls-add-saved' },
    { id: 'food', label: 'I need food / a break', testId: 'route-controls-food', placeholder: true },
    { id: 'finish-by', label: 'I need to finish by…', testId: 'route-controls-finish', placeholder: true },
    { id: paused ? 'resume' : 'pause', label: paused ? 'Resume' : 'Pause', testId: 'route-controls-pause' },
    { id: 'end', label: 'End route', testId: 'route-controls-end' },
  ]
  const visible = actions.filter((action) => !action.placeholder || import.meta.env.DEV)
  return (
    <div data-testid="route-controls-sheet" role="dialog" aria-modal="true" style={routeOverlay}>
      <button type="button" aria-label="Close" onClick={onClose} style={{ position: 'absolute', inset: 0, border: 'none', background: 'transparent' }} />
      <div style={routeSheet}>
        <p style={routeType}>Your afternoon</p>
        <h2 style={{ ...routeHeadline, fontSize: 26, margin: '8px 0 6px' }}>
          {formatDurationLabel(totals.estimatedDurationMin)} remaining
        </h2>
        {visible.map((action) =>
          action.placeholder ? (
            <p key={action.id} data-testid={action.testId} style={{ margin: '10px 0 0', color: R.muted, fontSize: 14, fontFamily: F.body }}>
              {action.label} — coming later
            </p>
          ) : (
            <GhostButton
              key={action.id}
              data-testid={action.testId}
              onClick={() => onAction?.(action.id)}
              style={{ marginTop: 10, ...routeGhost }}
            >
              {action.label}
            </GhostButton>
          ),
        )}
        <PrimaryButton color={T.gold} data-testid="route-controls-close" onClick={onClose} style={{ marginTop: 14, ...routePrimary }}>
          Close
        </PrimaryButton>
      </div>
    </div>
  )
}
