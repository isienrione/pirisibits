export function JourneyLayout({ header, eyebrow, title, subtitle, children, footer }) {
  return (
    <main
      style={{
        minHeight: '100dvh',
        padding:
          'max(var(--edge), env(safe-area-inset-top)) var(--edge) max(var(--edge), env(safe-area-inset-bottom))',
        background: 'var(--obsidian)',
        color: 'var(--warm-white)',
        fontFamily: 'var(--font-ui)',
      }}
    >
      <div style={{ maxWidth: 420, margin: '0 auto', paddingTop: 24 }}>
        {header}
        {eyebrow ? (
          <p
            style={{
              margin: 0,
              fontSize: 'var(--fs-caption)',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--muted-warm)',
            }}
          >
            {eyebrow}
          </p>
        ) : null}
        {title ? (
          <h1
            style={{
              margin: eyebrow ? '8px 0 0' : 0,
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--fs-title)',
              fontWeight: 500,
              lineHeight: 1.15,
            }}
          >
            {title}
          </h1>
        ) : null}
        {subtitle ? (
          <p style={{ marginTop: 12, fontSize: 'var(--fs-secondary)', lineHeight: 1.55, color: 'var(--muted-warm)' }}>
            {subtitle}
          </p>
        ) : null}
        <div style={{ marginTop: 24 }}>{children}</div>
        {footer ? <div style={{ marginTop: 28 }}>{footer}</div> : null}
      </div>
    </main>
  )
}

export function JourneyPrimaryButton({ children, onClick, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        padding: '16px 20px',
        border: 'none',
        borderRadius: 999,
        background: 'var(--accent)',
        color: 'var(--bone)',
        fontSize: 'var(--fs-body)',
        fontWeight: 600,
        cursor: disabled ? 'wait' : 'pointer',
        opacity: disabled ? 0.7 : 1,
      }}
    >
      {children}
    </button>
  )
}

export function JourneySecondaryButton({ children, onClick, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        marginTop: 12,
        width: '100%',
        padding: '14px 18px',
        border: 'none',
        borderRadius: 999,
        background: 'transparent',
        color: 'var(--muted-warm)',
        fontSize: 'var(--fs-secondary)',
        cursor: disabled ? 'wait' : 'pointer',
      }}
    >
      {children}
    </button>
  )
}
