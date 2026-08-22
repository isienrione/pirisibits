# 04 — Experiencia, Mystery y Reveal

## Objetivo

Demostrar que ChronoWalk no es una lista de POIs ni un audio-tour: el contenido produce interacciones diferentes al llegar.

## Pantallas funcionales

- D01 Hero — portada
- D02 Hero — runtime
- D05 Discovery — detalle
- D07 Mystery — carta previa
- D08 Mystery — revelado
- D09 Reveal — Then/Now
- D12 Experiencia completada
- L01 Detail Hunt, en versión mínima funcional si existe evidencia visual adecuada

## Implementación

1. Crea resolutores por `Treatment`; agregar un tratamiento nuevo no puede requerir modificar navegación o el composer.
2. Implementa un Hero basado en story/look-cue y un Discovery breve. No uses el tono de diagnóstico como narración turística.
3. `ExperienceRuntime.arrive()` y `beginNarration()`/`beginExperience()` son eventos separados y comprobables.
4. Mystery debe usar `spoilerSafeTitle`, costo de desvío y pista segura. Acciones: “Llévame” y “Revelar ahora”. Al revelar, registra la decisión sin gamificación.
5. Audita accesibilidad, route params, logs y labels para asegurar que el Mystery no filtra identidad antes de D08.
6. Then/Now sólo usa material de archivo si existe en el fixture con procedencia. Si no existe, construye la interacción y muestra un bloque explícito “Archivo pendiente — interacción de diseño”, sin imagen falsa.
7. Detail Hunt sólo se considera funcional con pista, objetivo y payoff reales. Si faltan, queda `visual-draft` en Screen Gallery.
8. D12 resume lo experimentado y conduce naturalmente a bifurcación; no usa XP, badges o confetti.

## Restricciones

- Hero, Discovery, Mystery y Reveal usan composiciones distintas.
- No autoplay en llegada.
- No texto histórico nuevo generado por el agente.
- Una pantalla D3 nunca va seguida inmediatamente por otra D3 sin una transición calmada.

## Validación

- Test de spoiler que inspecciona todo el view model previo al reveal.
- Test de que llegada no inicia experiencia.
- Reduce Motion convierte transiciones en cortes sin perder funcionalidad.

