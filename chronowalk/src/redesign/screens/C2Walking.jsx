import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings } from 'lucide-react'
import { T, F } from '../tokens.js'
import { pantheonNow } from '../images.js'
import { Eyebrow } from '../ui/index.js'
import { formatDistanceToNext, formatWalkingTime } from '../../content/journeyProgress.js'

export default function C2Walking({
  accent = T.actI,
  title = 'The Pantheon',
  photo = pantheonNow,
  distanceM = null,
  direction = 'Follow the route — Rome will guide you between stops.',
  progressPct = 35,
  embedded = false,
  onSimulateArrival,
  onPause,
  onOpenSettings,
  onContinue,
  continueLabel = 'Continue',
}) {
  const navigate = useNavigate()
  const [mapView, setMapView] = useState(false)
  const distanceLabel = formatDistanceToNext(distanceM)
  const walkTime = formatWalkingTime(distanceM)

  return (
    <div
      className="cw-grain"
      style={{
        background: T.bone,
        height: '100%',
        fontFamily: F.body,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      <div style={{ height: 3, background: `${T.muted}28`, flexShrink: 0, position: 'relative', zIndex: 2 }}>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: `${progressPct}%`,
            background: accent,
            boxShadow: `0 0 8px ${accent}80`,
          }}
        />
      </div>

      <div style={{ width: '100%', height: 200, flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
        <img src={photo} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%' }} />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '55%',
            background: `linear-gradient(to top, ${T.bone} 0%, transparent 100%)`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 'max(52px, calc(env(safe-area-inset-top) + 12px))',
            right: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(247,241,230,0.9)',
            borderRadius: 20,
            padding: '5px 10px',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: 3.5,
              background: accent,
              animation: 'presencePulse 2.5s ease-in-out infinite',
            }}
          />
          <span style={{ fontSize: 11, color: T.ink, letterSpacing: '0.06em' }}>GPS</span>
        </div>
        <button
          type="button"
          onClick={onOpenSettings ?? (() => navigate('/settings'))}
          style={{
            position: 'absolute',
            top: 'max(52px, calc(env(safe-area-inset-top) + 12px))',
            left: 16,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: `${T.ink}80`,
          }}
        >
          <Settings size={20} />
        </button>
      </div>

      <div style={{ flex: 1, padding: '4px 20px 0', position: 'relative', zIndex: 2, overflowY: 'auto' }}>
        <Eyebrow color={accent} hairline>
          WALKING TO
        </Eyebrow>
        <h1 style={{ fontFamily: F.display, fontSize: 40, color: T.ink, fontWeight: 300, lineHeight: 1.05, margin: '10px 0 4px' }}>
          {title}
        </h1>
        {distanceLabel ? (
          <div style={{ marginBottom: 18 }}>
            <span style={{ color: accent, fontSize: 16, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
              {distanceLabel}
            </span>
            {walkTime ? <span style={{ color: `${T.ink}55`, fontSize: 13 }}> · {walkTime}</span> : null}
          </div>
        ) : null}

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 18 }}>
          <div style={{ width: 1.5, height: 44, background: `${accent}45`, flexShrink: 0, marginTop: 3 }} />
          <p style={{ fontSize: 15, color: T.ink, lineHeight: 1.65, opacity: 0.72 }}>{direction}</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div
            style={{
              width: 9,
              height: 9,
              borderRadius: 4.5,
              background: accent,
              flexShrink: 0,
              boxShadow: `0 0 0 4px ${accent}22`,
              animation: 'presencePulse 3s ease-in-out infinite',
            }}
          />
          <span style={{ fontSize: 11, color: T.muted, letterSpacing: '0.05em' }}>♪ antiquity · whisper</span>
        </div>

        <div style={{ display: 'flex', background: `${T.muted}22`, borderRadius: 10, padding: 3, marginBottom: 12 }}>
          {['GUIDE', 'MAP'].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => {
                if (v === 'MAP') {
                  navigate('/map')
                  return
                }
                setMapView(false)
              }}
              style={{
                flex: 1,
                padding: '8px 0',
                textAlign: 'center',
                fontSize: 11,
                letterSpacing: '0.14em',
                fontFamily: F.body,
                color: (mapView ? 'MAP' : 'GUIDE') === v ? T.ink : T.muted,
                background: (mapView ? 'MAP' : 'GUIDE') === v ? T.warmWhite : 'transparent',
                borderRadius: 8,
                fontWeight: (mapView ? 'MAP' : 'GUIDE') === v ? 600 : 400,
                transition: 'all 200ms',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {v}
            </button>
          ))}
        </div>

        <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.65, fontStyle: 'italic' }}>
          Still with you. No rush — Rome has waited this long.
        </p>
      </div>

      <div style={{ padding: '12px 20px max(8px, env(safe-area-inset-bottom))', flexShrink: 0, position: 'relative', zIndex: 2, display: 'flex', gap: 16 }}>
        {onPause ? (
          <button type="button" onClick={onPause} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontSize: 13, padding: 0 }}>
            ‖ Pause walk
          </button>
        ) : null}
        {onContinue ? (
          <button type="button" onClick={onContinue} style={{ background: T.ember, border: 'none', borderRadius: 10, padding: '10px 16px', cursor: 'pointer', color: T.obsidian, fontWeight: 600, fontSize: 13 }}>
            {continueLabel}
          </button>
        ) : null}
        {onSimulateArrival ? (
          <button type="button" onClick={onSimulateArrival} style={{ background: 'none', border: 'none', cursor: 'pointer', color: accent, fontSize: 13, padding: 0 }}>
            I&apos;ve arrived
          </button>
        ) : null}
      </div>
    </div>
  )
}
