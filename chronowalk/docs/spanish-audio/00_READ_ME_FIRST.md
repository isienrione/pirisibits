# LEER PRIMERO — producción de narración ES en ElevenLabs

Este paquete produce exactamente **52 MP3**. No cambies nombres, no unas capítulos y no omitas variantes.

## Flujo secuencial para Isidora

1. Abre `01_MASTER_AUDIO_MANIFEST.md` y trabaja de la fila 1 a la 52. Marca una fila solo después de exportar, revisar y colocar el archivo.
2. Abre el archivo indicado en la columna **Spanish script file**. Comprueba tres datos antes de generar: `STOP`, `CHAPTER` y `REQUIRED OUTPUT FILENAME`.
3. En ElevenLabs, usa siempre la misma voz de marca y el modelo Eleven v3. Ajustes recomendados del playbook existente:
   - stability: **0.45**
   - similarity: **0.78**
   - style: **0.30**
4. Copia **únicamente** las palabras dentro del bloque que sigue a `SPANISH SCRIPT:`. No copies `PRODUCTION NOTES`, etiquetas, encabezados, backticks ni líneas en blanco al principio o al final.
5. Antes de generar, revisa que el cuadro de ElevenLabs no tenga espacios accidentales al principio, texto duplicado ni el capítulo anterior. Compara la primera y la última frase con el archivo Markdown.
6. Genera una toma completa. Mantén una voz constante: mismo voice ID, modelo, ajustes, ritmo general y distancia emocional en los 52 archivos. No “mejores” un capítulo cambiando de voz.
7. Escucha los primeros 15 segundos, un tramo central y los últimos 15 segundos. Después revisa todos los nombres incluidos en `PRONUNCIATION NOTES` contra `02_PRONUNCIATION_GUIDE.md`.
8. Exporta como MP3 con **exactamente** el nombre de `REQUIRED OUTPUT FILENAME`.
9. Evita el error `.mp3.mp3`: si el diálogo de guardado ya añade la extensión, escribe solo el nombre base. Después muestra las extensiones del sistema y confirma que termina una sola vez en `.mp3`.
10. Coloca el archivo en `public/rome/audio/es/narration/`. No crees subcarpetas por parada en el destino; las subcarpetas existen solo en este paquete de guiones. **No** uses el prefijo `ElevenLabs_` en el filename final: el producto espera el mismo nombre que el master inglés (`w01.mp3`, no `ElevenLabs_W01.mp3`).
11. Normaliza siguiendo el playbook: 44.1 kHz, 112 kbps, −16 LUFS integrado en dos pasadas, pico real máximo −1.5 dBTP, con aproximadamente 0.8 s de entrada y 1.2 s de cola cuando corresponda.
12. Escucha el MP3 final normalizado. Comprueba que no se recortó la última palabra y que el nombre, parada y capítulo siguen coincidiendo.
13. Cuando estén los 52, ejecuta `npm run check:i18n:audio`. El total de narración ES debe ser 52; los 28 archivos hero por sí solos no completan el modo offline.
14. VO de UI (aparte del manifiesto 1–52): `nuevo hito desbloqueado` se exporta como `ui_waypoint_unlocked.mp3` y se coloca en `public/rome/audio/es/system/` (no en `narration/`).

## Errores que bloquean la entrega

- **Nombre incorrecto:** el producto busca el mismo filename inglés dentro de la carpeta ES.
- **Prefijo ElevenLabs_:** los exports crudos de ElevenLabs deben renombrarse antes de subir.
- **`.mp3.mp3`:** el archivo parece correcto en Finder/Explorer, pero el producto no lo encuentra.
- **Capítulo equivocado:** especialmente `w17_ch1` a `w17_ch4`, `w1112_b1`/`b2`, y las rutas A/B.
- **Espacios o notas pegadas:** el bloque de voz debe contener solo palabras habladas.
- **Voz inconsistente:** no cambiar voice ID ni ajustes entre sesiones.
- **Omitir archivos “pequeños”:** pause, transits, outros, no-ticket y resume son parte del paquete offline.
- **Traducir de nuevo los hero:** los 28 textos hero de estos guiones proceden del overlay español canónico; graba lo que está en el bloque.

## Control final de carpetas

Todos los MP3 de narración terminan juntos aquí:

`public/rome/audio/es/narration/`

El VO hablado de llegada (“nuevo hito desbloqueado”) va aquí:

`public/rome/audio/es/system/ui_waypoint_unlocked.mp3`

Los guiones permanecen organizados por parada aquí:

`docs/spanish-audio/scripts/`
