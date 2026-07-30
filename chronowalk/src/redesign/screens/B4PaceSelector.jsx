import { useContext, useMemo, useState } from 'react'
import { T, F } from '../tokens.js'
import {
  colosseumNow,
  capitolineNow,
  pantheonNow,
  trajansNow,
} from '../images.js'
import { RedesignNavCtx } from '../nav.js'
import { Eyebrow } from '../ui/index.js'
import { ACT_DOT_KEYS } from '../../data/romePacing.js'

const PACE_IMAGES = {
  pantheon: pantheonNow,
  colosseum: colosseumNow,
  capitoline: capitolineNow,
  trajan: trajansNow,
}

const ACT_DOT_COLORS = {
  act1: T.actI,
  act2: T.actII,
  act3: T.actIII,
  act4: T.actIV,
  act5: T.actV,
  act6: T.actVI,
  encore: T.encore,
}

function resolveDots(actDots = []) {
  return ACT_DOT_KEYS.map((key, index) => {
    const actId = actDots[index] ?? null
    return actId ? ACT_DOT_COLORS[actId] ?? T.ink800 : null
  })
}

export default function B4PaceSelector({
  options: optionsProp,
  selectedPace,
  onSelectPace,
  onContinue,
  showPrices = true,
  eyebrow = 'BEFORE YOU BEGIN',
  title = (
    <>
      Choose your
      <br />
      Rome.
    </>
  ),
  subtitle = null,
  footerNote = 'You can change your mind at any time. Nothing expires. Nothing is skipped forever.',
}) {
  const { navigate } = useContext(RedesignNavCtx)
  const [selected, setSelected] = useState(null)

  const options = useMemo(
    () =>
      (optionsProp ?? []).map((opt) => ({
        id: opt.id,
        title: opt.title,
        badge: opt.badge ?? null,
        desc: opt.description,
        included: opt.includedSummary ?? null,
        priceLabel: opt.priceLabel ?? null,
        img: PACE_IMAGES[opt.imageKey] ?? colosseumNow,
        dots: resolveDots(opt.actDots),
      })),
    [optionsProp],
  )

  const activeIndex =
    selectedPace != null ? options.findIndex((opt) => opt.id === selectedPace) : selected

  const handleSelect = (index) => {
    setSelected(index)
    onSelectPace?.(options[index].id)
  }

  const handleContinue = () => {
    if (activeIndex == null || activeIndex < 0) return
    if (onContinue) {
      onContinue()
      return
    }
    navigate('C2')
  }

  return (
    <div
      style={{
        background: T.obsidian,
        height: '100%',
        fontFamily: F.body,
        display: 'flex',
        flexDirection: 'column',
        padding: '48px 24px 32px',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${pantheonNow})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 40%',
          filter: 'brightness(0.12) saturate(0.4)',
          zIndex: 0,
        }}
      />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(11,11,13,0.7)', zIndex: 1 }} />

      <div
        style={{
          position: 'relative',
          zIndex: 5,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minHeight: 0,
        }}
      >
        <div style={{ height: 32, position: 'relative', marginBottom: 16, flexShrink: 0 }}>
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: 0,
              bottom: 0,
              width: 1.5,
              background: T.ember,
              opacity: 0.7,
              boxShadow: '0 0 12px rgba(232,161,60,0.45)',
            }}
          />
        </div>

        <Eyebrow color={T.ember}>{eyebrow}</Eyebrow>
        <h2
          style={{
            fontFamily: F.display,
            fontSize: 40,
            color: T.warmWhite,
            fontWeight: 300,
            lineHeight: 1.05,
            margin: '10px 0 10px',
            flexShrink: 0,
          }}
        >
          {title}
        </h2>
        {subtitle ? (
          <p
            style={{
              margin: '0 0 14px',
              fontSize: 13,
              lineHeight: 1.55,
              color: T.muted,
              flexShrink: 0,
              maxWidth: 360,
            }}
          >
            {subtitle}
          </p>
        ) : null}

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            paddingBottom: 4,
          }}
        >
          {options.map((opt, i) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleSelect(i)}
              style={{
                textAlign: 'left',
                background: T.ink,
                border: `1.5px solid ${activeIndex === i ? T.ember : T.ink800}`,
                borderRadius: 14,
                cursor: 'pointer',
                transition: 'border-color 300ms',
                flexShrink: 0,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: activeIndex === i ? '0 0 20px rgba(232,161,60,0.15)' : 'none',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: 72,
                  overflow: 'hidden',
                  flexShrink: 0,
                  position: 'relative',
                }}
              >
                <img
                  src={opt.img}
                  alt={opt.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center 40%',
                    filter: `brightness(${activeIndex === i ? 0.7 : 0.55})`,
                    transition: 'filter 300ms',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to right, rgba(33,28,21,0.82) 0%, transparent 70%)',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'flex-end',
                    padding: '0 14px 10px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-end',
                      justifyContent: 'space-between',
                      width: '100%',
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: F.display,
                        fontSize: 20,
                        color: T.warmWhite,
                        fontWeight: 400,
                        lineHeight: 1.1,
                      }}
                    >
                      {opt.title}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      {showPrices && opt.priceLabel ? (
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: T.ember,
                            letterSpacing: '0.02em',
                          }}
                        >
                          {opt.priceLabel}
                        </span>
                      ) : null}
                      {opt.badge ? (
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 600,
                            color: T.bone,
                            background: T.gold,
                            borderRadius: 6,
                            padding: '3px 8px',
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                          }}
                        >
                          {opt.badge}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ padding: '10px 14px 12px' }}>
                <p style={{ fontSize: 12, color: T.muted, lineHeight: 1.6, marginBottom: 6 }}>
                  {opt.desc}
                </p>
                {opt.included ? (
                  <p
                    style={{
                      fontSize: 11,
                      color: `${T.warmWhite}99`,
                      lineHeight: 1.5,
                      marginBottom: 10,
                      letterSpacing: '0.01em',
                    }}
                  >
                    {opt.included}
                  </p>
                ) : null}
                <div style={{ display: 'flex', gap: 6 }}>
                  {opt.dots.map((color, di) => (
                    <div
                      key={di}
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        background: color ?? T.ink800,
                        opacity: color ? 1 : 0.35,
                      }}
                    />
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>

        {footerNote ? (
          <p
            style={{
              fontSize: 13,
              color: T.muted,
              lineHeight: 1.7,
              textAlign: 'center',
              margin: '14px 0 10px',
              flexShrink: 0,
            }}
          >
            {footerNote}
          </p>
        ) : null}

        <button
          type="button"
          onClick={handleContinue}
          style={{
            width: '100%',
            padding: '15px',
            background: activeIndex != null && activeIndex >= 0 ? T.terracotta : T.ink800,
            color: activeIndex != null && activeIndex >= 0 ? T.obsidian : T.muted,
            borderRadius: 12,
            fontFamily: F.body,
            fontWeight: 600,
            fontSize: 15,
            border: 'none',
            cursor: activeIndex != null && activeIndex >= 0 ? 'pointer' : 'default',
            transition: 'background 300ms, color 300ms',
            flexShrink: 0,
            boxShadow: activeIndex != null && activeIndex >= 0 ? '0 0 20px rgba(232,161,60,0.35)' : 'none',
          }}
        >
          {activeIndex != null && activeIndex >= 0
            ? `Begin — ${options[activeIndex].title}`
            : 'Select a tour'}
        </button>
      </div>
    </div>
  )
}
