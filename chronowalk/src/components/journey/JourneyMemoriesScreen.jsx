import { useState } from 'react'
import tourHeroFallback from '../../assets/tour-hero.svg'
import {
  MEMORY_SECTIONS,
  MEMORY_SECTION_LABELS,
} from '../../content/launchJourneyMemories'
import MemoryStoryReplay from './MemoryStoryReplay'
import { cn } from '../ui'

function SectionTabs({ activeSection, onSelect }) {
  return (
    <div
      className="flex flex-wrap gap-2"
      role="tablist"
      aria-label="Memory sections"
    >
      {Object.values(MEMORY_SECTIONS).map((section) => {
        const isActive = section === activeSection

        return (
          <button
            key={section}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(section)}
            className={cn(
              'rounded-full border px-4 py-2 text-sm font-medium transition',
              isActive
                ? 'border-bronze bg-bronze text-ivory'
                : 'border-parchment bg-parchment/50 text-deep-slate hover:border-bronze/35'
            )}
          >
            {MEMORY_SECTION_LABELS[section]}
          </button>
        )
      })}
    </div>
  )
}

function PlaceCard({ place }) {
  const [imageSrc, setImageSrc] = useState(place.heroImage ?? tourHeroFallback)

  return (
    <article
      className="overflow-hidden rounded-[1.5rem] border border-parchment/80 bg-ivory shadow-plaque"
      data-testid={`memory-place-${place.id}`}
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={imageSrc}
          alt=""
          className="h-full w-full object-cover"
          onError={() => {
            if (imageSrc !== tourHeroFallback) {
              setImageSrc(tourHeroFallback)
            }
          }}
        />
      </div>
      <div className="px-5 py-5 sm:px-6">
        <h3 className="font-display text-2xl font-semibold leading-tight text-deep-slate">
          {place.title}
        </h3>
        <p className="mt-2 text-base leading-relaxed text-soft-slate">{place.line}</p>
      </div>
    </article>
  )
}

function StoryCard({ story, isExpanded, onToggle }) {
  return (
    <article
      className="rounded-[1.5rem] border border-parchment/80 bg-ivory px-5 py-5 shadow-plaque sm:px-6"
      data-testid={`memory-story-${story.id}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-display text-xl font-semibold leading-tight text-deep-slate sm:text-2xl">
            {story.title}
          </h3>
          {story.listenedLabel ? (
            <p className="mt-2 text-sm text-soft-slate">Listened · {story.listenedLabel}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="shrink-0 rounded-full border border-bronze/35 px-4 py-2 text-sm font-medium text-bronze transition hover:bg-parchment/60"
        >
          {isExpanded ? 'Close' : 'Replay'}
        </button>
      </div>

      {isExpanded ? <MemoryStoryReplay story={story} /> : null}
    </article>
  )
}

function PhotoCard({ photo }) {
  const [imageSrc, setImageSrc] = useState(photo.heroImage ?? tourHeroFallback)

  return (
    <article
      className="overflow-hidden rounded-[1.5rem] border border-parchment/80 bg-ivory shadow-plaque"
      data-testid={`memory-photo-${photo.id}`}
    >
      <div className="relative aspect-[4/5] overflow-hidden sm:aspect-[4/3]">
        <img
          src={imageSrc}
          alt=""
          className="h-full w-full object-cover"
          onError={() => {
            if (imageSrc !== tourHeroFallback) {
              setImageSrc(tourHeroFallback)
            }
          }}
        />
      </div>
      <div className="px-5 py-4">
        <h3 className="font-display text-xl font-semibold text-deep-slate">{photo.title}</h3>
        {photo.capturedLabel ? (
          <p className="mt-1 text-sm text-soft-slate">Captured · {photo.capturedLabel}</p>
        ) : null}
      </div>
    </article>
  )
}

function JournalEntry({ entry }) {
  return (
    <article
      className="rounded-[1.5rem] border border-parchment/80 bg-parchment/30 px-5 py-6 sm:px-6"
      data-testid={`memory-journal-${entry.id}`}
    >
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="font-display text-xl font-semibold text-deep-slate">{entry.title}</h3>
        {entry.recordedLabel ? (
          <p className="shrink-0 text-xs font-semibold uppercase tracking-[0.14em] text-soft-slate">
            {entry.recordedLabel}
          </p>
        ) : null}
      </div>
      <blockquote className="mt-4 border-l-2 border-bronze/35 pl-4 font-display text-lg leading-relaxed text-deep-slate/88 sm:text-xl">
        {entry.text}
      </blockquote>
    </article>
  )
}

function EmptySection({ message }) {
  return (
    <p className="rounded-[1.5rem] border border-dashed border-parchment bg-parchment/20 px-6 py-10 text-center text-base leading-relaxed text-soft-slate">
      {message}
    </p>
  )
}

export default function JourneyMemoriesScreen({
  title,
  subtitle,
  places = [],
  stories = [],
  photos = [],
  journal = [],
  onBack,
  onOpenSettings,
}) {
  const [activeSection, setActiveSection] = useState(MEMORY_SECTIONS.PLACES)
  const [activeStoryId, setActiveStoryId] = useState(null)

  const emptyMessages = {
    [MEMORY_SECTIONS.PLACES]: 'Places you arrive at will gather here.',
    [MEMORY_SECTIONS.STORIES]: 'Stories you finish will stay here for replay.',
    [MEMORY_SECTIONS.PHOTOS]: 'Photos you capture will appear in this archive.',
    [MEMORY_SECTIONS.JOURNAL]: 'Reflections from your journey will line these pages.',
  }

  return (
    <div
      className="min-h-dvh bg-ivory text-deep-slate paper-texture"
      data-testid="journey-memories-screen"
    >
      <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-6 pb-safe pt-safe sm:px-8">
        <header>
          <button
            type="button"
            onClick={onBack}
            className="mt-2 min-h-11 text-sm font-medium text-soft-slate transition hover:text-deep-slate"
          >
            Back to explore more
          </button>

          <p className="mt-8 text-eyebrow uppercase text-bronze">Memories</p>
          <h1 className="mt-3 font-display text-[2rem] font-semibold leading-tight sm:text-4xl">
            {title}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-soft-slate sm:text-lg">
            {subtitle}
          </p>
        </header>

        <div className="mt-8">
          <SectionTabs activeSection={activeSection} onSelect={setActiveSection} />
        </div>

        <section
          className="mt-8 flex-1 pb-10"
          role="tabpanel"
          aria-label={MEMORY_SECTION_LABELS[activeSection]}
        >
          {activeSection === MEMORY_SECTIONS.PLACES ? (
            places.length ? (
              <div className="space-y-6">
                {places.map((place) => (
                  <PlaceCard key={place.id} place={place} />
                ))}
              </div>
            ) : (
              <EmptySection message={emptyMessages[MEMORY_SECTIONS.PLACES]} />
            )
          ) : null}

          {activeSection === MEMORY_SECTIONS.STORIES ? (
            stories.length ? (
              <div className="space-y-5">
                {stories.map((story) => (
                  <StoryCard
                    key={story.id}
                    story={story}
                    isExpanded={activeStoryId === story.id}
                    onToggle={() =>
                      setActiveStoryId((current) => (current === story.id ? null : story.id))
                    }
                  />
                ))}
              </div>
            ) : (
              <EmptySection message={emptyMessages[MEMORY_SECTIONS.STORIES]} />
            )
          ) : null}

          {activeSection === MEMORY_SECTIONS.PHOTOS ? (
            photos.length ? (
              <div className="grid gap-5 sm:grid-cols-2">
                {photos.map((photo) => (
                  <PhotoCard key={photo.id} photo={photo} />
                ))}
              </div>
            ) : (
              <EmptySection message={emptyMessages[MEMORY_SECTIONS.PHOTOS]} />
            )
          ) : null}

          {activeSection === MEMORY_SECTIONS.JOURNAL ? (
            journal.length ? (
              <div className="space-y-5">
                {journal.map((entry) => (
                  <JournalEntry key={entry.id} entry={entry} />
                ))}
              </div>
            ) : (
              <EmptySection message={emptyMessages[MEMORY_SECTIONS.JOURNAL]} />
            )
          ) : null}
        </section>

        {onOpenSettings ? (
          <footer className="pb-8">
            <button
              type="button"
              onClick={onOpenSettings}
              className="text-sm font-medium tracking-[0.08em] text-bronze underline decoration-bronze/30 underline-offset-4 transition hover:text-bronze-dark"
            >
              Settings
            </button>
          </footer>
        ) : null}
      </div>
    </div>
  )
}
