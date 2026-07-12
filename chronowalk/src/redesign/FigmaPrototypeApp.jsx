/**
 * Figma Make prototype gallery — browse every redesigned screen.
 * Route: /prototype (local CHRONOWALK 3 only)
 */
import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { T, F } from './tokens.js'
import { RedesignNavCtx } from './nav.js'
import './redesign.css'

import A1LandingHero from './screens/A1LandingHero.jsx'
import { loadRomeManifest, getWaypoint } from '../content/manifest.js'
import A2FreePreviewStory from './screens/A2FreePreviewStory.jsx'
import A3AccessConfirmed from './screens/A3AccessConfirmed.jsx'
import B1PrismWelcome from './screens/B1PrismWelcome.jsx'
import B2MakeItYours from './screens/B2MakeItYours.jsx'
import B3PermissionsPrimer from './screens/B3PermissionsPrimer.jsx'
import B4PaceSelector from './screens/B4PaceSelector.jsx'
import C1JourneyHome from './screens/C1JourneyHome.jsx'
import C1bStandalone from './screens/C1bStandalone.jsx'
import D1Map from './screens/D1Map.jsx'
import C2Walking from './screens/C2Walking.jsx'
import C3Approaching from './screens/C3Approaching.jsx'
import C4ArrivalMoment from './screens/C4ArrivalMoment.jsx'
import C5Story from './screens/C5Story.jsx'
import C7Threshold from './screens/C7Threshold.jsx'
import C6ImmersivePlayer from './screens/C6ImmersivePlayer.jsx'
import { buildImmersivePlayerProps } from './lib/waypointImmersiveProps.js'
import C8aPathChoice from './screens/C8aPathChoice.jsx'
import C8bThePause from './screens/C8bThePause.jsx'
import C8cActComplete from './screens/C8cActComplete.jsx'
import C8dResume from './screens/C8dResume.jsx'
import C9NoTicket from './screens/C9NoTicket.jsx'
import C5ReflectionBeat from './screens/C5ReflectionBeat.jsx'
import E1JournalHome from './screens/E1JournalHome.jsx'
import E2MemoryDetail from './screens/E2MemoryDetail.jsx'
import F1JourneyLetter from './screens/F1JourneyLetter.jsx'
import F2ShareCard from './screens/F2ShareCard.jsx'
import G1Settings from './screens/G1Settings.jsx'
import G2Credits from './screens/G2Credits.jsx'
import G3SystemStates from './screens/G3SystemStates.jsx'

const PROTOTYPE_MANIFEST = loadRomeManifest()
const PROTOTYPE_W17 = getWaypoint(PROTOTYPE_MANIFEST, 'w17')
const PROTOTYPE_W01 = getWaypoint(PROTOTYPE_MANIFEST, 'w01')

const SCREENS = [
  { id: 'A1', label: 'Landing Hero', Component: A1LandingHero },
  {
    id: 'A2',
    label: 'Free Preview',
    Component: () => (
      <A2FreePreviewStory
        manifest={PROTOTYPE_MANIFEST}
        waypoint={PROTOTYPE_W17}
        waypointId="w17"
        narrationPlaying
        currentTime={77}
        duration={240}
        audioAvailable
      />
    ),
  },
  { id: 'A3', label: 'Access Confirmed', Component: A3AccessConfirmed },
  { id: 'B1', label: 'Prism Welcome', Component: B1PrismWelcome },
  { id: 'B2', label: 'Make It Yours', Component: B2MakeItYours },
  { id: 'B3', label: 'Permissions Primer', Component: B3PermissionsPrimer },
  { id: 'B4', label: 'Pace Selector', Component: B4PaceSelector },
  { id: 'C1', label: 'Journey Home', Component: C1JourneyHome },
  { id: 'C1b', label: 'Route Sheet', Component: C1bStandalone },
  { id: 'D1', label: 'Map', Component: D1Map },
  { id: 'C2', label: 'Walking', Component: C2Walking },
  { id: 'C3', label: 'Approaching', Component: C3Approaching },
  { id: 'C4', label: 'Arrival Moment', Component: C4ArrivalMoment },
  { id: 'C5', label: 'Story', Component: C5Story },
  { id: 'C7', label: 'Threshold', Component: () => <C7Threshold embedded framed /> },
  {
    id: 'C6',
    label: 'Immersive (Colosseum)',
    Component: () => (
      <C6ImmersivePlayer
        {...buildImmersivePlayerProps({
          waypoint: PROTOTYPE_W01,
          waypointId: 'w01',
          manifest: PROTOTYPE_MANIFEST,
          audio: {
            narrationPlaying: true,
            currentTime: 77,
            duration: 240,
            audioAvailable: true,
          },
        })}
      />
    ),
  },
  { id: 'C8a', label: 'Path Choice', Component: C8aPathChoice },
  { id: 'C8b', label: 'The Pause', Component: C8bThePause },
  { id: 'C8c', label: 'Act Complete', Component: C8cActComplete },
  { id: 'C8d', label: 'Resume', Component: C8dResume },
  { id: 'C9', label: 'No-Ticket Flow', Component: C9NoTicket },
  { id: 'C5r', label: 'Reflection Beat', Component: C5ReflectionBeat },
  { id: 'E1', label: 'Journal Home', Component: E1JournalHome },
  { id: 'E2', label: 'Memory Detail', Component: E2MemoryDetail },
  { id: 'F1', label: 'Journey Letter', Component: F1JourneyLetter },
  { id: 'F2', label: 'Share Card', Component: F2ShareCard },
  { id: 'G1', label: 'Settings', Component: G1Settings },
  { id: 'G2', label: 'Credits', Component: G2Credits },
  { id: 'G3', label: 'System States', Component: G3SystemStates },
]

export default function FigmaPrototypeApp() {
  const [idx, setIdx] = useState(0)
  const { id, label, Component } = SCREENS[idx]

  const navigateById = (screenId) => {
    const i = SCREENS.findIndex((s) => s.id === screenId)
    if (i >= 0) setIdx(i)
  }

  return (
    <RedesignNavCtx.Provider value={{ navigate: navigateById, navigateToRoute: () => {} }}>
      <div className="redesign-prototype-chrome" style={{ fontFamily: F.body }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            disabled={idx === 0}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              border: `1px solid ${idx === 0 ? '#1a1611' : T.ink800}`,
              color: idx === 0 ? '#2a2218' : T.muted,
              background: 'none',
              cursor: idx === 0 ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ChevronLeft size={18} />
          </button>
          <div style={{ textAlign: 'center', minWidth: 220 }}>
            <div
              style={{
                fontSize: 10,
                color: T.ember,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
              }}
            >
              {id}
            </div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 3 }}>{label}</div>
          </div>
          <button
            type="button"
            onClick={() => setIdx((i) => Math.min(SCREENS.length - 1, i + 1))}
            disabled={idx === SCREENS.length - 1}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              border: `1px solid ${idx === SCREENS.length - 1 ? '#1a1611' : T.ink800}`,
              color: idx === SCREENS.length - 1 ? '#2a2218' : T.muted,
              background: 'none',
              cursor: idx === SCREENS.length - 1 ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div
          className="redesign-phone-frame"
          style={{
            borderRadius: 44,
            flexShrink: 0,
            boxShadow:
              '0 0 0 1px rgba(255,255,255,0.04), 0 32px 80px rgba(0,0,0,0.92)',
          }}
        >
          <Component />
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
          {SCREENS.map((screen, i) => (
            <button
              key={screen.id}
              type="button"
              onClick={() => setIdx(i)}
              title={screen.label}
              style={{
                width: i === idx ? 22 : 6,
                height: 6,
                borderRadius: 3,
                background: i === idx ? T.ember : '#28201a',
                border: 'none',
                cursor: 'pointer',
                transition: 'width 280ms ease, background 280ms ease',
                padding: 0,
              }}
            />
          ))}
        </div>
      </div>
    </RedesignNavCtx.Provider>
  )
}
