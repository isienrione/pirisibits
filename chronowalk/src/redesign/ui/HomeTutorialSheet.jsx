import { useMemo, useState } from 'react'
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Ear,
  Footprints,
  MapPinned,
  Settings,
  Sparkles,
  X,
} from 'lucide-react'
import { T, F } from '../tokens.js'
import { useT } from '../../i18n/I18nProvider.jsx'
import { ONBOARDING_CARD_PHASES } from '../../utils/tourOnboarding.js'
import HomeTutorialCue from './HomeTutorialCue.jsx'

/** Home-only tutorial order: walk coaching plus a settings tip (not used on-route). */
export const HOME_TUTORIAL_PHASES = [...ONBOARDING_CARD_PHASES, 'settings']

const PHASE_META = {
  walk: { accent: T.actIV, Icon: Footprints },
  arrive: { accent: T.actIII, Icon: MapPinned },
  listen: { accent: T.actVI, Icon: Ear },
  transcript: { accent: T.encore, Icon: BookOpen },
  continue: { accent: T.actII, Icon: ChevronRight },
  reveal: { accent: T.actV, Icon: Sparkles },
  settings: { accent: T.bronze, Icon: Settings },
}

/**
 * Full-screen step-by-step walk guide with mini cues of the real controls.
 */
export default function HomeTutorialSheet({ open, onClose }) {
  const t = useT()
  const phases = HOME_TUTORIAL_PHASES
  const [index, setIndex] = useState(0)

  const phase = phases[Math.min(index, phases.length - 1)]
  const meta = PHASE_META[phase] ?? PHASE_META.walk
  const { Icon, accent } = meta

  const copy = useMemo(() => {
    const key = `home.tutorial.${phase}`
    return {
      eyebrow: t(`${key}.eyebrow`),
      title: t(`${key}.title`),
      body: t(`${key}.body`),
    }
  }, [phase, t])

  if (!open) return null

  const isFirst = index <= 0
  const isLast = index >= phases.length - 1

  const goNext = () => {
    if (isLast) {
      setIndex(0)
      onClose()
      return
    }
    setIndex((value) => value + 1)
  }

  const goBack = () => {
    if (isFirst) return
    setIndex((value) => value - 1)
  }

  const handleClose = () => {
    setIndex(0)
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="home-tutorial-title"
      data-testid="home-tutorial"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 210,
        display: 'flex',
        flexDirection: 'column',
        background: `
          radial-gradient(90% 60% at 100% 0%, ${accent}33 0%, transparent 55%),
          radial-gradient(70% 50% at 0% 100%, rgba(177,74,110,0.18) 0%, transparent 50%),
          linear-gradient(180deg, #FFFEFA 0%, ${T.bone} 55%, #F3EDE3 100%)
        `,
        fontFamily: F.body,
        color: T.ink,
        paddingBottom: 'calc(var(--shell-tab-bar-height, 3.15rem) + 12px)',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '14px 16px 8px',
          paddingTop: 'max(20px, calc(env(safe-area-inset-top) + 18px))',
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontSize: 11,
              fontWeight: 650,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: accent,
            }}
          >
            {t('home.tutorial.eyebrow')}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#B9AF9C' }}>
            {t('home.tutorial.step', { current: index + 1, total: phases.length })}
          </p>
        </div>
        <button
          type="button"
          onClick={handleClose}
          aria-label={t('home.tutorial.close')}
          data-testid="home-tutorial-close"
          style={{
            width: 36,
            height: 36,
            borderRadius: 999,
            border: '1px solid #E9E2D5',
            background: '#FFFEFA',
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
            color: T.ink,
          }}
        >
          <X size={16} />
        </button>
      </header>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '12px 20px 20px',
        }}
      >
        <div
          style={{
            borderRadius: 28,
            padding: '28px 22px 24px',
            background: 'linear-gradient(165deg, #FFFFFF 0%, #FBF8F2 100%)',
            border: '1px solid #E9E2D5',
            boxShadow: `0 18px 40px ${accent}22`,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              display: 'grid',
              placeItems: 'center',
              background: `${accent}22`,
              color: accent,
              marginBottom: 18,
            }}
          >
            <Icon size={28} strokeWidth={1.8} aria-hidden />
          </div>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              fontWeight: 650,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: accent,
            }}
          >
            {copy.eyebrow}
          </p>
          <h2
            id="home-tutorial-title"
            style={{
              margin: '10px 0 0',
              fontFamily: F.display,
              fontSize: 30,
              fontWeight: 450,
              lineHeight: 1.15,
              color: T.ink,
            }}
          >
            {copy.title}
          </h2>
          <p
            style={{
              margin: '14px 0 0',
              fontSize: 16,
              lineHeight: 1.55,
              color: '#211C15',
            }}
          >
            {copy.body}
          </p>
          <HomeTutorialCue phase={phase} accent={accent} />
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 7,
            marginTop: 22,
          }}
          aria-hidden
        >
          {phases.map((id, i) => {
            const tone = PHASE_META[id]?.accent ?? T.actIV
            return (
              <span
                key={id}
                style={{
                  width: i === index ? 18 : 7,
                  height: 7,
                  borderRadius: 999,
                  background: i === index ? tone : `${tone}40`,
                  transition: 'width 200ms ease, background 200ms ease',
                }}
              />
            )
          })}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.4fr',
          gap: 10,
          padding: '0 20px 8px',
        }}
      >
        <button
          type="button"
          onClick={goBack}
          disabled={isFirst}
          data-testid="home-tutorial-back"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            minHeight: 52,
            borderRadius: 14,
            border: '1px solid #E9E2D5',
            background: isFirst ? 'rgba(233,226,213,0.55)' : '#FFFEFA',
            color: isFirst ? T.muted : T.ink,
            fontWeight: 650,
            fontSize: 15,
            cursor: isFirst ? 'default' : 'pointer',
            fontFamily: F.body,
            opacity: isFirst ? 0.55 : 1,
          }}
        >
          <ChevronLeft size={18} aria-hidden />
          {t('home.tutorial.back')}
        </button>
        <button
          type="button"
          onClick={goNext}
          data-testid="home-tutorial-next"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            minHeight: 52,
            borderRadius: 14,
            border: 'none',
            background: `linear-gradient(135deg, ${accent} 0%, color-mix(in srgb, ${accent} 70%, ${T.ink}) 100%)`,
            color: T.warmWhite,
            fontWeight: 650,
            fontSize: 15,
            cursor: 'pointer',
            fontFamily: F.body,
            boxShadow: `0 10px 24px ${accent}44`,
          }}
        >
          {isLast ? t('home.tutorial.done') : t('home.tutorial.next')}
          {!isLast ? <ChevronRight size={18} aria-hidden /> : null}
        </button>
      </div>
    </div>
  )
}
