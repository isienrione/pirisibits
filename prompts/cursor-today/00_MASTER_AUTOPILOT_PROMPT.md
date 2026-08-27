# Prompt maestro — construir una demo navegable hoy

Trabaja como principal product engineer de ChronoWalk. Tu objetivo es convertir el spike actual de `apps/traveler` en una **versión borrador navegable y demostrable hoy**, sin esperar que la curaduría ni el algoritmo estén terminados.

## Primero: entender y proteger

1. Inspecciona `git status`; no pises cambios ajenos ni uses comandos destructivos.
2. Lee completos: `CLAUDE.md`, `docs/canonical/01_MASTER_PRODUCT_MANUAL.md`, `02_PRODUCT_ARCHITECTURE.md`, `03_EXPERIENCE_DESIGN_SYSTEM.md`, `05_CITY_SANTIAGO_PRODUCT_CONTRACT.md`, `07_SCREEN_INVENTORY.md`, `08_VISUAL_INTERACTION_SYSTEM.md`.
3. Inspecciona `apps/traveler`, sus capabilities y los contratos exportados por `packages/domain`.
4. Ejecuta baseline: instalación sólo si hace falta, `pnpm typecheck`, `pnpm test`, y `pnpm --filter @chronowalk/traveler typecheck`. Registra fallos preexistentes; no debilites tests.
5. Crea `docs/demo/TODAY_PROGRESS.md` con checklist, decisiones, comandos y bloqueos. Actualízalo al cerrar cada fase.

## Contrato de alcance

Construye dos capas:

### Capa A — vertical slice funcional

Debe poder recorrerse sin calle real:

`A01 → A03 → A05 → A06 → A07 → A08 → A10/K01 → B01 → B04 → B05/B06 → C01 → C03 → D01/D02 → D05 → D07/D08 → D09 → D12 → E01 → E03 → C07/B03`.

Incluye accesos a `C05`, `C06/F01/F03`, `G01`, `I01`, `J01`, `J03`, `K02` y `K05`.

### Capa B — amplitud inspeccionable

Crea un `ScreenRegistry` tipado a partir del gate S de `07_SCREEN_INVENTORY.md`. Cada entrada declara `id`, `title`, `density`, `status`, `purpose` y `component`. Las pantallas aún no funcionales usan un `ContractScreen` honesto y sólo son accesibles desde un `DevScreenGallery`, nunca desde el flujo principal del viajero.

## Arquitectura de demo reemplazable

- Define view models y puertos de app entre UI y Engine. Las pantallas consumen `TravelerAppService`, no `packages/city-data` ni JSON de Santiago.
- Implementa `DemoTravelerAppService` como adapter temporal y explícito.
- Genera el fixture móvil mediante un script Node que lea las fuentes existentes en `docs/core_a`; el runtime móvil no puede usar `node:fs`.
- Usa únicamente títulos, coordenadas y claims que existan en esas fuentes. Si un dato falta, no lo rellenes.
- La ruta demo puede ser determinista, pero debe conservar las formas de `ComposedRoute`, `RouteTimeReport` y `WhyReason` o mapearlas explícitamente a view models.
- La sustitución futura por el City Engine debe ocurrir en el composition root, no en cada pantalla.

## Forma de ejecución autónoma

Lee y ejecuta, en orden, los prompts `01` a `06` de esta carpeta. No esperes aprobación entre tareas. Después de cada una:

1. ejecuta las pruebas indicadas;
2. corrige fallos causados por tu cambio;
3. actualiza `TODAY_PROGRESS.md`;
4. realiza un commit atómico sólo si Git está disponible y puedes incluir exclusivamente tus cambios;
5. continúa con la siguiente tarea.

No te detengas por falta de fotos, audio final, algoritmo, contenido terminado o token Mapbox: implementa estados honestos y adapters, y continúa. Sí detente ante conflicto canónico, credencial requerida, dato que habría que inventar o riesgo de sobrescribir trabajo ajeno.

## Definition of done de hoy

- App inicia en Portada, no en Diagnostics.
- Vertical slice completo navegable con back/forward coherente.
- Una propuesta dominante, una ruta-partitura, Why this estructurado, caminata D0, llegada explícita, Hero, Discovery, Mystery, Reveal, bifurcación, recomposición con delta y resume.
- Ubicación foreground es lazy; denegación y GPS débil tienen salida.
- Mapbox no deja pantalla en blanco cuando falta token.
- El demo nunca afirma usar personalización o factibilidad que no calculó.
- `pnpm typecheck`, `pnpm test` y traveler typecheck pasan, o los únicos fallos restantes están documentados como preexistentes con evidencia.
- `docs/demo/DEMO_SCRIPT.md` permite a una persona demostrar el loop en 5–7 minutos.
- `docs/demo/TODAY_HANDOFF.md` enumera archivos cambiados, pruebas, fallos, deudas y próximos cinco tickets.

Empieza ahora. No produzcas una explicación extensa antes de editar: crea el plan de archivos, escríbelo en `TODAY_PROGRESS.md` y ejecuta.
