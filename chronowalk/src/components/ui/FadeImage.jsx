import { cn } from './cn'
import { useImageLoadState } from '../../hooks/useImageLoadState'
import { motionImageFade } from './motion'
import { SkeletonMedia } from './Skeleton'

export function FadeImage({
  src,
  alt = '',
  placeholderSrc,
  className,
  imgClassName,
  skeletonClassName,
  onError,
  ...props
}) {
  const status = useImageLoadState(src)
  const showPlaceholder = placeholderSrc && status !== 'ready'

  if (!src) {
    return <SkeletonMedia className={cn('h-full w-full', skeletonClassName, className)} />
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-gradient-to-br from-sand via-limestone/40 to-warm-white',
        className
      )}
    >
      {status !== 'ready' ? (
        <>
          {showPlaceholder ? (
            <img
              src={placeholderSrc}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full scale-110 object-cover blur-md brightness-[0.92]"
              referrerPolicy="no-referrer"
            />
          ) : null}
          <SkeletonMedia className={cn('absolute inset-0 h-full w-full', skeletonClassName)} />
        </>
      ) : null}

      {status === 'ready' ? (
        <img
          src={src}
          alt={alt}
          className={cn('h-full w-full object-cover', motionImageFade, imgClassName)}
          referrerPolicy="no-referrer"
          onError={onError}
          {...props}
        />
      ) : null}
    </div>
  )
}

export default FadeImage
