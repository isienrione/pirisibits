import { Link } from 'react-router-dom'
import { isRouteLive } from '../../lib/route/model.js'
import { formatDurationLabel } from '../../lib/route/why.js'
import { estimateRouteTotals } from '../../lib/route/model.js'
import { useRouteState } from '../../lib/route/useRouteState.js'
import { useT } from '../../i18n/I18nProvider.jsx'
import { F } from '../tokens.js'
import { R } from './RouteSurface.jsx'

export default function NativeRoutePill() {
  const t = useT()
  const { active } = useRouteState()
  if (!isRouteLive(active)) return null
  const totals = estimateRouteTotals(active.items)
  const paused = active.status === 'paused'
  return (
    <Link
      to={paused ? '/route' : '/walk'}
      data-testid="route-pill"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        margin: '0 12px 8px',
        padding: '10px 14px',
        minHeight: 44,
        borderRadius: 999,
        background: R.cardFill,
        color: R.ink,
        border: `1px solid ${R.line}`,
        textDecoration: 'none',
        fontFamily: F.body,
        fontSize: 13,
        fontWeight: 600,
        boxShadow: R.shadow,
      }}
    >
      <span>{paused ? t('native.route.continueAfternoon') : t('native.route.yourAfternoon')}</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: R.ink }}>
        <span
          aria-hidden="true"
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: R.gold,
            boxShadow: '0 0 0 4px rgba(212,175,55,0.18)',
          }}
        />
        {formatDurationLabel(totals.estimatedDurationMin)}
      </span>
    </Link>
  )
}
