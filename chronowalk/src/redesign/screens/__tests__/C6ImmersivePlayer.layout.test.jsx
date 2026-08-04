import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import C6ImmersivePlayer from '../C6ImmersivePlayer.jsx'
import WalkSyncBar from '../../ui/WalkSyncBar.jsx'
import '../../redesign.css'

const redesignCss = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../../redesign.css'),
  'utf8',
)

function mountPlayer(ui, { width = 390, height = 844 } = {}) {
  const host = document.createElement('div')
  host.style.width = `${width}px`
  host.style.height = `${height}px`
  host.style.position = 'relative'
  host.style.overflow = 'hidden'
  document.body.appendChild(host)
  const view = render(ui, { container: host })
  return { host, ...view }
}

function leaderSyncBar(overrides = {}) {
  return (
    <WalkSyncBar
      syncEnabled
      joinCode="ROME1"
      isLeader
      resumePolicy="leader"
      canResumeForAll
      narrationPlaying={false}
      {...overrides}
    />
  )
}

function followerSyncBar(overrides = {}) {
  return (
    <WalkSyncBar
      syncEnabled
      joinCode="ROME1"
      isLeader={false}
      resumePolicy="leader"
      canResumeForAll={false}
      narrationPlaying={false}
      {...overrides}
    />
  )
}

describe('C6ImmersivePlayer next-step CTA layout', () => {
  beforeEach(() => {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    localStorage.clear()
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('keeps action-stack CSS in normal flow (not absolute overlay layers)', () => {
    expect(redesignCss).toMatch(
      /\.cw-waypoint-immersive__action-stack\s*\{[^}]*position:\s*relative/s,
    )
    expect(redesignCss).toMatch(
      /\.cw-waypoint-immersive__continuity\s*\{[^}]*position:\s*relative/s,
    )
    expect(redesignCss).toMatch(
      /\.cw-waypoint-immersive__action-stack\s*\{[^}]*safe-area-inset-bottom/s,
    )
    expect(redesignCss).not.toMatch(
      /\.cw-waypoint-immersive__continuity\s*\{[^}]*position:\s*absolute/s,
    )
  })

  it('renders an eligible next-step CTA for a normal solo player', () => {
    const onStoryComplete = vi.fn()
    mountPlayer(
      <C6ImmersivePlayer
        title="The Colosseum"
        chapterTitle="The Beast Awakens"
        chapterIndex={0}
        chapterCount={2}
        continueLabel="Next chapter →"
        onStoryComplete={onStoryComplete}
        onBack={() => {}}
      />,
    )

    const cta = screen.getByTestId('story-continue')
    expect(cta).toBeVisible()
    expect(cta).toHaveTextContent(/next chapter/i)
    expect(screen.getByTestId('immersive-action-stack')).toContainElement(cta)
    expect(screen.queryByTestId('immersive-sync-slot')).not.toBeInTheDocument()
    fireEvent.click(cta)
    expect(onStoryComplete).toHaveBeenCalledTimes(1)
  })

  it('renders CTA below organizer WalkSyncBar in a shared action stack', () => {
    mountPlayer(
      <C6ImmersivePlayer
        title="Colosseum interior"
        chapterIndex={0}
        chapterCount={2}
        continueLabel="Next chapter →"
        onStoryComplete={() => {}}
        onBack={() => {}}
        syncSlot={leaderSyncBar()}
      />,
    )

    const stack = screen.getByTestId('immersive-action-stack')
    const sync = within(stack).getByTestId('walk-sync-bar')
    const cta = within(stack).getByTestId('story-continue')
    expect(within(sync).getByRole('button', { name: /sync on/i })).toBeInTheDocument()
    expect(sync.compareDocumentPosition(cta) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('renders CTA with follower Waiting for leader when journey logic supplies onStoryComplete', () => {
    mountPlayer(
      <C6ImmersivePlayer
        title="Colosseum interior"
        chapterIndex={0}
        chapterCount={2}
        continueLabel="Continue walking →"
        onStoryComplete={() => {}}
        onBack={() => {}}
        syncSlot={followerSyncBar()}
      />,
    )

    const stack = screen.getByTestId('immersive-action-stack')
    expect(within(stack).getByTestId('sync-resume-all')).toHaveTextContent(/waiting for leader/i)
    expect(within(stack).getByTestId('story-continue')).toBeVisible()
    expect(within(stack).getByText(/only leader resumes/i)).toBeInTheDocument()
  })

  it('keeps WalkSyncBar and CTA as separate non-absolute layout regions', () => {
    mountPlayer(
      <C6ImmersivePlayer
        title="Colosseum interior"
        onStoryComplete={() => {}}
        onBack={() => {}}
        syncSlot={followerSyncBar()}
      />,
    )

    const stack = screen.getByTestId('immersive-action-stack')
    const syncSlot = screen.getByTestId('immersive-sync-slot')
    const continuity = stack.querySelector('.cw-waypoint-immersive__continuity')
    const syncBar = screen.getByTestId('walk-sync-bar')
    const cta = screen.getByTestId('story-continue')

    expect(stack.className).toContain('cw-waypoint-immersive__action-stack')
    expect(syncSlot.className).toContain('cw-waypoint-immersive__sync-slot')
    expect(continuity).toBeTruthy()
    expect(stack).toContainElement(syncBar)
    expect(stack).toContainElement(cta)
    expect(syncSlot.compareDocumentPosition(continuity) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    // Sync is not an absolute sibling overlay of the player root.
    expect(screen.getByTestId('waypoint-immersive').lastElementChild).toBe(stack)
  })

  it('places the CTA above shell bottom-nav clearance inside the player frame', () => {
    const { host } = mountPlayer(
      <div className="redesign-phone-frame redesign-phone-frame--companion" style={{ height: 844, width: 390 }}>
        <C6ImmersivePlayer
          title="Colosseum interior"
          continueLabel="Next chapter →"
          onStoryComplete={() => {}}
          onBack={() => {}}
          syncSlot={followerSyncBar()}
        />
      </div>,
      { width: 390, height: 844 },
    )

    const cta = screen.getByTestId('story-continue')
    const frame = host.querySelector('.redesign-phone-frame--companion')
    expect(frame).toContainElement(cta)
    expect(screen.getByTestId('immersive-action-stack')).toContainElement(cta)
    expect(redesignCss).toMatch(
      /\.redesign-phone-frame--companion\s*\{[^}]*--wc-shell-tab-inset/s,
    )
    // Frame sits above the tab strip (height AND min-height). Leaving base
    // min-height at full viewport made max-height lose and cropped the dock.
    expect(redesignCss).toMatch(
      /\.redesign-phone-frame--companion\s*\{[^}]*height:\s*calc\([^)]*--wc-shell-tab-inset/s,
    )
    expect(redesignCss).toMatch(
      /\.redesign-phone-frame--companion\s*\{[^}]*min-height:\s*calc\([^)]*--wc-shell-tab-inset/s,
    )
    expect(redesignCss).not.toMatch(
      /\.redesign-phone-frame--companion\s*\{[^}]*padding-bottom:\s*var\(--wc-shell-tab-inset/s,
    )
    expect(redesignCss).toMatch(
      /\.cw-journey-shell-root\s*>\s*\[data-testid='path-choice-screen'\]/,
    )
  })

  it('reserves safe-area padding on the action stack stylesheet rule', () => {
    expect(redesignCss).toMatch(
      /\.cw-waypoint-immersive__action-stack\s*\{[^}]*padding:[^;]*safe-area-inset-bottom/s,
    )
    mountPlayer(
      <C6ImmersivePlayer
        title="Colosseum interior"
        onStoryComplete={() => {}}
        onBack={() => {}}
        syncSlot={followerSyncBar()}
      />,
    )
    expect(screen.getByTestId('immersive-action-stack').className).toContain(
      'cw-waypoint-immersive__action-stack',
    )
  })

  it.each([
    [390, 844],
    [430, 932],
    [360, 640],
  ])('keeps CTA tappable in a %ix%i viewport shell', (width, height) => {
    const onStoryComplete = vi.fn()
    mountPlayer(
      <C6ImmersivePlayer
        title="Colosseum interior - a long landmark title that wraps on narrow phones"
        chapterTitle="Chapter title that is also quite long for regression coverage"
        chapterIndex={0}
        chapterCount={2}
        continueLabel="Next chapter →"
        onStoryComplete={onStoryComplete}
        onBack={() => {}}
        syncSlot={followerSyncBar()}
      />,
      { width, height },
    )

    const root = screen.getByTestId('waypoint-immersive')
    const stage = screen.getByTestId('immersive-stage')
    const stack = screen.getByTestId('immersive-action-stack')
    const cta = screen.getByTestId('story-continue')

    expect(root).toContainElement(stage)
    expect(root).toContainElement(stack)
    expect(root.className).toContain('cw-waypoint-immersive--with-action-stack')
    expect(root.className).toContain('cw-waypoint-immersive--with-sync')
    expect(cta).toHaveStyle({ minHeight: '44px' })

    fireEvent.click(cta)
    expect(onStoryComplete).toHaveBeenCalledTimes(1)
  })

  it('does not render the CTA when journey state withholds onStoryComplete', () => {
    mountPlayer(
      <C6ImmersivePlayer
        title="Colosseum interior"
        onBack={() => {}}
        syncSlot={followerSyncBar()}
      />,
    )
    expect(screen.queryByTestId('story-continue')).not.toBeInTheDocument()
    expect(screen.getByTestId('immersive-sync-slot')).toBeInTheDocument()
  })

  it('preserves independent walk sync chrome above an eligible CTA', () => {
    mountPlayer(
      <C6ImmersivePlayer
        title="Colosseum interior"
        onStoryComplete={() => {}}
        onBack={() => {}}
        syncSlot={followerSyncBar({ walkingIndependently: true, syncEnabled: false })}
      />,
    )
    expect(screen.getByTestId('walk-sync-bar')).toHaveAttribute('data-walking-independently', 'true')
    expect(screen.getByText(/walking independently/i)).toBeInTheDocument()
    expect(screen.getByTestId('story-continue')).toBeInTheDocument()
  })
})
