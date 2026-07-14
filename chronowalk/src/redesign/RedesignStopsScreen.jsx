import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { buildJournalTimeline } from '../content/journalTimeline.js'
import { getTourProductTruth } from '../content/tourProductTruth.js'
import { getWaypoint } from '../content/manifest.js'
import { jumpToWaypointInJourney } from '../lib/jumpToWaypoint.js'
import { JOURNEY_STATES } from '../state/journey.js'
import { useV2Journey, useTourManifest } from '../hooks/useV2Journey.js'
import { T, ACT_COLORS, F, S, R, TAP, SHELL_TAB_BAR_INSET } from './tokens.js'
import { TYPE } from './typography.js'
import { photoForWaypoint, signatureLine, titleForWaypoint } from './lib/waypointPresentation.js'
import {
  ActNode,
  Eyebrow,
  PrimaryButton,
  SecondaryButton,
  ScreenHeader,
  SurfaceCard,
  StatusMark,
  GoldSeam,
  CinematicImage,
} from './ui/index.js'

const SEAM_X = 38
const ACT_DIAMOND = 14
const STOP_NODE_R = 4
const ROW_INSET = SEAM_X + ACT_DIAMOND / 2 + 12

function actColorForNumeral(numeral) {
  return ACT_COLORS[numeral] ?? T.actI
}

function statusKind(status) {
  if (status === 'completed') return 'visited'
  if (status === 'current') return 'here'
  return null
}

function nodeStatusForStop(status) {
  if (status === 'completed') return 'done'
  if (status === 'current') return 'current'
  return 'ahead'
}

export default function RedesignStopsScreen() {
  const navigate = useNavigate()
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
    const jumped = jumpToWaypointInJourney(manifest, waypointId, context, state, {
      targetState,
      storyView,
    })
    if (jumped) navigate('/journey')
  }

  if (loading) {
    return (
      <div
        className="cw-grain"
        style={{
          background: T.bone,
          height: '100%',
          fontFamily: F.body,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: S.m,
        }}
      >
        <GoldSeam moment="loading" />
        <p style={{ color: T.muted, margin: 0 }}>Loading route…</p>
      </div>
    )
  }

  if (error || !manifest) {
    return (
      <div className="cw-grain" style={{ background: T.bone, height: '100%', fontFamily: F.body, padding: S.xl }}>
        <p style={{ color: T.muted }}>{error?.message ?? 'Route unavailable'}</p>
        <button
          type="button"
          onClick={() => navigate('/begin')}
          className="cw-motion-pressable"
          style={{
            marginTop: S.m,
            minHeight: TAP.min,
            padding: `0 ${S.m}`,
            borderRadius: R.control,
            border: 'none',
            background: T.ember,
            color: T.obsidian,
            cursor: 'pointer',
            ...TYPE.button,
          }}
        >
          Start tour
        </button>
      </div>
    )
  }

  return (
    <div className="cw-grain" style={{ background: T.bone, height: '100%', fontFamily: F.body, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <ScreenHeader
        layout="plain"
        title="All stops"
        subtitle={`${totalStops} on your route`}
      />

      <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', position: 'relative', paddingBottom: S.l }}>
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

        <div style={{ position: 'relative', zIndex: 1, paddingBottom: S.l }}>
          {groups.map((group) => (
            <div key={group.act}>
              <div
                style={{
                  position: 'relative',
                  padding: `${S.m} ${S.l} ${S.s} ${ROW_INSET}px`,
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
                  ACT {group.act} — {group.name}
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
                      padding: `0 ${S.l} ${isLastInAct ? S.l : S.m} ${ROW_INSET}px`,
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

                    <SurfaceCard
                      tone="light"
                      radius={12}
                      style={{
                        borderLeft: card.status === 'current' ? `2px solid ${group.color}` : '2px solid transparent',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => openStop(card.id)}
                        style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, textAlign: 'left' }}
                      >
                        <div style={{ display: 'flex', height: 100 }}>
                          {card.photo ? (
                            <CinematicImage
                              src={card.photo}
                              alt=""
                              width={96}
                              height="100%"
                              aspect="fill"
                              radius="none"
                              grade="film"
                              overlay="soft"
                              position="upper"
                              shadow="none"
                              faded={faded}
                            />
                          ) : (
                            <div style={{ width: 96, background: `${group.color}18`, flexShrink: 0 }} />
                          )}
                          <div style={{ flex: 1, padding: S.m }}>
                            <p
                              style={{
                                ...TYPE.cardTitle,
                                color: faded ? `${T.ink}99` : T.ink,
                                marginBottom: S.s,
                              }}
                            >
                              {card.name}
                            </p>
                            <p
                              style={{
                                ...TYPE.caption,
                                color: T.muted,
                                fontStyle: 'italic',
                              }}
                            >
                              {card.sigLine}
                            </p>
                          </div>
                        </div>
                      </button>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${S.m} ${S.m} ${S.l}`, borderTop: `1px solid ${T.muted}14` }}>
                        {statusKind(card.status) ? (
                          <StatusMark kind={statusKind(card.status)} color={group.color} />
                        ) : (
                          <span style={{ minHeight: 16 }} />
                        )}
                        <div style={{ display: 'flex', gap: S.s, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          <SecondaryButton
                            onClick={() => walkToStop(card.id, JOURNEY_STATES.STORY, 'chapters')}
                            color={T.ink}
                            borderColor={`${T.muted}35`}
                            style={{
                              width: 'auto',
                              minHeight: 44,
                              padding: `${S.s} ${S.m}`,
                              fontSize: 13,
                              fontWeight: 500,
                            }}
                          >
                            Listen
                          </SecondaryButton>
                          <PrimaryButton
                            onClick={() => walkToStop(card.id)}
                            color={T.ember}
                            glow={false}
                            style={{
                              width: 'auto',
                              minHeight: 44,
                              padding: `${S.s} ${S.m}`,
                              fontSize: 13,
                            }}
                          >
                            Walk here
                          </PrimaryButton>
                        </div>
                      </div>
                    </SurfaceCard>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {state === JOURNEY_STATES.IDLE ? (
        <div style={{ padding: `${S.l} ${S.edge} ${SHELL_TAB_BAR_INSET}`, borderTop: `1px solid ${T.muted}28` }}>
          <PrimaryButton color={T.ember} glow={false} onClick={() => navigate('/begin')}>
            Begin the tour
          </PrimaryButton>
        </div>
      ) : null}
    </div>
  )
}
