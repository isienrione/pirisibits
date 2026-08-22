# 02 — Onboarding, propuesta y ruta editorial

## Objetivo

Construir el tramo que convierte intención del viajero en una propuesta clara, usando un servicio demo reemplazable y datos existentes.

## Pantallas funcionales

- A01 Portada
- A03 Intereses
- A05 Estilo de exploración
- A06 Movilidad
- A07 Tiempo disponible
- A08 Permiso de ubicación
- A10 Listo
- K01 Calculando tu tarde
- B01 Home — propuesta
- B04 Ruta propuesta
- B05 ¿Por qué esta ruta?
- B06 Ajustar plan

## Implementación

1. Onboarding: una pregunta por pantalla, selección táctil grande, progreso editorial `01 / 05`. Máximo 60–90 segundos.
2. Captura preferencias como `TravelerProfile` y `SessionContext`; no strings paralelos sin mapping.
3. La ubicación se pide sólo en A08 y el usuario puede continuar en modo planificación si la niega.
4. Define `TravelerAppService` y view models de pantalla. Implementa `DemoTravelerAppService` bajo `src/demo/`, inyectado desde un composition root.
5. Crea un script determinista que derive un fixture móvil desde `docs/core_a/ChronoWalk_Santiago_Knowledge_Universe_v0_4.json` y, cuando corresponda, `GOLDEN_OUTPUT.md`. El artefacto generado debe incluir `sourceId` y estado de procedencia. No se ejecuta `node:fs` en React Native.
6. B01 hace una sola recomendación dominante. Usa lenguaje honesto: “Borrador para tus 120 minutos”, no “la ruta perfecta calculada por IA”.
7. B04 representa una partitura: Hero 2× alto, Discovery compacto, Micro en una línea, caminatas sin card, desvío lateral.
8. B05 renderiza `WhyReason[]` como líneas conectadas, incluyendo una alternativa perdedora sólo si el fixture la declara. No redactes una causa inexistente.
9. B06 permite tiempo, energía y carácter. En demo, el cambio llama al service y produce otra respuesta determinista; no muta arrays dentro de la pantalla.
10. K01 usa la metáfora de fragmentos de ruta ensamblándose, no spinner genérico. Debe respetar Reduce Motion.

## Restricciones

- Traveler no importa directamente `@chronowalk/city-data` ni JSON.
- No inventar coordenadas, distancias, opening hours, fotos, archivos ni copy histórico.
- No mostrar distancia desde usuario en modo planificación remota.
- No presentar 12 rutas iguales ni un dashboard.

## Validación

- Pruebas puras para reducer de onboarding y mapping del fixture.
- Cada ruta muestra `targetBudgetMin`, `experienceMin`, `walkingMin`, `bufferMin`, `totalEstimatedMin`, `budgetDeltaMin`, `timeFit`.
- Ajustar 60/120/180 produce estados distintos o declara honestamente que el demo sólo tiene una alternativa.

