/**
 * Compact status marks (Visited / Here / DONE / NOW).
 * Keeps existing letter-spacing and case per kind.
 */
export function StatusMark({ kind, color, style }) {
  const recipes = {
    visited: {
      children: 'Visited',
      fontSize: 11,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
    },
    here: {
      children: 'Here',
      fontSize: 11,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
    },
    done: {
      children: 'DONE',
      fontSize: 10,
      letterSpacing: '0.1em',
      textTransform: 'none',
    },
    now: {
      children: 'NOW',
      fontSize: 10,
      letterSpacing: '0.1em',
      textTransform: 'none',
    },
  }

  const recipe = recipes[kind]
  if (!recipe) return null

  return (
    <span
      style={{
        fontSize: recipe.fontSize,
        color,
        letterSpacing: recipe.letterSpacing,
        textTransform: recipe.textTransform,
        minHeight: kind === 'visited' || kind === 'here' ? 16 : undefined,
        ...style,
      }}
    >
      {recipe.children}
    </span>
  )
}
