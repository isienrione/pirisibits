# 05 — Adaptación, resume y estados de confianza

## Objetivo

Hacer visible la tercera fuente de valor: cuando cambia el viajero, cambia el resto del día y se entiende por qué.

## Pantallas funcionales

- E01 Bifurcación
- E03 Ruta recompuesta
- E04 Saltar o quitar
- C07 Retomar sesión
- B03 Home con ruta activa
- G01 Guardados
- I01 Ajustes
- J01 Sin conexión — ruta protegida
- J03 GPS débil
- K02 Recomponiendo la ruta

## Implementación

1. E01 muestra una recomendación dominante, hasta dos alternativas y “seguir el plan”. Cada opción declara impacto real disponible en el demo.
2. Las mutaciones pasan por `TravelerAppService.adaptRoute`; la UI no reordena rutas por sí sola.
3. E03 muestra el delta: tiempo, caminata, cierre y unidades que cambiaron. Si el servicio demo no puede calcular un valor, no lo muestra.
4. E04 quita una parada sin castigo y vuelve a componer el remainder.
5. Persiste guest state y ActiveRoute con AsyncStorage usando schema versionado. Instala el paquete con el mecanismo recomendado por Expo, sin actualizar el SDK.
6. C07 restaura exactamente el item/estado previo y permite seguir o cerrar. No reinicia onboarding.
7. J01 permite continuar la ruta activa con metadata ya persistida. No simules descarga de media que no existe.
8. G01 guarda localmente sin cuenta. I01 concentra Dev Gallery, Diagnostics y simuladores sólo en `__DEV__`.
9. K02 anima físicamente la recomposición con `Animated` y respeta Reduce Motion; no agregues una librería de animación pesada para este sprint.

## Restricciones

- No crear un segundo cerebro “Best Next”.
- Adaptar debe mejorar o declarar por qué sólo conserva validez.
- No esconder que el servicio es demo en los artefactos de desarrollo.

## Validación

- Tests puros: skip, time-change, alternative choice, serialization/migration y resume.
- Cerrar y reabrir la app devuelve a la sesión activa.
- Offline simulado no destruye la ruta persistida.

