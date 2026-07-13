import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { buildJourneyLetter, projectMeanderPoints } from '../../content/journeyLetter.js'
import { useV2Journey, useTourManifest } from '../../hooks/useV2Journey.js'
import { track, TRACK_EVENTS } from '../../lib/track.js'
import { saveLetterCard, shareLetterCard } from '../../components/letter/letterExport.js'
import RedesignRouteShell from '../RedesignRouteShell.jsx'
import BackNavButton from '../ui/BackNavButton.jsx'
import F1JourneyLetter from '../screens/F1JourneyLetter.jsx'

export default function RedesignLetterPage() {
  const navigate = useNavigate()
  const { context } = useV2Journey()
  const { manifest, loading, error } = useTourManifest()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const letter = useMemo(
    () => (manifest ? buildJourneyLetter(manifest, context) : null),
    [manifest, context],
  )

  const meander = useMemo(
    () => projectMeanderPoints(letter?.stops ?? []),
    [letter?.stops],
  )

  useEffect(() => {
    if (letter) track(TRACK_EVENTS.LETTER_VIEW, { stop_count: letter.stopCount })
  }, [letter])

  const stats = useMemo(() => {
    const stopCount = letter?.stopCount ?? 0
    return [
      { v: `${stopCount} stops`, l: 'visited' },
      { v: letter?.durationLabel ?? '—', l: 'in Rome' },
      { v: '21', l: 'centuries crossed' },
    ]
  }, [letter])

  const handleSave = async () => {
    if (!letter) return
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
    if (!letter) return
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
            : 'Sharing is not supported on this device.',
      )
    } catch (shareError) {
      setMessage(shareError.message ?? 'Could not share the letter.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <RedesignRouteShell>
        <div className="redesign-app-shell" style={{ minHeight: '100dvh', background: '#0B0B0D' }} />
      </RedesignRouteShell>
    )
  }

  if (error || !letter) {
    return (
      <RedesignRouteShell>
        <div className="redesign-app-shell redesign-phone-frame" style={{ padding: 32, color: '#FAF6EF' }}>
          <p>{error?.message ?? 'Your letter is not ready yet. Keep walking.'}</p>
          <div style={{ marginTop: 16 }}>
            <BackNavButton variant="immersive" label="Back to walk" onClick={() => navigate('/journey')} />
          </div>
        </div>
      </RedesignRouteShell>
    )
  }

  return (
    <RedesignRouteShell>
      <div className="redesign-app-shell">
        <F1JourneyLetter
          firstName={letter.firstName ?? ''}
          body={letter.body}
          reflection={letter.reflection}
          stats={stats}
          busy={busy}
          statusMessage={message}
          onSave={handleSave}
          onShare={handleShare}
          onBack={() => navigate('/journal')}
        />
      </div>
    </RedesignRouteShell>
  )
}
