import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  buildJourneyLetter,
  projectMeanderPoints,
  readTravelerName,
  writeTravelerName,
} from '../../content/journeyLetter.js'
import { useV2Journey, useTourManifest } from '../../hooks/useV2Journey.js'
import { track, TRACK_EVENTS } from '../../lib/track.js'
import { saveLetterCard, shareLetterCard } from '../../components/letter/letterExport.js'
import RedesignRouteShell from '../RedesignRouteShell.jsx'
import F1JourneyLetter from '../screens/F1JourneyLetter.jsx'

export default function RedesignLetterPage() {
  const navigate = useNavigate()
  const { context } = useV2Journey()
  const { manifest, loading, error } = useTourManifest()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [travelerName, setTravelerName] = useState(() => readTravelerName())

  const letter = useMemo(
    () =>
      manifest
        ? buildJourneyLetter(manifest, { ...context, travelerName })
        : null,
    [manifest, context, travelerName],
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

  const handleNameChange = (name) => {
    setTravelerName(name)
    writeTravelerName(name)
  }

  const handleSave = async () => {
    if (!letter) return
    setBusy(true)
    setMessage('')
    try {
      const result = await saveLetterCard(letter, meander)
      track(TRACK_EVENTS.LETTER_SAVE, { stop_count: letter.stopCount, method: result })
      setMessage(
        result === 'fallback'
          ? 'Letter opened - long-press the image to save it.'
          : result === 'error'
            ? 'Could not save the letter. Try sharing it instead.'
            : 'Letter saved to your device.',
      )
    } catch {
      setMessage('Could not save the letter. Try sharing it instead.')
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
        result === 'share'
          ? 'Letter image ready to share.'
          : result === 'download' || result === 'fallback'
            ? 'Letter image saved - share it from your photos.'
            : 'Could not share the letter image on this device.',
      )
    } catch {
      setMessage('Could not share the letter image on this device.')
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
          <button type="button" onClick={() => navigate('/journey')} style={{ marginTop: 16 }}>
            Back to walk
          </button>
        </div>
      </RedesignRouteShell>
    )
  }

  return (
    <RedesignRouteShell>
      <div className="redesign-app-shell">
        <F1JourneyLetter
          firstName={letter.firstName ?? 'Traveler'}
          body={letter.body}
          reflection={letter.reflection}
          stats={stats}
          busy={busy}
          statusMessage={message}
          onSave={handleSave}
          onShare={handleShare}
          onBack={() => navigate('/journal')}
          travelerName={travelerName}
          onTravelerNameChange={handleNameChange}
        />
      </div>
    </RedesignRouteShell>
  )
}
