import tourHeroFallback from '../../assets/tour-hero.svg'
import { Button, cn } from '../ui'

const tourHeroPhoto = `/tour-hero.jpg?v=${__APP_BUILD_ID__}`

function BackButton({ onBack, label = 'Back' }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="mb-4 -ml-1 self-start rounded-full px-3"
      onClick={onBack}
    >
      ← {label}
    </Button>
  )
}

export function PreTourScreenShell({
  children,
  showHero = false,
  heroSrc: heroSrcProp,
  onHeroError,
  canGoBack = false,
  onBack,
  backLabel = 'Back',
  className,
  contentClassName,
}) {
  const heroSrc = heroSrcProp ?? tourHeroPhoto

  return (
    <div className={cn('relative min-h-screen overflow-x-hidden bg-ivory paper-texture', className)}>
      {showHero ? (
        <div className="absolute inset-x-0 top-0 h-[min(42vh,22rem)] sm:h-[min(46vh,24rem)]">
          <img
            src={heroSrc}
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover object-[center_38%]"
            onError={() => onHeroError?.(tourHeroFallback)}
          />
          <div
            className="absolute inset-0 bg-gradient-to-b from-ivory/10 via-ivory/40 to-ivory"
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-obsidian/35 via-transparent to-transparent"
            aria-hidden="true"
          />
        </div>
      ) : null}

      <div
        className={cn(
          'relative mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 pb-safe pt-safe sm:px-6 lg:max-w-3xl',
          contentClassName
        )}
      >
        {showHero ? (
          <div className="h-[min(22vh,10rem)] shrink-0 sm:h-[min(26vh,12rem)]" aria-hidden="true" />
        ) : null}

        <div className="flex flex-1 flex-col py-2">
          {canGoBack && onBack ? <BackButton onBack={onBack} label={backLabel} /> : null}
          {children}
        </div>
      </div>
    </div>
  )
}

export default PreTourScreenShell
