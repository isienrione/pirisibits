import { NAV_ITEMS } from './navConfig'
import { cn, focusRing, metaLabel } from '../ui'

function NavButton({ item, active, onSelect, layout }) {
  const { Icon, label, id } = item

  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative flex min-h-11 flex-col items-center justify-center gap-1 rounded-2xl transition-colors',
        focusRing,
        layout === 'side' ? 'h-16 w-full px-2' : 'min-w-0 flex-1 px-2 py-2.5',
        active ? 'font-semibold text-gold' : 'font-medium text-soft-slate hover:text-deep-slate'
      )}
    >
      {active ? (
        <span
          className={cn(
            'absolute rounded-full bg-gold/15',
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
            className="flex items-stretch rounded-[1.75rem] border border-limestone/70 bg-warm-white/96 p-1.5 shadow-glass-lg backdrop-blur-glass"
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
        className="pointer-events-none fixed inset-y-0 left-0 z-[45] hidden w-[5.5rem] border-r border-limestone/60 bg-warm-white/95 px-2 py-6 shadow-glass backdrop-blur-glass lg:flex lg:flex-col lg:items-stretch"
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
