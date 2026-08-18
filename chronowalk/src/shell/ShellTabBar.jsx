import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useThresholdChrome } from '../context/ThresholdChromeContext.jsx'
import { shouldHideShellTabBar } from '../state/journey.js'
import { isStandaloneMode } from '../utils/pwaInstall.js'
import NativeRoutePill from '../redesign/ui/NativeRoutePill.jsx'
import { getShellTabs, isCompanionShellPath, isShellTabActive, isWalkTabVisible } from './config.js'
import { useI18n } from '../i18n/I18nProvider.jsx'
import { isNativeIOS } from '../lib/platform.js'
import { useV2Journey } from '../hooks/useV2Journey.js'

export default function ShellTabBar() {
  const { chromeHidden } = useThresholdChrome()
  const location = useLocation()
  const { locale, t } = useI18n()
  const { state } = useV2Journey()
  const native = isNativeIOS()

  const onCompanionRoute = isCompanionShellPath(location.pathname)
  const visible = onCompanionRoute && !shouldHideShellTabBar(chromeHidden)
  const standalone = isStandaloneMode()

  useEffect(() => {
    const root = document.documentElement
    if (visible) {
      root.dataset.shellTabBar = 'visible'
    } else {
      delete root.dataset.shellTabBar
    }
    root.dataset.shellStandalone = standalone ? 'true' : 'false'

    return () => {
      delete root.dataset.shellTabBar
      delete root.dataset.shellStandalone
    }
  }, [visible, standalone])

  if (!visible) return null

  // locale in deps so tab labels re-resolve when language changes
  const tabs = getShellTabs({ native, walkActive: native && isWalkTabVisible(state) })
  void locale

  return (
    <nav
      aria-label={t('shell.nav.aria')}
      className="fixed inset-x-0 bottom-0 z-[80] border-t border-ink800 bg-bone px-2 pt-1 shadow-card shell-tab-bar"
      style={{
        fontFamily: 'var(--font-ui)',
        // Extend bone flush to the physical bottom; keep only the real home-indicator inset.
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <NativeRoutePill />
      <ul className="mx-auto flex max-w-lg items-stretch justify-around gap-0.5">
        {tabs.map((tab) => {
          const active = isShellTabActive(tab.to, location.pathname)
          const Icon = tab.Icon

          return (
            <li key={tab.id} className="flex-1">
              <Link
                to={tab.to}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-2xl px-1.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.12em] transition-colors ${
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
