import { F } from '../tokens.js'
import { TYPE } from '../typography.js'

/**
 * Compact status marks (Visited / Here / DONE / NOW).
 * Caption hierarchy: status uses section-scale type with status tracking.
 */
export function StatusMark({ kind, color, style }) {
  const recipes = {
    visited: {
      children: 'Visited',
      textTransform: 'uppercase',
    },
    here: {
      children: 'Here',
      textTransform: 'uppercase',
    },
    done: {
      children: 'DONE',
      textTransform: 'none',
    },
    now: {
      children: 'NOW',
      textTransform: 'none',
    },
  }

  const recipe = recipes[kind]
  if (!recipe) return null

  return (
    <span
      style={{
        ...TYPE.status,
        fontFamily: F.body,
        color,
        textTransform: recipe.textTransform,
        minHeight: kind === 'visited' || kind === 'here' ? 16 : undefined,
        ...style,
      }}
    >
      {recipe.children}
    </span>
  )
}
