import { GoldButton } from '../ui'

export default function StoryReflectionMoment({ sentence, onContinue }) {
  return (
    <div
      className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#080808] px-8 pb-safe pt-safe text-ivory sm:px-12"
      data-testid="story-reflection-moment"
      role="status"
      aria-live="polite"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(212,175,55,0.1),transparent_62%)]"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-col items-center text-center">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-gold/80">
          Reflection
        </p>

        <blockquote className="mt-16 font-display text-[2rem] font-medium leading-[1.35] tracking-tight text-ivory sm:mt-20 sm:text-[2.75rem] sm:leading-[1.28]">
          {sentence}
        </blockquote>

        <div className="mt-20 w-full max-w-xs sm:mt-24">
          <GoldButton fullWidth showArrow onClick={onContinue}>
            Continue
          </GoldButton>
        </div>
      </div>
    </div>
  )
}
