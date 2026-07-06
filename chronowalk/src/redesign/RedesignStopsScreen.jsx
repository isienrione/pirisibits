import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { buildJournalTimeline } from '../content/journalTimeline.js'
import { getWaypoint } from '../content/manifest.js'
import { jumpToWaypointInJourney } from '../lib/jumpToWaypoint.js'
import { JOURNEY_STATES } from '../state/journey.js'
import { useV2Journey, useTourManifest } from '../hooks/useV2Journey.js'
import { T, ACT_COLORS, F } from './tokens.js'
import { photoForWaypoint, signatureLine, titleForWaypoint } from './lib/waypointPresentation.js'
import { Eyebrow } from './ui/index.js'

function actColorForNumeral(numeral) {
  return ACT_COLORS[numeral] ?? T.actI
}

function statusLabel(status) {
  if (status === 'completed') return 'Visited'
  if (status === 'current') return 'Current'
  if (status === 'upcoming') return 'Upcoming'
  return 'On route'
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

    return timeline
      .map((act) => ({
        act: act.numeral,
        color: actColorForNumeral(act.numeral),
        name: act.title,
        cards: act.entries
          .filter((entry) => entry.onPath)
          .map((entry) => {
            const waypoint = getWaypoint(manifest, entry.id)
            return {
              id: entry.id,
              name: titleForWaypoint(waypoint),
              sigLine: signatureLine(waypoint),
              status: entry.status,
              photo: photoForWaypoint(waypoint),
            }
          }),
      }))
      .filter((group) => group.cards.length > 0)
  }, [manifest, context.path, context.currentSequenceIndex, context.completedWaypointIds])

  const totalStops = groups.reduce((sum, group) => sum + group.cards.length, 0)

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

      <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', paddingBottom: 'var(--shell-tab-bar-height)' }}>
        {groups.map((group) => (
          <div key={group.act}>
            <div style={{ padding: '8px 24px 12px' }}>
              <Eyebrow color={group.color} hairline>
                ACT {group.act} — {group.name}
              </Eyebrow>
            </div>

            {group.cards.map((card) => (
              <div key={card.id} style={{ padding: '0 24px 14px' }}>
                <div style={{ background: T.warmWhite, borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 10px rgba(33,28,21,0.07)' }}>
                  <button
                    type="button"
                    onClick={() => openStop(card.id)}
                    style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, textAlign: 'left' }}
                  >
                    <div style={{ display: 'flex', height: 96 }}>
                      {card.photo ? (
                        <img src={card.photo} alt="" style={{ width: 96, height: '100%', objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 96, background: `${group.color}18`, flexShrink: 0 }} />
                      )}
                      <div style={{ flex: 1, padding: '14px 16px' }}>
                        <p style={{ fontFamily: F.display, fontSize: 18, color: T.ink, fontWeight: 300, lineHeight: 1.2, marginBottom: 4 }}>
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
                        onClick={() => walkToStop(card.id, JOURNEY_STATES.THRESHOLD)}
                        style={{ fontSize: 11, color: T.ink, background: 'none', border: `1px solid ${T.muted}40`, borderRadius: 8, padding: '6px 8px', cursor: 'pointer' }}
                      >
                        Threshold
                      </button>
                      <button
                        type="button"
                        onClick={() => walkToStop(card.id, JOURNEY_STATES.STORY, 'chapters')}
                        style={{ fontSize: 11, color: T.ink, background: 'none', border: `1px solid ${T.muted}40`, borderRadius: 8, padding: '6px 8px', cursor: 'pointer' }}
                      >
                        Audio
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
                        onClick={() => walkToStop(card.id)}
                        style={{ fontSize: 11, color: T.obsidian, background: T.ember, border: 'none', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Walk here
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {state === JOURNEY_STATES.IDLE ? (
        <div style={{ padding: '12px 24px max(12px, env(safe-area-inset-bottom))', borderTop: `1px solid ${T.muted}28` }}>
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
