import { LivingSeam } from '../components/ui/LivingSeam.jsx'

export default function ArrivalCard({ actEyebrow, waypointName }) {
  return (
    <div className="inline-flex max-w-sm flex-col">
      {actEyebrow ? (
        <p
          className="font-sans uppercase text-muted"
          style={{
            fontSize: '11px',
            letterSpacing: '0.18em',
          }}
        >
          {actEyebrow}
        </p>
      ) : null}

      <h2
        className="mt-3 font-display text-bone"
        style={{
          fontSize: '34px',
          lineHeight: 1.15,
          fontWeight: 500,
        }}
      >
        {waypointName}
      </h2>

      <LivingSeam
        vertical={false}
        className="mt-4 w-full max-w-[min(100%,12rem)]"
        style={{ height: '1.5px', width: '100%' }}
      />
    </div>
  )
}
