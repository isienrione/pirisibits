# ChronoWalk — Cursor Sprint “demo hoy”

Este paquete convierte el repositorio actual —que hoy tiene un spike nativo con `Diagnostics` y `Map`— en un encargo ejecutable para Cursor sin esperar que el algoritmo ni la curaduría estén terminados.

## Resultado esperado hoy

1. Una app Expo navegable en simulador o development build.
2. Un vertical slice coherente: onboarding → propuesta → ruta → caminata → llegada → experiencia → Mystery/Reveal → bifurcación → ruta recompuesta → resume.
3. Datos de demostración explícitos y reemplazables, derivados de los fixtures existentes; nunca coordenadas, historias u horarios inventados.
4. Un registro navegable de las 41 pantallas del gate S, distinguiendo `functional`, `visual-draft` y `not-started`.
5. Contratos que permiten sustituir el servicio demo por el City Engine sin reescribir pantallas.

No se intenta “terminar 98 pantallas” hoy. Se construye profundidad real en el loop principal y amplitud inspeccionable mediante un Screen Gallery de desarrollo. Eso produce una demo convincente sin fabricar producto.

## Cómo usarlo

1. Copia el contenido de `repo-overlay/` a la raíz del repositorio ChronoWalk. Esto agrega reglas y prompts; no reemplaza código existente.
2. Abre el repositorio completo en Cursor y confirma que Git puede revertir cambios.
3. En Cursor, entra primero a **Plan Mode**, pega el contenido de `00_MASTER_AUTOPILOT_PROMPT.md` y pide que guarde el plan en el workspace.
4. Revisa solamente que no proponga reescribir `packages/domain`, eliminar el spike nativo ni inventar datos.
5. Pulsa **Build**. El prompt le ordena avanzar sin pedir confirmación entre fases salvo bloqueos reales.
6. Si el agente pierde contexto, inicia un chat nuevo con la tarea siguiente (`01` a `06`) y dile que lea `docs/demo/TODAY_PROGRESS.md` antes de continuar.

## Orden de ejecución

- `00_MASTER_AUTOPILOT_PROMPT.md`: orquestador. Pégalo primero.
- `01_FOUNDATION_AND_NAVIGATION.md`: lenguaje visual, navegación y estado.
- `02_ONBOARDING_AND_PROPOSAL.md`: primera experiencia completa hasta la ruta.
- `03_ROUTE_LOCATION_AND_MAP.md`: caminar, ubicación y mapa.
- `04_EXPERIENCE_MYSTERY_REVEAL.md`: diferencia de categoría visible.
- `05_ADAPTATION_RESUME_AND_STATES.md`: adaptación y continuidad.
- `06_SCREEN_REGISTRY_AND_QA.md`: amplitud, galería y cierre verificable.

## Política de autonomía

Cursor puede crear y modificar archivos, instalar dependencias Expo compatibles, ejecutar pruebas y hacer commits atómicos si el worktree lo permite. Debe detenerse solamente ante:

- conflicto explícito con un documento canónico;
- necesidad de una credencial, cuenta, servicio pagado o cambio irreversible;
- necesidad de inventar datos físicos o históricos;
- cambios no relacionados ya presentes que puedan ser pisados;
- fallo nativo que sólo pueda verificarse en un dispositivo que no está disponible.

En esos casos debe registrar el bloqueo y continuar con todo lo que no dependa de él.

