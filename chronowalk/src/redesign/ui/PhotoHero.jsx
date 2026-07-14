import { useState } from 'react'
import { IMAGE_GRADE, IMAGE_POSITION } from './cinematicImage.js'
import { BottomScrim } from './BottomScrim.jsx'
import { Vignette } from './Vignette.jsx'

/**
 * Full-bleed cinematic photo layer for immersive screens.
 * Grade + vignette + bottom scrim — assets unchanged.
 */
export function PhotoHero({
  src,
  brightness,
  position = 'landmark',
  extraFilter = '',
  grade = 'dusk',
  scrim = true,
  vignette = true,
  className = '',
  style,
}) {
  const [loaded, setLoaded] = useState(false)
  const objectPosition = IMAGE_POSITION[position] ?? position
  const gradeFilter = IMAGE_GRADE[grade] ?? IMAGE_GRADE.dusk
  const brightnessFilter =
    typeof brightness === 'number' ? `brightness(${brightness})` : null
  const filter = [brightnessFilter ?? gradeFilter, extraFilter].filter(Boolean).join(' ')

  return (
    <div
      className={[
        'cw-cine-hero',
        loaded ? 'cw-cine-hero--loaded' : 'cw-cine-hero--loading',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
      aria-hidden
    >
      {src ? (
        <img
          className="cw-cine-hero__media"
          src={src}
          alt=""
          decoding="async"
          draggable={false}
          style={{ objectPosition, filter }}
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
        />
      ) : (
        <div className="cw-cine-hero__fallback" />
      )}
      {vignette ? <Vignette /> : null}
      {scrim ? <BottomScrim strength={0.88} /> : null}
    </div>
  )
}
