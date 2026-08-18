import { Link } from 'react-router-dom'
import { isRouteLive } from '../../lib/route/model.js'
import { formatDurationLabel } from '../../lib/route/why.js'
import { estimateRouteTotals } from '../../lib/route/model.js'
import { useRouteState } from '../../lib/route/useRouteState.js'
import { useT } from '../../i18n/I18nProvider.jsx'
import { T, F } from '../tokens.js'

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
        borderRadius: 999,
        background: T.bone,
        color: T.ink,
        textDecoration: 'none',
        fontFamily: F.body,
        fontSize: 13,
        fontWeight: 600,
        boxShadow: '0 8px 24px rgba(26,26,31,0.12)',
      }}
    >
      <span>{paused ? t('native.route.continueAfternoon') : t('native.route.yourAfternoon')}</span>
      <span style={{ color: T.gold }}>{formatDurationLabel(totals.estimatedDurationMin)}</span>
    </Link>
  )
}
