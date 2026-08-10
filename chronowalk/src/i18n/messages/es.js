/** Spanish UI catalog — neutral Latin American Spanish, natural spoken register. */

export const esMessages = Object.freeze({
  // Shell
  'shell.nav.aria': 'Navegación del recorrido',
  'shell.tab.walk': 'Caminar',
  'shell.tab.tour': 'Recorrido',
  'shell.tab.map': 'Mapa',
  'shell.tab.journal': 'Diario',

  // Language
  'language.label': 'Idioma',
  'language.sub': 'Se aplica al recorrido, las historias y el audio',
  'language.en': 'English',
  'language.es': 'Español',

  // Settings (G1)
  'settings.title': 'Ajustes',
  'settings.done': 'Listo',
  'settings.section.playback': 'Reproducción',
  'settings.section.sound': 'Sonido',
  'settings.section.device': 'Dispositivo',
  'settings.section.content': 'Contenido',
  'settings.section.language': 'Idioma',
  'settings.section.access': 'Acceso',
  'settings.narrationSpeed': 'Velocidad de narración',
  'settings.narrationSpeed.sub': 'Predeterminada para nuevos capítulos',
  'settings.backgroundAudio': 'Audio en segundo plano',
  'settings.backgroundAudio.sub': 'La atmósfera continúa con la pantalla bloqueada',
  'settings.autoAdvance': 'Avanzar capítulos automáticamente',
  'settings.autoAdvance.sub': 'Donde los capítulos lo permiten',
  'settings.ambientBed': 'Ambiente',
  'settings.ambientBed.sub': 'El volumen de narración sigue el del sistema',
  'settings.ambient.subtle': 'Sutil',
  'settings.ambient.off': 'Apagado',
  'settings.haptics': 'Vibración',
  'settings.reduceMotion': 'Reducir movimiento',
  'settings.offline': 'Contenido sin conexión',
  'settings.pace': 'Tu ritmo',
  'settings.credits': 'Créditos',
  'settings.restoreAccess': 'Restaurar acceso',

  // Launch settings copy
  'settings.launch.title': 'Ajustes',
  'settings.launch.subtitle': 'Opciones claras para cómo ChronoWalk camina contigo.',
  'settings.launch.tourName': 'Corazón de la Roma antigua',
  'settings.launch.tourDescription': 'Tu recorrido a pie por Roma.',
  'settings.launch.locationGuidance':
    'La ubicación se usa solo mientras caminas el recorrido, para guiar llegadas y lugares cercanos.',
  'settings.launch.offlineDescription': 'Historias, imágenes y audio de tu recorrido.',
  'settings.launch.privacySummary':
    'Tu viaje, tus recuerdos y tus preferencias permanecen en este dispositivo, salvo que elijas compartirlos.',
  'settings.section.tour': 'Ajustes del recorrido',
  'settings.section.audio': 'Ajustes de audio',
  'settings.section.offline': 'Almacenamiento sin conexión',
  'settings.section.notifications': 'Notificaciones',
  'settings.section.appearance': 'Apariencia',
  'settings.section.help': 'Ayuda y soporte',
  'settings.section.privacy': 'Privacidad',

  // Approach cues
  'approach.cue.0': 'Ya casi. Mira hacia arriba.',
  'approach.cue.1': 'El anfiteatro empieza a revelarse.',
  'approach.cue.2': 'Haz una pausa. El siguiente capítulo comienza un poco más adelante.',
  'approach.cue.3': 'Estás cerca. Deja que la ciudad te frene el paso.',
  'approach.cue.4': 'Escucha: las piedras están cerca.',
  'approach.cue.5': 'El siguiente capítulo te espera un poco más adelante.',
  'approach.cue.6': 'Ya casi. Roma se abre frente a ti.',
  'approach.cue.7': 'Baja el paso. Estás a punto de llegar.',
  'approach.fallback': 'Sigue caminando: Roma está justo adelante.',
  'arrival.fallback': 'Tómate un segundo. Mira hacia arriba.',

  // Companion
  'companion.offRoute.eyebrow': 'Fuera de ruta',
  'companion.offRoute.title': 'Te alejaste un poco del camino',
  'companion.offRoute.subtitle':
    'Cuando quieras, vuelve hacia {target}, o abre el mapa para orientarte.',
  'companion.offRoute.subtitle.generic': 'Abre el mapa para orientarte cuando quieras continuar.',
  'companion.observing.eyebrow': 'Observación',
  'companion.observing.title': 'Tómate tu tiempo',
  'companion.observing.subtitle':
    'Roma no se va a ninguna parte. Retoma el paso cuando quieras que la siguiente historia te encuentre.',

  // Map bottom card
  'map.card.offRoute.title': 'Parece que nos desviamos un poco',
  'map.card.offRoute.meta': 'No pasa nada: Roma premia el deambular.',
  'map.card.offRoute.cta': 'Volver a la ruta',
  'map.card.awaiting.title': 'Tu recorrido empieza aquí',
  'map.card.awaiting.meta': 'Camina hacia {landmark}',
  'map.card.awaiting.cta.directions': 'Obtener indicaciones',
  'map.card.awaiting.cta.open': 'Abrir indicaciones',
  'map.card.awaiting.cta.arrived': 'Ya estoy aquí',
  'map.card.walking.title': 'Camina hacia {landmark}',
  'map.card.approaching.title': 'Casi en {landmark}',
  'map.card.arrived.title': 'Has llegado',
  'map.card.arrived.meta': '{landmark}',
  'map.card.arrived.cta': 'Abrir historia',
  'map.card.afterStory.title': 'Cuando quieras',
  'map.card.afterStory.cta': 'Ir al siguiente',
  'map.card.nextStop': 'tu siguiente parada',
  'map.card.meta.about': '{distance} · unos {walkTime}',
  'map.card.meta.pair': '{distance} · {walkTime}',

  // Errors / chrome
  'error.boundary.title': 'No se pudo cargar ChronoWalk',
  'error.boundary.retry': 'Reintentar',
  'network.offline': 'Estás sin conexión',
  'network.offline.detail':
    'Estás sin conexión: el audio y los medios en caché siguen funcionando; los datos de navegación pueden no estar disponibles en modo avión',
  'network.offline.aria': 'Modo sin conexión',
  'network.back': 'De nuevo en línea',
  'pwa.update.ready': 'Hay una versión nueva lista',
  'pwa.update.action': 'Actualizar',
  'pwa.update.eyebrow': 'Nueva versión disponible',
  'pwa.update.body': 'Toca para actualizar cuando quieras: la navegación no se interrumpe.',
  'pwa.update.tap': 'Tocar para actualizar',
  'pwa.update.later': 'Más tarde',

  // Free Pantheon acquisition
  'pantheon.free.eyebrow': 'GRATIS · PANTEÓN PARTE 1 DE 4 · EXTERIOR',
  'pantheon.free.h1': 'Prueba gratis el capítulo exterior del Panteón.',
  'pantheon.free.lead':
    'Capítulo completo de 4 minutos (no un avance) con audio y una demostración visual de reconstrucción Antes/Ahora.',
  'pantheon.free.interactTipEyebrow': 'Este teléfono es la demo',
  'pantheon.free.interactPrompt': 'Interactúa con la pantalla del teléfono y disfruta un fragmento de ChronoWalk',
  'pantheon.free.secondaryCta': 'Explora el recorrido completo de 21 paradas por Roma',
  'pantheon.free.trustLine': 'Sin descarga de app · Navegador · Gratis',
  'pantheon.free.includes.0': 'Capítulo de audio exterior completo',
  'pantheon.free.includes.1': 'Reconstrucción Antes/Ahora',
  'pantheon.free.includes.2': 'Solo la parte 1 de 4',
  'pantheon.free.upgradeHeading': '¿Quieres el resto del Panteón?',
  'pantheon.free.upgradeLead':
    'Desbloquea las partes 2 a 4 (incluido el interior) y 21 paradas en Roma: Coliseo, Foro y más.',
  'pantheon.free.headerCta': 'Obtén el recorrido completo de Roma',
  'pantheon.free.howItWorks': 'Cómo funciona',
  'pantheon.free.fullTour': 'Recorrido completo de Roma',
  'pantheon.free.faqHeading': 'Respuestas rápidas',
  'pantheon.free.faq.0.q': '¿Es toda la experiencia del Panteón?',
  'pantheon.free.faq.0.a':
    'No. Este adelanto gratis es la parte 1 de 4 del Panteón: el capítulo exterior completo (~4 minutos) con su audio y reconstrucción. Tres capítulos más del Panteón, incluido el interior, se desbloquean con el recorrido de pago por Roma.',
  'pantheon.free.faq.1.q': '¿Necesito descargar una app?',
  'pantheon.free.faq.1.a':
    'No. ChronoWalk se abre en tu navegador. No hace falta descargarlo de la App Store.',
  'pantheon.free.faq.2.q': '¿Incluye la entrada al Panteón?',
  'pantheon.free.faq.2.a':
    'No. Las entradas a monumentos no están incluidas. ChronoWalk es una experiencia de audio autoguiada e independiente, no una audioguía oficial del monumento.',
  'pantheon.free.faq.3.q': '¿Puedo usarlo antes o durante la visita?',
  'pantheon.free.faq.3.a':
    'Sí. Ábrelo con conexión para empezar. Puedes preparar la experiencia antes de caminar si quieres usarla sin conexión.',

  // Product truth snippets used in-app
  'product.places21': '21 lugares',
  'product.stops21': '21 paradas',
  'chapter.fallback': 'Capítulo',

  // Common actions
  'action.continue': 'Continuar',
  'action.close': 'Cerrar',
  'action.cancel': 'Cancelar',
  'action.done': 'Listo',
  'action.retry': 'Reintentar',
  'action.openStory': 'Abrir historia',
  'action.getDirections': 'Obtener indicaciones',

  // Settings sheet (live companion)
  'settings.sheet.audioSpeed': 'Velocidad del audio',
  'settings.sheet.readInstead': 'Leer en lugar de escuchar',
  'settings.sheet.textSize': 'Tamaño del texto',
  'settings.sheet.backgroundPlay': 'Seguir reproduciendo en segundo plano',
  'settings.sheet.haptics': 'Vibración',
  'settings.sheet.reduceMotion': 'Reducir movimiento',
  'settings.sheet.offline': 'Descargar para usar sin conexión',
  'settings.sheet.offline.ready': 'Listo',
  'settings.sheet.restore': 'Restaurar compra',
  'settings.sheet.walkTogether': 'Caminar juntos',
  'settings.sheet.changeRoute': 'Cambiar ruta',
  'settings.sheet.help': 'Ayuda',
  'settings.sheet.about': 'Acerca de y créditos',
  'settings.sheet.analytics': 'Preferencias de analítica',
  'settings.sheet.install': 'Añadir a la pantalla de inicio',
  'map.card.approaching.meta': 'Baja el paso',
  'map.card.approaching.titleNamed': '{landmark} está justo adelante',
  'map.card.approaching.cta': 'Ya estoy aquí',
  'map.card.afterStory.titleShort': 'Siguiente parada',
  'map.card.afterStory.ctaNamed': 'Camina hacia {landmark}',
  'map.card.awaiting.titleNamed': 'El recorrido empieza en {landmark}',
  'map.card.awaiting.cta.walking': 'Obtener indicaciones a pie',
  'map.card.walking.titleNamed': 'Caminando hacia {landmark}',
  'map.card.walking.cta': 'Indicaciones',
})
