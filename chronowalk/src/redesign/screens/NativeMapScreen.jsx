import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getRomeRankableCatalog, contentRoute } from '../../content/rome/registry.js'
import { canAccessContentId } from '../../lib/contentAccess.js'
import { readGuestContext } from '../../lib/guestSession.js'
import { getLocationFix, LOCATION_STATUS } from '../../lib/locationAccess.js'
import { rankHeroes } from '../../lib/rankHeroes.js'
import { getJourneySnapshot } from '../../state/journey.js'
import { CONTENT_TYPES } from '../../content/registry/constants.js'
import {
  bifurcationOptions,
  isMysteryHidden,
  isRouteLive,
  liveItems,
} from '../../lib/route/index.js'
import { useRouteState } from '../../lib/route/useRouteState.js'
import { useT } from '../../i18n/I18nProvider.jsx'
import { F, T } from '../tokens.js'
import NativeCoverageSheet from '../ui/NativeCoverageSheet.jsx'
import { formatDuration } from '../ui/NativeContentCard.jsx'

const BOUNDS = { minLat: 41.878, maxLat: 41.907, minLng: 12.465, maxLng: 12.512 }

function project(lat, lng) {
  const x = (lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)
  const y = (BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)
  return {
    left: `${Math.min(96, Math.max(4, x * 100))}%`,
    top: `${Math.min(96, Math.max(4, y * 100))}%`,
  }
}

export default function NativeMapScreen() {
  const t = useT()
  const navigate = useNavigate()
  const guest = readGuestContext()
  const [position, setPosition] = useState(guest.lastPosition)
  const [zoom, setZoom] = useState('city')
  const [selected, setSelected] = useState(null)
  const [lockItem, setLockItem] = useState(null)
  const [showAlts, setShowAlts] = useState(false)
  const { active } = useRouteState()
  const live = isRouteLive(active)
  const routeItems = live ? liveItems(active) : []

  const catalog = useMemo(() => getRomeRankableCatalog(), [])
  const completedIds = [
    ...(getJourneySnapshot()?.context?.completedWaypointIds ?? []),
    ...(guest.history?.completedExperienceIds ?? []),
  ]
  const savedIds = new Set(guest.history?.savedExperienceIds ?? [])
  const ranked = useMemo(
    () =>
      rankHeroes({
        catalog,
        context: guest,
        position,
        canAccess: (id) => canAccessContentId(id),
        completedIds,
      }),
    [catalog, completedIds, guest, position],
  )
  const recommended = new Set((ranked.ranked || []).slice(0, 3).map((item) => item.id))

  useEffect(() => {
    let cancelled = false
    void getLocationFix({ timeoutMs: 8000 }).then((result) => {
      if (!cancelled && result.status === LOCATION_STATUS.SUCCESS) setPosition(result.position)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const markers =
    zoom === 'city'
      ? Object.values(
          catalog.reduce((groups, item) => {
            const key = item.clusterId || 'centro'
            if (!groups[key]) groups[key] = { ...item, clusterCount: 0, id: `cluster:${key}` }
            groups[key].clusterCount += 1
            return groups
          }, {}),
        )
      : catalog

  return (
    <div
      data-testid="native-map"
      style={{
        minHeight: '100%',
        background: T.obsidian,
        color: T.bone,
        padding: 'max(16px, calc(env(safe-area-inset-top) + 8px)) 0 calc(var(--shell-tab-bar-height, 72px) + 8px)',
      }}
    >
      <div style={{ padding: '0 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <h1 style={{ fontFamily: F.display, fontWeight: 400, fontSize: 28, margin: 0 }}>{t('native.map.title')}</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {live ? (
            <button
              type="button"
              data-testid="native-map-alts"
              onClick={() => setShowAlts((value) => !value)}
              style={{
                minHeight: 40,
                padding: '8px 12px',
                borderRadius: 999,
                border: '1px solid rgba(250,246,239,0.2)',
                background: 'transparent',
                color: T.bone,
              }}
            >
              {showAlts ? t('native.map.hideAlts') : t('native.map.showAlts')}
            </button>
          ) : null}
        <button
          type="button"
          data-testid="native-map-zoom"
          onClick={() => setZoom((current) => (current === 'city' ? 'streets' : 'city'))}
          style={{
            minHeight: 40,
            padding: '8px 12px',
            borderRadius: 999,
            border: '1px solid rgba(250,246,239,0.2)',
            background: 'transparent',
            color: T.bone,
          }}
        >
          {zoom === 'city' ? t('native.map.streets') : t('native.map.city')}
        </button>
        </div>
      </div>
      <div
        data-testid="native-map-canvas"
        style={{
          position: 'relative',
          margin: '0 16px',
          height: '58dvh',
          borderRadius: 20,
          background: 'linear-gradient(180deg, #16161c 0%, #0B0B0D 100%)',
          overflow: 'hidden',
          border: '1px solid rgba(250,246,239,0.08)',
        }}
      >
        {markers.map((item) => {
          if (!item.geo || !Number.isFinite(item.geo.lat)) return null
          if (routeItems.some((row) => row.contentId === item.id && isMysteryHidden(row))) return null
          const clustered = Boolean(item.clusterCount)
          const discovery = !clustered && item.contentType === CONTENT_TYPES.DISCOVERY
          const locked = item.clusterCount ? false : !canAccessContentId(item.id)
          const completed = completedIds.includes(item.id)
          const saved = savedIds.has(item.id)
          const rec = recommended.has(item.id)
          const pos = project(item.geo.lat, item.geo.lng)
          return (
            <button
              key={item.id}
              type="button"
              data-testid={`map-marker-${item.id}`}
              data-content-type={item.contentType || 'cluster'}
              data-map-state={[locked && 'locked', completed && 'completed', saved && 'saved', rec && 'recommended']
                .filter(Boolean)
                .join(' ')}
              onClick={() => {
                if (item.clusterCount) {
                  setZoom('streets')
                  return
                }
                setSelected(item)
              }}
              style={{
                position: 'absolute',
                left: pos.left,
                top: pos.top,
                transform: 'translate(-50%, -50%)',
                width: clustered ? 16 : discovery ? 12 : 18,
                height: clustered ? 16 : discovery ? 12 : 18,
                borderRadius: '50%',
                border: rec ? `2px solid ${T.gold}` : '1px solid rgba(250,246,239,0.5)',
                background: completed ? '#4E9B8F' : locked ? '#6B6358' : discovery ? T.bone : T.gold,
                opacity: locked ? 0.7 : 1,
                boxShadow: rec ? '0 0 0 6px rgba(212,175,55,0.22)' : 'none',
                padding: 0,
              }}
              aria-label={item.title}
            />
          )
        })}
        {live && routeItems.length ? (
          <div data-testid="map-active-route" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
              <polyline
                fill="none"
                stroke={T.gold}
                strokeWidth="1.2"
                points={routeItems
                  .map((item) => catalog.find((row) => row.id === item.contentId))
                  .filter((rec) => rec?.geo)
                  .map((rec) => {
                    const pos = project(rec.geo.lat, rec.geo.lng)
                    return `${parseFloat(pos.left)} ${parseFloat(pos.top)}`
                  })
                  .join(' ')}
              />
            </svg>
            {routeItems.map((item, index) => {
              const rec = catalog.find((row) => row.id === item.contentId)
              if (!rec?.geo) return null
              const pos = project(rec.geo.lat, rec.geo.lng)
              const mystery = isMysteryHidden(item)
              const current = item.routeItemId === active.currentRouteItemId
              return (
                <span
                  key={item.routeItemId}
                  data-testid={`map-route-marker-${item.contentId}`}
                  data-mystery={mystery ? 'true' : 'false'}
                  data-current={current ? 'true' : 'false'}
                  aria-label={mystery ? t('native.route.mysteryTitle') : rec.title}
                  style={{
                    position: 'absolute',
                    left: pos.left,
                    top: pos.top,
                    transform: 'translate(-50%, -50%)',
                    width: mystery ? 14 : 22,
                    height: mystery ? 14 : 22,
                    borderRadius: '50%',
                    background: mystery ? '#7A9E8A' : current ? T.gold : T.bone,
                    color: T.obsidian,
                    fontSize: 11,
                    fontWeight: 700,
                    display: 'grid',
                    placeItems: 'center',
                    pointerEvents: 'auto',
                    boxShadow: current ? '0 0 0 6px rgba(212,175,55,0.25)' : 'none',
                  }}
                >
                  {mystery ? '✦' : index + 1}
                </span>
              )
            })}
          </div>
        ) : null}
        {showAlts && live
          ? (bifurcationOptions({ active, catalog, context: guest, position }).alternatives || []).map((option) => {
              if (!option.item?.geo) return null
              const pos = project(option.item.geo.lat, option.item.geo.lng)
              return (
                <span
                  key={option.contentId}
                  data-testid={`map-alt-marker-${option.contentId}`}
                  style={{
                    position: 'absolute',
                    left: pos.left,
                    top: pos.top,
                    width: 10,
                    height: 10,
                    marginLeft: -5,
                    marginTop: -5,
                    borderRadius: '50%',
                    border: `1.5px dashed ${T.gold}`,
                    background: 'transparent',
                  }}
                />
              )
            })
          : null}
        {position ? (
          <span
            data-testid="map-user-location"
            style={{
              position: 'absolute',
              ...project(position.lat, position.lng),
              width: 14,
              height: 14,
              marginLeft: -7,
              marginTop: -7,
              borderRadius: '50%',
              background: '#4E7D9B',
              boxShadow: '0 0 0 8px rgba(78,125,155,0.25)',
            }}
          />
        ) : null}
      </div>
      {selected ? (
        <div
          data-testid="native-map-preview"
          style={{ margin: '14px 16px 0', padding: 14, borderRadius: 16, background: T.charcoal }}
        >
          {(() => {
            const mystery = routeItems.find((row) => row.contentId === selected.id && isMysteryHidden(row))
            const title = mystery ? t('native.route.mysteryTitle') : selected.title
            const body = mystery ? t('native.route.mysteryTeaser') : selected.whyWorthIt
            return (
              <>
          <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.muted }}>
            {mystery ? t('native.route.mysteryTitle') : selected.contentType === CONTENT_TYPES.DISCOVERY ? t('native.content.notice') : t('native.content.experience')}
            {!canAccessContentId(selected.id) ? ` · ${t('native.content.locked')}` : ''}
          </p>
          <h2 style={{ fontFamily: F.display, fontWeight: 400, fontSize: 22, margin: '6px 0' }}>{title}</h2>
          <p style={{ margin: 0, color: 'rgba(250,246,239,0.8)', lineHeight: 1.4 }}>{body}</p>
          <p style={{ margin: '8px 0 12px', color: T.muted, fontSize: 13 }}>{formatDuration(selected.timeCostMin)}</p>
              </>
            )
          })()}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              type="button"
              data-testid="map-preview-open"
              onClick={() => navigate(contentRoute(selected))}
              style={{
                minHeight: 44,
                width: '100%',
                borderRadius: 12,
                border: 'none',
                background: T.gold,
                color: T.obsidian,
                fontWeight: 600,
              }}
            >
              {canAccessContentId(selected.id) && selected.contentType !== CONTENT_TYPES.DISCOVERY
                ? t('native.experience.start')
                : t('native.discover.view')}
            </button>
            {!canAccessContentId(selected.id) ? (
              <button
                type="button"
                data-testid="map-preview-unlock"
                onClick={() => setLockItem(selected)}
                style={{
                  minHeight: 44,
                  width: '100%',
                  borderRadius: 12,
                  border: '1px solid rgba(250,246,239,0.2)',
                  background: 'transparent',
                  color: T.bone,
                  fontWeight: 600,
                }}
              >
                {t('native.experience.unlock')}
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <p style={{ margin: '14px 20px 0', color: T.muted }}>{t('native.map.hint')}</p>
      )}
      <NativeCoverageSheet open={Boolean(lockItem)} item={lockItem} onClose={() => setLockItem(null)} />
    </div>
  )
}
