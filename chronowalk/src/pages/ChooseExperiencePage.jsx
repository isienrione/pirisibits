import { useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import tourHeroFallback from '../assets/tour-hero.svg'
import { getLaunchExperiences } from '../content/launchExperiences'
import { GoldButton, cn } from '../components/ui'
import { metaLabel } from '../components/ui/styles'
import { ROUTES } from '../routes/paths'

function ExperienceCard({ experience, isSelected, onSelect }) {
  const [heroSrc, setHeroSrc] = useState(experience.heroImage)

  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={() => onSelect(experience.id)}
      className={cn(
        'snap-center shrink-0 scroll-ml-6 first:scroll-ml-0',
        'w-[min(82vw,20rem)] transition-[transform,opacity,filter] duration-spring ease-spring',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-obsidian',
        isSelected ? 'scale-100 opacity-100' : 'scale-[0.9] opacity-60'
      )}
    >
      <div
        className={cn(
          'overflow-hidden rounded-[2rem] border transition-[border-color,box-shadow] duration-spring ease-spring',
          isSelected
            ? 'border-gold/50 shadow-gold-glow'
            : 'border-ivory/10 shadow-none'
        )}
      >
        <div className="relative aspect-[3/4] w-full overflow-hidden">
          <img
            src={heroSrc}
            alt=""
            aria-hidden="true"
            className={cn(
              'h-full w-full object-cover transition-transform duration-spring ease-spring',
              isSelected ? 'scale-100' : 'scale-105'
            )}
            onError={() => {
              if (heroSrc !== tourHeroFallback) {
                setHeroSrc(tourHeroFallback)
              }
            }}
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/35 to-transparent"
            aria-hidden="true"
          />
          <div className="absolute inset-x-0 bottom-0 p-6 text-left">
            <h2 className="font-display text-2xl font-semibold leading-tight text-ivory">
              {experience.title}
            </h2>
            <p className={cn(metaLabel, 'mt-3 text-gold/90')}>{experience.duration}</p>
            <p className="mt-1 text-sm font-medium text-ivory/80">{experience.walkingStyle}</p>
            <p className="mt-3 text-sm leading-relaxed text-ivory/70">{experience.description}</p>
          </div>
        </div>
      </div>
    </button>
  )
}

export default function ChooseExperiencePage() {
  const navigate = useNavigate()
  const { destinationId } = useParams()
  const experiences = useMemo(
    () => (destinationId ? getLaunchExperiences(destinationId) : []),
    [destinationId]
  )
  const [selectedId, setSelectedId] = useState(experiences[0]?.id ?? null)
  const scrollerRef = useRef(null)

  const handleSelect = (experienceId) => {
    setSelectedId(experienceId)
    const index = experiences.findIndex((experience) => experience.id === experienceId)
    const scroller = scrollerRef.current
    if (!scroller || index < 0) return
    const card = scroller.children[index]
    card?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }

  if (!experiences.length) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-obsidian px-6 text-ivory">
        <p className="text-sm text-ivory/70">Experiences are not available for this journey yet.</p>
      </div>
    )
  }

  const selectedExperience = experiences.find((experience) => experience.id === selectedId)

  return (
    <div className="flex min-h-dvh flex-col bg-obsidian text-ivory">
      <div className="px-6 pt-safe sm:px-8">
        <p className={cn(metaLabel, 'text-gold/80')}>ChronoWalk</p>
        <h1 className="mt-3 font-display text-[2rem] font-semibold leading-tight tracking-tight sm:text-4xl">
          Choose your experience
        </h1>
      </div>

      <div
        ref={scrollerRef}
        className="mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-4 pt-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:px-8 [&::-webkit-scrollbar]:hidden"
      >
        {experiences.map((experience) => (
          <ExperienceCard
            key={experience.id}
            experience={experience}
            isSelected={experience.id === selectedId}
            onSelect={handleSelect}
          />
        ))}
      </div>

      <div className="mt-auto px-6 pb-safe pt-8 sm:px-8">
        <p className="text-center text-sm text-ivory/60">
          {selectedExperience?.title ?? 'Select an experience'}
        </p>
        <GoldButton
          fullWidth
          showArrow
          className="mt-4"
          disabled={!selectedId}
          onClick={() => navigate(ROUTES.journey, { replace: true })}
        >
          Continue
        </GoldButton>
      </div>
    </div>
  )
}
