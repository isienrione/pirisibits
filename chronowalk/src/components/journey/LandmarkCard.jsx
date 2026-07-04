import { useEffect, useState } from 'react'
import { BottomSheet, Button, GoldButton, cn } from '../ui'
import tourHeroFallback from '../../assets/tour-hero.svg'

async function loadTranscriptContent(transcript) {
  if (!transcript || typeof transcript !== 'string') return null

  const trimmed = transcript.trim()
  if (!trimmed) return null

  if (!trimmed.startsWith('/') && !trimmed.startsWith('http')) {
    return trimmed
  }

  try {
    const response = await fetch(trimmed)
    if (!response.ok) return null
    return await response.text()
  } catch {
    return null
  }
}

export default function LandmarkCard({
  stop,
  onBeginStory,
  onSeeAncientRome,
  className,
}) {
  const [heroSrc, setHeroSrc] = useState(stop?.heroImage ?? tourHeroFallback)
  const [transcriptOpen, setTranscriptOpen] = useState(false)
  const [transcriptText, setTranscriptText] = useState(null)
  const [transcriptLoading, setTranscriptLoading] = useState(false)

  useEffect(() => {
    setHeroSrc(stop?.heroImage ?? tourHeroFallback)
  }, [stop?.heroImage])

  useEffect(() => {
    if (!transcriptOpen || !stop?.transcript) return undefined

    let cancelled = false
    setTranscriptLoading(true)

    void loadTranscriptContent(stop.transcript).then((text) => {
      if (cancelled) return
      setTranscriptText(text)
      setTranscriptLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [stop?.transcript, transcriptOpen])

  if (!stop) return null

  const introduction =
    stop.subtitle?.trim() ||
    stop.arrivalLine?.trim() ||
    `Stand where history still breathes at ${stop.shortTitle ?? stop.title}.`

  return (
    <div
      className={cn('relative min-h-dvh overflow-hidden bg-obsidian text-ivory', className)}
      data-testid="landmark-card"
    >
      <div className="relative h-[min(58vh,30rem)] w-full">
        <img
          src={heroSrc}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-center"
          onError={() => {
            if (heroSrc !== tourHeroFallback) {
              setHeroSrc(tourHeroFallback)
            }
          }}
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/25 to-obsidian/10"
          aria-hidden="true"
        />
      </div>

      <div className="relative px-6 pb-safe pt-8 sm:px-8">
        <p className="text-eyebrow uppercase text-gold/90">Stop {stop.number}</p>
        <h1 className="mt-3 font-display text-[2.75rem] font-semibold leading-[1.02] tracking-tight sm:text-5xl">
          {stop.shortTitle ?? stop.title}
        </h1>
        <p className="mt-5 max-w-lg text-xl leading-relaxed text-ivory/75 sm:text-2xl">
          {introduction}
        </p>

        <div className="mt-12 flex max-w-md flex-col gap-3">
          <GoldButton fullWidth showArrow onClick={onBeginStory}>
            Begin Story
          </GoldButton>
          <Button variant="outline-dark" size="lg" fullWidth onClick={onSeeAncientRome}>
            See Ancient Rome
          </Button>
          <Button
            variant="text"
            size="lg"
            fullWidth
            className="text-ivory/80 hover:text-ivory"
            onClick={() => setTranscriptOpen(true)}
          >
            Transcript
          </Button>
        </div>
      </div>

      {transcriptOpen ? (
        <BottomSheet
          open={transcriptOpen}
          onHandleClick={() => setTranscriptOpen(false)}
          onEscape={() => setTranscriptOpen(false)}
          handleLabel="Close transcript"
          ariaLabelledBy="landmark-transcript-title"
          className="fixed inset-x-0"
        >
          <div className="pb-6">
            <p className="text-eyebrow uppercase text-bronze">Transcript</p>
            <h2
              id="landmark-transcript-title"
              className="mt-2 font-display text-2xl font-semibold text-deep-slate"
            >
              {stop.shortTitle ?? stop.title}
            </h2>
            {transcriptLoading ? (
              <p className="mt-4 text-sm text-soft-slate">Loading transcript…</p>
            ) : (
              <p className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-soft-slate">
                {transcriptText ?? 'Transcript will appear here when available.'}
              </p>
            )}
          </div>
        </BottomSheet>
      ) : null}
    </div>
  )
}
