export default function ShellSection({ title, children, className = '' }) {
  return (
    <section className={className}>
      {title ? (
        <h2 className="mb-3 px-1 text-sm font-semibold text-ink900">{title}</h2>
      ) : null}
      <div className="bg-ink900 rounded-card divide-y divide-ink800 px-4">
        {children}
      </div>
    </section>
  )
}
