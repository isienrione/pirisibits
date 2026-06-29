import { NAV_ITEMS } from './navConfig'
import { cn, focusRing, metaLabel, tapAction } from '../ui'
import { triggerHaptic, HAPTIC_KIND } from '../../utils/haptics'

function NavButton({ item, active, onSelect, layout }) {
  const { Icon, label, id } = item

  const handleSelect = () => {
    if (!active) triggerHaptic(HAPTIC_KIND.SELECTION)
    onSelect(id)
  }

  return (
    <button
      type="button"
      onClick={handleSelect}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl transition-colors',
        tapAction,
        focusRing,
        layout === 'side' ? 'h-16 w-full px-2' : 'min-w-0 flex-1 px-2 py-2.5',
        active ? 'font-semibold text-bronze' : 'font-medium text-soft-slate hover:text-deep-slate'
      )}
    >
      {active ? (
        <span
          className={cn(
            'absolute rounded-full bg-bronze/12',
            layout === 'side' ? 'inset-x-2 inset-y-1.5' : 'inset-x-1 bottom-1 top-1'
          )}
          aria-hidden="true"
        />
      ) : null}
      <span className="relative">
        <Icon />
      </span>
      <span className={cn('relative', metaLabel)}>{label}</span>
    </button>
  )
}

export function AppNavigation({ activeTab, onChange, audioSlot = null }) {
  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[45] px-4 pb-safe pt-2 lg:hidden">
        <div className="pointer-events-auto mx-auto flex w-full max-w-md flex-col gap-2">
          {audioSlot}
          <nav
            className="flex items-stretch rounded-[1.75rem] border border-parchment/80 bg-ivory/96 p-1.5 shadow-plaque-lg backdrop-blur-glass"
            aria-label="Main navigation"
          >
            {NAV_ITEMS.map((item) => (
              <NavButton
                key={item.id}
                item={item}
                active={activeTab === item.id}
                onSelect={onChange}
                layout="bottom"
              />
            ))}
          </nav>
        </div>
      </div>

      <nav
        className="pointer-events-none fixed inset-y-0 left-0 z-[45] hidden w-[5.5rem] border-r border-parchment/70 bg-ivory/95 px-2 py-6 shadow-plaque backdrop-blur-glass lg:flex lg:flex-col lg:items-stretch"
        aria-label="Main navigation"
      >
        <div className="pointer-events-auto flex flex-1 flex-col gap-2">
          {NAV_ITEMS.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              active={activeTab === item.id}
              onSelect={onChange}
              layout="side"
            />
          ))}
        </div>
      </nav>
    </>
  )
}

export default AppNavigation
