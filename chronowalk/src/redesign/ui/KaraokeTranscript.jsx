import { useEffect, useMemo, useRef } from 'react'
import { T, F } from '../tokens.js'
import { parseTranscriptForKaraoke, resolveActiveWordIndex } from '../../utils/transcriptContent.js'

/**
 * Spotify-style read-along: full card, word-by-word highlight synced to narration progress.
 */
export default function KaraokeTranscript({
  transcript = '',
  currentTime = 0,
  duration = 0,
  playing = false,
  accent = T.ember,
  fontSize = 18,
  variant = 'dark',
  fullHeight = false,
  testId = 'karaoke-transcript',
}) {
  const scrollRef = useRef(null)
  const activeWordRef = useRef(null)

  const { paragraphs, wordCount } = useMemo(
    () => parseTranscriptForKaraoke(transcript),
    [transcript]
  )

  const activeIndex = resolveActiveWordIndex(wordCount, currentTime, duration)
  const syncActive = playing && duration > 0 && activeIndex >= 0

  useEffect(() => {
    if (!syncActive || !activeWordRef.current || !scrollRef.current) return
    activeWordRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [activeIndex, syncActive])

  const isBone = variant === 'bone'
  const shellBg = isBone ? 'rgba(255,255,255,0.92)' : `${T.ink800}ee`
  const shellBorder = isBone ? `${T.ink800}22` : `${T.muted}22`
  const defaultInk = isBone ? T.ink : T.warmWhite
  const spokenInk = isBone ? `${T.ink}88` : `${T.warmWhite}66`
  const upcomingInk = isBone ? `${T.ink}44` : `${T.warmWhite}38`

  if (!paragraphs.length) {
    return null
  }

  return (
    <div
      data-testid={testId}
      style={{
        background: shellBg,
        border: `1px solid ${shellBorder}`,
        borderRadius: 16,
        padding: fullHeight ? '22px 20px 28px' : '16px 16px 18px',
        flex: fullHeight ? 1 : undefined,
        minHeight: fullHeight ? 0 : undefined,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {paragraphs.map((paragraph) => (
          <p
            key={paragraph.id}
            style={{
              fontFamily: F.display,
              fontWeight: 300,
              fontSize,
              lineHeight: 1.9,
              margin: '0 0 1.35em',
              letterSpacing: '0.01em',
            }}
          >
            {paragraph.words.map((word) => {
              const isActive = syncActive && word.index === activeIndex
              const isSpoken = syncActive && word.index < activeIndex
              const color = isActive ? accent : isSpoken ? spokenInk : syncActive ? upcomingInk : defaultInk

              return (
                <span
                  key={`${paragraph.id}-${word.index}`}
                  ref={isActive ? activeWordRef : undefined}
                  data-word-index={word.index}
                  data-active={isActive ? 'true' : undefined}
                  style={{
                    color,
                    fontWeight: isActive ? 500 : 300,
                    transition: 'color 0.18s ease, opacity 0.18s ease',
                    textShadow: isActive ? `0 0 18px ${accent}55` : 'none',
                  }}
                >
                  {word.text}{' '}
                </span>
              )
            })}
          </p>
        ))}
      </div>
    </div>
  )
}
