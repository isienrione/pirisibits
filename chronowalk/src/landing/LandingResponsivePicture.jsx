/**
 * Shared <picture> sources for landing Rome planes (AVIF → WebP → JPEG/PNG fallback).
 * Keep width/height on sources and img to limit CLS.
 */
export function LandingResponsivePicture({
  image,
  className,
  loading = 'lazy',
  fetchPriority,
  decoding = 'async',
  sizes,
}) {
  const {
    mobileSrc,
    desktopSrc,
    mobileAvif,
    desktopAvif,
    mobileWebp,
    desktopWebp,
    lqipSrc,
    alt = '',
    objectPosition,
    mobileWidth = 960,
    mobileHeight = 1200,
    desktopWidth = 1600,
    desktopHeight = 900,
  } = image

  const imgStyle = {
    ...(lqipSrc ? { backgroundImage: `url(${lqipSrc})`, backgroundSize: 'cover' } : null),
    ...(objectPosition ? { objectPosition } : null),
  }

  return (
    <picture>
      {mobileAvif ? (
        <source
          type="image/avif"
          media="(max-width: 47.99rem)"
          srcSet={mobileAvif}
          width={mobileWidth}
          height={mobileHeight}
        />
      ) : null}
      {desktopAvif ? (
        <source
          type="image/avif"
          media="(min-width: 48rem)"
          srcSet={desktopAvif}
          width={desktopWidth}
          height={desktopHeight}
        />
      ) : null}
      {mobileWebp ? (
        <source
          type="image/webp"
          media="(max-width: 47.99rem)"
          srcSet={mobileWebp}
          width={mobileWidth}
          height={mobileHeight}
        />
      ) : null}
      {desktopWebp ? (
        <source
          type="image/webp"
          media="(min-width: 48rem)"
          srcSet={desktopWebp}
          width={desktopWidth}
          height={desktopHeight}
        />
      ) : null}
      <source media="(max-width: 47.99rem)" srcSet={mobileSrc} width={mobileWidth} height={mobileHeight} />
      <source media="(min-width: 48rem)" srcSet={desktopSrc} width={desktopWidth} height={desktopHeight} />
      <img
        className={className}
        src={mobileSrc || desktopSrc}
        width={mobileWidth}
        height={mobileHeight}
        alt={alt}
        loading={loading}
        decoding={decoding}
        fetchPriority={fetchPriority}
        sizes={sizes}
        style={Object.keys(imgStyle).length ? imgStyle : undefined}
      />
    </picture>
  )
}
