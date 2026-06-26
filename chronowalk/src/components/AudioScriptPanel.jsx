import React, { useState } from 'react'

const AudioScriptPanel = ({ label, script, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen)

  if (!script) return null

  return (
    <div className="rounded-xl border border-stone-700/80 bg-stone-900/60">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-amber-200"
        aria-expanded={open}
      >
        <span>{label}</span>
        <span aria-hidden="true" className="text-stone-400">
          {open ? '−' : '+'}
        </span>
      </button>
      {open ? (
        <div className="border-t border-stone-700/80 px-4 py-3 text-sm leading-relaxed text-stone-300">
          {script}
        </div>
      ) : null}
    </div>
  )
}

export default AudioScriptPanel
