import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Lock } from 'lucide-react'
import ChronoWalkLogo from '../../components/ui/ChronoWalkLogo.jsx'
import { T, F } from '../tokens.js'
import { Eyebrow } from '../ui/index.js'
import { buildPreviewTourActs, summarizePreviewTour } from '../../content/myTourPlan.js'
import { getTourProductTruth } from '../../content/tourProductTruth.js'
import { photoForWaypoint, titleForWaypoint } from '../lib/waypointPresentation.js'

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

/**
 * Post-preview ghost tour - full Rome itinerary visible, one sample stop unlocked.
 */
export default function A2PreviewGhostTour({
  manifest,
  previewWaypointId = 'w17',
  previewStopTitle = 'The Pantheon',
  onUnlock,
  onBack,
}) {
  const acts = useMemo(
    () => (manifest ? buildPreviewTourActs(manifest, previewWaypointId) : []),
    [manifest, previewWaypointId],
  )
  const progress = useMemo(() => summarizePreviewTour(acts), [acts])
  const productTruth = useMemo(() => (manifest ? getTourProductTruth(manifest) : null), [manifest])
  const [expandedActs, setExpandedActs] = useState(() => new Set())

  useEffect(() => {
    if (acts.length > 0) {
      setExpandedActs(new Set(acts.map((act) => act.id)))
    }
  }, [acts])

  const toggleActExpanded = (actId) => {
    setExpandedActs((prev) => {
      const next = new Set(prev)
      if (next.has(actId)) next.delete(actId)
      else next.add(actId)
      return next
    })
  }

  return (
    <div
      className="cw-grain"
      style={{
        background: T.bone,
        height: '100%',
        fontFamily: F.body,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
    >
      <div style={{ flexShrink: 0, padding: 'max(18px, env(safe-area-inset-top)) 24px 12px' }}>
        <ChronoWalkLogo className="cw-preview-ghost__logo" width={240} variant="light" hideTagline />
        <Eyebrow color={T.gold}>YOUR TOUR</Eyebrow>
        <h1
          style={{
            fontFamily: F.display,
            fontSize: 34,
            fontWeight: 300,
            color: T.ink,
            margin: '8px 0 6px',
            lineHeight: 1.05,
          }}
        >
          Rome on foot
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: T.muted, lineHeight: 1.55 }}>
          {previewStopTitle} is yours to try. {progress.locked} more places wait behind the full pass.
        </p>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            left: SEAM_X,
            top: 0,
            bottom: 0,
            width: 1.5,
            background: T.gold,
            boxShadow: '0 0 12px rgba(212, 175, 55, 0.45)',
            zIndex: 0,
          }}
        />

        <div style={{ paddingBottom: 16 }}>
          {acts.map((act) => {
            const color = ACT_COLOR[act.colorKey] ?? T.actI
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
                    padding: `14px 20px 14px ${SEAM_X + NODE_R + 14}px`,
                    gap: 12,
                    opacity: 0.72,
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
                      background: T.bone,
                      border: `1.5px solid ${T.ink800}`,
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
                        filter: 'brightness(0.78) saturate(0.55)',
                      }}
                    />
                  ) : null}

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
                        color: `${color}90`,
                        fontWeight: 500,
                        display: 'block',
                        marginBottom: 2,
                      }}
                    >
                      {actLabel}
                    </span>
                    <p
                      style={{
                        fontFamily: F.display,
                        fontSize: 22,
                        color: `${T.ink}90`,
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
                      const isSample = stop.status === 'sample'
                      const isLocked = stop.status === 'locked'
                      const stopPhoto = photoForWaypoint(stop.waypoint)
                      return (
                        <button
                          key={stop.id}
                          type="button"
                          onClick={() => {
                            if (isLocked) onUnlock?.()
                          }}
                          disabled={isSample}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            width: '100%',
                            padding: `8px 20px 8px ${SEAM_X + NODE_R + 14}px`,
                            opacity: isLocked ? 0.46 : 1,
                            background: 'none',
                            border: 'none',
                            cursor: isLocked ? 'pointer' : 'default',
                            textAlign: 'left',
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
                                filter: isLocked ? 'saturate(0.35) brightness(0.82)' : 'none',
                              }}
                            />
                          ) : null}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p
                              style={{
                                margin: 0,
                                fontSize: 14,
                                fontWeight: isSample ? 600 : 400,
                                color: isLocked ? T.muted : T.ink,
                                lineHeight: 1.25,
                              }}
                            >
                              {titleForWaypoint(stop.waypoint)}
                            </p>
                            {stop.hook ? (
                              <p
                                style={{
                                  margin: '2px 0 0',
                                  fontSize: 12,
                                  color: T.muted,
                                  lineHeight: 1.35,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {stop.hook}
                              </p>
                            ) : null}
                          </div>
                          {isSample ? (
                            <span style={{ fontSize: 10, color: T.ember, letterSpacing: '0.1em' }}>
                              SAMPLE
                            </span>
                          ) : (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                fontSize: 10,
                                color: T.muted,
                                letterSpacing: '0.08em',
                              }}
                            >
                              <Lock size={12} aria-hidden />
                              LOCKED
                            </span>
                          )}
                        </button>
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
          padding: '16px 24px max(16px, env(safe-area-inset-bottom))',
          background: `linear-gradient(to bottom, ${T.bone}00 0%, ${T.bone} 18%)`,
          borderTop: `1px solid ${T.ink800}18`,
        }}
      >
        <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.65, margin: '0 0 14px', fontStyle: 'italic' }}>
          That&apos;s one room of {productTruth?.publicPlaceCount ?? progress.total}. The rest of Rome is waiting
          outside.
        </p>
        <button
          type="button"
          onClick={() => onUnlock?.()}
          style={{
            width: '100%',
            padding: '15px',
            background: T.terracotta,
            color: T.obsidian,
            borderRadius: 12,
            fontFamily: F.body,
            fontWeight: 600,
            fontSize: 15,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Unlock all {productTruth?.publicPlacesLabel ?? `${progress.total} places`}
        </button>
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            style={{
              width: '100%',
              marginTop: 10,
              padding: '12px',
              background: 'transparent',
              border: 'none',
              color: T.muted,
              cursor: 'pointer',
              fontFamily: F.body,
            }}
          >
            Back to Home
          </button>
        ) : null}
      </div>
    </div>
  )
}
