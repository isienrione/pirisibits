/**
 * How to open ChronoWalk: App Store / Play Store (coming soon) or browser (available now).
 */
export default function LandingGetAppSection() {
  return (
    <section
      id="get-app"
      className="cw-v4-getapp"
      aria-labelledby="cw-v4-getapp-heading"
    >
      <div className="cw-v4-wrap cw-v4-getapp__inner">
        <header className="cw-v4-section-head">
          <p className="cw-v4-eyebrow">GET THE APP</p>
          <h2 id="cw-v4-getapp-heading" className="cw-v4-section-title">
            Open ChronoWalk your way.
          </h2>
          <p className="cw-v4-section-lead">
            Use it in your browser today. Native App Store and Play Store builds are on the way.
          </p>
        </header>

        <div className="cw-v4-getapp__options">
          <button
            type="button"
            className="cw-v4-getapp__option cw-v4-getapp__option--dimmed"
            disabled
            aria-disabled="true"
          >
            <span className="cw-v4-getapp__option-icon" aria-hidden>
              <svg viewBox="0 0 24 24" width="28" height="28">
                <path
                  fill="currentColor"
                  d="M16.37 12.86c.03 2.98 2.61 3.97 2.64 3.98-.02.07-.41 1.41-1.37 2.8-.83 1.2-1.69 2.4-3.04 2.42-1.33.03-1.76-.79-3.28-.79s-2 .77-3.25.81c-1.3.05-2.29-1.3-3.13-2.49C3.2 16.88 1.94 12.96 3.4 10.3c.73-1.32 2.03-2.15 3.44-2.18 1.35-.03 2.62.91 3.28.91.65 0 2.17-1.12 3.66-.96.62.03 2.37.25 3.5 1.9-.09.05-2.09 1.22-2.31 3.89ZM14.3 6.13c.7-.85 1.17-2.03 1.04-3.21-1.01.04-2.23.67-2.96 1.52-.65.75-1.23 1.96-1.08 3.11 1.14.09 2.3-.58 3-1.42Z"
                />
              </svg>
            </span>
            <span className="cw-v4-getapp__option-copy">
              <span className="cw-v4-getapp__option-eyebrow">Download on the</span>
              <span className="cw-v4-getapp__option-title">App Store</span>
            </span>
          </button>

          <button
            type="button"
            className="cw-v4-getapp__option cw-v4-getapp__option--dimmed"
            disabled
            aria-disabled="true"
          >
            <span className="cw-v4-getapp__option-icon" aria-hidden>
              <svg viewBox="0 0 24 24" width="28" height="28">
                <path
                  fill="currentColor"
                  d="M3.6 2.5c.2-.2.5-.3.8-.2l12.9 7.3c.4.2.6.6.6 1s-.2.8-.6 1L4.4 18.9c-.3.2-.7.1-.9-.1-.2-.2-.3-.5-.3-.8V3.4c0-.3.1-.6.4-.9Zm14.8 8.3 2.3 1.3c.7.4.7 1.4 0 1.8l-2.3 1.3-3.2-2.2 3.2-2.2ZM3.9 20.1l9.4-5.3 3.1 2.1-11.4 4.1c-.6.2-1.2-.4-1.1-1Z"
                />
              </svg>
            </span>
            <span className="cw-v4-getapp__option-copy">
              <span className="cw-v4-getapp__option-eyebrow">Get it on</span>
              <span className="cw-v4-getapp__option-title">Google Play</span>
            </span>
          </button>

          <a href="/" className="cw-v4-getapp__option cw-v4-getapp__option--active">
            <span className="cw-v4-getapp__option-icon" aria-hidden>
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none">
                <rect
                  x="4"
                  y="3"
                  width="16"
                  height="18"
                  rx="2.5"
                  stroke="currentColor"
                  strokeWidth="1.75"
                />
                <path
                  d="M8 7h8M8 11h8M8 15h5"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span className="cw-v4-getapp__option-copy">
              <span className="cw-v4-getapp__option-eyebrow">Available now</span>
              <span className="cw-v4-getapp__option-title">Use in browser</span>
              <span className="cw-v4-getapp__option-note">
                No App Store download. Open ChronoWalk in your mobile browser. Initial setup needs
                internet; then prepare the walk for offline use.
              </span>
            </span>
          </a>
        </div>

        <p className="cw-v4-getapp__soon">
          Coming soon: native App Store and Google Play apps. ChronoWalk is a browser app today.
        </p>
      </div>
    </section>
  )
}
