import { Link } from 'react-router-dom'
import { ABOUT_IMAGERY_COPY, collectWikimediaCredits } from '../content/imageCredits.js'
import { useTourManifest } from '../hooks/useV2Journey.js'
import { PageShell, SectionHeader } from '../components/ui'

export default function CreditsScreen() {
  const { manifest, loading, error } = useTourManifest()

  if (loading) {
    return (
      <PageShell>
        <SectionHeader align="left" title="Credits & Sources" subtitle="Loading…" />
      </PageShell>
    )
  }

  if (error || !manifest) {
    return (
      <PageShell>
        <SectionHeader
          align="left"
          title="Credits & Sources"
          subtitle={error?.message ?? 'Manifest did not load.'}
        />
      </PageShell>
    )
  }

  const wikimediaCredits = collectWikimediaCredits(manifest)

  return (
    <PageShell>
      <SectionHeader align="left" title="Credits & Sources" />

      <section className="mt-8">
        <h2 className="font-display text-xl font-medium text-ink900">Present-day photography</h2>

        {wikimediaCredits.length ? (
          <ul className="mt-4 space-y-3">
            {wikimediaCredits.map((entry) => (
              <li key={entry.id} className="text-sm leading-relaxed text-ink900">
                <span className="font-semibold">{entry.title}</span>
                {' — '}
                {entry.sourceUrl ? (
                  <a
                    href={entry.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ember underline decoration-[color-mix(in_srgb,var(--accent)_40%,var(--bone))] underline-offset-2"
                  >
                    {entry.credit}
                  </a>
                ) : (
                  entry.credit
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Wikimedia credits will appear here as they are added to the tour manifest.
          </p>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-medium text-ink900">About our imagery</h2>
        <p className="mt-4 text-sm leading-relaxed text-ink900">{ABOUT_IMAGERY_COPY}</p>
      </section>

      <div className="mt-10">
        <Link to="/settings" className="text-sm font-semibold text-ember">
          Back to settings
        </Link>
      </div>
    </PageShell>
  )
}
