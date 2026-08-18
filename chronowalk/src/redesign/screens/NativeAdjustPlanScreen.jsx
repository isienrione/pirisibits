import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getRomeRankableCatalog, getRegistryItem } from '../../content/rome/registry.js'
import { canAccessContentId } from '../../lib/contentAccess.js'
import { completeNativeContext, readGuestContext } from '../../lib/guestSession.js'
import {
  addContentAnywhere,
  composeAndSave,
  hydrateRouteItem,
  isRouteLive,
  liveItems,
  recomposeActiveFromProposed,
  removeAnyRouteItem,
  reorderRouteItems,
} from '../../lib/route/index.js'
import { useRouteState } from '../../lib/route/useRouteState.js'
import { useT } from '../../i18n/I18nProvider.jsx'
import { F, T } from '../tokens.js'
import { PrimaryButton } from '../ui/PrimaryButton.jsx'
import { GhostButton } from '../ui/GhostButton.jsx'
import RouteTimeline from '../ui/RouteTimeline.jsx'
import { R, RouteSurface, routeHeadline } from '../ui/RouteSurface.jsx'

const TIME_ORDER = ['30min', '1h', '2h', 'halfday', 'allday']

function shiftTime(current, direction) {
  const index = Math.max(0, TIME_ORDER.indexOf(current || '1h'))
  const next = TIME_ORDER[Math.min(TIME_ORDER.length - 1, Math.max(0, index + direction))]
  return next
}

function applyTweak(tweak) {
  const ctx = readGuestContext()
  const traveler = { ...(ctx.traveler || {}) }
  const patch = { traveler }
  if (tweak === 'hidden') traveler.iconicVsHidden = 'hidden'
  if (tweak === 'iconic') traveler.iconicVsHidden = 'iconic'
  if (tweak === 'art' || tweak === 'history') {
    const extra = tweak === 'art' ? 'art' : 'history'
    const interests = [...new Set([...(traveler.positiveInterestIds || ctx.interestIds || []), extra])]
    traveler.positiveInterestIds = interests
    patch.interestIds = interests
  }
  if (tweak === 'walk') traveler.walkingTolerance = 'short'
  if (tweak === 'short' || tweak === 'long') {
    const id = shiftTime(ctx.session?.availableTimeNow || ctx.timeBudgetId, tweak === 'short' ? -1 : 1)
    patch.session = { ...(ctx.session || {}), availableTimeNow: id }
    patch.timeBudgetId = id
  }
  completeNativeContext(patch)
}

export default function NativeAdjustPlanScreen() {
  const t = useT()
  const navigate = useNavigate()
  const { proposed, active } = useRouteState()
  const live = isRouteLive(active)
  const route = live ? active : proposed
  const catalog = useMemo(() => getRomeRankableCatalog(), [])
  const byId = useMemo(() => Object.fromEntries(catalog.map((item) => [item.id, item])), [catalog])
  const items = liveItems(route).map((item) => hydrateRouteItem(item, byId)).filter(Boolean)
  const guest = readGuestContext()
  const savedIds = guest.history?.savedExperienceIds || []
  const savedRecords = savedIds
    .map((id) => getRegistryItem(id))
    .filter(Boolean)
    .filter((rec) => !items.some((item) => item.contentId === rec.id))

  const tweaks = [
    { id: 'hidden', label: t('native.route.tweakHidden') },
    { id: 'iconic', label: t('native.route.tweakIconic') },
    { id: 'art', label: t('native.route.tweakArt') },
    { id: 'history', label: t('native.route.tweakHistory') },
    { id: 'walk', label: t('native.route.tweakWalk') },
    { id: 'short', label: t('native.route.tweakShort') },
    { id: 'long', label: t('native.route.tweakLong') },
  ]

  const recompose = () => {
    const next = composeAndSave()
    if (live) recomposeActiveFromProposed(next)
  }

  return (
    <RouteSurface testId="native-adjust">
      <GhostButton
        data-testid="adjust-back"
        onClick={() => navigate(live ? '/route' : '/plan')}
        style={{ minHeight: 44, color: R.ink, borderColor: R.line, background: 'transparent' }}
      >
        {t('native.route.back')}
      </GhostButton>
      <h1 style={routeHeadline}>{t('native.route.adjustTitle')}</h1>
      <p style={{ margin: '0 0 16px', color: R.muted, fontFamily: F.body }}>{t('native.route.adjustLead')}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        {tweaks.map((tw) => (
          <GhostButton
            key={tw.id}
            data-testid={`adjust-${tw.id}`}
            onClick={() => {
              applyTweak(tw.id)
              recompose()
            }}
            style={{ color: R.ink, borderColor: R.line, background: 'transparent' }}
          >
            {tw.label}
          </GhostButton>
        ))}
      </div>
      <div style={{ background: R.card, borderRadius: 20, padding: 16 }}>
        <RouteTimeline items={items} catalogById={byId} currentId={active?.currentRouteItemId} />
      </div>
      <div style={{ marginTop: 16, display: 'grid', gap: 8 }}>
        {items.map((item, idx, arr) => (
          <div key={item.routeItemId} style={{ display: 'flex', gap: 8 }}>
            {idx > 0 ? (
              <GhostButton
                data-testid={`adjust-up-${item.contentId}`}
                onClick={() => {
                  const vis = arr.map((row) => row.routeItemId)
                  const next = [...vis]
                  const j = next.indexOf(item.routeItemId)
                  ;[next[j - 1], next[j]] = [next[j], next[j - 1]]
                  reorderRouteItems(next)
                }}
                style={{ color: R.ink, borderColor: R.line, background: 'transparent' }}
              >
                ↑
              </GhostButton>
            ) : null}
            <GhostButton
              data-testid={`adjust-remove-${item.contentId}`}
              onClick={() => removeAnyRouteItem(item.routeItemId)}
              style={{ color: R.ink, borderColor: R.line, background: 'transparent' }}
            >
              {t('native.route.removeStop')}
            </GhostButton>
          </div>
        ))}
      </div>
      {savedRecords.length ? (
        <div style={{ marginTop: 20 }}>
          <h2 style={{ fontSize: 13, letterSpacing: '0.12em', textTransform: 'uppercase', color: R.muted }}>
            {t('native.route.addSaved')}
          </h2>
          {savedRecords.map((rec) => (
            <GhostButton
              key={rec.id}
              data-testid={`adjust-add-saved-${rec.id}`}
              onClick={() => addContentAnywhere(rec)}
              style={{ width: '100%', marginTop: 8, color: R.ink, borderColor: R.line, background: 'transparent' }}
            >
              {rec.title}
            </GhostButton>
          ))}
        </div>
      ) : null}
      <PrimaryButton
        color={T.gold}
        data-testid="adjust-done"
        onClick={() => navigate(live ? '/route' : '/plan')}
        style={{ marginTop: 24, minHeight: 48 }}
      >
        {t('native.route.done')}
      </PrimaryButton>
    </RouteSurface>
  )
}
