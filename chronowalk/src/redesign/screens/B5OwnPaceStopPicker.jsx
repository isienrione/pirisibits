import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { T, F, S, SCREEN_HEADER_PAD, SHELL_TAB_BAR_INSET } from '../tokens.js'
import { PrimaryButton, BackLink, CinematicImage } from '../ui/index.js'
import { buildOwnPacePickerActs } from '../../content/myTourPlan.js'
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

export default function B5OwnPaceStopPicker({
  manifest,
  context,
  selectedIds,
  onChangeSelected,
  onContinue,
  onBack,
  title = 'Choose your stops',
  subtitle = 'Tap the places you want on today’s walk.',
}) {
  const acts = useMemo(() => buildOwnPacePickerActs(manifest, context), [manifest, context])
  const selected = useMemo(() => new Set(selectedIds ?? []), [selectedIds])
  const [expandedActs, setExpandedActs] = useState(() => new Set(acts.map((act) => act.id)))

  const toggleStop = (stopId) => {
    const next = new Set(selected)
    if (next.has(stopId)) next.delete(stopId)
    else next.add(stopId)
    onChangeSelected?.([...next])
  }

  const toggleAct = (actId) => {
    setExpandedActs((prev) => {
      const next = new Set(prev)
      if (next.has(actId)) next.delete(actId)
      else next.add(actId)
      return next
    })
  }

  const toggleAllInAct = (act) => {
    const actStopIds = act.stops.map((stop) => stop.id)
    const allSelected = actStopIds.every((id) => selected.has(id))
    const next = new Set(selected)
    if (allSelected) {
      actStopIds.forEach((id) => next.delete(id))
    } else {
      actStopIds.forEach((id) => next.add(id))
    }
    onChangeSelected?.([...next])
  }

  const canContinue = selected.size > 0

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
      }}
    >
      <div style={{ padding: SCREEN_HEADER_PAD, flexShrink: 0 }}>
        {onBack ? (
          <BackLink onClick={onBack} showIcon={false} style={{ marginBottom: S.m }}>
            ← Back
          </BackLink>
        ) : null}
        <h1
          style={{
            fontFamily: F.display,
            fontSize: 30,
            fontWeight: 300,
            color: T.ink,
            lineHeight: 1.15,
            margin: `0 0 ${S.m}`,
          }}
        >
          {title}
        </h1>
        <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.55, margin: 0 }}>{subtitle}</p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', padding: `0 0 ${S.m}` }}>
        {acts.map((act) => {
          const color = ACT_COLOR[act.colorKey] ?? T.actI
          const expanded = expandedActs.has(act.id)
          const actLabel = act.numeral === 'Encore' ? 'ENCORE' : `ACT ${act.numeral}`

          return (
            <div key={act.id} style={{ borderTop: `1px solid ${T.ink800}18` }}>
              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: S.m,
                  padding: `${S.m} ${S.edge}`,
                }}
              >
                <button
                  type="button"
                  onClick={() => toggleAct(act.id)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: S.m,
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
                      letterSpacing: '0.18em',
                      color,
                      fontWeight: 600,
                      flex: 1,
                    }}
                  >
                    {actLabel} · {act.title}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleAllInAct(act)}
                  style={{
                    fontSize: 11,
                    color: T.muted,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: `4px ${S.s}`,
                  }}
                >
                  {act.stops.every((stop) => selected.has(stop.id)) ? 'Clear' : 'All'}
                </button>
                <button
                  type="button"
                  onClick={() => toggleAct(act.id)}
                  aria-label={expanded ? 'Collapse act' : 'Expand act'}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    color: T.muted,
                  }}
                >
                  {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {expanded
                ? act.stops.map((stop) => {
                    const checked = selected.has(stop.id)
                    const photo = photoForWaypoint(stop.waypoint)
                    return (
                      <button
                        key={stop.id}
                        type="button"
                        onClick={() => toggleStop(stop.id)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: S.m,
                          padding: `${S.m} ${S.edge} ${S.m} ${S.xl}`,
                          background: checked ? `${color}0c` : 'transparent',
                          border: 'none',
                          borderLeft: checked ? `2px solid ${color}` : '2px solid transparent',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 6,
                            border: `1.5px solid ${checked ? color : T.ink800}`,
                            background: checked ? color : T.bone,
                            flexShrink: 0,
                            display: 'grid',
                            placeItems: 'center',
                          }}
                        >
                          {checked ? (
                            <span style={{ color: T.warmWhite, fontSize: 12, lineHeight: 1 }}>✓</span>
                          ) : null}
                        </div>
                        {photo ? (
                          <CinematicImage
                            src={photo}
                            alt=""
                            width={44}
                            height={44}
                            radius="sm"
                            grade="film"
                            overlay="soft"
                            position="upper"
                            shadow="still"
                          />
                        ) : null}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 15, fontWeight: 500, color: T.ink, lineHeight: 1.25 }}>
                            {titleForWaypoint(stop.waypoint)}
                          </p>
                          {stop.hook ? (
                            <p
                              style={{
                                margin: `${S.s} 0 0`,
                                fontSize: 12,
                                color: T.muted,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {stop.hook}
                            </p>
                          ) : null}
                        </div>
                      </button>
                    )
                  })
                : null}
            </div>
          )
        })}
      </div>

      <div
        style={{
          flexShrink: 0,
          padding: `${S.l} ${S.edge} ${SHELL_TAB_BAR_INSET}`,
          borderTop: `1px solid ${T.ink800}18`,
          background: T.bone,
        }}
      >
        <PrimaryButton
          color={canContinue ? T.ember : T.ink800}
          textColor={canContinue ? T.obsidian : T.muted}
          disabled={!canContinue}
          glow={false}
          onClick={onContinue}
          style={{ cursor: canContinue ? 'pointer' : 'default', opacity: 1 }}
        >
          {canContinue
            ? `Continue · ${selected.size} stop${selected.size === 1 ? '' : 's'}`
            : 'Select at least one stop'}
        </PrimaryButton>
      </div>
    </div>
  )
}
