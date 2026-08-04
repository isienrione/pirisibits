import { memo } from 'react'
import { ChevronDown, Settings } from 'lucide-react'
import { ROME_ACTS } from '../../data/romePacing.js'
import {
  castelNow,
  colosseumNow,
  palatineNow,
  pantheonNow,
  capitolineNow,
  trajansNow,
} from '../../redesign/images.js'
import { T, F } from '../../redesign/tokens.js'
import { Eyebrow } from '../../redesign/ui/index.js'

const ACT_PHOTOS = {
  act1: colosseumNow,
  act2: palatineNow,
  act3: capitolineNow,
  act4: trajansNow,
  act5: pantheonNow,
  act6: castelNow,
}

const ACT_COLORS = {
  act1: T.actI,
  act2: T.actII,
  act3: T.actIII,
  act4: T.actIV,
  act5: T.actV,
  act6: T.actVI,
}

const DEMO_ACTS = ROME_ACTS.filter((act) => act.id !== 'encore').map((act) => ({
  id: act.id,
  numeral: act.numeral,
  name: act.title,
  promise: act.promise.replace(/[—–]/g, '-'),
  color: ACT_COLORS[act.id] ?? T.ember,
  photo: ACT_PHOTOS[act.id] ?? colosseumNow,
  status: act.id === 'act1' ? 'current' : 'ahead',
}))

const SEAM_X = 38
const NODE_R = 7

function ChronowalkMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="9.5" stroke={T.ember} strokeWidth="1.5" />
      <line x1="11" y1="1.5" x2="11" y2="20.5" stroke={T.ember} strokeWidth="1.5" />
      <line x1="11" y1="7" x2="18" y2="15" stroke={T.actV} strokeWidth="1" opacity="0.6" />
      <line x1="11" y1="7" x2="4" y2="15" stroke={T.actVI} strokeWidth="1" opacity="0.6" />
    </svg>
  )
}

/**
 * Static My Tour / begin-route phone for acquisition demos.
 * Mirrors the live tour home without journey hooks.
 */
export default memo(function LandingDemoBeginTourScreen() {
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
      <div
        style={{
          flexShrink: 0,
          padding: '48px 24px 12px',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ChronowalkMark />
            <span
              style={{
                fontSize: 11,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                fontWeight: 500,
                color: T.ink,
              }}
            >
              CHRONOWALK
            </span>
          </div>
          <span style={{ color: T.muted, lineHeight: 0, padding: 4 }} aria-hidden>
            <Settings size={18} />
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 4,
          }}
        >
          <h1
            style={{
              fontFamily: F.display,
              fontSize: 22,
              fontWeight: 300,
              color: T.ink,
              lineHeight: 1.15,
              margin: 0,
              letterSpacing: '0.02em',
            }}
          >
            Rome: Eternal City
          </h1>
          <span
            style={{
              fontSize: 11,
              color: T.muted,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '0.06em',
              flexShrink: 0,
            }}
          >
            0/21
          </span>
        </div>
        <Eyebrow color={T.actI} hairline>
          ROMA ETERNA
        </Eyebrow>
      </div>

      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            left: SEAM_X,
            top: 0,
            bottom: 0,
            width: 1.5,
            background: T.ember,
            boxShadow: '0 0 12px rgba(232,161,60,0.45)',
            zIndex: 0,
          }}
        />
        <div style={{ paddingBottom: 8 }}>
          {DEMO_ACTS.map((act) => (
            <div
              key={act.id}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                padding: `12px 16px 12px ${SEAM_X + NODE_R + 14}px`,
                gap: 12,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: SEAM_X - NODE_R,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: NODE_R * 2,
                  height: NODE_R * 2,
                  borderRadius: NODE_R,
                  zIndex: 2,
                  ...(act.status === 'current'
                    ? {
                        background: act.color,
                        boxShadow: `0 0 0 5px ${act.color}28, 0 0 14px ${act.color}70`,
                      }
                    : {
                        background: T.bone,
                        border: `1.5px solid ${T.ink800}`,
                      }),
                }}
              />
              <img
                src={act.photo}
                alt=""
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 10,
                  objectFit: 'cover',
                  flexShrink: 0,
                  filter: act.status === 'ahead' ? 'brightness(0.7) saturate(0.55)' : 'none',
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    fontSize: 10,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: act.status === 'ahead' ? `${act.color}70` : act.color,
                    fontWeight: 500,
                    display: 'block',
                    marginBottom: 2,
                  }}
                >
                  ACT {act.numeral}
                </span>
                <p
                  style={{
                    fontFamily: F.display,
                    fontSize: 18,
                    color: act.status === 'ahead' ? `${T.ink}85` : T.ink,
                    fontWeight: 300,
                    lineHeight: 1.1,
                    margin: '0 0 2px',
                  }}
                >
                  {act.name}
                </p>
                <p
                  style={{
                    fontSize: 12,
                    color: T.muted,
                    lineHeight: 1.35,
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {act.promise}
                </p>
              </div>
              <span style={{ color: T.muted, flexShrink: 0 }} aria-hidden>
                <ChevronDown size={16} />
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          flexShrink: 0,
          padding: '14px 20px 12px',
          background: `linear-gradient(to bottom, ${T.bone}00 0%, ${T.bone} 18%)`,
          borderTop: `1px solid ${T.ink800}18`,
          position: 'relative',
          zIndex: 5,
        }}
      >
        <div
          style={{
            width: '100%',
            padding: '14px',
            background: T.actI,
            color: T.warmWhite,
            borderRadius: 12,
            fontFamily: F.body,
            fontWeight: 600,
            fontSize: 14,
            textAlign: 'center',
            marginBottom: 12,
            boxShadow: `0 0 22px ${T.actI}50`,
          }}
        >
          Begin Act I - The Arena
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 28 }}>
          <span style={{ fontSize: 12, color: T.muted }}>Route</span>
          <span style={{ fontSize: 12, color: T.muted }}>Start from where I am</span>
        </div>
      </div>

      <div
        style={{
          flexShrink: 0,
          display: 'flex',
          borderTop: `1px solid ${T.ink800}22`,
          background: T.bone,
          paddingBottom: 28,
          paddingTop: 4,
          zIndex: 5,
        }}
      >
        {['WALK', 'TOUR', 'MAP', 'JOURNAL'].map((tab) => (
          <div
            key={tab}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              paddingTop: 8,
              fontSize: 9,
              letterSpacing: '0.12em',
              color: tab === 'TOUR' ? T.actI : T.muted,
            }}
          >
            {tab}
          </div>
        ))}
      </div>
    </div>
  )
})
