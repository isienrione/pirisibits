function ShellPage({ eyebrow, title, subtitle, children }) {
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
      {subtitle ? (
        <p style={{ marginTop: 12, fontSize: 'var(--fs-secondary)', color: 'var(--muted-warm)' }}>
          {subtitle}
        </p>
      ) : null}
      <div style={{ marginTop: 24 }}>{children}</div>
    </main>
  )
}

export function BeginPage() {
  return (
    <ShellPage
      eyebrow="Begin journey"
      title="Rome is ready when you are."
      subtitle="M10 — day selector and location pre-prompt."
    />
  )
}

export function JourneyPage() {
  return (
    <>
      <ShellPage
        eyebrow="Journey shell"
        title="Walking · Approaching · Arrival · Story · Threshold"
        subtitle="Set state to threshold in the dev panel, or open /threshold-demo."
      />
    </>
  )
}

export function MapPage() {
  return <ShellPage eyebrow="Map" title="Three confidence layers" subtitle="M14 — Mapbox warm style." />
}

export function JournalPage() {
  return (
    <ShellPage
      eyebrow="Journal"
      title="Your Rome is still ahead of you."
      subtitle="M15 — timeline on bone background."
    />
  )
}

export function LetterPage() {
  return (
    <ShellPage
      eyebrow="Journey letter"
      title="The path you walked"
      subtitle="M16 — SVG meander + share/save."
    />
  )
}

export function AccessPage() {
  return (
    <ShellPage
      eyebrow="Access"
      title="Welcome back, traveler."
      subtitle="M9 — magic link validation and cw_access grant."
    />
  )
}
