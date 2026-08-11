import { useContext } from "react";
import { T, F } from "../tokens.js";
import { spanishSteps } from "../images.js";
import { RedesignNavCtx } from '../nav.js';
import { Vignette, BottomScrim, Eyebrow } from '../ui/index.js';
import { useT } from '../../i18n/I18nProvider.jsx'

export default function C8dResume({
  resumeLabel = null,
  onContinue,
  onStartFresh,
  busy = false,
}) {
  const t = useT()
  const { navigate } = useContext(RedesignNavCtx);
  const accent   = T.actI;

  return (
    <div style={{ background: T.obsidian, height: "100%", position: "relative", overflow: "hidden", fontFamily: F.body }}>

      {/* Golden-hour Rome - Spanish Steps at sunset for warmth */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `url(${spanishSteps})`,
        backgroundSize: "cover", backgroundPosition: "center 38%",
        filter: "brightness(0.52) saturate(1.15)",
      }} />
      <Vignette />
      <BottomScrim strength={0.88} />

      {/* Content - type on the photograph */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 10,
        display: "flex", flexDirection: "column",
        justifyContent: "flex-end",
        padding: "0 28px 60px",
      }}>
        <Eyebrow color={accent}>{t('resume.eyebrow')}</Eyebrow>

        <h1 style={{
          fontFamily: F.display,
          fontSize: 34,
          color: T.warmWhite,
          fontWeight: 300,
          lineHeight: 1.1,
          margin: "14px 0 8px",
          textShadow: "0 2px 24px rgba(0,0,0,0.55)",
        }}>
          {t('resume.title')}
        </h1>

        <p style={{
          fontSize: 14,
          color: T.muted,
          lineHeight: 1.6,
          marginBottom: 32,
        }}>
          {t('resume.body')}
        </p>

        {/* Primary */}
        <button
          type="button"
          disabled={busy}
          onClick={() => (onContinue ? onContinue() : navigate("C5"))}
          style={{
            width: "100%", padding: "15px",
            background: accent, color: T.warmWhite,
            borderRadius: 12, fontFamily: F.body,
            fontWeight: 600, fontSize: 15,
            border: "none", cursor: "pointer",
            marginBottom: 14,
            boxShadow: `0 0 22px ${accent}55`,
          }}
        >
          {resumeLabel ?? t('resume.default')}
        </button>

        {/* Quiet */}
        <button
          type="button"
          disabled={busy}
          onClick={() => (onStartFresh ? onStartFresh() : navigate("B4"))}
          style={{
          width: "100%", textAlign: "center",
          fontSize: 13, color: `${T.warmWhite}65`,
          background: "none", border: "none",
          cursor: "pointer", fontFamily: F.body,
        }}>
          {t('resume.fresh')}
        </button>
      </div>
    </div>
  );
}
