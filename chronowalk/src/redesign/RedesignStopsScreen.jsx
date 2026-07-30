import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { buildJournalTimeline } from '../content/journalTimeline.js'
import { getTourProductTruth } from '../content/tourProductTruth.js'
import { getWaypoint } from '../content/manifest.js'
import { JOURNEY_STATES } from '../state/journey.js'
import { useV2Journey, useTourManifest } from '../hooks/useV2Journey.js'
import { useSharedWalkGuard } from './context/SharedWalkGuardContext.jsx'
import { T, ACT_COLORS, F, SHELL_TAB_BAR_INSET } from './tokens.js'
import { photoForWaypoint, signatureLine, titleForWaypoint } from './lib/waypointPresentation.js'
import { ActNode, Eyebrow } from './ui/index.js'

const SEAM_X = 38
const ACT_DIAMOND = 14
const STOP_NODE_R = 4
const ROW_INSET = SEAM_X + ACT_DIAMOND / 2 + 12

function actColorForNumeral(numeral) {
  return ACT_COLORS[numeral] ?? T.actI
}

function statusLabel(status) {
  if (status === 'completed') return 'Visited'
  if (status === 'current') return 'Current'
  if (status === 'upcoming') return 'Upcoming'
  return 'On route'
}

function nodeStatusForStop(status) {
  if (status === 'completed') return 'done'
  if (status === 'current') return 'current'
  return 'ahead'
}

export default function RedesignStopsScreen() {
  const navigate = useNavigate()
  const { requestJumpToWaypoint } = useSharedWalkGuard()
  const { state, context } = useV2Journey()
  const { manifest, loading, error } = useTourManifest()

  const groups = useMemo(() => {
    if (!manifest) return []

    const timeline = buildJournalTimeline(manifest, {
      path: context.path,
      sequenceIndex: context.currentSequenceIndex,
      completedWaypointIds: context.completedWaypointIds,
    })

    let order = 0
    return timeline
      .map((act) => ({
        act: act.numeral,
        color: actColorForNumeral(act.numeral),
        name: act.title,
        cards: act.entries
          .filter((entry) => entry.onPath)
          .map((entry) => {
            order += 1
            const waypoint = getWaypoint(manifest, entry.id)
            return {
              id: entry.id,
              order,
              name: titleForWaypoint(waypoint),
              sigLine: signatureLine(waypoint),
              status: entry.status,
              photo: photoForWaypoint(waypoint),
            }
          }),
      }))
      .filter((group) => group.cards.length > 0)
  }, [manifest, context.path, context.currentSequenceIndex, context.completedWaypointIds])

  const totalStops = useMemo(() => {
    if (!manifest) return 0
    return getTourProductTruth(manifest, {
      path: context.path,
      pace: context.pace,
      promotedOptionalIds: context.promotedOptionalIds,
      customWaypointIds: context.customWaypointIds,
    }).visitStopCount
  }, [manifest, context.path, context.pace, context.promotedOptionalIds, context.customWaypointIds])

  const openStop = (waypointId) => {
    navigate(`/journal/${waypointId}`)
  }

  const walkToStop = (waypointId, targetState = null, storyView = null) => {
    if (!manifest) return
    void requestJumpToWaypoint(manifest, waypointId, context, state, {
      targetState,
      storyView,
    }).then((jumped) => {
      if (jumped) navigate('/journey')
    })
  }

  if (loading) {
    return (
      <div className="cw-grain" style={{ background: T.bone, height: '100%', fontFamily: F.body, display: 'grid', placeItems: 'center' }}>
        <p style={{ color: T.muted }}>Loading route…</p>
      </div>
    )
  }

  if (error || !manifest) {
    return (
      <div className="cw-grain" style={{ background: T.bone, height: '100%', fontFamily: F.body, padding: 32 }}>
        <p style={{ color: T.muted }}>{error?.message ?? 'Route unavailable'}</p>
        <button type="button" onClick={() => navigate('/begin')} style={{ marginTop: 16, padding: '12px 16px', borderRadius: 10, border: 'none', background: T.ember, cursor: 'pointer' }}>
          Start tour
        </button>
      </div>
    )
  }

  return (
    <div className="cw-grain" style={{ background: T.bone, height: '100%', fontFamily: F.body, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: 'max(48px, calc(env(safe-area-inset-top) + 16px)) 24px 12px', flexShrink: 0 }}>
        <h1 style={{ fontFamily: F.display, fontSize: 32, color: T.ink, fontWeight: 300, lineHeight: 1.1, marginBottom: 4 }}>
          All stops
        </h1>
        <p style={{ fontSize: 13, color: T.muted }}>
          {totalStops} stops on your Rome route
        </p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', position: 'relative', paddingBottom: 16 }}>
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
          aria-hidden
        />

        <div style={{ position: 'relative', zIndex: 1, paddingBottom: 16 }}>
          {groups.map((group) => (
            <div key={group.act}>
              <div
                style={{
                  position: 'relative',
                  padding: `12px 20px 10px ${ROW_INSET}px`,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: SEAM_X - ACT_DIAMOND / 2,
                    top: 14,
                    width: ACT_DIAMOND,
                    height: ACT_DIAMOND,
                    borderRadius: 3,
                    background: group.color,
                    transform: 'rotate(45deg)',
                    boxShadow: `0 0 0 4px ${group.color}22, 0 0 14px ${group.color}66`,
                    zIndex: 2,
                  }}
                  aria-hidden
                />
                <Eyebrow color={group.color} hairline>
                  ACT {group.act} · {group.name}
                </Eyebrow>
              </div>

              {group.cards.map((card, cardIndex) => {
                const faded = card.status === 'upcoming'
                const isLastInAct = cardIndex === group.cards.length - 1

                return (
                  <div
                    key={card.id}
                    style={{
                      position: 'relative',
                      padding: `0 20px ${isLastInAct ? 18 : 14}px ${ROW_INSET}px`,
                      opacity: faded ? 0.72 : 1,
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        left: SEAM_X - STOP_NODE_R,
                        top: 48,
                        zIndex: 2,
                      }}
                    >
                      <ActNode status={nodeStatusForStop(card.status)} color={group.color} radius={STOP_NODE_R} />
                    </div>

                    <span
                      style={{
                        position: 'absolute',
                        left: SEAM_X + STOP_NODE_R + 4,
                        top: 12,
                        fontSize: 11,
                        color: T.muted,
                        fontVariantNumeric: 'tabular-nums',
                        fontWeight: 300,
                        zIndex: 2,
                      }}
                      aria-hidden
                    >
                      {card.order}
                    </span>

                    <div
                      style={{
                        background: T.warmWhite,
                        borderRadius: 14,
                        overflow: 'hidden',
                        boxShadow: '0 1px 10px rgba(33,28,21,0.07)',
                        borderLeft: card.status === 'current' ? `2px solid ${group.color}` : '2px solid transparent',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => openStop(card.id)}
                        style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, textAlign: 'left' }}
                      >
                        <div style={{ display: 'flex', height: 96 }}>
                          {card.photo ? (
                            <img
                              src={card.photo}
                              alt=""
                              style={{
                                width: 96,
                                height: '100%',
                                objectFit: 'cover',
                                flexShrink: 0,
                                filter: faded ? 'saturate(0.55) brightness(0.92)' : 'none',
                              }}
                            />
                          ) : (
                            <div style={{ width: 96, background: `${group.color}18`, flexShrink: 0 }} />
                          )}
                          <div style={{ flex: 1, padding: '14px 16px' }}>
                            <p style={{ fontFamily: F.display, fontSize: 18, color: faded ? `${T.ink}99` : T.ink, fontWeight: 300, lineHeight: 1.2, marginBottom: 4 }}>
                              {card.name}
                            </p>
                            <p style={{ fontSize: 12, color: T.muted, fontStyle: 'italic', lineHeight: 1.45 }}>
                              {card.sigLine}
                            </p>
                          </div>
                        </div>
                      </button>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px 14px', borderTop: `1px solid ${T.muted}18` }}>
                        <span style={{ fontSize: 11, color: group.color, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                          {statusLabel(card.status)}
                        </span>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            onClick={() => walkToStop(card.id, JOURNEY_STATES.STORY, 'chapters')}
                            style={{ fontSize: 11, color: T.ink, background: 'none', border: `1px solid ${T.muted}40`, borderRadius: 8, padding: '6px 8px', cursor: 'pointer' }}
                          >
                            Listen here
                          </button>
                          <button
                            type="button"
                            onClick={() => openStop(card.id)}
                            style={{ fontSize: 11, color: T.ink, background: 'none', border: `1px solid ${T.muted}40`, borderRadius: 8, padding: '6px 8px', cursor: 'pointer' }}
                          >
                            Open card
                          </button>
                          <button
                            type="button"
                            onClick={() => walkToStop(card.id, JOURNEY_STATES.WALKING)}
                            style={{ fontSize: 11, color: T.obsidian, background: T.ember, border: 'none', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', fontWeight: 600 }}
                          >
                            Walk here
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {state === JOURNEY_STATES.IDLE ? (
        <div style={{ padding: `12px 24px ${SHELL_TAB_BAR_INSET}`, borderTop: `1px solid ${T.muted}28` }}>
          <button
            type="button"
            onClick={() => navigate('/begin')}
            style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: T.ember, color: T.obsidian, fontWeight: 600, cursor: 'pointer' }}
          >
            Begin the tour
          </button>
        </div>
      ) : null}
    </div>
  )
}
