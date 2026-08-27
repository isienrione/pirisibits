# 06 — Screen Registry, QA y handoff

## Objetivo

Cerrar el día con una app demostrable y una visión honesta de toda la superficie prioritaria, sin confundir shells con producto terminado.

## Implementación

1. Extrae las 41 entradas gate S desde `docs/canonical/07_SCREEN_INVENTORY.md` a `ScreenRegistry` tipado. No agregues pantallas de imaginación propia.
2. Clasifica cada entrada:
   - `functional`: flujo y estado reales del demo;
   - `visual-draft`: composición navegable con acciones explícitamente pendientes;
   - `not-started`: contrato visible sólo en Dev Gallery.
3. Dev Gallery permite filtrar por grupo, densidad y estado, abrir cualquier screen y volver sin romper el flujo principal.
4. Cada `ContractScreen` muestra propósito canónico, densidad, gate, dependencias y “qué falta para funcional”; nunca finge éxito.
5. Audita safe areas, Dynamic Type, VoiceOver, contraste, Reduce Motion, estados vacíos y touch targets.
6. Crea `docs/demo/DEMO_SCRIPT.md` con un recorrido de 5–7 minutos y pasos exactos para activar Mystery, Reveal, GPS weak, offline y adaptación.
7. Crea `docs/demo/TODAY_HANDOFF.md`: resultado, archivos, pruebas, fallos, deuda, credenciales faltantes, conflictos canónicos y próximos cinco tickets ordenados por valor.
8. Ejecuta todos los checks disponibles. No cambies configuración para silenciar fallos.

## Pruebas finales

```sh
pnpm typecheck
pnpm test
pnpm --filter @chronowalk/traveler typecheck
```

Ejecuta además el arranque Expo y valida el primary flow en el simulador disponible. Si no hay simulador o development build, documenta el bloqueo y entrega instrucciones exactas, pero no declares QA visual superado.

## Informe final obligatorio

- Qué se puede demostrar hoy.
- Qué está simulado y dónde se sustituye.
- Qué datos provienen de fuente real.
- Qué pantallas son funcionales, visual-draft y not-started.
- Tests y resultado.
- Cinco siguientes tickets con Definition of Done.

