import { landingPictureSources } from './landingVisualAssets.js'

/**
 * Responsive landing image with WebP primary and PNG/JPG fallback via <picture>.
 */
export default function LandingPicture({
  asset,
  alt = '',
  className,
  loading,
  decoding,
  onError,
  ...rest
}) {
  const { webp, fallback } = landingPictureSources(asset)

  return (
    <picture>
      <source srcSet={webp} type="image/webp" />
      <img
        src={fallback}
        alt={alt}
        className={className}
        loading={loading}
        decoding={decoding}
        onError={onError}
        {...rest}
      />
    </picture>
  )
}
