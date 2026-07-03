import { useState } from 'react'
import { ROME_ACTS } from '../../../data/romePacing.js'
import { actAccentValue } from '../../../design/actAccents.ts'
import { Button } from '../../ui'

export default function BeforeStartScreen({ onBegin }) {
  const [selectedActId, setSelectedActId] = useState(ROME_ACTS[0]?.id ?? 'act1')

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col px-6 pb-8 pt-10">
      <p className="text-eyebrow uppercase text-muted">Before you walk</p>
      <h1 className="mt-3 font-display text-4xl font-medium leading-tight text-warmwhite">
        Choose your first act
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        Rome unfolds in acts — pick where your path begins, then step into the city.
      </p>

      <ul className="mt-8 space-y-3">
        {ROME_ACTS.map((act) => {
          const selected = act.id === selectedActId

          return (
            <li key={act.id}>
              <button
                type="button"
                onClick={() => setSelectedActId(act.id)}
                className={`w-full rounded-[var(--radius-card)] border px-4 py-4 text-left transition-colors ${
                  selected
                    ? 'border-ember/40 bg-[color-mix(in_srgb,var(--ember)_8%,var(--obsidian))]'
                    : 'border-ink800 bg-transparent'
                }`}
              >
                <p
                  className="text-eyebrow uppercase"
                  style={{ color: actAccentValue(act.id) }}
                >
                  Act {act.numeral} · {act.title}
                </p>
                <p className="mt-2 text-sm text-muted">{act.promise}</p>
              </button>
            </li>
          )
        })}
      </ul>

      <div className="mt-auto pt-10">
        <Button fullWidth onClick={() => onBegin?.(selectedActId)}>
          Begin
        </Button>
      </div>
    </div>
  )
}
