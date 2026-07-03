import { GlassPanel } from '../components/ui'

export default function ShellSection({ title, children, className = '' }) {
  return (
    <section className={className}>
      {title ? (
        <h2 className="mb-3 px-1 text-sm font-semibold text-ink">{title}</h2>
      ) : null}
      <GlassPanel className="divide-y divide-border-daylight px-4">
        {children}
      </GlassPanel>
    </section>
  )
}
