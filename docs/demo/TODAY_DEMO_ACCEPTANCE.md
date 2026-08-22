# Acceptance contract — borrador Traveler de hoy

## El demo pasa si

- [ ] Abre en una portada ChronoWalk, no en Diagnostics.
- [ ] El onboarding se completa en cinco decisiones y no pide ubicación antes de explicar para qué.
- [ ] Home recomienda una sola experiencia/ruta dominante.
- [ ] La ruta se lee como partitura, no como lista de cards.
- [ ] “Por qué esta ruta” proviene de razones estructuradas.
- [ ] Puede ajustarse el tiempo y se ve una respuesta distinta u honestamente limitada.
- [ ] Caminata D0 sigue siendo reconocible como ChronoWalk sin collage.
- [ ] Llegada y comienzo de experiencia son acciones diferentes.
- [ ] Existe al menos un Hero, Discovery, Mystery y Reveal inspeccionable.
- [ ] Mystery no filtra identidad antes del reveal.
- [ ] Una bifurcación recompone la ruta y muestra el delta.
- [ ] Cerrar/reabrir recupera la ruta activa.
- [ ] Permiso denegado, GPS débil, falta de token y offline tienen estados útiles.
- [ ] El mapa usa sólo coordenadas existentes y no falla sin token.
- [ ] Los mocks están detrás de un adapter reemplazable y no se presentan como algoritmo final.
- [ ] Las 41 pantallas Gate S aparecen en Dev Gallery con estado honesto.
- [ ] Typecheck y tests pasan, o los fallos preexistentes quedan separados y reproducibles.

## El demo falla si

- Home parece dashboard o catálogo.
- Todas las experiencias son la misma card.
- La app afirma inteligencia no calculada.
- Se inventan datos de ubicación, contenido o factibilidad.
- El diseño completo depende de fotos remotas o de un token.
- Las pantallas “faltantes” se cuentan como terminadas por tener un placeholder.
- Cursor reescribe Engine/Domain para acomodar la UI.

