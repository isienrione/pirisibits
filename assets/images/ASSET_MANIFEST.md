# ChronoWalk Santiago — paquete de assets para Cursor/Gemini

Este paquete se entrega con la estructura exacta solicitada: `assets/images/`.

## Inventario

| Archivo | Dimensiones | Alfa | Uso recomendado | Procedencia / estado |
|---|---:|:---:|---|---|
| `paper_texture.jpg` | 1024×1024 | No | Fondo global repetible | Generado para ChronoWalk; validado en mosaico 2×2. |
| `stamp_red_sun.png` | 1024×1024 | Sí | Sol/sello vermilion de portada y collage | Generado para ChronoWalk; alfa real y borde entintado. |
| `stgo_cathedral_etch.png` | 868×1813 | Sí | Torre eclesiástica en collage editorial | Generado como grabado neoclásico santiaguino; no usar como reproducción arquitectónica exacta. |
| `andes_mountains_bw.png` | 2048×768 | Sí | Cordillera panorámica detrás de la portada | Generado para ChronoWalk; grabado monocromo, sin ciudad ni texto. |
| `swatch_teal.png` | 1536×1024 | Sí | Recorte teal `#2E8B9A` | Generado; papel físico rasgado, no blob CSS. |
| `swatch_red.png` | 1536×1024 | Sí | Recorte vermilion `#E53E27` | Generado; papel físico rasgado, no blob CSS. |
| `swatch_mustard.png` | 1536×1024 | Sí | Recorte mostaza `#E5A93C` | Generado y limpiado; alfa real, sin checkerboard incrustado. |
| `swatch_purple.png` | 1536×1024 | Sí | Recorte violeta `#6B46A8` | Generado; papel físico rasgado, no blob CSS. |
| `la_moneda_1973.jpg` | 1008×1008 | No | Prototipo de escena histórica / comparación temporal | Reutilizado del código Lovable entregado por el usuario. **Procedencia documental y licencia no verificadas: no presentarlo como fotografía de archivo auténtica antes de validarlo o sustituirlo.** |
| `la_moneda_today.jpg` | 1008×1008 | No | Vista contemporánea de La Moneda | Reutilizado del código Lovable entregado por el usuario. Verificar licencia/procedencia antes de publicación. |
| `morande_door.jpg` | 1122×1402 | No | Hero/thumbnail de Morandé 80 | Recreación visual de prototipo generada para la app; sustituir por fotografía con licencia si debe funcionar como evidencia documental. |

## Regla de implementación

- Los PNG ya incluyen transparencia real. No volver a recortarlos con `borderRadius` ni reconstruirlos con círculos CSS/React Native.
- Mantener el mapa activo en densidad D0: estas capas editoriales pertenecen a onboarding, propuesta, llegada y experiencia; no deben tapar la navegación.
- Usar `paper_texture.jpg` con repetición o `ImageBackground`; no estirarlo a una relación extrema.
- El copy y los controles deben permanecer en componentes nativos y accesibles, nunca horneados dentro de las imágenes.
- Para fotografías históricas, separar siempre “recreación” de “archivo verificado”.

## Nota de verificación de Morandé 80

La dirección visual se contrastó con referencias del acceso real. La puerta se ubica en la fachada de La Moneda hacia calle Morandé y posee una carga histórica específica. La imagen incluida sigue siendo una recreación de prototipo, no una fotografía documental.

Referencia visual y de licencia para una eventual sustitución por foto real: [Wikimedia Commons — Acceso Palacio de La Moneda, Morandé 80](https://commons.wikimedia.org/wiki/File:Acceso_Palacio_de_La_Moneda_-_Morand%C3%A9_80_(marzo_de_2025)_-_1.jpg), CC BY-SA 4.0.

## QA incluido

La carpeta `qa/` contiene pruebas sobre papel, repetición de textura y contact sheets. No es necesario copiarla dentro de la app.
