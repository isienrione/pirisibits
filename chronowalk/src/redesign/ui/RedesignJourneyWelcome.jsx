import { useMemo } from 'react'
import { buildJournalTimeline } from '../../content/journalTimeline.js'
import { getTourProductTruth } from '../../content/tourProductTruth.js'
import { getWaypoint } from '../../content/manifest.js'
import { useTourManifest, useV2Journey } from '../../hooks/useV2Journey.js'
import { T, F, ACT_COLORS, SHELL_TAB_BAR_INSET } from '../tokens.js'
import { photoForWaypoint, signatureLine, titleForWaypoint } from '../lib/waypointPresentation.js'
import { Eyebrow, PrimaryButton } from '../ui/index.js'

function actColor(numeral) {
  return ACT_COLORS[numeral] ?? T.actI
}

/**
 * Journey welcome — excited roadmap preview before unlocking audio.
 */
export default function RedesignJourneyWelcome({ onUnlock, busy = false }) {
  const { context } = useV2Journey()
  const { manifest, loading } = useTourManifest()

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
        color: actColor(act.numeral),
        name: act.title,
        stops: act.entries
          .filter((e) => e.onPath)
          .map((e) => {
            const wp = getWaypoint(manifest, e.id)
            return {
              id: e.id,
              name: titleForWaypoint(wp),
              hook: signatureLine(wp),
              photo: photoForWaypoint(wp),
            }
          }),
      }))
      .filter((g) => g.stops.length > 0)
  }, [manifest, context])

  const stopCount = useMemo(() => {
    if (!manifest) return 0
    return getTourProductTruth(manifest, {
      path: context.path,
      pace: context.pace,
      promotedOptionalIds: context.promotedOptionalIds,
      customWaypointIds: context.customWaypointIds,
    }).visitStopCount
  }, [manifest, context.path, context.pace, context.promotedOptionalIds, context.customWaypointIds])

  return (
    <div
      className="cw-grain redesign-app-shell"
      style={{
        minHeight: '100%',
        background: T.bone,
        fontFamily: F.body,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: 'max(48px, calc(env(safe-area-inset-top) + 20px)) 24px 16px',
          flexShrink: 0,
        }}
      >
        <Eyebrow color={T.ember}>YOUR ROME AWAITS</Eyebrow>
        <h1
          style={{
            fontFamily: F.display,
            fontSize: 38,
            fontWeight: 300,
            color: T.ink,
            lineHeight: 1.08,
            margin: '12px 0 10px',
          }}
        >
          {stopCount} stops.
          <br />
          One living city.
        </h1>
        <p style={{ fontSize: 16, color: T.muted, lineHeight: 1.65 }}>
          Walk the full route — from the Arena to the Appian Way. Narration unlocks as you arrive at each place.
        </p>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          scrollbarWidth: 'none',
          padding: '8px 24px 16px',
        }}
      >
        {loading ? (
          <p style={{ color: T.muted }}>Loading your route…</p>
        ) : (
          groups.map((group) => (
            <div key={group.act} style={{ marginBottom: 20 }}>
              <Eyebrow color={group.color} hairline>
                ACT {group.act} — {group.name}
              </Eyebrow>
              {group.stops.map((stop, i) => (
                <div
                  key={stop.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 0',
                    borderBottom: i < group.stops.length - 1 ? `1px solid ${T.muted}22` : 'none',
                  }}
                >
                  <span
                    style={{
                      width: 22,
                      fontSize: 12,
                      color: T.muted,
                      fontVariantNumeric: 'tabular-nums',
                      textAlign: 'right',
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </span>
                  {stop.photo ? (
                    <img
                      src={stop.photo}
                      alt=""
                      style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
                    />
                  ) : (
                    <div style={{ width: 44, height: 44, borderRadius: 8, background: `${group.color}18` }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 15, fontWeight: 500, color: T.ink, lineHeight: 1.25, marginBottom: 2 }}>
                      {stop.name}
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        color: T.muted,
                        lineHeight: 1.4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {stop.hook}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      <div
        style={{
          flexShrink: 0,
          padding: `16px 24px ${SHELL_TAB_BAR_INSET}`,
          borderTop: `1px solid ${T.muted}28`,
          background: T.bone,
        }}
      >
        <p style={{ fontSize: 13, color: T.muted, textAlign: 'center', marginBottom: 14, lineHeight: 1.5 }}>
          Tap once to wake sound — narration, ambience, and the city between stops.
        </p>
        <PrimaryButton onClick={onUnlock} disabled={busy}>
          {busy ? 'Starting audio…' : 'Begin your walk'}
        </PrimaryButton>
      </div>
    </div>
  )
}
