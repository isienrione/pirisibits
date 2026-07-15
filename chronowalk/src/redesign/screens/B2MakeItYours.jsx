import { useState, useEffect } from "react";
import { T, F } from "../tokens.js";
import { spanishSteps } from "../images.js";
import { Vignette, BottomScrim } from '../ui/index.js';

export default function B2MakeItYours({
  showIosInstructions = false,
  canInstall = true,
  downloading: downloadingProp,
  downloadProgress: downloadProgressProp,
  downloadComplete = false,
  analyticsEnabled = false,
  onInstall,
  onDownload,
  onAnalyticsChange,
  onContinue,
  onSkip,
}) {
  const [downloadingLocal, setDownloadingLocal] = useState(false);
  const [dlProgressLocal, setDlProgressLocal]   = useState(0);
  const [analyticsOn, setAnalyticsOn] = useState(Boolean(analyticsEnabled));

  const downloading = downloadingProp ?? downloadingLocal;
  const dlProgress = downloadProgressProp ?? dlProgressLocal;

  useEffect(() => {
    setAnalyticsOn(Boolean(analyticsEnabled));
  }, [analyticsEnabled]);

  const setAnalytics = (next) => {
    setAnalyticsOn(next);
    onAnalyticsChange?.(next);
  };

  useEffect(() => {
    if (downloadingProp != null) return undefined;
    if (!downloadingLocal) return undefined;
    const iv = setInterval(() => {
      setDlProgressLocal(p => {
        if (p >= 1) { clearInterval(iv); return 1; }
        return Math.min(p + 0.008, 1);
      });
    }, 40);
    return () => clearInterval(iv);
  }, [downloadingLocal, downloadingProp]);

  const ringR = 22;
  const ringC = 2 * Math.PI * ringR; // ≈ 138.2

  return (
    <div style={{ background: T.obsidian, height: "100%", position: "relative", overflow: "hidden", fontFamily: F.body }}>
      {/* Full-bleed dusk-Rome photo — Spanish Steps golden hour */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `url(${spanishSteps})`,
        backgroundSize: "cover", backgroundPosition: "center 25%",
        filter: "brightness(0.36) saturate(0.85)",
      }} />
      <Vignette />
      <BottomScrim strength={0.90} />

      {/* Content — all type ON the photograph */}
      <div style={{ position: "relative", zIndex: 10, height: "100%", display: "flex", flexDirection: "column", padding: "56px 28px 40px", overflowY: "auto" }}>

        {/* Small logomark */}
        <div style={{ marginBottom: 28 }}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="8.5" stroke={T.ember} strokeWidth="1.3" style={{ filter: "drop-shadow(0 0 4px rgba(232,161,60,0.5))" }} />
            <line x1="10" y1="1.5" x2="10" y2="18.5" stroke={T.ember} strokeWidth="1.3" />
          </svg>
        </div>

        <h2 style={{ fontFamily: F.display, fontSize: 40, color: T.warmWhite, fontWeight: 300, lineHeight: 1.05, marginBottom: 10, textShadow: "0 2px 24px rgba(0,0,0,0.5)" }}>
          Make it yours.
        </h2>
        <p style={{ fontSize: 14, color: T.muted, marginBottom: 28, lineHeight: 1.6 }}>Three small things before Rome.</p>

        {/* ── Row 1 — Home screen ── */}
        <div style={{ borderTop: `1px solid ${T.ink800}`, paddingTop: 22, paddingBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 16, color: T.warmWhite, fontWeight: 500, marginBottom: 6, lineHeight: 1.4 }}>
                Put Rome on your home screen
              </p>
              <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.6 }}>
                {showIosInstructions
                  ? <>Tap <span style={{ color: `${T.warmWhite}BB` }}>Share</span> — then &quot;Add to Home Screen&quot;</>
                  : 'Install a home-screen icon for tour day.'}
              </p>
            </div>
            {/* Platform illustration — iOS share-sheet arrow */}
            <div style={{ flexShrink: 0 }}>
              <svg width="46" height="46" viewBox="0 0 46 46" fill="none">
                {/* Phone body */}
                <rect x="9" y="4" width="28" height="38" rx="4" stroke={`${T.muted}55`} strokeWidth="1.2" />
                {/* Share arrow up */}
                <line x1="23" y1="30" x2="23" y2="17" stroke={T.warmWhite} strokeWidth="1.5" strokeLinecap="round" />
                <polyline points="17,23 23,17 29,23" fill="none" stroke={T.warmWhite} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                {/* Box at arrow base */}
                <path d="M18 27 L15 27 L15 38 L31 38 L31 27 L28 27" stroke={`${T.warmWhite}80`} strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* ── Row 2 — Download ── */}
        <div style={{ borderTop: `1px solid ${T.ink800}`, paddingTop: 22, paddingBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 16, color: T.warmWhite, fontWeight: 500, marginBottom: 5, lineHeight: 1.4 }}>
                Download the walk
                <span style={{ color: T.muted, fontWeight: 400, fontSize: 14 }}> — 215 MB</span>
              </p>
              <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.6 }}>
                Streets of Rome, weak signal, strong stories.
              </p>
              {downloadComplete || dlProgress >= 1 ? (
                <p style={{ fontSize: 12, color: T.actII, marginTop: 6 }}>Downloaded ✓</p>
              ) : downloading && dlProgress > 0 && dlProgress < 1 ? (
                <p style={{ fontSize: 12, color: T.ember, marginTop: 6, fontVariantNumeric: "tabular-nums" }}>
                  {Math.round(dlProgress * 215)} MB of 215 MB
                </p>
              ) : null}
            </div>

            {/* Thin act-gradient progress ring */}
            <div
              style={{ flexShrink: 0, cursor: downloadComplete || dlProgress >= 1 ? "default" : "pointer" }}
              onClick={() => {
                if (downloadComplete || dlProgress >= 1) return
                if (onDownload) {
                  onDownload()
                  return
                }
                if (!downloadingLocal && dlProgress < 1) setDownloadingLocal(true)
              }}
            >
              <svg width="52" height="52" viewBox="0 0 52 52">
                <defs>
                  <linearGradient id="ringGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={T.actI}   />
                    <stop offset="40%"  stopColor={T.actIII} />
                    <stop offset="80%"  stopColor={T.actIV}  />
                    <stop offset="100%" stopColor={T.actVI}  />
                  </linearGradient>
                </defs>
                {/* Track */}
                <circle cx="26" cy="26" r={ringR} fill="none" stroke={T.ink800} strokeWidth="2" />
                {/* Progress arc */}
                <circle
                  cx="26" cy="26" r={ringR}
                  fill="none"
                  stroke={downloadComplete || dlProgress >= 1 ? T.actII : "url(#ringGrad)"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  transform="rotate(-90 26 26)"
                  style={{
                    strokeDasharray: ringC,
                    strokeDashoffset: ringC * (1 - dlProgress),
                    transition: "stroke-dashoffset 160ms linear, stroke 400ms",
                    filter: dlProgress > 0 && dlProgress < 1 ? `drop-shadow(0 0 3px ${T.actI}90)` : "none",
                  }}
                />
                {/* Down arrow when idle */}
                {!downloading && !downloadComplete && dlProgress < 1 && (
                  <>
                    <line x1="26" y1="19" x2="26" y2="30" stroke={T.warmWhite} strokeWidth="1.5" strokeLinecap="round" />
                    <polyline points="20,26 26,32 32,26" fill="none" stroke={T.warmWhite} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </>
                )}
                {/* Checkmark when done */}
                {(downloadComplete || dlProgress >= 1) && (
                  <polyline points="17,26 23,32 35,20" fill="none" stroke={T.actII} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                )}
              </svg>
            </div>
          </div>
        </div>

        {/* ── Row 3 — Analytics (opt-in) ── */}
        <div style={{ borderTop: `1px solid ${T.ink800}`, paddingTop: 22, paddingBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 16, color: T.warmWhite, fontWeight: 500, marginBottom: 6, lineHeight: 1.4 }}>
                Help improve ChronoWalk
              </p>
              <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.6 }}>
                Anonymous usage only — we count moments, never people, and never sell your data.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={analyticsOn}
              aria-label={analyticsOn ? 'Disable analytics' : 'Enable analytics'}
              onClick={() => setAnalytics(!analyticsOn)}
              style={{
                flexShrink: 0,
                width: 52,
                height: 32,
                borderRadius: 999,
                border: 'none',
                padding: 3,
                cursor: 'pointer',
                background: analyticsOn ? T.ember : T.ink800,
                transition: 'background 160ms ease',
              }}
            >
              <span
                aria-hidden
                style={{
                  display: 'block',
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: analyticsOn ? T.obsidian : T.muted,
                  transform: analyticsOn ? 'translateX(20px)' : 'translateX(0)',
                  transition: 'transform 160ms ease, background 160ms ease',
                }}
              />
            </button>
          </div>
        </div>

        {/* Bottom hairline divider */}
        <div style={{ borderTop: `1px solid ${T.ink800}` }} />

        <div style={{ marginTop: "auto", textAlign: "center", paddingTop: 24, display: 'grid', gap: 12 }}>
          {canInstall ? (
            <button
              type="button"
              onClick={() => onInstall?.()}
              style={{ width: '100%', padding: '15px', background: T.ember, color: T.obsidian, borderRadius: 12, fontFamily: F.body, fontWeight: 600, fontSize: 15, border: 'none', cursor: 'pointer' }}
            >
              {showIosInstructions ? 'Got it — continue' : 'Add to home screen'}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => (onContinue ? onContinue() : onSkip?.())}
            style={{ width: '100%', padding: '14px', background: 'transparent', color: T.warmWhite, borderRadius: 12, fontFamily: F.body, fontSize: 15, border: `1px solid ${T.ink800}`, cursor: 'pointer' }}
          >
            Continue to Rome
          </button>
          <button type="button" onClick={() => (onSkip ? onSkip() : undefined)} style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, fontSize: 13, letterSpacing: "0.06em", fontFamily: F.body }}>
            I'll do this later
          </button>
        </div>
      </div>
    </div>
  );
}
