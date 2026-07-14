import { CinematicImage } from './CinematicImage.jsx'

/**
 * Journey-driven map companion card — one primary CTA, warm map chrome.
 */
export default function MapBottomCard({
  title,
  meta,
  ctaLabel,
  imageUrl,
  onCta,
  disabled = false,
}) {
  if (!title || !ctaLabel) return null

  return (
    <div
      style={{
        borderRadius: 16,
        border: '1px solid color-mix(in srgb, var(--warm-white) 8%, transparent)',
        background: 'color-mix(in srgb, var(--ink) 86%, transparent)',
        backdropFilter: 'blur(10px)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 'var(--gap-m)',
          padding: 'var(--gap-m) var(--gap-m) 0',
        }}
      >
        {imageUrl ? (
          <CinematicImage
            src={imageUrl}
            alt=""
            width={44}
            height={44}
            radius="md"
            grade="film"
            overlay="soft"
            position="upper"
            shadow="none"
          />
        ) : null}
        <div style={{ flex: 1, minWidth: 0, paddingBottom: meta ? 0 : 'var(--gap-s)' }}>
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-display)',
              fontSize: 17,
              lineHeight: 1.25,
              color: 'var(--warm-white)',
              fontWeight: 400,
            }}
          >
            {title}
          </p>
          {meta ? (
            <p
              style={{
                margin: 'var(--gap-s) 0 0',
                fontSize: 13,
                lineHeight: 1.35,
                color: 'var(--muted-warm)',
              }}
            >
              {meta}
            </p>
          ) : null}
        </div>
      </div>

      <div style={{ padding: 'var(--gap-m)' }}>
        <button
          type="button"
          onClick={onCta}
          disabled={disabled}
          style={{
            width: '100%',
            padding: 'var(--gap-m)',
            borderRadius: 12,
            border: 'none',
            background: 'var(--accent)',
            color: 'var(--bone)',
            fontSize: 14,
            fontWeight: 600,
            cursor: disabled ? 'wait' : 'pointer',
            opacity: disabled ? 0.75 : 1,
          }}
        >
          {ctaLabel}
        </button>
      </div>
    </div>
  )
}
