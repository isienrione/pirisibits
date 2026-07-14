import { useState } from 'react'
import {
  IMAGE_ASPECT,
  IMAGE_GRADE,
  IMAGE_OVERLAY,
  IMAGE_POSITION,
  IMAGE_RADIUS,
  IMAGE_SHADOW,
} from './cinematicImage.js'

/**
 * Cinematic still — radius, grade, overlay, shadow, fade, loading.
 * Assets unchanged; presentation only.
 */
export function CinematicImage({
  src,
  alt = '',
  width,
  height,
  aspect = 'square',
  radius = 'md',
  grade = 'film',
  overlay = 'soft',
  position = 'landmark',
  shadow = 'soft',
  faded = false,
  /** Appended to the grade filter (e.g. sepia for “THEN” diptychs). */
  extraFilter = '',
  className = '',
  style,
  testId = 'cinematic-image',
}) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  const radiusPx = typeof radius === 'number' ? radius : IMAGE_RADIUS[radius] ?? IMAGE_RADIUS.md
  const aspectValue = IMAGE_ASPECT[aspect] ?? aspect
  const baseGrade = faded
    ? `${IMAGE_GRADE[grade] ?? IMAGE_GRADE.film} brightness(0.82) saturate(0.65)`
    : IMAGE_GRADE[grade] ?? IMAGE_GRADE.film
  const gradeFilter = [baseGrade === 'none' ? null : baseGrade, extraFilter]
    .filter(Boolean)
    .join(' ')
  const objectPosition = IMAGE_POSITION[position] ?? position
  const boxShadow = IMAGE_SHADOW[shadow] ?? shadow
  const overlayKey = IMAGE_OVERLAY[overlay] ? overlay : 'soft'

  return (
    <div
      className={[
        'cw-cine-image',
        `cw-cine-image--overlay-${overlayKey}`,
        loaded ? 'cw-cine-image--loaded' : 'cw-cine-image--loading',
        failed ? 'cw-cine-image--failed' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      data-testid={testId}
      style={{
        width: width ?? '100%',
        height: height ?? (aspect === 'fill' ? '100%' : undefined),
        aspectRatio: aspect === 'fill' || height ? undefined : aspectValue,
        borderRadius: radiusPx,
        boxShadow: boxShadow === 'none' ? undefined : boxShadow,
        ...style,
      }}
    >
      <div className="cw-cine-image__skeleton" aria-hidden />
      {!failed && src ? (
        <img
          className="cw-cine-image__media"
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          draggable={false}
          style={{
            objectPosition,
            filter: gradeFilter || undefined,
          }}
          onLoad={() => setLoaded(true)}
          onError={() => {
            setFailed(true)
            setLoaded(true)
          }}
        />
      ) : (
        <div className="cw-cine-image__fallback" aria-hidden />
      )}
      <div className="cw-cine-image__overlay" aria-hidden />
    </div>
  )
}

export default CinematicImage
