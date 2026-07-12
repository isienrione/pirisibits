import { companionCopy } from '../../content/companionGuidance.js'

export default function CompanionNotice({ mode, targetTitle }) {
  const copy = companionCopy(mode, { targetTitle })
  if (!copy) return null

  return (
    <div
      role="status"
      style={{
        marginTop: 16,
        padding: '14px 16px',
        borderRadius: 14,
        border: '1px solid color-mix(in srgb, var(--ember) 28%, transparent)',
        background: 'color-mix(in srgb, var(--ink) 72%, transparent)',
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 'var(--fs-caption)',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--ember)',
        }}
      >
        {copy.eyebrow}
      </p>
      <p style={{ margin: '6px 0 0', fontSize: 'var(--fs-body)', fontWeight: 600, lineHeight: 1.35 }}>
        {copy.title}
      </p>
      <p style={{ margin: '6px 0 0', fontSize: 'var(--fs-secondary)', color: 'var(--muted-warm)', lineHeight: 1.5 }}>
        {copy.subtitle}
      </p>
    </div>
  )
}
