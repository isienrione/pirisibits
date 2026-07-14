import { useContext } from "react";
import { T, F, S, SHELL_SAFE_BOTTOM_INSET } from "../tokens.js";
import { PrimaryButton, TextButton, Vignette, BottomScrim } from "../ui/index.js";
import { spanishSteps } from "../images.js";
import { RedesignNavCtx } from '../nav.js';

export default function C8dResume({
  resumeLabel = 'Pick up at the Temple of Vesta',
  onContinue,
  onStartFresh,
  busy = false,
}) {
  const { navigate } = useContext(RedesignNavCtx);
  const accent   = T.actI;

  return (
    <div style={{ background: T.obsidian, height: "100%", position: "relative", overflow: "hidden", fontFamily: F.body }}>

      {/* Golden-hour Rome — Spanish Steps at sunset for warmth */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `url(${spanishSteps})`,
        backgroundSize: "cover", backgroundPosition: "center 38%",
        filter: "brightness(0.52) saturate(1.15)",
      }} />
      <Vignette />
      <BottomScrim strength={0.88} />

      {/* Content — type on the photograph */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 10,
        display: "flex", flexDirection: "column",
        justifyContent: "flex-end",
        padding: `0 ${S.edge} ${SHELL_SAFE_BOTTOM_INSET}`,
      }}>
        <h1 style={{
          fontFamily: F.display,
          fontSize: 34,
          color: T.warmWhite,
          fontWeight: 300,
          lineHeight: 1.1,
          margin: `0 0 ${S.m}`,
          textShadow: "0 2px 24px rgba(0,0,0,0.55)",
        }}>
          Rome kept your place.
        </h1>

        <p style={{
          fontSize: 15,
          color: T.muted,
          lineHeight: 1.55,
          marginBottom: S.xl,
        }}>
          {resumeLabel}
        </p>

        <PrimaryButton
          color={accent}
          textColor={T.warmWhite}
          glow={false}
          disabled={busy}
          onClick={() => (onContinue ? onContinue() : navigate("C5"))}
          style={{ marginBottom: S.m }}
        >
          Continue walking
        </PrimaryButton>

        <TextButton
          disabled={busy}
          onClick={() => (onStartFresh ? onStartFresh() : navigate("B4"))}
          style={{ width: '100%', textAlign: 'center', color: `${T.warmWhite}65` }}
        >
          Start from where I am
        </TextButton>
      </div>
    </div>
  );
}
