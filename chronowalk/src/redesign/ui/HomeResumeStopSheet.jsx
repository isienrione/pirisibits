import { useEffect, useMemo, useState } from 'react'
import { Check, ChevronDown, MapPinned, X } from 'lucide-react'
import { T, F } from '../tokens.js'
import { useT } from '../../i18n/I18nProvider.jsx'
import { getWaypoint } from '../../content/manifest.js'
import { getTourWaypointIds } from '../../content/myTourPlan.js'
import {
  formatWalkDistance,
  resolveNearestTourStop,
} from '../../lib/startFromNearestStop.js'
import { photoForWaypoint, titleForWaypoint } from '../lib/waypointPresentation.js'

function StopThumb({ waypoint, size = 72 }) {
  const src = waypoint ? photoForWaypoint(waypoint) : null
  if (!src) {
    return (
      <div
        aria-hidden
        style={{
          width: size,
          height: size,
          borderRadius: 16,
          background: `${T.actIV}22`,
          flexShrink: 0,
        }}
      />
    )
  }
  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        borderRadius: 16,
        objectFit: 'cover',
        flexShrink: 0,
        background: T.limestone,
      }}
    />
  )
}

/**
 * Resume-from-elsewhere screen: nearest stop suggestion, then optional stop list.
 */
export default function HomeResumeStopSheet({
  open,
  onClose,
  manifest,
  context,
  onChooseStop,
}) {
  const t = useT()
  const [phase, setPhase] = useState('loading') // loading | nearest | picker | error
  const [nearestId, setNearestId] = useState(null)
  const [distanceM, setDistanceM] = useState(null)
  const [errorKind, setErrorKind] = useState(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [selectedId, setSelectedId] = useState(null)

  const stops = useMemo(() => {
    if (!manifest) return []
    return getTourWaypointIds(manifest, context)
      .map((id) => {
        const waypoint = getWaypoint(manifest, id)
        if (!waypoint) return null
        return { id, waypoint, title: titleForWaypoint(waypoint) }
      })
      .filter(Boolean)
  }, [manifest, context])

  const nearestWaypoint = useMemo(
    () => (nearestId ? getWaypoint(manifest, nearestId) : null),
    [manifest, nearestId],
  )

  useEffect(() => {
    if (!open) return undefined
    let cancelled = false
    setPhase('loading')
    setNearestId(null)
    setDistanceM(null)
    setErrorKind(null)
    setPickerOpen(false)
    setSelectedId(null)

    void (async () => {
      const result = await resolveNearestTourStop({ manifest, context })
      if (cancelled) return
      if (result.status !== 'ok') {
        setErrorKind(result.status)
        setPickerOpen(true)
        setPhase('picker')
        return
      }
      setNearestId(result.id)
      setDistanceM(result.distanceM)
      setSelectedId(result.id)
      setPhase('nearest')
    })()

    return () => {
      cancelled = true
    }
  }, [open, manifest, context])

  if (!open) return null

  const distanceLabel = formatWalkDistance(distanceM, t)
  const nearestTitle = nearestWaypoint ? titleForWaypoint(nearestWaypoint) : null

  const confirmSelected = () => {
    const id = selectedId ?? nearestId
    if (!id) return
    onChooseStop?.(id)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="home-resume-title"
      data-testid="home-resume-sheet"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 210,
        display: 'flex',
        flexDirection: 'column',
        background: `
          radial-gradient(90% 55% at 100% 0%, rgba(78,155,143,0.22) 0%, transparent 55%),
          radial-gradient(70% 45% at 0% 100%, rgba(78,125,155,0.16) 0%, transparent 50%),
          linear-gradient(180deg, #FFFEFA 0%, ${T.bone} 50%, #F3EDE3 100%)
        `,
        fontFamily: F.body,
        color: T.ink,
        // Sit above the fixed shell tab bar (z-index lower than this overlay).
        paddingBottom: 'calc(var(--shell-tab-bar-height, 3.15rem) + 12px)',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
          padding: '14px 16px 8px',
          paddingTop: 'max(16px, calc(env(safe-area-inset-top) + 10px))',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontSize: 11,
              fontWeight: 650,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: T.actVI,
            }}
          >
            {t('home.resume.eyebrow')}
          </p>
          <h2
            id="home-resume-title"
            style={{
              margin: '6px 0 0',
              fontFamily: F.display,
              fontSize: 26,
              fontWeight: 450,
              lineHeight: 1.15,
              color: T.ink,
            }}
          >
            {t('home.resume.title')}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('home.resume.close')}
          data-testid="home-resume-close"
          style={{
            width: 36,
            height: 36,
            borderRadius: 999,
            border: `1px solid ${T.limestone}`,
            background: '#FFFEFA',
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
            color: T.ink,
            flexShrink: 0,
          }}
        >
          <X size={16} />
        </button>
      </header>

      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '8px 16px 16px' }}>
        {phase === 'loading' ? (
          <p
            data-testid="home-resume-loading"
            style={{ margin: '48px 0 0', textAlign: 'center', color: '#8A8174', fontSize: 15 }}
          >
            {t('home.resume.locating')}
          </p>
        ) : null}

        {phase === 'nearest' && nearestWaypoint ? (
          <div
            data-testid="home-resume-nearest"
            style={{
              marginTop: 12,
              borderRadius: 24,
              padding: 18,
              background: 'linear-gradient(165deg, #FFFFFF 0%, #FBF8F2 100%)',
              border: `1px solid ${T.limestone}`,
              boxShadow: '0 14px 32px rgba(78,125,155,0.12)',
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 12,
                fontWeight: 650,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: T.actIV,
              }}
            >
              {t('home.resume.nearestLabel')}
            </p>
            <div style={{ display: 'flex', gap: 14, marginTop: 14, alignItems: 'center' }}>
              <StopThumb waypoint={nearestWaypoint} size={84} />
              <div style={{ minWidth: 0 }}>
                <p
                  style={{
                    margin: 0,
                    fontFamily: F.display,
                    fontSize: 22,
                    fontWeight: 500,
                    lineHeight: 1.15,
                    color: T.ink,
                  }}
                >
                  {nearestTitle}
                </p>
                {distanceLabel ? (
                  <p
                    style={{
                      margin: '8px 0 0',
                      fontSize: 14,
                      color: '#8A8174',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <MapPinned size={14} aria-hidden color={T.actVI} />
                    {distanceLabel}
                  </p>
                ) : null}
              </div>
            </div>

            <div style={{ display: 'grid', gap: 10, marginTop: 20 }}>
              <button
                type="button"
                data-testid="home-resume-yes"
                onClick={() => onChooseStop?.(nearestId)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  minHeight: 52,
                  borderRadius: 14,
                  border: 'none',
                  background: `linear-gradient(135deg, ${T.actIV} 0%, ${T.actII} 100%)`,
                  color: T.warmWhite,
                  fontWeight: 650,
                  fontSize: 15,
                  cursor: 'pointer',
                  fontFamily: F.body,
                  boxShadow: '0 10px 24px rgba(78,155,143,0.28)',
                }}
              >
                <Check size={18} aria-hidden />
                {t('home.resume.yes', { title: nearestTitle })}
              </button>
              <button
                type="button"
                data-testid="home-resume-different"
                onClick={() => {
                  setSelectedId(nearestId)
                  setPickerOpen(true)
                  setPhase('picker')
                }}
                style={{
                  minHeight: 48,
                  borderRadius: 14,
                  border: `1px solid ${T.limestone}`,
                  background: '#FFFEFA',
                  color: T.ink,
                  fontWeight: 650,
                  fontSize: 14,
                  cursor: 'pointer',
                  fontFamily: F.body,
                }}
              >
                {t('home.resume.different')}
              </button>
            </div>
          </div>
        ) : null}

        {phase === 'picker' ? (
          <div data-testid="home-resume-picker" style={{ marginTop: 12 }}>
            {errorKind ? (
              <p style={{ margin: '0 0 14px', fontSize: 14, lineHeight: 1.5, color: '#8A8174' }}>
                {errorKind === 'no_gps' ? t('home.resume.noGps') : t('home.resume.noStop')}
              </p>
            ) : (
              <p style={{ margin: '0 0 14px', fontSize: 14, lineHeight: 1.5, color: '#8A8174' }}>
                {t('home.resume.pickerHint')}
              </p>
            )}

            <button
              type="button"
              data-testid="home-resume-dropdown"
              aria-expanded={pickerOpen}
              onClick={() => setPickerOpen((value) => !value)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                padding: '14px 14px',
                borderRadius: 16,
                border: `1px solid ${T.limestone}`,
                background: '#FFFEFA',
                cursor: 'pointer',
                fontFamily: F.body,
                textAlign: 'left',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                {selectedId ? (
                  <StopThumb
                    waypoint={getWaypoint(manifest, selectedId)}
                    size={44}
                  />
                ) : null}
                <span style={{ minWidth: 0 }}>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 11,
                      fontWeight: 650,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: T.actVI,
                    }}
                  >
                    {t('home.resume.chooseLabel')}
                  </span>
                  <span
                    style={{
                      display: 'block',
                      marginTop: 4,
                      fontSize: 15,
                      fontWeight: 650,
                      color: T.ink,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {selectedId
                      ? titleForWaypoint(getWaypoint(manifest, selectedId))
                      : t('home.resume.choosePlaceholder')}
                  </span>
                </span>
              </span>
              <ChevronDown
                size={18}
                aria-hidden
                style={{
                  flexShrink: 0,
                  transform: pickerOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 180ms ease',
                }}
              />
            </button>

            {pickerOpen ? (
              <ul
                data-testid="home-resume-stop-list"
                style={{
                  listStyle: 'none',
                  margin: '8px 0 0',
                  padding: 6,
                  borderRadius: 16,
                  border: `1px solid ${T.limestone}`,
                  background: '#FFFEFA',
                  maxHeight: 'min(46vh, 360px)',
                  overflow: 'auto',
                }}
              >
                {stops.map((stop) => {
                  const active = stop.id === selectedId
                  return (
                    <li key={stop.id}>
                      <button
                        type="button"
                        data-testid={`home-resume-stop-${stop.id}`}
                        onClick={() => {
                          setSelectedId(stop.id)
                          setPickerOpen(false)
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '10px 10px',
                          borderRadius: 12,
                          border: 'none',
                          background: active ? `${T.actIV}18` : 'transparent',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontFamily: F.body,
                        }}
                      >
                        <StopThumb waypoint={stop.waypoint} size={48} />
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span
                            style={{
                              display: 'block',
                              fontSize: 15,
                              fontWeight: 650,
                              color: T.ink,
                            }}
                          >
                            {stop.title}
                          </span>
                          {stop.id === nearestId ? (
                            <span
                              style={{
                                display: 'block',
                                marginTop: 2,
                                fontSize: 12,
                                color: T.actIV,
                                fontWeight: 600,
                              }}
                            >
                              {t('home.resume.nearestBadge')}
                            </span>
                          ) : null}
                        </span>
                        {active ? <Check size={16} color={T.actIV} aria-hidden /> : null}
                      </button>
                    </li>
                  )
                })}
              </ul>
            ) : null}

            <button
              type="button"
              data-testid="home-resume-confirm-pick"
              disabled={!selectedId}
              onClick={confirmSelected}
              style={{
                width: '100%',
                marginTop: 16,
                minHeight: 52,
                borderRadius: 14,
                border: 'none',
                background: selectedId
                  ? `linear-gradient(135deg, ${T.actVI} 0%, ${T.actIV} 100%)`
                  : `${T.muted}55`,
                color: T.warmWhite,
                fontWeight: 650,
                fontSize: 15,
                cursor: selectedId ? 'pointer' : 'default',
                fontFamily: F.body,
                opacity: selectedId ? 1 : 0.6,
              }}
            >
              {t('home.resume.confirmPick')}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
