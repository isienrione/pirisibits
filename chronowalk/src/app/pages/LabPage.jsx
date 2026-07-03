import { lazy, Suspense, useState } from 'react'
import { Link } from 'react-router-dom'
import { THRESHOLD_DEMO_WAYPOINT } from '../../data/thresholdDemo.js'
import { LivingSeam } from '../../components/ui/LivingSeam.jsx'
import ArrivalCard from '../../lab/ArrivalCard.jsx'
import JourneyLetter from '../../lab/JourneyLetter.jsx'
import ThresholdBloom from '../../lab/ThresholdBloom.jsx'

const Threshold = lazy(() => import('../../components/Threshold.jsx'))

function LabSection({ title, description, children, minHeight = 'min-h-[20rem]' }) {
  return (
    <section className={`border-b border-ink800 ${minHeight}`}>
      <div className="border-b border-ink800 px-4 py-3">
        <h2 className="font-display text-lg font-medium text-warmwhite">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      </div>
      <div className="relative">{children}</div>
    </section>
  )
}

export default function LabPage() {
  const [deepZoom, setDeepZoom] = useState(false)
  const [bloomKey, setBloomKey] = useState(0)
  const [bloomActive, setBloomActive] = useState(false)

  const fireBloom = () => {
    setBloomActive(false)
    setBloomKey((key) => key + 1)
    window.requestAnimationFrame(() => setBloomActive(true))
  }

  return (
    <main className="min-h-dvh bg-obsidian text-warmwhite" style={{ fontFamily: 'var(--font-ui)' }}>
      <header className="sticky top-0 z-20 border-b border-ink800 bg-obsidian/95 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <div>
            <p className="text-eyebrow uppercase text-ember">Dev lab</p>
            <h1 className="font-display text-xl font-medium">Prism components</h1>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={deepZoom}
                onChange={(event) => setDeepZoom(event.target.checked)}
                className="accent-ember"
              />
              Deep-zoom viewport
            </label>
            <Link to="/welcome" className="text-sm font-semibold text-ember">
              Exit
            </Link>
          </div>
        </div>
      </header>

      <div
        className="mx-auto max-w-3xl origin-top transition-transform duration-500 ease-out"
        style={{
          transform: deepZoom ? 'scale(1.35)' : 'scale(1)',
        }}
      >
        <LabSection title="1 · LivingSeam" description="1.5px ember hairline, breathing opacity, seam glow.">
          <div className="flex h-48 items-stretch justify-center gap-8 px-6 py-10">
            <LivingSeam />
            <div className="relative flex h-full w-48 items-center justify-center">
              <LivingSeam />
              <ThresholdBloom
                key={bloomKey}
                active={bloomActive}
                onComplete={() => setBloomActive(false)}
              />
            </div>
            <button
              type="button"
              onClick={fireBloom}
              className="self-end rounded-full border border-ink800 px-4 py-2 text-sm text-muted"
            >
              Fire ThresholdBloom
            </button>
          </div>
        </LabSection>

        <LabSection
          title="2 · Threshold"
          description="Protected component — rendered as-is."
          minHeight="min-h-[70vh]"
        >
          <Suspense fallback={<p className="p-6 text-sm text-muted">Loading threshold…</p>}>
            <div className="h-[70vh]">
              <Threshold
                waypoint={THRESHOLD_DEMO_WAYPOINT}
                nowAmbienceUrl={THRESHOLD_DEMO_WAYPOINT.nowAmbience}
                thenSoundscapeUrl={THRESHOLD_DEMO_WAYPOINT.thenSoundscape}
                embedded
                active
              />
            </div>
          </Suspense>
        </LabSection>

        <LabSection title="3 · ArrivalCard" description="Fraunces name, act eyebrow, ember underline — no chrome.">
          <div className="flex min-h-[12rem] items-end bg-obsidian px-6 py-12">
            <ArrivalCard actEyebrow="Act III · The Forum" waypointName="Basilica of Maxentius" />
          </div>
        </LabSection>

        <LabSection title="4 · JourneyLetter" description="Obsidian letter, spectrum route draw, DM Sans stats.">
          <JourneyLetter />
        </LabSection>

        <LabSection title="5 · ThresholdBloom" description="600ms spectrum shimmer — one breath at crossing completion.">
          <div className="relative flex h-40 items-center justify-center">
            <LivingSeam className="h-32" />
            <ThresholdBloom key={`solo-${bloomKey}`} active={bloomActive} />
          </div>
          <div className="px-6 pb-8">
            <button
              type="button"
              onClick={fireBloom}
              className="rounded-full border border-ink800 px-5 py-2.5 text-sm font-semibold text-warmwhite"
            >
              Trigger bloom
            </button>
          </div>
        </LabSection>
      </div>
    </main>
  )
}
