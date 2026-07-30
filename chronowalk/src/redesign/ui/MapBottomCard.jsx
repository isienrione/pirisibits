/**
 * Journey-driven map companion card · one primary CTA, warm map chrome.
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
          gap: 12,
          padding: '13px 14px 0',
        }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              objectFit: 'cover',
              flexShrink: 0,
            }}
          />
        ) : null}
        <div style={{ flex: 1, minWidth: 0, paddingBottom: meta ? 0 : 4 }}>
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
                margin: '4px 0 0',
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

      <div style={{ padding: '12px 14px 14px' }}>
        <button
          type="button"
          onClick={onCta}
          disabled={disabled}
          style={{
            width: '100%',
            padding: '12px 16px',
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
