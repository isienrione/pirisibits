import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { buildJourneyLetter, projectMeanderPoints } from '../../content/journeyLetter.js'
import { JOURNEY_STATES } from '../../state/journey.js'
import { useJourney, useTourManifest } from '../../hooks/useJourney.js'
import { track, TRACK_EVENTS } from '../../lib/track.js'
import LetterMeander from './LetterMeander.jsx'
import { saveLetterCard, shareLetterCard } from './letterExport.js'

function LetterLayout({ eyebrow, title, children, actions }) {
  return (
    <main
      style={{
        minHeight: '100dvh',
        padding:
          'max(var(--edge), env(safe-area-inset-top)) var(--edge) max(var(--edge), env(safe-area-inset-bottom))',
        background: 'var(--bone)',
        color: 'var(--ink)',
        fontFamily: 'var(--font-ui)',
      }}
    >
      <div style={{ maxWidth: 420, margin: '0 auto', paddingTop: 24 }}>
        <p
          style={{
            margin: 0,
            fontSize: 'var(--fs-caption)',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'color-mix(in srgb, var(--ink) 45%, var(--bone))',
          }}
        >
          {eyebrow}
        </p>
        <h1
          style={{
            margin: '8px 0 0',
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--fs-title)',
            fontWeight: 500,
            lineHeight: 1.15,
            color: 'var(--ink)',
          }}
        >
          {title}
        </h1>
        <div style={{ marginTop: 28 }}>{children}</div>
        {actions ? <div style={{ marginTop: 28, display: 'grid', gap: 12 }}>{actions}</div> : null}
      </div>
    </main>
  )
}

function ActionButton({ children, onClick, disabled = false, variant = 'primary' }) {
  const primary = variant === 'primary'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        padding: '16px 20px',
        border: primary ? 'none' : '1px solid color-mix(in srgb, var(--ink) 14%, var(--bone))',
        borderRadius: 999,
        background: primary ? 'var(--accent)' : 'transparent',
        color: primary ? 'var(--bone)' : 'var(--ink)',
        fontSize: 'var(--fs-body)',
        fontWeight: 600,
        cursor: disabled ? 'wait' : 'pointer',
        opacity: disabled ? 0.7 : 1,
      }}
    >
      {children}
    </button>
  )
}

export default function LetterScreen() {
  const { state, context } = useJourney()
  const { manifest, loading, error } = useTourManifest()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const letter = useMemo(
    () => (manifest ? buildJourneyLetter(manifest, context) : null),
    [manifest, context]
  )

  const meander = useMemo(
    () => projectMeanderPoints(letter?.stops ?? []),
    [letter?.stops]
  )

  useEffect(() => {
    if (letter) track(TRACK_EVENTS.LETTER_VIEW, { stop_count: letter.stopCount })
  }, [letter])

  if (loading) {
    return <LetterLayout eyebrow="Journey letter" title="Composing your letter…" />
  }

  if (error || !manifest || !letter) {
    return (
      <LetterLayout
        eyebrow="Journey letter"
        title="Letter unavailable"
        children={<p>{error?.message ?? 'Manifest did not load.'}</p>}
      />
    )
  }

  const handleSave = async () => {
    setBusy(true)
    setMessage('')
    try {
      await saveLetterCard(letter, meander)
      track(TRACK_EVENTS.LETTER_SAVE, { stop_count: letter.stopCount })
      setMessage('Letter saved to your device.')
    } catch (saveError) {
      setMessage(saveError.message ?? 'Could not save the letter.')
    } finally {
      setBusy(false)
    }
  }

  const handleShare = async () => {
    setBusy(true)
    setMessage('')
    try {
      const result = await shareLetterCard(letter, meander)
      track(TRACK_EVENTS.LETTER_SHARE, { stop_count: letter.stopCount, method: result })
      setMessage(
        result === 'clipboard'
          ? 'Letter copied to clipboard.'
          : result === 'share'
            ? 'Letter shared.'
            : 'Sharing is not supported on this device.'
      )
    } catch (shareError) {
      setMessage(shareError.message ?? 'Could not share the letter.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <LetterLayout
      eyebrow="Journey letter"
      title={letter.title}
      actions={
        <>
          <ActionButton onClick={handleShare} disabled={busy || !letter.stopCount}>
            Share letter
          </ActionButton>
          <ActionButton onClick={handleSave} disabled={busy || !letter.stopCount} variant="secondary">
            Save as image
          </ActionButton>
          {state !== JOURNEY_STATES.IDLE ? (
            <Link
              to="/journey"
              style={{
                display: 'block',
                textAlign: 'center',
                color: 'color-mix(in srgb, var(--ink) 60%, var(--bone))',
                fontSize: 'var(--fs-secondary)',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              Return to walk
            </Link>
          ) : (
            <Link
              to="/begin"
              style={{
                display: 'block',
                textAlign: 'center',
                color: 'color-mix(in srgb, var(--ink) 60%, var(--bone))',
                fontSize: 'var(--fs-secondary)',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              Begin journey
            </Link>
          )}
        </>
      }
    >
      <LetterMeander meander={meander} />

      <p
        style={{
          margin: '24px 0 0',
          fontSize: 'var(--fs-body)',
          lineHeight: 1.6,
          color: 'var(--ink)',
        }}
      >
        {letter.body}
      </p>

      {letter.reflection ? (
        <blockquote
          style={{
            margin: '24px 0 0',
            padding: '0 0 0 16px',
            borderLeft: '3px solid var(--verdigris)',
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--fs-reflect)',
            fontStyle: 'italic',
            lineHeight: 1.55,
            color: 'color-mix(in srgb, var(--ink) 78%, var(--bone))',
          }}
        >
          {letter.reflection}
        </blockquote>
      ) : null}

      {message ? (
        <p style={{ margin: '16px 0 0', fontSize: 'var(--fs-meta)', color: 'var(--verdigris)' }}>{message}</p>
      ) : null}
    </LetterLayout>
  )
}
