import JourneyShell from '../../components/journey/JourneyShell.jsx'
import MapScreen from '../../components/map/MapScreen.jsx'
import JournalScreen from '../../components/journal/JournalScreen.jsx'
import LetterScreen from '../../components/letter/LetterScreen.jsx'
import RedesignJourneyPage from '../../redesign/pages/RedesignJourneyPage.jsx'

const useFigmaRedesign = true

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
  return useFigmaRedesign ? <RedesignJourneyPage /> : <JourneyShell />
}

export function MapPage() {
  return <MapScreen />
}

export function JournalPage() {
  return <JournalScreen />
}

export function LetterPage() {
  return <LetterScreen />
}
