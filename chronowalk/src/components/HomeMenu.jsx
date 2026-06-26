import { HOME_MENU_FAQ, HOME_MENU_SUPPORT } from '../content/homeMenuContent'

const statusLabel = (status) => {
  if (status === 'completed') return 'Done'
  if (status === 'current') return 'Here'
  return 'Upcoming'
}

const HomeMenu = ({
  open,
  onClose,
  side = 'left',
  tour,
  stops = [],
  onJumpToStop,
  showScript,
  onToggleShowScript,
  onToggleMenuSide,
  isSingleStopMode,
}) => {
  const panelSide = side === 'right' ? 'right-0' : 'left-0'
  const translateClosed = side === 'right' ? 'translate-x-full' : '-translate-x-full'

  return (
    <>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close menu"
        className={`fixed inset-0 z-[180] bg-black/50 transition-opacity ${
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        className={`fixed top-0 ${panelSide} z-[190] flex h-full w-[min(88vw,20rem)] flex-col border-amber-400/20 bg-stone-950/98 shadow-2xl backdrop-blur-md transition-transform duration-300 ${
          side === 'right' ? 'border-l' : 'border-r'
        } ${open ? 'translate-x-0' : translateClosed}`}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between border-b border-stone-800 px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-400">
              ChronoWalk
            </p>
            <h2 className="font-serif text-lg font-bold text-amber-50">Menu</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-stone-700 px-3 py-1 text-sm text-stone-300 hover:border-amber-400/40"
          >
            Close
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <section className="mb-6">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">
              Locations
            </h3>
            <p className="mb-3 text-xs leading-relaxed text-stone-500">
              Jump to any stop without walking there — great for testing sliders and scripts.
            </p>
            <ul className="space-y-2">
              {stops.map((stop, index) => (
                <li key={stop.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onJumpToStop?.(stop.id)
                      onClose()
                    }}
                    className="flex w-full items-center justify-between rounded-xl border border-stone-800 bg-stone-900/80 px-3 py-2.5 text-left transition hover:border-amber-400/40 hover:bg-stone-900"
                  >
                    <span className="text-sm text-stone-100">
                      <span className="mr-2 text-xs text-stone-500">{index + 1}.</span>
                      {stop.title}
                    </span>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wide ${
                        stop.status === 'completed'
                          ? 'text-emerald-400'
                          : stop.status === 'current'
                            ? 'text-amber-300'
                            : 'text-stone-500'
                      }`}
                    >
                      {statusLabel(stop.status)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {isSingleStopMode ? (
              <p className="mt-2 text-xs text-stone-500">Single-stop mode — open full tour to walk the route.</p>
            ) : null}
          </section>

          <section className="mb-6">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">
              Display
            </h3>
            <label className="mb-3 flex cursor-pointer items-center justify-between rounded-xl border border-stone-800 bg-stone-900/80 px-3 py-3">
              <span className="text-sm text-stone-200">Show audio scripts</span>
              <input
                type="checkbox"
                checked={showScript}
                onChange={(event) => onToggleShowScript?.(event.target.checked)}
                className="h-4 w-4 accent-amber-500"
              />
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onToggleMenuSide?.('left')}
                className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold ${
                  side === 'left'
                    ? 'border-amber-400/50 bg-amber-400/10 text-amber-100'
                    : 'border-stone-800 text-stone-400'
                }`}
              >
                Menu left
              </button>
              <button
                type="button"
                onClick={() => onToggleMenuSide?.('right')}
                className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold ${
                  side === 'right'
                    ? 'border-amber-400/50 bg-amber-400/10 text-amber-100'
                    : 'border-stone-800 text-stone-400'
                }`}
              >
                Menu right
              </button>
            </div>
          </section>

          <section className="mb-6">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">
              FAQ
            </h3>
            <div className="space-y-3">
              {HOME_MENU_FAQ.map((item) => (
                <details
                  key={item.q}
                  className="rounded-xl border border-stone-800 bg-stone-900/50 px-3 py-2"
                >
                  <summary className="cursor-pointer text-sm font-medium text-stone-200">
                    {item.q}
                  </summary>
                  <p className="mt-2 text-xs leading-relaxed text-stone-400">{item.a}</p>
                </details>
              ))}
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">
              {HOME_MENU_SUPPORT.title}
            </h3>
            <div className="rounded-xl border border-stone-800 bg-stone-900/50 px-3 py-3 text-sm text-stone-300">
              <p>{HOME_MENU_SUPPORT.body}</p>
              <a
                href={`mailto:${HOME_MENU_SUPPORT.email}`}
                className="mt-2 inline-block font-medium text-amber-300 hover:text-amber-200"
              >
                {HOME_MENU_SUPPORT.email}
              </a>
              <p className="mt-2 text-xs text-stone-500">{HOME_MENU_SUPPORT.note}</p>
            </div>
          </section>

          {tour ? (
            <p className="mt-6 text-center text-[10px] uppercase tracking-[0.12em] text-stone-600">
              Routes: pedestrian walking only
            </p>
          ) : null}
        </div>
      </aside>
    </>
  )
}

export default HomeMenu
