/**
 * Landing-only section wrapper with stable anchor id and editorial variants.
 */
export default function LandingSection({
  id,
  title,
  children,
  className = '',
  variant = 'dark',
  hideTitle = false,
  as = 'section',
}) {
  const Tag = as
  return (
    <Tag
      id={id}
      className={`cw-landing-section cw-landing-section--${variant} ${className}`.trim()}
      aria-labelledby={hideTitle ? undefined : `${id}-heading`}
    >
      <div className="cw-landing-section__inner">
        {hideTitle ? null : (
          <h2 id={`${id}-heading`} className="cw-landing-section__title">
            {title}
          </h2>
        )}
        <div className="cw-landing-section__body">{children}</div>
      </div>
    </Tag>
  )
}
