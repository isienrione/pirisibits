import { useNavigate } from 'react-router-dom'
import { Settings, Navigation } from 'lucide-react'
import { T, F, SHELL_TAB_BAR_INSET } from '../tokens.js'
import { pantheonNow } from '../images.js'
import { Eyebrow } from '../ui/index.js'
import { LOCATION_STATUS } from '../../hooks/useGeoLocation.js'
import {
  formatDistanceToNext,
  formatWalkingTime,
  sanitizeWalkDistanceM,
} from '../../content/journeyProgress.js'

/** Baked into this chunk — must bump when layout changes (see walkingUiRevision.js). */
export const WALKING_UI_REVISION = 6

const WALK_BG = T.obsidian
const WALK_INK = T.bone
const WALK_MUTED = `${T.bone}88`
const WALK_GLASS = 'rgba(22,19,15,0.78)'

function GpsChip({ locationStatus = LOCATION_STATUS.WAITING, accent = T.actI, dark = false }) {
  const waiting = locationStatus === LOCATION_STATUS.WAITING
  const denied =
    locationStatus === LOCATION_STATUS.DENIED ||
    locationStatus === LOCATION_STATUS.UNAVAILABLE
  const granted = locationStatus === LOCATION_STATUS.GRANTED

  const label = waiting ? 'Locating…' : denied ? 'Location off' : 'GPS live'
  const dotColor = waiting ? T.ember : denied ? T.muted : accent

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div
        style={{
          width: 7,
          height: 7,
          borderRadius: 3.5,
          background: dotColor,
          animation: waiting || granted ? 'presencePulse 2.5s ease-in-out infinite' : undefined,
        }}
      />
      <span
        style={{
          fontSize: 11,
          color: dark ? WALK_INK : T.ink,
          letterSpacing: '0.06em',
        }}
      >
        {label}
      </span>
    </div>
  )
}

function CompassDial({
  bearingDeg = null,
  bearingIsLive = false,
  accent = T.actI,
}) {
  const hasBearing = bearingDeg != null && Number.isFinite(bearingDeg)

  return (
    <div style={{ width: 152, height: 152, margin: '0 auto', position: 'relative' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: `1px solid ${accent}35`,
          background: `radial-gradient(circle at 50% 42%, ${T.ink800} 0%, ${WALK_BG} 74%)`,
          boxShadow: `inset 0 0 0 1px ${accent}18`,
        }}
      />
      {['N', 'E', 'S', 'W'].map((label, index) => {
        const angle = index * 90
        const rad = ((angle - 90) * Math.PI) / 180
        const x = 76 + Math.cos(rad) * 62
        const y = 76 + Math.sin(rad) * 62
        return (
          <span
            key={label}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              transform: 'translate(-50%, -50%)',
              fontSize: 10,
              letterSpacing: '0.08em',
              color: label === 'N' ? accent : `${WALK_MUTED}`,
              fontWeight: label === 'N' ? 700 : 500,
            }}
          >
            {label}
          </span>
        )
      })}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          transform: hasBearing ? `rotate(${bearingDeg}deg)` : undefined,
          transition: 'transform 600ms ease',
        }}
      >
        <Navigation
          size={38}
          color={accent}
          fill={`${accent}22`}
          strokeWidth={1.6}
          style={{ transform: 'translateY(-5px)' }}
        />
      </div>
      <p
        style={{
          position: 'absolute',
          bottom: 14,
          left: 0,
          right: 0,
          textAlign: 'center',
          margin: 0,
          fontSize: 10,
          color: WALK_MUTED,
          letterSpacing: '0.04em',
        }}
      >
        {!hasBearing
          ? 'Finding direction…'
          : bearingIsLive
            ? 'Live heading'
            : 'Route heading'}
      </p>
    </div>
  )
}

function resolveDistanceCopy(distanceM, estimatedDistanceM) {
  const liveDistanceM = sanitizeWalkDistanceM(distanceM)

  if (liveDistanceM != null) {
    return {
      primary: formatDistanceToNext(liveDistanceM),
      secondary: formatWalkingTime(liveDistanceM),
      estimated: false,
      pending: false,
    }
  }

  if (estimatedDistanceM != null) {
    return {
      primary: formatDistanceToNext(estimatedDistanceM),
      secondary: formatWalkingTime(estimatedDistanceM),
      estimated: true,
      pending: false,
    }
  }

  return {
    primary: 'Finding your position…',
    secondary: null,
    estimated: false,
    pending: true,
  }
}

export default function C2Walking({
  accent = T.actI,
  title = 'The Pantheon',
  photo = pantheonNow,
  direction = 'Follow the route — Rome will guide you between stops.',
  signatureLine = null,
  actNumeral = 'I',
  distanceM = null,
  estimatedDistanceM = null,
  bearingDeg = null,
  bearingIsLive = false,
  progressPct = 35,
  locationStatus = LOCATION_STATUS.WAITING,
  onRetryLocation,
  embedded = false,
  onSimulateArrival,
  locationShy = false,
  extraBottomInset = 0,
  onPause,
  onOpenSettings,
  onContinue,
  continueLabel = 'Continue',
  companionLine = null,
  map = null,
  insideGeofence = false,
}) {
  const navigate = useNavigate()
  const distanceCopy = resolveDistanceCopy(distanceM, estimatedDistanceM)
  const showLocationHelp =
    locationStatus === LOCATION_STATUS.DENIED ||
    locationStatus === LOCATION_STATUS.UNAVAILABLE

  return (
    <div
      className="cw-grain cw-walking-dark"
      data-walking-ui-rev={WALKING_UI_REVISION}
      style={{
        background: WALK_BG,
        height: '100%',
        fontFamily: F.body,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        color: WALK_INK,
      }}
    >
      <div
        style={{
          height: 3,
          background: `${T.muted}18`,
          flexShrink: 0,
          position: 'relative',
          zIndex: 2,
        }}
      >
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

      <div
        style={{
          flexShrink: 0,
          height: 112,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <img
          src={photo}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 35%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(to top, ${WALK_BG} 4%, transparent 42%, rgba(0,0,0,0.35) 100%)`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 'max(8px, calc(env(safe-area-inset-top) + 4px))',
            left: 16,
            right: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <button
            type="button"
            onClick={onOpenSettings ?? (() => navigate('/settings'))}
            aria-label="Settings"
            style={{
              background: WALK_GLASS,
              border: `1px solid ${T.muted}22`,
              borderRadius: 20,
              width: 36,
              height: 36,
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
              color: `${WALK_INK}cc`,
              backdropFilter: 'blur(8px)',
            }}
          >
            <Settings size={18} />
          </button>
          <div
            style={{
              background: WALK_GLASS,
              border: `1px solid ${T.muted}22`,
              borderRadius: 20,
              padding: '5px 10px',
              backdropFilter: 'blur(8px)',
            }}
          >
            <GpsChip locationStatus={locationStatus} accent={accent} dark />
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            left: 16,
            bottom: 10,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: 10,
              letterSpacing: '0.14em',
              color: accent,
              fontWeight: 700,
            }}
          >
            ACT {actNumeral}
          </span>
          <span style={{ fontSize: 11, color: `${WALK_INK}bb`, letterSpacing: '0.04em' }}>
            Next stop ahead
          </span>
        </div>
      </div>

      <div
        style={{
          flexShrink: 0,
          marginTop: -28,
          position: 'relative',
          zIndex: 2,
          padding: '0 20px',
        }}
      >
        <CompassDial
          bearingDeg={bearingDeg}
          bearingIsLive={bearingIsLive}
          accent={accent}
        />
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          padding: '4px 20px 0',
          overflowY: 'auto',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <img
            src={photo}
            alt=""
            style={{
              width: 48,
              height: 48,
              borderRadius: 10,
              objectFit: 'cover',
              flexShrink: 0,
              boxShadow: `0 0 0 1px ${accent}33`,
            }}
          />
          <div style={{ minWidth: 0 }}>
            <Eyebrow color={accent}>WALKING TO</Eyebrow>
            <h1
              style={{
                fontFamily: F.display,
                fontSize: 30,
                color: WALK_INK,
                fontWeight: 300,
                lineHeight: 1.08,
                margin: '4px 0 0',
              }}
            >
              {title}
            </h1>
            {signatureLine ? (
              <p
                style={{
                  margin: '5px 0 0',
                  fontSize: 13,
                  color: `${WALK_INK}77`,
                  lineHeight: 1.45,
                  fontStyle: 'italic',
                }}
              >
                {signatureLine}
              </p>
            ) : null}
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <span
            style={{
              color: distanceCopy.pending ? WALK_MUTED : accent,
              fontSize: distanceCopy.pending ? 14 : 16,
              fontWeight: distanceCopy.pending ? 500 : 600,
              fontVariantNumeric: 'tabular-nums',
              fontStyle: distanceCopy.pending ? 'italic' : 'normal',
            }}
          >
            {distanceCopy.primary}
          </span>
          {distanceCopy.secondary ? (
            <span style={{ color: `${WALK_INK}66`, fontSize: 13 }}>
              {' '}
              · {distanceCopy.secondary}
              {distanceCopy.estimated ? ' · estimated' : ''}
            </span>
          ) : null}
        </div>

        {showLocationHelp ? (
          <div
            style={{
              marginBottom: 14,
              padding: '10px 12px',
              borderRadius: 10,
              background: `${T.muted}12`,
              border: `1px solid ${T.muted}24`,
            }}
          >
            <p style={{ margin: 0, fontSize: 13, color: WALK_MUTED, lineHeight: 1.55 }}>
              Location is off — distance and live compass need GPS. You can still follow the route
              on the map, or tap “I&apos;m here” when you arrive.
            </p>
            {onRetryLocation ? (
              <button
                type="button"
                onClick={onRetryLocation}
                style={{
                  marginTop: 8,
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: accent,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Try location again
              </button>
            ) : null}
          </div>
        ) : null}

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
          <div
            style={{
              width: 1.5,
              minHeight: 44,
              alignSelf: 'stretch',
              background: `${accent}45`,
              flexShrink: 0,
            }}
          />
          <p style={{ fontSize: 15, color: WALK_INK, lineHeight: 1.65, opacity: 0.78, margin: 0 }}>
            {direction}
          </p>
        </div>

        <p
          style={{
            fontSize: 13,
            color: WALK_MUTED,
            lineHeight: 1.65,
            fontStyle: 'italic',
            margin: '0 0 16px',
          }}
        >
          {companionLine ?? 'Still with you. No rush — Rome has waited this long.'}
        </p>

        {map ? (
          <div
            style={{
              marginBottom: 10,
              borderRadius: 12,
              overflow: 'hidden',
              border: `1px solid ${T.muted}22`,
              height: 132,
              position: 'relative',
              background: T.ink800,
            }}
          >
            {map}
            {!embedded ? (
              <button
                type="button"
                onClick={() => navigate('/map')}
                aria-label="Open full map"
                style={{
                  position: 'absolute',
                  right: 10,
                  bottom: 10,
                  background: WALK_GLASS,
                  border: `1px solid ${T.muted}28`,
                  borderRadius: 8,
                  padding: '6px 10px',
                  cursor: 'pointer',
                  color: WALK_INK,
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  backdropFilter: 'blur(8px)',
                }}
              >
                Full map
              </button>
            ) : null}
          </div>
        ) : !embedded ? (
          <button
            type="button"
            onClick={() => navigate('/map')}
            style={{
              background: `${T.muted}14`,
              border: `1px solid ${T.muted}28`,
              borderRadius: 10,
              padding: '10px 14px',
              cursor: 'pointer',
              color: WALK_INK,
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '0.04em',
              width: '100%',
            }}
          >
            Open full map
          </button>
        ) : null}
      </div>

      <div
        style={{
          padding: `12px 20px calc(${SHELL_TAB_BAR_INSET} + ${extraBottomInset}px)`,
          flexShrink: 0,
          position: 'relative',
          zIndex: 12,
          borderTop: `1px solid ${T.muted}18`,
          background: WALK_BG,
        }}
      >
        {onSimulateArrival && (insideGeofence || locationShy) ? (
          <button
            type="button"
            data-testid="manual-arrive"
            onClick={onSimulateArrival}
            style={{
              width: '100%',
              marginBottom: 12,
              background: 'transparent',
              border: `1px solid ${accent}`,
              borderRadius: 12,
              padding: '12px 22px',
              cursor: 'pointer',
              color: accent,
              fontFamily: F.body,
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: '0.04em',
            }}
          >
            I&apos;m here
          </button>
        ) : null}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {onPause ? (
            <button
              type="button"
              onClick={onPause}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: WALK_MUTED,
                fontSize: 13,
                padding: 0,
              }}
            >
              ‖ Pause walk
            </button>
          ) : null}
          {onContinue ? (
            <button
              type="button"
              onClick={onContinue}
              style={{
                background: T.ember,
                border: 'none',
                borderRadius: 10,
                padding: '10px 16px',
                cursor: 'pointer',
                color: T.obsidian,
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              {continueLabel}
            </button>
          ) : null}
          {onSimulateArrival && !(insideGeofence || locationShy) ? (
            <button
              type="button"
              data-testid="manual-arrive"
              onClick={onSimulateArrival}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: accent,
                fontSize: 13,
                padding: 0,
                marginLeft: 'auto',
                fontWeight: 600,
              }}
            >
              I&apos;m here
            </button>
          ) : null}
        </div>
        {onSimulateArrival && locationShy ? (
          <p
            style={{
              margin: '10px 0 0',
              fontSize: 12,
              color: WALK_MUTED,
              lineHeight: 1.5,
              fontStyle: 'italic',
            }}
          >
            The satellites are being shy. Tap “I&apos;m here” when you reach it.
          </p>
        ) : null}
      </div>
    </div>
  )
}
