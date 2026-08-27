# 03 — Ruta activa, ubicación y mapa

## Objetivo

Hacer visible que ChronoWalk puede acompañar a alguien en la calle sin pedir permisos excesivos ni bloquear el demo cuando faltan credenciales.

## Pantallas funcionales

- C01 Caminata
- C03 Llegada
- C04 Control de ruta
- C05 Ruta en curso — lista
- C06 Ruta en curso — mapa
- F01 Mapa — ciudad
- F03 Mapa — hoja de detalle
- J03 GPS débil
- K05 Buscando ubicación

## Implementación

1. Refactoriza `useForegroundLocation` para activarse sólo cuando el usuario lo autoriza desde A08 o inicia una ruta. Nunca solicita background/Always.
2. C01 es D0: dirección o estado de orientación, distancia sólo si existe una medición válida, siguiente lugar y una acción principal. Pausar/terminar siguen accesibles.
3. Una señal de llegada puede sugerir llegada, pero C03 exige confirmación humana antes de iniciar una experiencia.
4. Mapbox: configura token sólo desde entorno. Si falta, renderiza un estado útil con ruta-lista y mensaje de configuración; nunca pantalla blanca ni crash.
5. Los markers y líneas usan únicamente coordenadas no nulas del fixture generado, mostrando el estado de precisión. Si faltan puntos suficientes, no dibujes una ruta falsa.
6. F01 establece jerarquía visual entre Hero, Discovery, ruta actual y Mystery anónimo. No muestres todos los pines iguales.
7. F03 abre una hoja funcional con tipo, tiempo, procedencia y acción “Agregar”, delegada al service.
8. Agrega switches sólo-DEV para simular `GPS weak`, `permission denied`, `no token` y `planning mode`.

## Restricciones

- No calcular distancia con coordenadas faltantes.
- No afirmar turn-by-turn si sólo existe un bearing aproximado.
- Mystery no filtra nombre ni identidad en markers o labels accesibles.
- El mapa es instrumento, no cerebro ni Home.

## Validación

- Tests de los estados `checking`, `denied`, `granted-awaiting-fix`, `ok`, `weak` y `error` en lógica pura.
- Navegación funciona con token y sin token.
- Llegada y comienzo de narración son acciones separadas.

