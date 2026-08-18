import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getRomeRankableCatalog, contentRoute } from '../../content/rome/registry.js'
import { canAccessContentId } from '../../lib/contentAccess.js'
import { readGuestContext } from '../../lib/guestSession.js'
import { getLocationFix, LOCATION_STATUS } from '../../lib/locationAccess.js'
import { rankHeroes } from '../../lib/rankHeroes.js'
import { getJourneySnapshot } from '../../state/journey.js'
import { CONTENT_TYPES } from '../../content/registry/constants.js'
import { isPlausibleRomePosition } from '../../lib/geoSanity.js'
import { loadMapboxRuntime } from '../../map/mapboxLoader.js'
import { env } from '../../config/env.js'
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
import { R, routeCard, routeType } from '../ui/RouteSurface.jsx'

const ROME_CENTER = { lat: 41.8986, lng: 12.4768 }
const BOUNDS = { minLat: 41.878, maxLat: 41.907, minLng: 12.465, maxLng: 12.512 }
const NATIVE_MAP_STYLE = 'mapbox://styles/mapbox/streets-v12'

function projectCss(lat, lng) {
  const x = (lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)
  const y = (BOUNDS.maxLat - lat) / (BOUNDS.maxLat - minLatSafe(BOUNDS.maxLat, BOUNDS.minLat))
  return {
    left: `${Math.min(96, Math.max(4, x * 100))}%`,
    top: `${Math.min(96, Math.max(4, y * 100))}%`,
  }
}

function minLatSafe(max, min) {
  return max - min || 1
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
  const [engine, setEngine] = useState('mapbox-pending')
  const [pixelPos, setPixelPos] = useState(null)
  const mapRef = useRef(null)
  const mapboxRef = useRef(null)
  const { active } = useRouteState()
  const live = isRouteLive(active)
  const routeItems = live ? liveItems(active) : []
  const routeKey = routeItems.map((item) => item.contentId).join('|')
  const located = isPlausibleRomePosition(position)

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
        position: located ? position : null,
        canAccess: (id) => canAccessContentId(id),
        completedIds,
      }),
    [catalog, completedIds, guest, located, position],
  )
  const recommended = new Set((ranked.ranked || []).slice(0, 3).map((item) => item.id))

  useEffect(() => {
    let cancelled = false
    void getLocationFix({ timeoutMs: 8000 }).then((result) => {
      if (!cancelled && result.status === LOCATION_STATUS.SUCCESS && isPlausibleRomePosition(result.position)) {
        setPosition(result.position)
      }
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

  useEffect(() => {
    let cancelled = false
    let map
    void loadMapboxRuntime()
      .then((mapboxgl) => {
        if (cancelled || !mapRef.current) return
        if (!env.mapboxToken) {
          setEngine('mapbox-unconfigured')
          return
        }
        mapboxgl.accessToken = env.mapboxToken
        const center = located ? [position.lng, position.lat] : [ROME_CENTER.lng, ROME_CENTER.lat]
        map = new mapboxgl.Map({
          container: mapRef.current,
          style: NATIVE_MAP_STYLE,
          center,
          zoom: zoom === 'city' ? 13.2 : 15.4,
          attributionControl: false,
          cooperativeGestures: true,
        })
        mapboxRef.current = map
        const syncPixels = () => {
          const next = {}
          const projectItem = (id, geo) => {
            if (!geo || !Number.isFinite(geo.lat)) return
            const p = map.project([geo.lng, geo.lat])
            next[id] = { left: `${p.x}px`, top: `${p.y}px` }
          }
          for (const item of catalog) projectItem(item.id, item.geo)
          if (located) projectItem('user', position)
          setPixelPos(next)
        }
        map.on('load', () => {
          if (cancelled) return
          setEngine('mapbox')
          syncPixels()
          const coords = routeItems
            .map((item) => catalog.find((row) => row.id === item.contentId)?.geo)
            .filter((geo) => geo && Number.isFinite(geo.lat) && Number.isFinite(geo.lng))
            .map((geo) => [geo.lng, geo.lat])
          if (coords.length >= 2 && !map.getSource('cw-active-route')) {
            map.addSource('cw-active-route', {
              type: 'geojson',
              data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } },
            })
            map.addLayer({
              id: 'cw-active-route-line',
              type: 'line',
              source: 'cw-active-route',
              paint: {
                'line-color': '#2A6F6A',
                'line-width': 4,
                'line-opacity': 0.88,
              },
            })
          }
        })
        map.on('move', syncPixels)
        map.on('error', () => {
          if (!cancelled) setEngine((current) => (current === 'mapbox' ? current : 'fallback'))
        })
      })
      .catch(() => {
        if (!cancelled) setEngine('fallback')
      })
    return () => {
      cancelled = true
      map?.remove?.()
      mapboxRef.current = null
    }
  }, [catalog, located, position?.lat, position?.lng, zoom, routeKey])

  const markerPos = (item) => {
    if (pixelPos?.[item.id] && engine === 'mapbox') return pixelPos[item.id]
    if (!item.geo || !Number.isFinite(item.geo.lat)) return null
    return projectCss(item.geo.lat, item.geo.lng)
  }

  return (
    <div
      data-testid="native-map"
      data-map-engine={engine}
      style={{
        minHeight: '100%',
        background: R.bg,
        color: R.ink,
        padding: 'max(16px, calc(env(safe-area-inset-top) + 8px)) 0 calc(var(--shell-tab-bar-height, 72px) + 8px)',
      }}
    >
      <div style={{ padding: '0 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <h1 style={{ fontFamily: F.display, fontWeight: 400, fontSize: 28, margin: 0, color: R.ink }}>{t('native.map.title')}</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {live ? (
            <button
              type="button"
              data-testid="native-map-alts"
              onClick={() => setShowAlts((value) => !value)}
              style={{
                minHeight: 44,
                padding: '8px 12px',
                borderRadius: 999,
                border: `1px solid ${R.line}`,
                background: R.cardWarm,
                color: R.ink,
                fontFamily: F.body,
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
              minHeight: 44,
              padding: '8px 12px',
              borderRadius: 999,
              border: `1px solid ${R.line}`,
              background: R.cardWarm,
              color: R.ink,
              fontFamily: F.body,
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
          overflow: 'hidden',
          border: `1px solid ${R.line}`,
          boxShadow: R.shadow,
          background: R.line,
        }}
      >
        <div ref={mapRef} data-testid="native-mapbox" style={{ position: 'absolute', inset: 0 }} />
        {markers.map((item) => {
          if (!item.geo || !Number.isFinite(item.geo.lat)) return null
          if (routeItems.some((row) => row.contentId === item.id && isMysteryHidden(row))) return null
          const clustered = Boolean(item.clusterCount)
          const discovery = !clustered && item.contentType === CONTENT_TYPES.DISCOVERY
          const locked = item.clusterCount ? false : !canAccessContentId(item.id)
          const completed = completedIds.includes(item.id)
          const saved = savedIds.has(item.id)
          const rec = recommended.has(item.id)
          const pos = markerPos(item)
          if (!pos) return null
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
                border: rec ? `2px solid ${R.gold}` : `1px solid ${R.line}`,
                background: completed ? R.teal : locked ? R.olive : discovery ? R.sage : R.gold,
                opacity: locked ? 0.72 : 1,
                boxShadow: rec ? '0 0 0 6px rgba(212,175,55,0.22)' : 'none',
                padding: 0,
                zIndex: 2,
              }}
              aria-label={item.title}
            />
          )
        })}
        {live && routeItems.length ? (
          <div data-testid="map-active-route" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3 }}>
            {routeItems.map((item, index) => {
              const rec = catalog.find((row) => row.id === item.contentId)
              if (!rec?.geo) return null
              const pos = markerPos(rec)
              if (!pos) return null
              const mystery = isMysteryHidden(item)
              const current = item.routeItemId === active.currentRouteItemId
              const done = item.state === 'completed'
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
                    background: mystery ? R.violet : current ? R.gold : done ? R.teal : R.card,
                    color: mystery || current || done ? R.card : R.ink,
                    border: `1.5px solid ${mystery ? R.gold : current ? R.gold : R.line}`,
                    fontSize: 11,
                    fontWeight: 700,
                    display: 'grid',
                    placeItems: 'center',
                    pointerEvents: 'auto',
                    boxShadow: current
                      ? '0 0 0 6px rgba(212,175,55,0.25)'
                      : mystery
                        ? `0 0 0 4px color-mix(in srgb, ${R.violet} 22%, transparent)`
                        : 'none',
                  }}
                >
                  {mystery ? '✦' : index + 1}
                </span>
              )
            })}
          </div>
        ) : null}
        {showAlts && live
          ? (bifurcationOptions({ active, catalog, context: guest, position: located ? position : null }).alternatives || []).map(
              (option) => {
                if (!option.item?.geo) return null
                const pos = markerPos(option.item)
                if (!pos) return null
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
                      border: `1.5px dashed ${R.gold}`,
                      background: 'transparent',
                      zIndex: 3,
                    }}
                  />
                )
              },
            )
          : null}
        {located ? (
          <span
            data-testid="map-user-location"
            style={{
              position: 'absolute',
              ...(pixelPos?.user && engine === 'mapbox' ? pixelPos.user : projectCss(position.lat, position.lng)),
              width: 14,
              height: 14,
              marginLeft: -7,
              marginTop: -7,
              borderRadius: '50%',
              background: R.blue,
              boxShadow: `0 0 0 8px color-mix(in srgb, ${R.blue} 22%, transparent)`,
              zIndex: 4,
            }}
          />
        ) : null}
      </div>
      {selected ? (
        <div data-testid="native-map-preview" style={{ ...routeCard, margin: '14px 16px 0', padding: 14, borderRadius: 16 }}>
          {(() => {
            const mystery = routeItems.find((row) => row.contentId === selected.id && isMysteryHidden(row))
            const title = mystery ? t('native.route.mysteryTitle') : selected.title
            const body = mystery ? t('native.route.mysteryTeaser') : selected.whyWorthIt
            return (
              <>
                <p style={routeType}>
                  {mystery
                    ? t('native.route.mysteryTitle')
                    : selected.contentType === CONTENT_TYPES.DISCOVERY
                      ? t('native.content.notice')
                      : t('native.content.experience')}
                  {!canAccessContentId(selected.id) ? ` · ${t('native.content.locked')}` : ''}
                </p>
                <h2 style={{ fontFamily: F.display, fontWeight: 400, fontSize: 22, margin: '6px 0', color: R.ink }}>{title}</h2>
                <p style={{ margin: 0, color: R.ink, lineHeight: 1.4, fontFamily: F.body }}>{body}</p>
                <p style={{ margin: '8px 0 12px', color: R.muted, fontSize: 13, fontFamily: F.body }}>
                  {formatDuration(selected.timeCostMin)}
                </p>
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
                color: T.ink,
                fontWeight: 600,
                fontFamily: F.body,
                boxShadow: R.primaryShadow,
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
                  border: `1px solid ${R.line}`,
                  background: 'transparent',
                  color: R.ink,
                  fontWeight: 600,
                  fontFamily: F.body,
                }}
              >
                {t('native.experience.unlock')}
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <p style={{ margin: '14px 20px 0', color: R.muted, fontFamily: F.body }}>{t('native.map.hint')}</p>
      )}
      <NativeCoverageSheet open={Boolean(lockItem)} item={lockItem} onClose={() => setLockItem(null)} />
    </div>
  )
}
