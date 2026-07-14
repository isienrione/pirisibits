import { CinematicImage } from './CinematicImage.jsx'
import { PrimaryButton } from './PrimaryButton.jsx'
import { TYPE } from '../typography.js'
import { R } from '../tokens.js'

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
        borderRadius: R.card,
        border: '1px solid color-mix(in srgb, var(--warm-white) 8%, transparent)',
        background: 'color-mix(in srgb, var(--ink) 86%, transparent)',
        backdropFilter: 'blur(12px)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-floating)',
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
              ...TYPE.cardTitle,
              color: 'var(--warm-white)',
              fontSize: 17,
            }}
          >
            {title}
          </p>
          {meta ? (
            <p
              style={{
                ...TYPE.meta,
                margin: 'var(--gap-s) 0 0',
                color: 'var(--muted-warm)',
              }}
            >
              {meta}
            </p>
          ) : null}
        </div>
      </div>

      <div style={{ padding: 'var(--gap-m)' }}>
        <PrimaryButton
          onClick={onCta}
          disabled={disabled}
          busy={disabled}
          glow={false}
          color="var(--accent)"
          textColor="var(--obsidian)"
        >
          {ctaLabel}
        </PrimaryButton>
      </div>
    </div>
  )
}
