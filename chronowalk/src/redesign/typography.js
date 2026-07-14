/**
 * Book-like typography roles for redesign screens.
 * Fonts stay Fraunces / DM Sans — only size, LH, tracking, and spacing.
 * See docs/TYPOGRAPHY.md
 */
import { F } from './tokens.js'

/** CSS-variable-backed type roles for inline styles. */
export const TYPE = Object.freeze({
  display: Object.freeze({
    fontFamily: F.display,
    fontWeight: 300,
    fontSize: 'var(--fs-title)',
    lineHeight: 'var(--lh-display)',
    letterSpacing: 'var(--tracking-display)',
    paddingTop: 'var(--type-optical-display)',
    margin: 0,
  }),
  title: Object.freeze({
    fontFamily: F.display,
    fontWeight: 300,
    fontSize: 'var(--fs-place)',
    lineHeight: 'var(--lh-title)',
    letterSpacing: 'var(--tracking-title)',
    paddingTop: 'var(--type-optical-display)',
    margin: 0,
  }),
  heading: Object.freeze({
    fontFamily: F.display,
    fontWeight: 300,
    fontSize: 'var(--fs-h2)',
    lineHeight: 'var(--lh-heading)',
    letterSpacing: 'var(--tracking-heading)',
    margin: 0,
  }),
  cardTitle: Object.freeze({
    fontFamily: F.display,
    fontWeight: 300,
    fontSize: 'var(--fs-reflect)',
    lineHeight: 'var(--lh-heading)',
    letterSpacing: 'var(--tracking-heading)',
    margin: 0,
  }),
  body: Object.freeze({
    fontFamily: F.body,
    fontWeight: 400,
    fontSize: 'var(--fs-body)',
    lineHeight: 'var(--lh-body)',
    letterSpacing: 'var(--tracking-body)',
    margin: 0,
  }),
  prose: Object.freeze({
    fontFamily: F.display,
    fontWeight: 300,
    fontSize: 'var(--fs-reflect)',
    lineHeight: 'var(--lh-prose)',
    letterSpacing: 'var(--tracking-prose)',
    margin: 0,
  }),
  ui: Object.freeze({
    fontFamily: F.body,
    fontWeight: 400,
    fontSize: 'var(--fs-secondary)',
    lineHeight: 'var(--lh-ui)',
    letterSpacing: 'var(--tracking-ui)',
    margin: 0,
  }),
  subtitle: Object.freeze({
    fontFamily: F.body,
    fontWeight: 400,
    fontSize: 'var(--fs-secondary)',
    lineHeight: 'var(--lh-ui)',
    letterSpacing: 'var(--tracking-ui)',
    margin: 0,
  }),
  meta: Object.freeze({
    fontFamily: F.body,
    fontWeight: 400,
    fontSize: 'var(--fs-meta)',
    lineHeight: 'var(--lh-meta)',
    letterSpacing: 'var(--tracking-meta)',
    margin: 0,
  }),
  caption: Object.freeze({
    fontFamily: F.body,
    fontWeight: 400,
    fontSize: 'var(--fs-chip)',
    lineHeight: 'var(--lh-caption)',
    letterSpacing: 'var(--tracking-caption)',
    margin: 0,
  }),
  kicker: Object.freeze({
    fontFamily: F.body,
    fontWeight: 500,
    fontSize: 'var(--fs-kicker)',
    lineHeight: 'var(--lh-kicker)',
    letterSpacing: 'var(--tracking-kicker)',
    textTransform: 'uppercase',
    margin: 0,
  }),
  section: Object.freeze({
    fontFamily: F.body,
    fontWeight: 500,
    fontSize: 'var(--fs-caption)',
    lineHeight: 'var(--lh-caption)',
    letterSpacing: 'var(--tracking-section)',
    textTransform: 'uppercase',
    margin: 0,
  }),
  button: Object.freeze({
    fontFamily: F.body,
    fontWeight: 600,
    fontSize: 'var(--fs-button)',
    lineHeight: 'var(--lh-button)',
    letterSpacing: 'var(--tracking-button)',
  }),
  buttonQuiet: Object.freeze({
    fontFamily: F.body,
    fontWeight: 500,
    fontSize: 'var(--fs-button-quiet)',
    lineHeight: 'var(--lh-button)',
    letterSpacing: 'var(--tracking-button)',
  }),
  textAction: Object.freeze({
    fontFamily: F.body,
    fontWeight: 400,
    fontSize: 'var(--fs-meta)',
    lineHeight: 'var(--lh-meta)',
    letterSpacing: 'var(--tracking-meta)',
  }),
  chip: Object.freeze({
    fontFamily: F.body,
    fontWeight: 500,
    fontSize: 'var(--fs-chip)',
    lineHeight: 'var(--lh-caption)',
    letterSpacing: 'var(--tracking-chip)',
  }),
  tab: Object.freeze({
    fontFamily: F.body,
    fontWeight: 500,
    fontSize: 'var(--fs-caption)',
    lineHeight: 'var(--lh-caption)',
    letterSpacing: 'var(--tracking-tab)',
    textTransform: 'uppercase',
  }),
  status: Object.freeze({
    fontFamily: F.body,
    fontWeight: 500,
    fontSize: 'var(--fs-caption)',
    lineHeight: 'var(--lh-caption)',
    letterSpacing: 'var(--tracking-status)',
    textTransform: 'uppercase',
  }),
})

/** Vertical rhythm after type — use as marginBottom. */
export const TYPE_SPACE = Object.freeze({
  afterDisplay: 'var(--type-after-display)',
  afterHeading: 'var(--type-after-heading)',
  afterParagraph: 'var(--type-after-paragraph)',
  afterKicker: 'var(--type-after-kicker)',
})

/**
 * Display title style for a numeric size (ScreenHeader, custom heroes).
 * Keeps Fraunces; tunes LH / tracking / optical pad by size.
 */
export function displayTitleStyle(fontSize = 32) {
  const size = typeof fontSize === 'number' ? fontSize : 32
  const isLarge = size >= 32
  return {
    fontFamily: F.display,
    fontSize: size,
    fontWeight: 300,
    lineHeight: isLarge ? 'var(--lh-display)' : 'var(--lh-title)',
    letterSpacing: isLarge ? 'var(--tracking-display)' : 'var(--tracking-title)',
    paddingTop: 'var(--type-optical-display)',
    margin: 0,
  }
}
