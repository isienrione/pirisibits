import { GoldButton } from '../ui'

export default function JourneyLetter({
  salutation,
  paragraphs = [],
  signOff,
  signature,
  onReturnHome,
}) {
  return (
    <article
      className="min-h-dvh bg-[#080808] text-ivory"
      data-testid="journey-letter"
    >
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,55,0.08),transparent_55%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-xl px-8 pb-safe pt-20 sm:px-12 sm:pt-24">
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-gold/75">
          Your journey
        </p>

        <p className="mt-20 font-display text-[2rem] font-medium leading-tight tracking-tight sm:mt-24 sm:text-[2.35rem]">
          {salutation}
        </p>

        <div className="mt-14 space-y-10 sm:mt-16">
          {paragraphs.map((paragraph) => (
            <p
              key={paragraph}
              className="text-lg leading-[1.85] text-ivory/78 sm:text-[1.2rem] sm:leading-[1.9]"
            >
              {paragraph}
            </p>
          ))}
        </div>

        <footer className="mt-20 border-t border-ivory/10 pt-12 sm:mt-24">
          <p className="font-display text-xl leading-relaxed text-ivory/88">{signOff}</p>
          <p className="mt-3 font-display text-2xl italic text-gold/90">{signature}</p>
        </footer>

        <div className="mt-20 w-full max-w-xs sm:mt-24">
          <GoldButton fullWidth showArrow onClick={onReturnHome}>
            Return home
          </GoldButton>
        </div>
      </div>
    </article>
  )
}
