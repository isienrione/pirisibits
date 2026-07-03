import JourneyShell from '../../components/journey/JourneyShell.jsx'

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

export function JourneyPage() {
  return <JourneyShell />
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
