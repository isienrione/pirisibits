import { useState, useEffect } from 'react'
import { Play, ChevronRight } from 'lucide-react'
import { T, F, ICON, S } from '../tokens.js'
import { colosseumNow, pantheonNow, spanishSteps, THEN_colosseum } from '../images.js'
import { loadRomeManifest } from '../../content/manifest.js'
import { getRedesignHeroTrustStats } from '../../content/tourProductTruth.js'
import { Vignette, BottomScrim, Eyebrow, Seam, PrimaryButton, GhostButton } from '../ui/index.js'

const HERO_TRUST_STATS = getRedesignHeroTrustStats(loadRomeManifest())

export default function A1LandingHero({ priceLabel = '€17', onPurchase, onPreview, onPreviewStory }) {
  const [demoState, setDemoState] = useState('now')

  useEffect(() => {
    const cycle = () => {
      setDemoState('then')
      setTimeout(() => setDemoState('now'), 2800)
    }
    const t1 = setTimeout(cycle, 2400)
    const iv = setInterval(cycle, 6400)
    return () => {
      clearTimeout(t1)
      clearInterval(iv)
    }
  }, [])

  return (
    <div
      style={{
        height: '100%',
        overflowY: 'auto',
        scrollbarWidth: 'none',
        fontFamily: F.body,
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          backgroundImage: `url(${spanishSteps})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 30%',
          filter: 'brightness(0.45)',
          zIndex: 0,
        }}
      />
      <Vignette />
      <BottomScrim strength={0.96} />

      <div style={{ position: 'relative', zIndex: 10 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'max(52px, calc(env(safe-area-inset-top) + 16px)) 24px 0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
              <circle cx="11" cy="11" r="9.5" stroke={T.ember} strokeWidth="1.5" />
              <line x1="11" y1="1.5" x2="11" y2="20.5" stroke={T.ember} strokeWidth="1.5" />
              <line x1="11" y1="7" x2="18" y2="15" stroke={T.actV} strokeWidth="1" opacity="0.6" />
              <line x1="11" y1="7" x2="4" y2="15" stroke={T.actVI} strokeWidth="1" opacity="0.6" />
            </svg>
            <span
              style={{
                fontSize: 12,
                color: T.warmWhite,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
              }}
            >
              CHRONOWALK
            </span>
          </div>
          <span
            style={{
              fontSize: 10,
              color: T.muted,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}
          >
            ROME
          </span>
        </div>

        <div style={{ padding: '64px 24px 32px' }}>
          <h1
            style={{
              fontFamily: F.display,
              fontSize: 52,
              fontWeight: 300,
              color: T.warmWhite,
              lineHeight: 1.05,
              marginBottom: 16,
              textShadow: '0 2px 24px rgba(0,0,0,0.5)',
            }}
          >
            Walk through
            <br />
            time.
          </h1>
          <p style={{ fontSize: 16, color: `${T.warmWhite}CC`, lineHeight: 1.65 }}>
            Rome, narrated like a film —
            <br />
            revealed by your touch.
          </p>
        </div>

        <div
          style={{
            margin: '0 24px 32px',
            borderRadius: 14,
            overflow: 'hidden',
            height: 200,
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${colosseumNow})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              transition: 'opacity var(--d-rise, 480ms) var(--ease-exit, cubic-bezier(0.22, 1, 0.36, 1))',
              opacity: demoState === 'now' ? 1 : 0,
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${THEN_colosseum})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'sepia(65%) contrast(0.82) brightness(0.75)',
              transition: 'opacity var(--d-rise, 480ms) var(--ease-exit, cubic-bezier(0.22, 1, 0.36, 1))',
              opacity: demoState === 'then' ? 1 : 0,
            }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(11,11,13,0.22)' }} />
          <Seam />
          <div
            style={{
              position: 'absolute',
              bottom: 10,
              left: 12,
              fontSize: 9,
              color: T.bone,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              zIndex: 5,
            }}
          >
            {demoState === 'now' ? 'TODAY' : 'c. 80 AD'}
          </div>
        </div>

        <div style={{ padding: `0 ${S.edge} ${S.l}`, display: 'flex', flexDirection: 'column', gap: S.m }}>
          <PrimaryButton
            onClick={onPurchase}
            color={T.gold}
            textColor={T.obsidian}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <span>Get ChronoWalk Rome — {priceLabel}</span>
            <ChevronRight size={ICON.md} strokeWidth={ICON.stroke} aria-hidden />
          </PrimaryButton>
          <GhostButton onClick={onPreview}>Try the free story</GhostButton>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 24,
            padding: '0 24px 36px',
          }}
        >
          {HERO_TRUST_STATS.map((v) => (
            <div key={v} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 4, height: 4, borderRadius: 2, background: T.ember }} />
              <span style={{ fontSize: 12, color: `${T.warmWhite}99` }}>{v}</span>
            </div>
          ))}
        </div>

        <div
          style={{
            margin: '0 24px max(32px, calc(env(safe-area-inset-bottom) + 16px))',
            background: 'rgba(33,28,21,0.75)',
            borderRadius: 14,
            padding: 16,
            backdropFilter: 'blur(12px)',
            border: `1px solid ${T.ink800}`,
          }}
        >
          <Eyebrow color={T.actIII}>FREE PREVIEW</Eyebrow>
          <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
            <div style={{ flex: 1 }}>
              <p
                style={{
                  fontFamily: F.display,
                  fontSize: 22,
                  color: T.warmWhite,
                  lineHeight: 1.2,
                  marginBottom: 6,
                }}
              >
                Hear the Pantheon
              </p>
              <p style={{ fontSize: 12, color: T.muted, lineHeight: 1.6 }}>
                Free preview · 4 minutes
              </p>
            </div>
            <div style={{ width: 76, height: 76, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
              <img
                src={pantheonNow}
                alt="Pantheon"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={onPreviewStory ?? onPreview}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 12,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                background: T.ember,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Play size={14} fill={T.obsidian} color={T.obsidian} style={{ marginLeft: 2 }} />
            </div>
            <span style={{ fontFamily: F.body, fontSize: 13, color: T.ember, fontWeight: 500 }}>
              Preview story
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
