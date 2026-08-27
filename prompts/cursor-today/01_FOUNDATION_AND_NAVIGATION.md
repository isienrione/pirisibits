# 01 — Foundation, design system y navegación

## Objetivo

Reemplazar la entrada de diagnóstico por un shell de producto reconocible y preparar una base que permita construir pantallas rápido sin convertirlas en templates uniformes.

## Inputs obligatorios

- `apps/traveler/App.tsx`, `app.config.ts`, `src/screens/*`, `src/capabilities/*`.
- `docs/canonical/03_EXPERIENCE_DESIGN_SYSTEM.md` y `08_VISUAL_INTERACTION_SYSTEM.md`.
- Dependencias y versiones exactas del workspace; no actualices Expo o React Native.

## Implementación

1. Crea tokens en `apps/traveler/src/design/`: colores, spacing, typography, motion y `EditorialDensity = 0|1|2|3`.
2. Implementa un `DensityProvider` y primitivas mínimas: `Screen`, `EditorialLabel`, `PrimaryAction`, `PaperRule`, `RouteLine`, `PhotoPlaceholder`, `InstrumentMetric`. Las primitivas decorativas deben no renderizar en D0.
3. Instala sólo fuentes/dependencias Expo compatibles necesarias. Usa Fraunces, DM Sans y Barlow Condensed si cargan de forma fiable; si no, conserva fallbacks tipográficos explícitos y documenta el bloqueo.
4. Define navegación tipada por grupos de flujo. No pongas 41 pantallas en un Stack monolítico si puede dividirse por navegadores de flow.
5. `App.tsx` inicia en `Welcome`. `Diagnostics` queda accesible únicamente desde Settings cuando `__DEV__` sea verdadero.
6. Crea un estado global pequeño con Context + reducer; no agregues Redux/Zustand. Separa `onboarding`, `route`, `experience`, `session` y `system`.
7. Actualiza sólo el nombre visible de la app a `ChronoWalk`; conserva bundle identifiers y capacidades nativas existentes.
8. Agrega un `DevScreenGallery` vacío pero navegable para que las fases siguientes registren pantallas.

## Restricciones

- No crear una `<Card>` universal.
- No gradients, dashboards, formularios beige ni collage en D0.
- No mover lógica de dominio a componentes.
- No solicitar permisos al arrancar.

## Validación

- Typecheck traveler.
- App arranca sin solicitar ubicación.
- Diagnostics conserva audio, lifecycle y mapa de prueba.
- D0 impide renderizar primitivas editoriales decorativas mediante test o invariant de desarrollo.

## Entrega

Actualiza `docs/demo/TODAY_PROGRESS.md` con estructura creada, dependencias añadidas y cualquier diferencia frente al canon.

