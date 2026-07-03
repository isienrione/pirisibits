import { Link, useLocation } from 'react-router-dom'
import { useJourney } from '../hooks/useJourney.js'
import { JOURNEY_STATES } from '../state/journey.js'
import { getShellTabs, SHELL_COMPANION_PATHS } from './config.js'
import { persistShellTab } from './tabPersistence.js'

export default function ShellTabBar() {
  const { state } = useJourney()
  const location = useLocation()

  if (state === JOURNEY_STATES.IDLE) return null

  const onCompanionRoute = SHELL_COMPANION_PATHS.includes(location.pathname)
  if (!onCompanionRoute) return null

  const tabs = getShellTabs()

  return (
    <nav
      aria-label="Tour navigation"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-ink800 bg-bone px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-card"
      style={{ fontFamily: 'var(--font-ui)' }}
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around gap-1">
        {tabs.map((tab) => {
          const active = location.pathname === tab.to
          const Icon = tab.Icon

          return (
            <li key={tab.id} className="flex-1">
              <Link
                to={tab.to}
                onClick={() => persistShellTab(tab.to)}
                className={`flex min-h-11 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.12em] transition-colors ${
                  active ? 'text-ember' : 'text-muted'
                }`}
              >
                <Icon />
                <span>{tab.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
