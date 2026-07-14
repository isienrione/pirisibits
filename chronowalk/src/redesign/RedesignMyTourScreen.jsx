import { useMemo, useState, useCallback, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSettingsSheet } from './context/SettingsSheetContext.jsx'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { T, F, S, SHELL_TAB_BAR_INSET } from './tokens.js'
import {
  PrimaryButton,
  TextButton,
  ScreenHeader,
  BrandMark,
  StatusMark,
} from './ui/index.js'
import { C1bRouteSheet } from './screens/C1bRouteSheet.jsx'
import B5OwnPaceStopPicker from './screens/B5OwnPaceStopPicker.jsx'
import {
  buildMyTourActs,
  buildRouteSheetGroups,
  currentActForTour,
  getTourWaypointIds,
  needsOwnPaceSelection,
  primaryCtaLabel,
  summarizeMyTour,
} from '../content/myTourPlan.js'
import { JOURNEY_PACE, getPaceOption } from '../data/romePacing.js'
import { JOURNEY_STATES } from '../state/journey.js'
import { useV2Journey, useTourManifest } from '../hooks/useV2Journey.js'
import { photoForWaypoint, titleForWaypoint } from './lib/waypointPresentation.js'
import { getWaypoint } from '../content/manifest.js'
import { jumpToWaypointInJourney } from '../lib/jumpToWaypoint.js'
import { getDistance } from '../utils/distance.js'
import { requestLocationAccess } from '../lib/locationAccess.js'
import { findSequenceIndexForWaypoint } from '../content/myTourPlan.js'

const ACT_COLOR = {
  act1: T.actI,
  act2: T.actII,
  act3: T.actIII,
  act4: T.actIV,
  act5: T.actV,
  act6: T.actVI,
  encore: T.encore,
}

const SEAM_X = 38
const NODE_R = 7

export default function RedesignMyTourScreen() {
  const navigate = useNavigate()
  const { openSettings } = useSettingsSheet()
  const { state, context, begin, setCustomWaypointIds } = useV2Journey()
  const { manifest, loading, error } = useTourManifest()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [pickerMode, setPickerMode] = useState(false)
  const [pickerSelection, setPickerSelection] = useState(() => context.customWaypointIds ?? [])
  const [expandedActs, setExpandedActs] = useState(() => new Set())
  const [geoBusy, setGeoBusy] = useState(false)

  const acts = useMemo(
    () => (manifest ? buildMyTourActs(manifest, context) : []),
    [manifest, context],
  )

  const progress = useMemo(() => summarizeMyTour(acts), [acts])
  const routeGroups = useMemo(() => buildRouteSheetGroups(acts), [acts])
  const currentAct = useMemo(() => currentActForTour(acts), [acts])
  const paceLabel = getPaceOption(context.pace)?.title ?? 'Your tour'

  const journeyActive =
    state !== JOURNEY_STATES.IDLE &&
    state !== JOURNEY_STATES.COMPLETE &&
    state !== JOURNEY_STATES.DAY_COMPLETE

  const showOwnPacePicker =
    pickerMode ||
    (context.pace === JOURNEY_PACE.OWN && needsOwnPaceSelection(context) && state === JOURNEY_STATES.IDLE)

  const initExpanded = useCallback(() => {
    const current = currentActForTour(acts)
    if (current) return new Set([current.id])
    return acts.length ? new Set([acts[0].id]) : new Set()
  }, [acts])

  useEffect(() => {
    if (acts.length > 0) {
      setExpandedActs((prev) => (prev.size === 0 ? initExpanded() : prev))
    }
  }, [acts, initExpanded])

  const toggleActExpanded = (actId) => {
    setExpandedActs((prev) => {
      const next = new Set(prev)
      if (next.has(actId)) next.delete(actId)
      else next.add(actId)
      return next
    })
  }

  const handlePrimaryCta = () => {
    if (journeyActive) {
      navigate('/journey')
      return
    }

    if (context.pace === JOURNEY_PACE.OWN && needsOwnPaceSelection(context)) {
      setPickerMode(true)
      return
    }

    const tourIds = manifest ? getTourWaypointIds(manifest, context) : []
    const firstId = tourIds[0]
    let sequenceIndex = 0
    if (manifest && firstId) {
      sequenceIndex = Math.max(
        0,
        findSequenceIndexForWaypoint(manifest, firstId, context.path, context.promotedOptionalIds),
      )
    }

    begin({
      pace: context.pace,
      path: context.path,
      sequenceIndex,
      customWaypointIds: context.customWaypointIds,
    })
    navigate('/journey')
  }

  const handleStartFromHere = async () => {
    if (!manifest) return
    setGeoBusy(true)
    await requestLocationAccess()
    setGeoBusy(false)

    const tourIds = getTourWaypointIds(manifest, context)
    if (!tourIds.length) return

    const resolvePosition = () =>
      new Promise((resolve) => {
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
          resolve(null)
          return
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => resolve(null),
          { enableHighAccuracy: true, timeout: 12000 },
        )
      })

    const position = await resolvePosition()
    if (!position) {
      navigate('/map')
      return
    }

    let nearestId = tourIds[0]
    let bestDist = Infinity
    for (const id of tourIds) {
      const waypoint = getWaypoint(manifest, id)
      if (!waypoint?.geofence) continue
      const dist = getDistance(
        position.lat,
        position.lng,
        waypoint.geofence.lat,
        waypoint.geofence.lng,
      )
      if (dist < bestDist) {
        bestDist = dist
        nearestId = id
      }
    }

    jumpToWaypointInJourney(manifest, nearestId, context, state)
    navigate('/journey')
  }

  const handleOwnPaceConfirm = () => {
    setCustomWaypointIds(pickerSelection)
    setPickerMode(false)
  }

  const handleTakeMeThere = (waypointId) => {
    if (!manifest) return
    jumpToWaypointInJourney(manifest, waypointId, context, state)
    setSheetOpen(false)
    navigate('/journey')
  }

  if (loading) {
    return (
      <div
        className="cw-grain"
        style={{
          background: T.bone,
          height: '100%',
          display: 'grid',
          placeItems: 'center',
          fontFamily: F.body,
          color: T.muted,
        }}
      >
        Loading your tour…
      </div>
    )
  }

  if (error || !manifest) {
    return (
      <div className="cw-grain" style={{ background: T.bone, height: '100%', padding: S.xl, fontFamily: F.body }}>
        <p style={{ color: T.muted }}>{error?.message ?? 'Tour unavailable'}</p>
        <Link
          to="/begin"
          style={{
            display: 'inline-block',
            marginTop: S.m,
            padding: `${S.m}`,
            borderRadius: 10,
            background: T.ember,
            color: T.obsidian,
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Start tour
        </Link>
      </div>
    )
  }

  if (showOwnPacePicker) {
    return (
      <B5OwnPaceStopPicker
        manifest={manifest}
        context={context}
        selectedIds={pickerSelection}
        onChangeSelected={setPickerSelection}
        onContinue={handleOwnPaceConfirm}
        onBack={pickerMode && !needsOwnPaceSelection(context) ? () => setPickerMode(false) : undefined}
      />
    )
  }

  const ctaLabel = primaryCtaLabel(acts, journeyActive)
  const ctaColor = currentAct ? ACT_COLOR[currentAct.colorKey] ?? T.actI : T.actI

  return (
    <div
      className="cw-grain"
      style={{
        background: T.bone,
        height: '100%',
        fontFamily: F.body,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <ScreenHeader
        layout="brand"
        title="ROME: ETERNAL CITY"
        metaLeft={paceLabel}
        metaRight={`${progress.completed}/${progress.total}`}
        onSettings={openSettings}
        brand={
          <>
            <BrandMark />
            <span
              style={{
                fontSize: 11,
                color: T.ink,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                fontWeight: 500,
              }}
            >
              CHRONOWALK
            </span>
          </>
        }
      >
        {context.pace === JOURNEY_PACE.OWN ? (
          <TextButton
            underline
            style={{ marginTop: S.m, fontSize: 12 }}
            onClick={() => {
              setPickerSelection(context.customWaypointIds ?? [])
              setPickerMode(true)
            }}
          >
            Edit today&apos;s stops
          </TextButton>
        ) : null}
      </ScreenHeader>

      <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            left: SEAM_X,
            top: 0,
            bottom: 0,
            width: 1.5,
            background: T.ember,
            boxShadow: '0 0 12px rgba(232,161,60,0.45)',
            animation: 'seamBreathe 3s ease-in-out infinite',
            zIndex: 0,
          }}
        />

        <div style={{ paddingBottom: S.l }}>
          {acts.map((act) => {
            const color = ACT_COLOR[act.colorKey] ?? T.actI
            const faded = act.status === 'ahead' || act.locked
            const actLabel = act.numeral === 'Encore' ? 'ENCORE' : `ACT ${act.numeral}`
            const photo = photoForWaypoint(act.photoStop)
            const expanded = expandedActs.has(act.id)

            return (
              <div key={act.id}>
                <div
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    padding: `${S.m} ${S.l} ${S.m} ${SEAM_X + NODE_R + 14}px`,
                    gap: S.m,
                    opacity: act.locked ? 0.38 : faded ? 0.55 : 1,
                    transition: 'opacity 300ms',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: SEAM_X - NODE_R,
                      top: 28,
                      width: NODE_R * 2,
                      height: NODE_R * 2,
                      borderRadius: NODE_R,
                      zIndex: 2,
                      ...(act.status === 'current'
                        ? {
                            background: color,
                            boxShadow: `0 0 0 5px ${color}28, 0 0 14px ${color}70`,
                            animation: 'presencePulse 3s ease-in-out infinite',
                          }
                        : act.status === 'done'
                          ? { background: color }
                          : {
                              background: T.bone,
                              border: `1.5px solid ${T.ink800}`,
                            }),
                    }}
                  />

                  {photo ? (
                    <img
                      src={photo}
                      alt=""
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 10,
                        objectFit: 'cover',
                        flexShrink: 0,
                        filter: faded ? 'brightness(0.7) saturate(0.55)' : 'none',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 10,
                        background: `${T.muted}22`,
                        flexShrink: 0,
                      }}
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => toggleActExpanded(act.id)}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      padding: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        color: faded ? `${color}70` : color,
                        fontWeight: 500,
                        display: 'block',
                        marginBottom: 2,
                      }}
                    >
                      {actLabel}
                      {act.locked ? ' · DAY TWO' : ''}
                    </span>
                    <p
                      style={{
                        fontFamily: F.display,
                        fontSize: 22,
                        color: faded ? `${T.ink}85` : T.ink,
                        fontWeight: 300,
                        lineHeight: 1.1,
                        margin: '0 0 3px',
                      }}
                    >
                      {act.title}
                    </p>
                    <p
                      style={{
                        fontSize: 13,
                        color: T.muted,
                        lineHeight: 1.4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        margin: 0,
                      }}
                    >
                      {act.promise}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleActExpanded(act.id)}
                    aria-label={expanded ? 'Collapse act' : 'Expand act'}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 4,
                      flexShrink: 0,
                      color: T.muted,
                    }}
                  >
                    {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>

                {expanded
                  ? act.stops.map((stop) => {
                      const stopFaded = stop.status === 'upcoming' || act.locked
                      const stopPhoto = photoForWaypoint(stop.waypoint)
                      return (
                        <div
                          key={stop.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: `${S.s} ${S.l} ${S.s} ${SEAM_X + NODE_R + 14}px`,
                            opacity: stopFaded ? 0.5 : 1,
                          }}
                        >
                          <div style={{ width: 56, flexShrink: 0 }} />
                          {stopPhoto ? (
                            <img
                              src={stopPhoto}
                              alt=""
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: 8,
                                objectFit: 'cover',
                                flexShrink: 0,
                                filter: stopFaded ? 'saturate(0.5)' : 'none',
                              }}
                            />
                          ) : null}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p
                              style={{
                                margin: 0,
                                fontSize: 14,
                                fontWeight: stop.status === 'current' ? 600 : 400,
                                color: stopFaded ? T.muted : T.ink,
                                lineHeight: 1.25,
                              }}
                            >
                              {titleForWaypoint(stop.waypoint)}
                            </p>
                          </div>
                          {stop.status === 'completed' ? (
                            <StatusMark kind="done" color={color} />
                          ) : stop.status === 'current' ? (
                            <StatusMark kind="now" color={T.ember} />
                          ) : null}
                        </div>
                      )
                    })
                  : null}
              </div>
            )
          })}
        </div>
      </div>

      <div
        style={{
          flexShrink: 0,
          padding: `${S.l} ${S.edge} ${SHELL_TAB_BAR_INSET}`,
          background: `linear-gradient(to bottom, ${T.bone}00 0%, ${T.bone} 18%)`,
          borderTop: `1px solid ${T.ink800}14`,
          position: 'relative',
          zIndex: 5,
        }}
      >
        <PrimaryButton
          color={ctaColor}
          textColor={T.warmWhite}
          glow={false}
          onClick={handlePrimaryCta}
          style={{ marginBottom: S.m }}
        >
          {ctaLabel}
        </PrimaryButton>
        <div style={{ display: 'flex', justifyContent: 'center', gap: S.xl }}>
          <TextButton onClick={() => setSheetOpen(true)}>Route</TextButton>
          <TextButton disabled={geoBusy} onClick={handleStartFromHere}>
            Start from here
          </TextButton>
        </div>
        {state === JOURNEY_STATES.IDLE && acts.length === 0 ? (
          <Link
            to="/begin"
            style={{
              display: 'block',
              textAlign: 'center',
              marginTop: S.m,
              fontSize: 13,
              color: T.muted,
            }}
          >
            Choose your rhythm first →
          </Link>
        ) : null}
      </div>

      {sheetOpen ? (
        <C1bRouteSheet
          groups={routeGroups}
          stopCount={progress.total}
          onClose={() => setSheetOpen(false)}
          onTakeMeThere={handleTakeMeThere}
          colorForAct={(actId) => ACT_COLOR[actId] ?? T.actI}
        />
      ) : null}
    </div>
  )
}
