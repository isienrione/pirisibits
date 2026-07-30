import { T, F } from "../tokens.js";
import { C1bRouteSheet } from './C1bRouteSheet.jsx';

export default function C1bStandalone() {
  return (
    <div style={{ background: T.bone, height: "100%", position: "relative", overflow: "hidden", fontFamily: F.body }}>
      {/* Dimmed C1 spine as contextual background */}
      <div style={{ position: "absolute", inset: 0, opacity: 0.35, pointerEvents: "none" }}>
        <div style={{ background: T.bone, height: "100%", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "50px 20px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: F.body, fontSize: 11, color: T.actI, letterSpacing: "0.18em", textTransform: "uppercase" }}>HEART OF ANCIENT ROME</span>
          </div>
          {/* Seam */}
          <div style={{ position: "relative", flex: 1 }}>
            <div style={{ position: "absolute", left: 38, top: 0, bottom: 0, width: 1.5, background: T.ember, opacity: 0.5 }} />
          </div>
        </div>
      </div>
      {/* The sheet · always open */}
      <C1bRouteSheet />
    </div>
  );
}
