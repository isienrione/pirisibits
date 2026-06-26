import { NAV_ITEMS } from './navConfig'
import { cn } from '../ui'

function NavButton({ item, active, onSelect, layout }) {
  const { Icon, label, id } = item

  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative flex flex-col items-center justify-center gap-1 rounded-2xl transition-colors',
        layout === 'side' ? 'h-16 w-full px-2' : 'min-w-0 flex-1 px-2 py-2.5',
        active ? 'text-gold' : 'text-soft-slate hover:text-deep-slate'
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
      <span className="relative text-[0.65rem] font-semibold uppercase tracking-[0.12em]">
        {label}
      </span>
    </button>
  )
}

export function AppNavigation({ activeTab, onChange }) {
  return (
    <>
      <nav
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[45] px-4 pb-safe pt-2 lg:hidden"
        aria-label="Main navigation"
      >
        <div className="pointer-events-auto mx-auto flex max-w-md items-stretch rounded-3xl border border-limestone/70 bg-warm-white/95 p-1.5 shadow-glass-lg backdrop-blur-glass">
          {NAV_ITEMS.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              active={activeTab === item.id}
              onSelect={onChange}
              layout="bottom"
            />
          ))}
        </div>
      </nav>

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
