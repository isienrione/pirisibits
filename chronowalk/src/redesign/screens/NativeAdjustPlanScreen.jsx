import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getRomeRankableCatalog, getRegistryItem } from '../../content/rome/registry.js'
import { canAccessContentId } from '../../lib/contentAccess.js'
import { completeNativeContext, readGuestContext } from '../../lib/guestSession.js'
import {
  addContentAnywhere,
  composeAndSave,
  hydrateRouteItem,
  isMysteryHidden,
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
import PlaceMedia from '../ui/PlaceMedia.jsx'
import { R, RouteSurface, routeGhost, routeHeadline, routePrimary, routeType } from '../ui/RouteSurface.jsx'

const TIME_ORDER = ['30min', '1h', '2h', 'halfday', 'allday']

function shiftTime(current, direction) {
  const index = Math.max(0, TIME_ORDER.indexOf(current || '1h'))
  return TIME_ORDER[Math.min(TIME_ORDER.length - 1, Math.max(0, index + direction))]
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

function Chip({ id, label, testId, selected, onClick, accent }) {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      style={{
        minHeight: 44,
        padding: '10px 14px',
        borderRadius: 999,
        border: `1px solid ${selected ? accent : R.line}`,
        background: selected ? `color-mix(in srgb, ${accent} 16%, ${R.cardWarm})` : R.cardWarm,
        color: R.ink,
        fontFamily: F.body,
        fontSize: 14,
        fontWeight: 600,
      }}
    >
      {label}
    </button>
  )
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
  const feel = guest.traveler?.iconicVsHidden

  const recompose = () => {
    const next = composeAndSave()
    if (live) recomposeActiveFromProposed(next)
  }

  const feelChips = [
    { id: 'hidden', label: t('native.route.tweakHidden'), accent: R.violet },
    { id: 'iconic', label: t('native.route.tweakIconic'), accent: R.gold },
    { id: 'art', label: t('native.route.tweakArt'), accent: T.actVI },
    { id: 'history', label: t('native.route.tweakHistory'), accent: R.terracotta },
  ]
  const paceChips = [
    { id: 'walk', label: t('native.route.tweakWalk'), accent: R.teal },
    { id: 'short', label: t('native.route.tweakShort'), accent: R.teal },
    { id: 'long', label: t('native.route.tweakLong'), accent: R.teal },
  ]

  return (
    <RouteSurface testId="native-adjust">
      <GhostButton data-testid="adjust-back" onClick={() => navigate(live ? '/route' : '/plan')} style={routeGhost}>
        {t('native.route.back')}
      </GhostButton>
      <h1 style={routeHeadline}>{t('native.route.adjustTitle')}</h1>
      <p style={{ margin: '0 0 16px', color: R.muted, fontFamily: F.body }}>{t('native.route.adjustLead')}</p>

      <p style={routeType}>{t('native.route.adjustFeel')}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '10px 0 18px' }}>
        {feelChips.map((chip) => (
          <Chip
            key={chip.id}
            id={chip.id}
            label={chip.label}
            testId={`adjust-${chip.id}`}
            accent={chip.accent}
            selected={(chip.id === 'hidden' || chip.id === 'iconic') && feel === chip.id}
            onClick={() => {
              applyTweak(chip.id)
              recompose()
            }}
          />
        ))}
      </div>

      <p style={routeType}>{t('native.route.adjustPace')}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '10px 0 18px' }}>
        {paceChips.map((chip) => (
          <Chip
            key={chip.id}
            id={chip.id}
            label={chip.label}
            testId={`adjust-${chip.id}`}
            accent={chip.accent}
            onClick={() => {
              applyTweak(chip.id)
              recompose()
            }}
          />
        ))}
      </div>

      <p style={{ ...routeType, marginBottom: 10 }}>{t('native.route.adjustYours')}</p>
      <div style={{ display: 'grid', gap: 8 }}>
        {items.map((item, idx, arr) => {
          const mystery = isMysteryHidden(item)
          const content = item.content || byId[item.contentId]
          return (
            <div
              key={item.routeItemId}
              data-testid={`adjust-row-${item.contentId}`}
              style={{
                display: 'grid',
                gridTemplateColumns: '56px 1fr auto',
                gap: 10,
                alignItems: 'center',
                padding: 8,
                borderRadius: 16,
                border: `1px solid ${R.line}`,
                background: R.cardFill,
              }}
            >
              <PlaceMedia item={content} mystery={mystery} height={56} radius={10} />
              <div>
                <p style={{ margin: 0, fontFamily: F.display, fontSize: 16, color: R.ink }}>
                  {mystery ? t('native.route.mysteryTitle') : content?.title || item.contentId}
                </p>
                <p style={{ margin: '2px 0 0', color: R.muted, fontSize: 12, fontFamily: F.body }}>
                  {item.estimatedExperienceMin} min
                </p>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
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
                    style={{ minHeight: 44, width: 44, padding: 0, ...routeGhost }}
                  >
                    ↑
                  </GhostButton>
                ) : null}
                <GhostButton
                  data-testid={`adjust-remove-${item.contentId}`}
                  onClick={() => removeAnyRouteItem(item.routeItemId)}
                  style={{ minHeight: 44, width: 'auto', padding: '0 12px', ...routeGhost }}
                >
                  {t('native.route.removeStop')}
                </GhostButton>
              </div>
            </div>
          )
        })}
      </div>

      {savedRecords.length ? (
        <div style={{ marginTop: 20 }}>
          <h2 style={{ fontSize: 13, letterSpacing: '0.12em', textTransform: 'uppercase', color: R.muted, fontFamily: F.body }}>
            {t('native.route.addSaved')}
          </h2>
          {savedRecords.map((rec) => (
            <GhostButton
              key={rec.id}
              data-testid={`adjust-add-saved-${rec.id}`}
              onClick={() => addContentAnywhere(rec)}
              style={{ width: '100%', marginTop: 8, ...routeGhost }}
            >
              {rec.title}
            </GhostButton>
          ))}
        </div>
      ) : null}

      <GhostButton data-testid="adjust-browse" onClick={() => navigate('/explore')} style={{ marginTop: 12, ...routeGhost }}>
        {t('native.discover.seeAll')}
      </GhostButton>
      <PrimaryButton
        color={T.gold}
        data-testid="adjust-done"
        onClick={() => navigate(live ? '/route' : '/plan')}
        style={{ marginTop: 16, ...routePrimary }}
      >
        {t('native.route.update')}
      </PrimaryButton>
      <GhostButton data-testid="adjust-cancel" onClick={() => navigate(live ? '/route' : '/plan')} style={{ marginTop: 10, ...routeGhost }}>
        {t('native.route.cancel')}
      </GhostButton>
    </RouteSurface>
  )
}
