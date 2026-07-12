import { useMemo, useRef } from 'react'
import {T, F, withAlpha} from '../tokens.js'
import { parseTranscriptForKaraoke } from '../../utils/transcriptContent.js'

/**
 * Read-along transcript: full card, static text (no word-by-word sync highlight).
 */
export default function KaraokeTranscript({
  transcript = '',
  currentTime: _currentTime = 0,
  duration: _duration = 0,
  playing: _playing = false,
  accent: _accent = T.ember,
  fontSize = 18,
  variant = 'dark',
  fullHeight = false,
  immersive = false,
  readingMode = false,
  testId = 'karaoke-transcript',
}) {
  const scrollRef = useRef(null)

  const { paragraphs } = useMemo(
    () => parseTranscriptForKaraoke(transcript),
    [transcript]
  )

  const isBone = variant === 'bone'
  const shellBg = readingMode
    ? 'transparent'
    : immersive
      ? 'transparent'
      : isBone
        ? 'rgba(255,255,255,0.92)'
        : `${withAlpha(T.ink800, 'EE')}`
  const shellBorder = readingMode || immersive ? 'transparent' : isBone ? `${withAlpha(T.ink800, '22')}` : `${withAlpha(T.mutedDecor, '22')}`
  const defaultInk = isBone ? T.ink : T.warmWhite

  if (!paragraphs.length) {
    return null
  }

  if (readingMode) {
    return (
      <div data-testid={testId}>
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
              color: defaultInk,
            }}
          >
            {paragraph.words.map((word) => (
              <span key={`${paragraph.id}-${word.index}`}>{word.text} </span>
            ))}
          </p>
        ))}
      </div>
    )
  }

  return (
    <div
      data-testid={testId}
      style={{
        background: shellBg,
        border: immersive ? 'none' : `1px solid ${shellBorder}`,
        borderRadius: immersive ? 0 : 16,
        padding: readingMode ? '0 2px 8px' : immersive ? '4px 2px 8px' : fullHeight ? '22px 20px 28px' : '16px 16px 18px',
        flex: fullHeight || immersive || readingMode ? 1 : undefined,
        minHeight: fullHeight || immersive || readingMode ? 0 : undefined,
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
            {paragraph.words.map((word) => (
              <span
                key={`${paragraph.id}-${word.index}`}
                data-word-index={word.index}
                style={{
                  color: defaultInk,
                  fontWeight: 300,
                }}
              >
                {word.text}{' '}
              </span>
            ))}
          </p>
        ))}
      </div>
    </div>
  )
}
