import { GlassPanel } from '../components/ui'

export default function ShellSection({ title, children, className = '' }) {
  return (
    <section className={className}>
      {title ? (
        <h2 className="mb-3 px-1 text-sm font-semibold text-deep-slate">{title}</h2>
      ) : null}
      <GlassPanel grain className="divide-y divide-parchment/70 px-4">
        {children}
      </GlassPanel>
    </section>
  )
}
