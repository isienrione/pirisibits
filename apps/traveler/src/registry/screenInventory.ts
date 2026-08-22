import type { EditorialDensity } from '../design/tokens'
import type { ScreenId } from '../state/types'

export type ScreenStatus = 'functional' | 'visual-draft' | 'not-started'

export type ScreenRegistryEntry = {
  id: ScreenId
  title: string
  density: EditorialDensity
  status: ScreenStatus
  purpose: string
  group: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'I' | 'J' | 'K' | 'L' | 'dev'
  gate: 'S'
  missingForFunctional: string | null
}

export const SCREEN_REGISTRY: ScreenRegistryEntry[] = [
  { id: 'A01', title: 'Portada', density: 3, status: 'functional', purpose: 'Open on ChronoWalk, not diagnostics.', group: 'A', gate: 'S', missingForFunctional: null },
  { id: 'A03', title: 'Intereses', density: 2, status: 'functional', purpose: 'One interest decision.', group: 'A', gate: 'S', missingForFunctional: null },
  { id: 'A05', title: 'Estilo de exploración', density: 2, status: 'functional', purpose: 'Linger vs cover ground.', group: 'A', gate: 'S', missingForFunctional: null },
  { id: 'A06', title: 'Movilidad', density: 1, status: 'functional', purpose: 'Stairs / walking constraint.', group: 'A', gate: 'S', missingForFunctional: null },
  { id: 'A07', title: 'Tiempo disponible', density: 2, status: 'functional', purpose: '60 / 120 / 180 minutes.', group: 'A', gate: 'S', missingForFunctional: null },
  { id: 'A08', title: 'Permiso de ubicación', density: 1, status: 'functional', purpose: 'Ask only after the why is clear.', group: 'A', gate: 'S', missingForFunctional: null },
  { id: 'A10', title: 'Listo', density: 2, status: 'functional', purpose: 'Hand-off into composition.', group: 'A', gate: 'S', missingForFunctional: null },
  { id: 'K01', title: 'Calculando tu tarde', density: 2, status: 'functional', purpose: 'Fragments assembling, not a spinner.', group: 'K', gate: 'S', missingForFunctional: null },
  { id: 'B01', title: 'Home — propuesta', density: 2, status: 'functional', purpose: 'One dominant recommendation.', group: 'B', gate: 'S', missingForFunctional: null },
  { id: 'B03', title: 'Home con ruta activa', density: 1, status: 'functional', purpose: 'Resume the live route.', group: 'B', gate: 'S', missingForFunctional: null },
  { id: 'B04', title: 'Ruta propuesta', density: 2, status: 'functional', purpose: 'Score, not a card list.', group: 'B', gate: 'S', missingForFunctional: null },
  { id: 'B05', title: '¿Por qué esta ruta?', density: 2, status: 'functional', purpose: 'Structured WhyReason lines.', group: 'B', gate: 'S', missingForFunctional: null },
  { id: 'B06', title: 'Ajustar plan', density: 1, status: 'functional', purpose: 'Time / energy / character via the service.', group: 'B', gate: 'S', missingForFunctional: null },
  { id: 'C01', title: 'Caminata', density: 0, status: 'functional', purpose: 'D0 instrument: next place, optional distance.', group: 'C', gate: 'S', missingForFunctional: null },
  { id: 'C03', title: 'Llegada', density: 1, status: 'functional', purpose: 'Human confirm before narration.', group: 'C', gate: 'S', missingForFunctional: null },
  { id: 'C04', title: 'Control de ruta', density: 1, status: 'functional', purpose: 'Pause, skip, map, list.', group: 'C', gate: 'S', missingForFunctional: null },
  { id: 'C05', title: 'Ruta en curso — lista', density: 1, status: 'functional', purpose: 'Active remainder as a line.', group: 'C', gate: 'S', missingForFunctional: null },
  { id: 'C06', title: 'Ruta en curso — mapa', density: 0, status: 'functional', purpose: 'Instrument map with sourced points.', group: 'C', gate: 'S', missingForFunctional: null },
  { id: 'C07', title: 'Retomar sesión', density: 1, status: 'functional', purpose: 'Restore exact cursor.', group: 'C', gate: 'S', missingForFunctional: null },
  { id: 'D01', title: 'Hero — portada', density: 3, status: 'functional', purpose: 'Story / look-cue cover.', group: 'D', gate: 'S', missingForFunctional: null },
  { id: 'D02', title: 'Hero — runtime', density: 2, status: 'functional', purpose: 'Spoken line from sourced transcript.', group: 'D', gate: 'S', missingForFunctional: null },
  { id: 'D05', title: 'Discovery — detalle', density: 2, status: 'functional', purpose: 'Compact discovery, not a hero clone.', group: 'D', gate: 'S', missingForFunctional: null },
  { id: 'D07', title: 'Mystery — carta previa', density: 2, status: 'functional', purpose: 'Spoiler-safe title, hint, cost.', group: 'D', gate: 'S', missingForFunctional: null },
  { id: 'D08', title: 'Mystery — revelado', density: 2, status: 'functional', purpose: 'Identity only after reveal.', group: 'D', gate: 'S', missingForFunctional: null },
  { id: 'D09', title: 'Reveal — Then/Now', density: 3, status: 'functional', purpose: 'Archive interaction with provenance.', group: 'D', gate: 'S', missingForFunctional: null },
  { id: 'D12', title: 'Experiencia completada', density: 2, status: 'functional', purpose: 'Lead into bifurcation. No XP.', group: 'D', gate: 'S', missingForFunctional: null },
  { id: 'E01', title: 'Bifurcación', density: 2, status: 'functional', purpose: 'Dominant option plus two alternatives.', group: 'E', gate: 'S', missingForFunctional: null },
  { id: 'E03', title: 'Ruta recompuesta', density: 2, status: 'functional', purpose: 'Show the delta the service produced.', group: 'E', gate: 'S', missingForFunctional: null },
  { id: 'E04', title: 'Saltar o quitar', density: 1, status: 'functional', purpose: 'Remove a stop without punishment.', group: 'E', gate: 'S', missingForFunctional: null },
  { id: 'F01', title: 'Mapa — ciudad', density: 1, status: 'functional', purpose: 'Hierarchy of treatments on sourced points.', group: 'F', gate: 'S', missingForFunctional: null },
  { id: 'F03', title: 'Mapa — hoja de detalle', density: 1, status: 'functional', purpose: 'Type, time, provenance, save.', group: 'F', gate: 'S', missingForFunctional: null },
  { id: 'G01', title: 'Guardados', density: 1, status: 'functional', purpose: 'Local saves. No account.', group: 'G', gate: 'S', missingForFunctional: null },
  { id: 'I01', title: 'Ajustes', density: 1, status: 'functional', purpose: 'Dev tools only in __DEV__.', group: 'I', gate: 'S', missingForFunctional: null },
  { id: 'J01', title: 'Sin conexión — ruta protegida', density: 1, status: 'functional', purpose: 'Continue from persisted metadata.', group: 'J', gate: 'S', missingForFunctional: null },
  { id: 'J03', title: 'GPS débil', density: 0, status: 'functional', purpose: 'Useful exit when accuracy is weak.', group: 'J', gate: 'S', missingForFunctional: null },
  { id: 'K02', title: 'Recomponiendo la ruta', density: 2, status: 'functional', purpose: 'Physical recompose animation.', group: 'K', gate: 'S', missingForFunctional: null },
  { id: 'K05', title: 'Buscando ubicación', density: 0, status: 'functional', purpose: 'Awaiting first fix.', group: 'K', gate: 'S', missingForFunctional: null },
  { id: 'L01', title: 'Detail Hunt', density: 2, status: 'visual-draft', purpose: 'Hunt needs a real clue, target, and payoff.', group: 'L', gate: 'S', missingForFunctional: 'No hunt clue/target/payoff in Rome sources used for this demo.' },
  { id: 'Diagnostics', title: 'Diagnostics', density: 1, status: 'functional', purpose: 'Dev-only audio, lifecycle, map probe.', group: 'dev', gate: 'S', missingForFunctional: null },
  { id: 'Gallery', title: 'Dev Screen Gallery', density: 1, status: 'functional', purpose: 'Inspect every Gate S screen honestly.', group: 'dev', gate: 'S', missingForFunctional: null },
]
