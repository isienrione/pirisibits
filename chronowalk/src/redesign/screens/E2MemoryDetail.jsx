import { useState } from 'react'
import { Play, ChevronDown } from 'lucide-react'
import { useContext } from 'react'
import { T, F, S, SHELL_SAFE_BOTTOM_INSET } from '../tokens.js'
import { TYPE, displayTitleStyle, TYPE_SPACE } from '../typography.js'
import { colosseumNow } from '../images.js'
import { RedesignNavCtx } from '../nav.js'
import {
  Eyebrow,
  BackLink,
  PrimaryButton,
  SectionLabel,
  TextButton,
  GoldSeam,
} from '../ui/index.js'
import C7Threshold from './C7Threshold.jsx'

/**
 * Single memory page — quote, photograph, discoveries, listen again.
 * Deliberately not a feature panel.
 */
export default function E2MemoryDetail({
  accent = T.actI,
  actLabel = 'CHAPTER I — THE ARENA',
  title = 'The Colosseum',
  nowPhoto = colosseumNow,
  thenPhoto = colosseumNow,
  thenLoop = null,
  thenLabel = 'ANCIENT ROME',
  honestyCaption = 'Interpretive reconstruction informed by archaeology and scholarship.',
  signatureLine: quote = 'Take a second. Look up.',
  discoveries: discoveriesProp,
  facts: factsProp,
  transcript,
  chapters: chaptersProp,
  onBack,
  onWalkToStop,
  onListenAgain,
  onStepThroughTime,
  onAudioOnly,
  onTranscript,
  onViewImages,
}) {
  const { navigate } = useContext(RedesignNavCtx)
  const immersionH = Math.round(((390 - 48) * 4) / 3)
  const [txOpen, setTxOpen] = useState(false)

  const discoveries =
    discoveriesProp?.length
      ? discoveriesProp
      : factsProp?.length
        ? factsProp
        : [honestyCaption].filter(Boolean)

  const chapters = chaptersProp?.length
    ? chaptersProp
    : [
        { n: 1, title: 'The Beast Awakens', dur: '4:22' },
        { n: 2, title: 'Fifty Thousand Witnesses', dur: '6:01' },
        { n: 3, title: 'The Concrete Memory', dur: '5:38' },
      ]

  const listen = onListenAgain ?? onAudioOnly ?? onStepThroughTime

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
      <div
        style={{
          padding: `max(48px, calc(env(safe-area-inset-top) + ${S.m})) ${S.edge} ${S.m}`,
          flexShrink: 0,
        }}
      >
        <BackLink onClick={() => (onBack ? onBack() : navigate('E1'))}>Journal</BackLink>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          scrollbarWidth: 'none',
          padding: `0 ${S.edge} ${SHELL_SAFE_BOTTOM_INSET}`,
        }}
      >
        <Eyebrow color={accent} hairline>
          {actLabel}
        </Eyebrow>

        {/* Quote leads — the memory's voice */}
        <p
          style={{
            ...TYPE.prose,
            fontSize: 22,
            color: T.ink,
            fontStyle: 'italic',
            margin: `${S.l} 0 ${TYPE_SPACE.afterDisplay}`,
            maxWidth: '22em',
          }}
        >
          “{quote}”
        </p>

        <h2
          style={{
            ...displayTitleStyle(28),
            color: T.ink,
            margin: `0 0 ${S.l}`,
          }}
        >
          {title}
        </h2>

        <div style={{ marginBottom: S.l, height: 36, display: 'flex', alignItems: 'center' }}>
          <GoldSeam moment="chapterTransition" length={48} accent={accent} />
        </div>

        {/* Photograph / threshold — the page's image plane */}
        <div
          style={{
            marginBottom: S.xl,
            borderRadius: 16,
            overflow: 'hidden',
            height: Math.min(immersionH, 360),
          }}
        >
          <C7Threshold
            embedded
            nowPhoto={nowPhoto}
            thenPhoto={thenPhoto}
            thenLoop={thenLoop}
            thenLabel={thenLabel}
            honestyCaption={honestyCaption}
          />
        </div>

        {/* Discoveries — historical glances, not a fact dump */}
        {discoveries.length ? (
          <section style={{ marginBottom: S.xl }}>
            <SectionLabel color={accent} style={{ marginBottom: S.m }}>
              Discovered here
            </SectionLabel>
            {discoveries.map((line, i) => (
              <div key={i}>
                {i > 0 && (
                  <div style={{ height: 1, background: `${T.muted}28`, margin: `${S.m} 0` }} />
                )}
                <p
                  style={{
                    ...TYPE.ui,
                    color: T.ink,
                    fontSize: 15,
                    lineHeight: 'var(--lh-prose)',
                    margin: 0,
                  }}
                >
                  {line}
                </p>
              </div>
            ))}
          </section>
        ) : null}

        {/* One primary return path — quiet secondary actions */}
        <div style={{ marginBottom: S.xl }}>
          {onWalkToStop ? (
            <PrimaryButton
              color={accent}
              textColor={T.warmWhite}
              glow={false}
              onClick={onWalkToStop}
              style={{ marginBottom: S.m }}
            >
              Walk to this place
            </PrimaryButton>
          ) : null}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: `${S.m} ${S.l}` }}>
            {listen ? (
              <TextButton onClick={listen} style={{ color: accent }}>
                Listen again
              </TextButton>
            ) : null}
            {onTranscript ? (
              <TextButton onClick={onTranscript}>Read as you walk</TextButton>
            ) : null}
            {onViewImages && !listen ? (
              <TextButton onClick={onViewImages} style={{ color: accent }}>
                Step through time
              </TextButton>
            ) : null}
          </div>
        </div>

        {/* Transcript — kept, but secondary */}
        {transcript ? (
          <div style={{ marginBottom: S.xl }}>
            <button
              type="button"
              onClick={() => setTxOpen(!txOpen)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: `${S.m} 0`,
                borderTop: `1px solid ${T.muted}28`,
                borderBottom: `1px solid ${T.muted}28`,
              }}
            >
              <span style={{ ...TYPE.meta, color: T.ink, fontWeight: 500 }}>The words you heard</span>
              <ChevronDown
                size={16}
                color={T.muted}
                style={{
                  transform: txOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 250ms',
                }}
              />
            </button>
            {txOpen ? (
              <div style={{ padding: `${S.m} 0 ${S.s}` }}>
                <p style={{ ...TYPE.meta, color: T.muted, lineHeight: 'var(--lh-prose)' }}>
                  {transcript}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Listen-again chapters */}
        {chapters.length ? (
          <section>
            <SectionLabel color={accent} style={{ marginBottom: S.m }}>
              Listen again
            </SectionLabel>
            {chapters.map((ch, i) => (
              <div key={ch.n ?? i}>
                {i > 0 && <div style={{ height: 1, background: `${T.muted}20` }} />}
                <button
                  type="button"
                  onClick={listen ?? onWalkToStop}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: S.m,
                    padding: `${S.m} 0`,
                    cursor: 'pointer',
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      background: `${accent}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Play size={13} fill={accent} color={accent} style={{ marginLeft: 2 }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ ...TYPE.ui, color: T.ink, fontWeight: 500, margin: 0 }}>
                      {ch.title ?? ch}
                    </p>
                  </div>
                  {ch.dur ? (
                    <span
                      style={{
                        ...TYPE.caption,
                        color: T.muted,
                        fontVariantNumeric: 'tabular-nums',
                        flexShrink: 0,
                      }}
                    >
                      {ch.dur}
                    </span>
                  ) : null}
                </button>
              </div>
            ))}
          </section>
        ) : null}
      </div>
    </div>
  )
}
