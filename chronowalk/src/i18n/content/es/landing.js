/**
 * Spanish marketing-content overlays.
 *
 * IDs, routes, media, prices, cents, SKUs, and checkout metadata intentionally
 * stay in landingData.js. This file contains display copy only.
 */
export const ES_LANDING = Object.freeze({
  hostBannerPrefix: 'Recomendado por',

  LANDING_CTA: {
    begin: 'Elige un recorrido por Roma',
    unlockRome: 'Desbloquea las 21 paradas',
    tryFree: 'Disfruta un adelanto gratis',
    tryFreeSneakPeek: 'Disfruta un adelanto gratis',
    experienceCompleteStop: 'Vive una parada completa',
    tryPantheonFree: 'Prueba gratis una parada: Panteón, parte 1',
    tryCompleteStopFree: 'Prueba gratis una parada completa',
    tryPantheonStopFree: 'Prueba gratis la parada del Panteón',
    seeRoutes: 'Ver todos los recorridos por Roma',
    tryOneStopFree: 'Disfruta un adelanto gratis',
    exploreRomeRoutes: 'Ver todos los recorridos por Roma',
    chooseTour: 'Elige tu recorrido',
    howItWorks: '¿Cómo funciona ChronoWalk?',
    reviews: '★★★★★ Reseñas',
  },

  FREE_PREVIEW: {
    title: 'El Panteón',
    meta: 'Parada completa gratis · ~4 minutos',
    heroCtaMeta: 'El Panteón · 4 minutos · Gratis · Sin registro',
    copy:
      'Audio ligado al lugar y una reconstrucción Antes/Ahora en una parada completa del Panteón.',
  },

  ROME_TIERS: [
    {
      id: 'rome-complete',
      tierLabel: 'EL RECORRIDO COMPLETO POR ROMA',
      tag: 'Experiencia completa',
      tagline: 'El circuito completo por la ciudad',
      pacingNote: '¡Puedes hacerlo en 1 o 2 días!',
      bestFor:
        'Las 21 paradas, desde la Roma antigua hasta el centro histórico y la Vía Apia.',
      outcome:
        'Una ciudad. Una historia continua. Desde la Roma antigua hasta el centro histórico. La experiencia ChronoWalk completa.',
      priceNote: 'Compra única. Sin suscripción. Tuyo para siempre.',
      badge: 'Experiencia completa',
      description:
        'El recorrido completo por la Roma antigua y el centro histórico. Veintiuna paradas. Dos mil años de historia.',
      durationLabel: '4.5 – 5.5 h',
      stopsLabel: '21 paradas',
      legend: [
        { tone: 'full', label: 'Ruta completa (21 paradas)', detail: '~6 km · 4.5 – 5.5 h' },
        {
          tone: 'optional',
          label: 'Circuito opcional (4 paradas)',
          detail: 'Palatino, vista del Circo Máximo y panorámica del Foro',
        },
      ],
      includesLabel: 'Incluye todos los puntos destacados de la ciudad y el circuito opcional',
      featuredBullet: 'Solo €5 más que cualquiera de las rutas cortas.',
      bullets: [
        'Las 21 paradas, desde la Roma antigua hasta el centro histórico y la Vía Apia',
        'Reconstrucciones Antes/Ahora a lo largo de la ruta',
        'Indicaciones y progreso guardado',
      ],
      expandLabel: 'Ver las 21 paradas',
      primaryCta: 'Elegir Roma Eterna',
      footFeatures: [
        { icon: 'pin', title: 'Empieza donde quieras', body: 'Comienza en cualquier parada' },
        { icon: 'download', title: 'Descarga y sal', body: 'Úsalo sin conexión' },
        {
          icon: 'bookmark',
          title: 'Retómalo cuando quieras',
          body: 'Tu progreso queda guardado',
        },
      ],
    },
    {
      id: 'rome-essential',
      tierLabel: 'ROMA ANTIGUA',
      tag: 'Roma antigua',
      tagline: 'Coliseo, Palatino y núcleo de la Roma antigua',
      bestFor: 'Ideal para el Coliseo, el Palatino, el Foro y la zona del Capitolio.',
      outcome:
        'Camina por el corazón de la Roma antigua, desde el Coliseo y el Palatino hasta el Foro Romano.',
      priceNote: 'Un solo pago y es tuyo para siempre.',
      description:
        'Camina por el corazón de la Roma antigua, desde el Coliseo y el Palatino hasta el Foro Romano.',
      durationLabel: '~2.5 – 3 h',
      stopsLabel: '12 paradas',
      legend: [
        {
          tone: 'short',
          label: 'Ruta corta (9 paradas)',
          detail: 'Camino directo sin circuito opcional · ~1.5 – 2 h · ~2.2 km',
        },
        {
          tone: 'full',
          label: 'Ruta completa (12 paradas)',
          detail: 'Incluye el circuito opcional · ~2.5 – 3 h · ~3 km',
        },
        {
          tone: 'optional',
          label: 'Circuito opcional (3 paradas)',
          detail: 'Palatino, Circo Máximo y panorámica del Foro · ~30 – 45 min',
        },
      ],
      bullets: [
        'Audio ligado al lugar en cada parada',
        'Reconstrucciones Antes/Ahora donde estén disponibles',
        'Indicaciones y progreso guardado',
      ],
      expandLabel: 'Ver las 12 paradas',
      primaryCta: 'Elegir Roma Antica',
      footFeatures: [
        { icon: 'pin', title: 'Empieza donde quieras', body: 'Comienza en cualquier parada' },
        { icon: 'download', title: 'Descarga y sal', body: 'Úsalo sin conexión' },
        {
          icon: 'bookmark',
          title: 'Retómalo cuando quieras',
          body: 'Tu progreso queda guardado',
        },
      ],
    },
    {
      id: 'rome-central',
      tierLabel: 'CENTRO DE ROMA',
      tag: 'Centro Storico',
      tagline: 'Centro histórico y Panteón en profundidad',
      bestFor: 'Ideal para una tarde por el centro histórico de Roma.',
      outcome:
        'Perfecto para una tarde por el corazón histórico de Roma, con una mirada profunda al Panteón.',
      priceNote: 'Un solo pago y es tuyo para siempre.',
      description:
        'Perfecto para una tarde por el corazón histórico de Roma, con una mirada profunda al Panteón.',
      durationLabel: '~2.5 – 3 h',
      /** Marketing: 8 lugares del centro (Panteón una vez) + bis Vía Apia. Unlock = 10 visit IDs. */
      stopsLabel: '8 + bis Vía Apia',
      legend: [
        {
          tone: 'full',
          label: 'Ruta por el centro histórico',
          detail: '8 paradas del centro + bis Vía Apia · ~2.5 – 3 h · ~4 km',
        },
      ],
      bullets: [
        'Audio ligado al lugar en cada parada',
        'Reconstrucciones Antes/Ahora donde estén disponibles',
        'Indicaciones y progreso guardado',
      ],
      expandLabel: 'Ver centro + Vía Apia',
      primaryCta: 'Elegir Roma Historica',
      footFeatures: [
        { icon: 'pin', title: 'Empieza donde quieras', body: 'Comienza en cualquier parada' },
        { icon: 'download', title: 'Descarga y sal', body: 'Úsalo sin conexión' },
        {
          icon: 'bookmark',
          title: 'Retómalo cuando quieras',
          body: 'Tu progreso queda guardado',
        },
      ],
    },
  ],

  ROME_BUNDLES: [
    {
      id: 'rome-couple',
      name: 'Pareja',
      bestFor: 'Para dos personas que recorren Roma en sus propios teléfonos.',
      outcome:
        'Roma Eterna completa para cada persona incluida, con progreso compartido del recorrido.',
      priceNote: 'una vez · impuestos incluidos donde corresponda',
      badge: 'Ahorra €4.98',
      seatLabel: '2 personas y dispositivos',
      seatDetail: 'Dos plazas en total, incluida la persona que compra',
      contentTitle: 'Roma Eterna completa para cada persona',
      contentStops: 'Las 21 paradas',
      contentLoop: 'Progreso compartido del recorrido',
      contentLine: 'Roma Eterna completa · 21 paradas',
      perPerson: '€12.50 por persona',
      savingsLine: 'Ahorra €4.98 frente a dos compras separadas de Roma Eterna.',
      description:
        'Dos personas y dispositivos. Roma Eterna completa para cada una, con progreso compartido del recorrido.',
      bullets: [
        '2 personas y dispositivos',
        'Roma Eterna completa para cada persona',
        'Las 21 paradas',
        'Progreso compartido del recorrido',
      ],
      primaryCta: 'Elegir Pareja',
    },
    {
      id: 'rome-family',
      name: 'Familia',
      bestFor: 'Para hasta cuatro personas que comparten un recorrido por Roma.',
      outcome:
        'Roma Eterna completa para cada persona incluida, con progreso compartido del recorrido.',
      priceNote: 'una vez · impuestos incluidos donde corresponda',
      badge: 'Ahorra hasta €24.96',
      seatLabel: 'Hasta 4 personas y dispositivos',
      seatDetail: 'Hasta cuatro plazas en total, incluida la persona que compra',
      contentTitle: 'Roma Eterna completa para cada persona',
      contentStops: 'Las 21 paradas',
      contentLoop: 'Progreso compartido del recorrido',
      contentLine: 'Roma Eterna completa · 21 paradas',
      perPerson: 'Desde €8.75 por persona',
      savingsLine: 'Ahorra hasta €24.96 si se usan las cuatro plazas.',
      description:
        'Hasta 4 personas y dispositivos. Roma Eterna completa para cada una, con progreso compartido del recorrido.',
      bullets: [
        'Hasta 4 personas y dispositivos',
        'Roma Eterna completa para cada persona',
        'Las 21 paradas',
        'Progreso compartido del recorrido',
      ],
      primaryCta: 'Elegir Familia',
    },
  ],

  LANDING_ACTS: [
    { id: 'act-open', label: 'Acto I: La apertura', name: 'La apertura' },
    { id: 'act-walk', label: 'Acto II: El recorrido', name: 'El recorrido' },
    { id: 'act-choose', label: 'Acto III: La elección', name: 'La elección' },
  ],

  LANDING_CONTENT: {
    hero: {
      eyebrow: 'Recorrido autoguiado con audio por Roma',
      headline: 'La Roma antigua vuelve a la vida mientras caminas.',
      accentLine: 'A tu propio ritmo.',
      subheadline:
        'Disfruta del Coliseo, el Foro Romano, el Panteón y otras 18 paradas • audio inmersivo • rutas seleccionadas • reconstrucciones visuales de la Antigüedad',
      subheadlineHighlight: 'Coliseo, el Foro Romano, el Panteón y otras 18 paradas',
      primaryCta: 'Prueba gratis una parada: Panteón, parte 1',
      primaryCtaAriaLabel: 'Prueba gratis una parada: Panteón, parte 1',
      phoneLabel: 'Escuchando junto a un monumento',
    },
    heroReassurance: {
      items: [
        {
          id: 'browser',
          label: 'Sin descarga desde una tienda',
          support: 'Se abre en tu navegador y funciona como una app móvil',
        },
        {
          id: 'offline',
          label: 'Modo sin conexión disponible',
          support: 'Prepáralo antes de salir y ponte en marcha',
        },
        {
          id: 'payment',
          label: 'Un solo pago',
          support: 'Sin suscripciones',
        },
        {
          id: 'try-free',
          label: '¿Aún no lo tienes claro? Pruébalo antes de comprar',
          support: 'Disfruta del Panteón, parte 1 (GRATIS)',
          supportBefore: 'Disfruta del ',
          supportLinkText: 'Panteón, parte 1 (GRATIS)',
        },
      ],
    },
    thenNowProof: {
      eyebrow: 'La ruina se convierte en espacio',
      headline: 'Mantén pulsado para retroceder 2.000 años.',
      support:
        'ChronoWalk combina audio ligado al lugar con reconstrucciones Antes/Ahora que revelas manteniendo pulsado.',
      holdHint: 'Mantén pulsado para revelar la Roma antigua',
      holdHintTouch: 'Toca y mantén pulsado para revelar la Roma antigua',
      revealLabel: 'Mostrar la Roma antigua',
      hideLabel: 'Mostrar la actualidad',
      exampleNote: 'Un ejemplo de la experiencia Antes/Ahora dentro de ChronoWalk',
      landmarkLabel: 'Interior del Coliseo',
    },
    'product-demo': {
      eyebrow: 'LA APP',
      headline: '¿Cómo funciona ChronoWalk?',
      subheadline:
        'Desde que abres la ruta hasta que escuchas la historia en el lugar, paso a paso.',
      chapters: [
        {
          id: 'begin',
          title: 'Empieza la ruta que elegiste.',
          body:
            'Abre tu recorrido por Roma y consulta los actos que tienes por delante. Empieza el acto I, salta al lugar donde estás o abre el mapa cuando lo necesites.',
          beats: ['TU RECORRIDO', 'EMPEZAR ACTO I', 'EMPEZAR DONDE ESTÁS'],
        },
        {
          id: 'arrive',
          title: 'Llegas. La historia adecuada está lista.',
          body:
            'ChronoWalk usa tu ubicación para mostrar la parada que tienes delante. Mantén pulsado para revelar una reconstrucción basada en evidencias desde el mismo punto de vista.',
          beats: ['PARADA ACTUAL', 'MANTÉN PULSADO', 'ANTES Y AHORA', 'REVELAR'],
        },
        {
          id: 'listen',
          title: 'Escucha lo que ocurrió aquí.',
          body:
            'Reproduce el capítulo junto al monumento o elige leerlo. Prepara el recorrido antes de dejar el Wi-Fi y sigue escuchando cuando se pierda la señal.',
          beats: ['AUDIO', 'LEER', 'LISTO SIN CONEXIÓN'],
        },
        {
          id: 'walk',
          title: 'Deambula libremente. No pierdas nunca el hilo.',
          body:
            'Haz una pausa para comer, desvíate o continúa mañana. ChronoWalk guarda tu progreso y te muestra dónde retomar la ruta. Usa el mapa cuando lo necesites. Ignóralo cuando Roma te distraiga.',
          beats: ['MAPA', 'PASOS', 'PAUSA', 'CONTINUAR'],
        },
      ],
    },
    personas: {
      headline: 'ChronoWalk es tu compañero de confianza',
      items: [
        {
          id: 'no-tickets',
          headline: '¿No conseguiste entrada para el Coliseo?',
          body:
            'Puede que el monumento esté agotado. La ciudad no. Sigue las historias, fachadas, miradores y espacios públicos que todavía están abiertos a tu alrededor.',
          cta: 'Ver los recorridos por Roma',
        },
        {
          id: 'rigid',
          headline: '¿No te gustan los horarios rígidos de los tours?',
          body:
            'Sin punto de encuentro, bandera ni paraguas que seguir. Sin presión para mantener el ritmo ni grupos enormes.',
          cta: 'Ver los recorridos por Roma',
        },
        {
          id: 'history',
          headline: '¿Quieres caminar con libertad sin perderte la historia?',
          body:
            'Escucha la historia ligada a las piedras que tienes delante y usa las reconstrucciones para sumergirte en los detalles, sin entregar todo el día a un grupo.',
          cta: 'Disfruta un adelanto gratis',
        },
        {
          id: 'itineraries',
          headline: '¿Te abruman las opciones infinitas y las reseñas contradictorias?',
          body:
            'Cierra todas esas pestañas. Empieza con una ruta investigada y disfruta el día sabiendo que vale la pena.',
          cta: 'Comparar los recorridos',
        },
        {
          id: 'guides',
          headline: '¿Los tours guiados se salen de tu presupuesto?',
          body:
            'Obtén la estructura, el contexto y la narración de un recorrido guiado por un precio único.',
          cta: 'Elige un recorrido por Roma',
        },
      ],
    },
    monuments: {
      eyebrow: 'LAS PARADAS',
      headline: 'Descubre todos los lugares que puedes recorrer con ChronoWalk',
      subheadline: 'Desliza para ver las paradas que llevan la historia por toda la ciudad.',
      expandLabel: 'Ver todas las paradas de la ruta',
      collapseLabel: 'Mostrar los puntos destacados',
      previewAriaLabel: 'Lugares destacados de la ruta por Roma',
      fullAriaLabel: 'Ruta completa por Roma, parada por parada',
    },
    pricing: {
      eyebrow: 'ELIGE TU RECORRIDO',
      headline: 'Elige tu recorrido por Roma.',
      subheadline:
        'Tres rutas autoguiadas. El mismo audio sin conexión, mapas y progreso guardado. Elige el capítulo que encaje con tu día.',
      footnote:
        'Pago seguro con Paddle · El acceso llega por correo · Las entradas a monumentos no están incluidas · Impuestos incluidos donde corresponda',
      accessLinkLabel: '¿Ya compraste? Abre tu enlace de acceso',
      metaTimeLabel: 'Duración estimada',
      metaStopsLabel: 'Paradas',
      sharedExperience: {
        eyebrow: 'CAMINEN JUNTOS',
        headline: 'Comparte el recorrido, no los auriculares.',
        lead:
          'Cada persona sigue el recorrido completo Roma Eterna en su propio teléfono. El progreso compartido mantiene unido al grupo mientras avanza el día. La sincronización exacta del audio puede variar entre navegadores.',
      },
    },
    trust: {
      checklist: [
        {
          id: 'browser',
          title: 'Funciona en tu navegador',
          body:
            'Abre ChronoWalk desde tu enlace de acceso. No hace falta instalar nada desde la App Store.',
        },
        {
          id: 'offline',
          title: 'Prepáralo para usarlo sin conexión',
          body:
            'Abre y descarga el recorrido mientras tienes conexión; después usa el contenido preparado cuando se pierda la señal.',
        },
        {
          id: 'one-time',
          title: 'Compra única',
          body: 'Paga una vez por el recorrido elegido. No hay suscripción.',
        },
        {
          id: 'gps',
          title: 'Usa tu ubicación',
          body:
            'ChronoWalk te ayuda a reconocer la parada que tienes delante y te muestra por dónde continuar.',
        },
        {
          id: 'evidence',
          title: 'Evidencias explicadas con honestidad',
          body:
            'Las reconstrucciones distinguen las pruebas establecidas de las conjeturas fundamentadas.',
        },
        {
          id: 'progress',
          title: 'Progreso guardado',
          body: 'Pausa el recorrido y vuelve más tarde sin empezar de nuevo.',
        },
      ],
      imageryNote:
        'Las fotografías actuales y las notas de reconstrucción incluyen fuentes cuando están disponibles.',
      imageryCta: 'Créditos de las imágenes',
    },
    faq: {
      headline: 'Preguntas frecuentes',
      groups: [
        {
          id: 'understanding',
          label: 'Entender el producto',
          items: [
            {
              id: 'what-is-chronowalk',
              q: '¿Qué es ChronoWalk?',
              a:
                'ChronoWalk es un recorrido autoguiado con audio por Roma que se abre en tu navegador. Usa tu ubicación para mostrar la parada relevante, reproducir la historia ligada a ese lugar y ayudarte a seguir la ruta a tu propio ritmo.',
            },
            {
              id: 'different-from-podcast',
              q: '¿En qué se diferencia de un pódcast?',
              a:
                'Un pódcast suele reproducirse en un orden fijo. ChronoWalk vincula cada capítulo a una parada real y combina la narración con indicaciones, mapas, reconstrucciones Antes/Ahora y progreso guardado.',
            },
            {
              id: 'different-from-audio-tours',
              q: '¿En qué se diferencia de otras audioguías?',
              a:
                'ChronoWalk reúne narración ligada al lugar, reconstrucciones basadas en evidencias, orden flexible de las paradas, indicaciones, preparación sin conexión y progreso guardado en un recorrido desde el navegador.',
            },
            {
              id: 'group-tour',
              q: '¿Es un tour en grupo?',
              a:
                'No. No hay guía, punto de encuentro ni hora fija de salida. Caminas de forma independiente o eliges Pareja o Familia para recorrerlo juntos en teléfonos separados.',
            },
          ],
        },
        {
          id: 'using-in-rome',
          label: 'Usarlo en Roma',
          items: [
            {
              id: 'offline',
              q: '¿Funciona sin conexión?',
              a:
                'Necesitas conexión para abrir y preparar el recorrido por primera vez. Cuando el contenido necesario esté preparado, podrás seguir usándolo con señal débil o sin señal.',
            },
            {
              id: 'mobile-data',
              q: '¿Necesito datos móviles?',
              a:
                'No durante todo el recorrido si preparas el contenido con antelación. Tu teléfono puede seguir usando la ubicación, pero el audio y las imágenes preparados no necesitan datos continuos.',
            },
            {
              id: 'gps-inaccurate',
              q: '¿Qué pasa si el GPS no es preciso?',
              a:
                'Puedes abrir manualmente la parada correspondiente desde la app. La ubicación funciona mejor al aire libre, en calles y plazas abiertas.',
            },
            {
              id: 'pause-continue',
              q: '¿Puedo pausar y continuar más tarde?',
              a:
                'Sí. Puedes salir de la ruta, volver después y continuar desde el progreso guardado donde esté disponible.',
            },
            {
              id: 'tickets',
              q: '¿Necesito entrada para cada parada?',
              a:
                'No. Muchas paradas se disfrutan desde calles, plazas, senderos o miradores públicos. Si una parada corresponde a un recinto con entrada, ChronoWalk no incluye ni sustituye esa entrada.',
            },
          ],
        },
        {
          id: 'purchase-access',
          label: 'Compra y acceso',
          items: [
            {
              id: 'subscription',
              q: '¿Es una suscripción?',
              a: 'No. ChronoWalk es una compra única.',
            },
            {
              id: 'keep-access',
              q: '¿Cuánto tiempo conservo el acceso?',
              a:
                'Tu compra sigue disponible durante el viaje y después. Vuelve a abrir tu enlace de acceso cuando quieras regresar a las historias.',
            },
            {
              id: 'share-purchase',
              q: '¿Pueden dos personas compartir una compra estándar?',
              a:
                'Una compra estándar es para una persona y un dispositivo. Elige Pareja o Familia si varias personas quieren usar ChronoWalk en sus propios teléfonos.',
            },
            {
              id: 'device-limit',
              q: '¿Cuántos dispositivos cubre una compra?',
              a:
                'Una compra estándar cubre un dispositivo. Pareja incluye dos personas y dispositivos. Familia incluye hasta cuatro. Cada plaza canjeada recibe el recorrido Roma Eterna completo.',
            },
            {
              id: 'phones',
              q: '¿En qué teléfonos funciona?',
              a:
                'En iPhone y Android modernos desde el navegador móvil. No hace falta instalar nada desde una tienda. Los servicios de ubicación deben estar activados.',
            },
            {
              id: 'account',
              q: '¿Necesito una cuenta?',
              a:
                'Después de comprar, recibirás por correo un enlace de acceso. La parada gratis del Panteón se abre sin crear una cuenta.',
            },
          ],
        },
        {
          id: 'content-trust',
          label: 'Contenido y confianza',
          items: [
            {
              id: 'narration-ai',
              q: '¿La narración está generada por IA?',
              a:
                'Los guiones se investigan y escriben en estudio para esta ruta por Roma; no los produce un modelo de lenguaje como un tour genérico. Algunas herramientas, incluidas herramientas asistidas por IA, pueden ayudar a redactar y pulir, pero cada línea se selecciona antes de llegar a ti.',
            },
            {
              id: 'reconstructions-researched',
              q: '¿Cómo se investigan las reconstrucciones?',
              a:
                'En algunos lugares, Antes/Ahora compara la vista actual con una reconstrucción adaptada a ese punto de vista. Se basa en fuentes arqueológicas e históricas, y los pies de imagen indican qué elementos son interpretativos.',
            },
            {
              id: 'historians-disagree',
              q: '¿Qué ocurre cuando los historiadores no están de acuerdo?',
              a:
                'ChronoWalk señala la incertidumbre y distingue la reconstrucción respaldada de la conjetura fundamentada. No afirma que exista consenso académico cuando no lo hay.',
            },
          ],
        },
      ],
    },
    header: {
      nav: [
        { label: 'Cómo funciona', href: '/how-it-works' },
        { label: 'Paradas', href: '#monuments' },
        { label: 'Recorridos por Roma', href: '#pricing' },
        { label: 'Preguntas', href: '#faq' },
      ],
    },
    footer: {
      tagline:
        'Recorridos autoguiados con audio por Roma, investigados y tuyos para siempre.',
      nav: [
        { label: 'Inicio', href: '/' },
        { label: 'Cómo funciona', href: '/how-it-works' },
        { label: 'Paradas', href: '#monuments' },
        { label: 'Recorridos por Roma', href: '#pricing' },
        { label: 'Preguntas', href: '#faq' },
      ],
      credit: 'Hecho para quienes recorren la ciudad a pie · ChronoWalk',
      accessLinkLabel: '¿Ya compraste? Abre tu enlace de acceso',
    },
  },

  LANDING_INTENTS: {
    rome: {
      eyebrow: 'Recorrido autoguiado con audio por Roma',
      headline: 'La Roma antigua vuelve a la vida mientras caminas.',
      accentLine: 'A tu propio ritmo.',
      subheadline:
        'Disfruta del Coliseo, el Foro Romano, el Panteón y otras 18 paradas • audio inmersivo • rutas seleccionadas • reconstrucciones visuales de la Antigüedad',
      subheadlineHighlight: 'Coliseo, el Foro Romano, el Panteón y otras 18 paradas',
    },
    colosseum: {
      eyebrow: 'Experiencia con audio en el Coliseo y 20 paradas más en Roma',
      headline: 'Descubre mucho más que las ruinas del Coliseo.',
      subheadline:
        'Escucha la historia de la arena donde ocurrió, revela la Roma antigua con reconstrucciones interactivas y sigue una experiencia completa de 21 paradas.',
    },
    pantheon: {
      eyebrow: 'Prueba gratis una parada completa con audio en el Panteón',
      headline: 'Ponte bajo el Panteón y entiende lo que tienes delante.',
      subheadline:
        'Empieza sin costo con la experiencia completa del Panteón y continúa por Roma con audio inmersivo, rutas seleccionadas y 21 paradas históricas.',
    },
    forum: {
      eyebrow: 'Recorrido con audio por el Foro Romano y la Roma antigua',
      headline: 'Convierte unas ruinas dispersas en el centro de un imperio.',
      subheadline:
        'Sigue la historia por el Foro Romano y más allá con audio inmersivo, reconstrucciones interactivas y un recorrido seleccionado de 21 paradas.',
    },
    'self-guided': {
      eyebrow: 'Un recorrido autoguiado por Roma que avanza contigo',
      headline: 'Empieza donde quieras. Deambula libremente. No pierdas el hilo.',
      subheadline:
        'Explora 21 paradas históricas con audio inmersivo, rutas flexibles y reconstrucciones interactivas, sin unirte a un grupo ni descargar una app.',
    },
  },

  ACQUISITION: {
    ancientRome: {
      eyebrow: 'RECORRIDO AUTOGUIADO CON AUDIO POR LA ROMA ANTIGUA',
      h1: 'Convierte las ruinas de la Roma antigua en una ciudad viva.',
      lead:
        'Explora el Coliseo, el Foro Romano y los monumentos cercanos con audio inmersivo, reconstrucciones visuales y una ruta que puedes seguir a tu propio ritmo.',
      primaryCtaPrefix: 'Explorar la ruta por la Roma antigua',
      secondaryCta: 'Desbloquea recorridos completos desde €4.99',
      trustLine: 'Un solo pago · Sin descarga desde una tienda · Prepáralo para caminar sin conexión',
      admissionNoteEmphasis: 'Las entradas no están incluidas',
      admissionNote:
        'para el Coliseo, el Foro Romano, el Palatino ni otros monumentos. ChronoWalk es solo una experiencia de recorrido con audio.',
      heroImageAlt: 'Ruinas del Foro Romano en la Roma antigua',
      experienceHeading: 'Lo que vas a vivir',
      experienceSteps: [
        'Observa lo que sobrevivió',
        'Revela lo que se alzaba aquí',
        'Escucha a las personas y los hechos ligados al lugar',
        'Sigue una ruta seleccionada sin unirte a un grupo',
      ],
      stopsHeading: 'Paradas representativas',
      stopsLead: 'Un recorrido centrado en el Coliseo, el Foro y los monumentos cercanos.',
      seeCompleteRoute: 'Ver la ruta completa',
      thenNowEyebrow: 'LA RUINA SE CONVIERTE EN ESPACIO',
      thenNowHeading: 'Mantén pulsado para revelar la Roma antigua.',
      thenNowLead:
        'Observa el monumento que sobrevivió, revela el entorno reconstruido y escucha la historia en el lugar donde ocurrió.',
      choiceHeading: 'Elige tu recorrido por Roma',
      anticaCta: 'Elegir Roma Antica',
      eternaCta: 'Desbloquear las 21 paradas · €10',
      historicaCta: 'Elegir Roma Historica',
      eternaValueLine:
        'Roma Eterna cuesta €10 durante la oferta de lanzamiento e incluye las 21 paradas.',
      pricingDetailsCta: 'Ver más detalles y precios de cada ruta',
      headerPrimaryCta: 'Obtener el recorrido completo por Roma',
      introductoryPricing: 'Precio introductorio para quienes empiezan pronto.',
      stopsSuffix: 'paradas',
      verifiedStops: 'paradas verificadas según los datos actuales de Roma Antica.',
      ancientFocused: 'Ruta centrada en la Roma antigua',
      eternaMeta: '21 paradas · Incluye la Roma antigua y la historia del resto de la ciudad',
      historicaMeta: 'Centro Storico y Panteón en profundidad',
      freePantheon: 'Prueba gratis el Panteón',
      howItWorks: 'Cómo funciona',
      fullRomeTour: 'Recorrido completo por Roma',
      quickAnswers: 'Respuestas rápidas',
      faq: [
        {
          q: '¿Incluye entradas para el Coliseo o el Foro?',
          a:
            'No. Las entradas para el Coliseo, el Foro Romano, el Palatino u otros monumentos no están incluidas. ChronoWalk es una experiencia autoguiada con audio que usas en tu propio teléfono.',
        },
        {
          q: '¿Puedo empezar en cualquier parada?',
          a:
            'Sí. Empieza en una parada incluida que te resulte conveniente y continúa con flexibilidad. No estás obligado a empezar por la primera.',
        },
        {
          q: '¿Es un tour guiado en vivo?',
          a: 'No. ChronoWalk es autoguiado. Caminas a tu ritmo sin unirte a un grupo.',
        },
        {
          q: '¿Puedo usarlo sin conexión?',
          a:
            'Prepara y descarga la experiencia con conexión antes de salir. La primera apertura necesita conexión.',
        },
      ],
    },
    howItWorks: {
      eyebrow: 'CÓMO FUNCIONA CHRONOWALK',
      h1: 'Una audioguía de Roma que avanza contigo.',
      lead:
        'Ábrela en tu navegador, elige dónde empezar y explora Roma con audio inmersivo, rutas flexibles y reconstrucciones Antes/Ahora.',
      primaryCta: 'Prueba gratis la parada del Panteón',
      secondaryCta: 'Ver las 21 paradas',
      trustLine: 'Sin descarga desde una tienda · Un solo pago · Prepáralo antes de caminar',
      heroImageAlt: 'Revelado Antes/Ahora de ChronoWalk en un teléfono',
      demoHeading: 'Cómo funciona ChronoWalk',
      demoLead: 'Cuatro pantallas. Desplázate con normalidad. Cada paso muestra lo que verás en tu teléfono.',
      reassureHeading: 'Respuestas a preguntas habituales',
      reassure: [
        { title: '¿Necesito una app?', body: 'No. Se abre directamente en tu navegador.' },
        {
          title: '¿Funciona sin internet?',
          body: 'Prepara y descarga la experiencia antes de caminar. La configuración inicial necesita conexión.',
        },
        {
          title: '¿Tengo que empezar en la primera parada?',
          body: 'No. Empieza en una parada conveniente y continúa con flexibilidad.',
        },
        { title: '¿Es una suscripción?', body: 'No. Es una compra única.' },
      ],
      finalHeading: 'Compruébalo por ti mismo.',
      finalPrimaryCta: 'Vive gratis el Panteón',
      finalSecondaryCta: 'Desbloquea recorridos completos desde €4.99',
      headerPrimaryCta: 'Obtener el recorrido completo por Roma',
      freePantheon: 'Experiencia gratis del Panteón',
      ancientRome: 'Ruta por la Roma antigua',
      fullTour: 'Recorrido completo',
    },
    featuredStops: [
      'Coliseo',
      'Arco de Tito',
      'Foro Romano',
      'Curia Julia',
      'Vía Sacra',
      'Mirador de la terraza del Palatino',
    ],
  },
})
