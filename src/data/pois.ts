import type { ImageSourcePropType } from 'react-native';
import { vectorFromTopics } from '@/src/data/algorithm';
import { LocalImages, type LocalImageKey } from '@/src/data/localImages';
import type { RouteStop } from '@/src/data/catalog';

export type StopKind = 'anchor' | 'pocket' | 'micro';
export type MediaLevel = 1 | 2 | 3 | 4 | 5;

export type ForensicHotspot = {
  x: number;
  y: number;
  label: string;
};

export type InteractiveLayerType =
  | 'flagship_reveal'
  | 'persona_card'
  | 'spatial_soundscape'
  | 'forensic_look_close'
  | 'archive_document';

export type InteractiveLayer = {
  type: InteractiveLayerType;
  level?: MediaLevel;
  asset_then?: string;
  asset_now?: string;
  persona?: string;
  quote?: string;
  place?: string;
  soundscape_label?: string;
  soundscape_script?: string;
  hotspots?: ForensicHotspot[];
  archive_image?: string;
  transcript?: string;
  caption?: string;
};

export const LAYER_TYPE_BY_LEVEL: Record<MediaLevel, InteractiveLayerType> = {
  1: 'archive_document',
  2: 'forensic_look_close',
  3: 'spatial_soundscape',
  4: 'persona_card',
  5: 'flagship_reveal',
};

export const LAYER_META: Record<
  InteractiveLayerType,
  { kicker: string; title: string; note: string }
> = {
  flagship_reveal: {
    kicker: 'NIVEL 5',
    title: 'THEN / NOW',
    note: 'desliza 1973 sobre el presente',
  },
  persona_card: {
    kicker: 'NIVEL 4',
    title: 'PERSONA',
    note: 'una voz que todavía habla aquí',
  },
  spatial_soundscape: {
    kicker: 'NIVEL 3',
    title: 'SOUNDSCAPE',
    note: 'el barrio entra por el oído',
  },
  forensic_look_close: {
    kicker: 'NIVEL 2',
    title: 'LOOK CLOSE',
    note: 'lupa sobre la cicatriz urbana',
  },
  archive_document: {
    kicker: 'NIVEL 1',
    title: 'ARCHIVO',
    note: 'pellizca el plano o el decreto',
  },
};

export type POIStop = {
  id: string;
  title: string;
  subtitle: string;
  neighborhood: string;
  lat: number;
  lng: number;
  kind: StopKind;
  mediaLevel: MediaLevel;
  thematicVector: number[];
  dwellMinutes: number;
  stairs: boolean;
  imageKey: LocalImageKey;
  thenImageKey?: LocalImageKey;
  img_before?: string;
  img_after?: string;
  directionHint: string;
  audio: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  modules?: {
    module_a: string;
    module_b: string;
    module_c: string;
    module_d: string;
  };
  quote?: { persona: string; text: string };
  soundscapeLabel?: string;
  forensicHotspots?: ForensicHotspot[];
  archiveTranscript?: string;
  radius_meters?: number;
  daylightLock?: boolean;
  daylight_only?: boolean;
  sensitiveMemory?: boolean;
  is_sensitive_memory_site?: boolean;
  stepFree?: boolean;
  step_free_certified?: boolean;
  canonical_anchor?: boolean;
  /** Alias of thematicVector (T1A…T9). */
  vectors?: number[];
  islandHubId?: string;
  interactive_layer?: InteractiveLayer;
};

export const SANTIAGO_ORIGIN = { lat: -33.4429, lng: -70.6539 };

export const SANTIAGO_POIS: POIStop[] = [
  {
    id: 'la-moneda',
    title: 'La Moneda',
    subtitle: 'El poder, la historia y lo que hoy se vive.',
    neighborhood: 'Centro Cívico',
    lat: -33.4429,
    lng: -70.6539,
    kind: 'anchor',
    mediaLevel: 5,
    thematicVector: vectorFromTopics({ T1: 1, T2: 0.85, T3: 0.7, T4: 0.4 }),
    dwellMinutes: 15,
    stairs: false,
    imageKey: 'monedaToday',
    thenImageKey: 'moneda1973',
    img_before: 'moneda1973',
    img_after: 'monedaToday',
    interactive_layer: {
      type: 'flagship_reveal',
      level: 5,
      asset_then: 'moneda1973',
      asset_now: 'monedaToday',
      caption: 'La Moneda, 11 de septiembre de 1973',
    },
    directionHint: 'Sigue por Morandé hacia el norte',
    audio: {
      A: 'Estás frente a La Moneda. Mira la fachada simétrica: es el palacio de gobierno de Chile desde 1846.',
      B: 'El 11 de septiembre de 1973 este edificio fue bombardeado. Lo que ves reconstruido guarda la cicatriz de ese día y la vida cívica que volvió a ocupar la plaza.',
      C: 'Fíjate en las ventanas del segundo piso oriente. Desde ahí Allende dio su último discurso radial.',
      D: 'Cuando termines, camina por el costado oriente hacia Morandé 80. Son menos de cuatro minutos.',
    },
  },
  {
    id: 'morande-80',
    title: 'Morandé 80',
    subtitle: 'Una puerta que Chile decidió no olvidar.',
    neighborhood: 'Centro Cívico',
    lat: -33.4424,
    lng: -70.6533,
    kind: 'pocket',
    mediaLevel: 4,
    thematicVector: vectorFromTopics({ T1: 1, T2: 1, T8: 0.3 }),
    dwellMinutes: 12,
    stairs: false,
    imageKey: 'morande',
    thenImageKey: 'moneda1973',
    img_before: 'moneda1973',
    img_after: 'morande',
    sensitiveMemory: true,
    is_sensitive_memory_site: true,
    directionHint: 'Continúa hacia Plaza de la Constitución',
    quote: {
      persona: 'Salvador Allende',
      text: 'Sigan ustedes sabiendo que, mucho más temprano que tarde, se abrirán las grandes alamedas.',
    },
    interactive_layer: {
      type: 'persona_card',
      level: 4,
      persona: 'Salvador Allende',
      quote:
        'Sigan ustedes sabiendo que, mucho más temprano que tarde, se abrirán las grandes alamedas.',
      place: 'Morandé 80',
    },
    audio: {
      A: 'Esta puerta no está. El vano vacío es el monumento.',
      B: 'Por Morandé 80 salía el presidente. En 1973 fue tapiada. Décadas después el país eligió no reconstruirla: la ausencia es la marca.',
      C: 'Si te quedas un momento, mira el marco de piedra. Todavía se lee el gesto de una entrada que ya no existe.',
      D: 'Sigue hacia el norte por Bandera. El siguiente giro te deja en Plaza de Armas.',
    },
  },
  {
    id: 'londres-38',
    title: 'Londres 38',
    subtitle: 'Casa de memoria. Un número que no se borra.',
    neighborhood: 'París-Londres',
    lat: -33.4449,
    lng: -70.6406,
    kind: 'pocket',
    mediaLevel: 4,
    thematicVector: vectorFromTopics({ T2: 1, T1: 0.35, T8: 0.4 }),
    dwellMinutes: 14,
    stairs: true,
    sensitiveMemory: true,
    is_sensitive_memory_site: true,
    imageKey: 'archivoCalle',
    archiveTranscript:
      'Londres 38. Centro de detención y tortura entre 1973 y 1974. Hoy casa de memoria: los nombres en la fachada son el archivo a la intemperie.',
    directionHint: 'Camina hacia Alameda y gira a Lastarria',
    quote: {
      persona: 'Londres 38',
      text: 'Los nombres en la fachada no son ornamentales: son personas.',
    },
    audio: {
      A: 'Esta casona de París-Londres parece una casa más. El número 38 es el dato que cambia todo.',
      B: 'Entre 1973 y 1974 funcionó como centro de detención. Hoy es sitio de memoria: la fachada lista nombres para que no se vuelvan rumor.',
      C: 'Si te detienes, lee un nombre. Cada placa es una persona, no un símbolo.',
      D: 'Sigue hacia Alameda. Lastarria queda a pocos minutos si tu ruta sigue al oriente.',
    },
  },
  {
    id: 'plaza-de-armas',
    title: 'Plaza de Armas',
    subtitle: 'El corazón cívico de Santiago.',
    neighborhood: 'Santiago Centro',
    lat: -33.4378,
    lng: -70.6505,
    kind: 'anchor',
    mediaLevel: 3,
    thematicVector: vectorFromTopics({ T1: 0.8, T3: 0.6, T6: 1, T8: 0.7 }),
    dwellMinutes: 14,
    stairs: false,
    imageKey: 'plaza',
    thenImageKey: 'plazaBn',
    soundscapeLabel: 'Campanas, pregones y tranvía',
    directionHint: 'Cruza hacia el Pasaje Phillips',
    audio: {
      A: 'Esta es la Plaza de Armas. El kilómetro cero de Santiago colonial.',
      B: 'Aquí se midió la ciudad: catedral, cabildo, comercio y voces. El trazado de Pedro de Valdivia todavía organiza el centro.',
      C: 'Cierra los ojos diez segundos. El sonido de las palomas y los fotógrafos es el mismo oficio de hace un siglo, con otra cámara.',
      D: 'Sal por el costado poniente hacia Pasaje Phillips. El pasaje está a un minuto.',
    },
  },
  {
    id: 'pasaje-phillips',
    title: 'Pasaje Phillips',
    subtitle: 'Un pasaje que todavía huele a centro.',
    neighborhood: 'Santiago Centro',
    lat: -33.4384,
    lng: -70.6512,
    kind: 'micro',
    mediaLevel: 2,
    thematicVector: vectorFromTopics({ T3: 0.8, T4: 0.6, T6: 0.9, T8: 0.5 }),
    dwellMinutes: 8,
    stairs: false,
    imageKey: 'centro',
    forensicHotspots: [
      { x: 0.28, y: 0.42, label: 'Marca de incendio en el dintel' },
      { x: 0.62, y: 0.58, label: 'Relieve comercial de los años 20' },
      { x: 0.78, y: 0.3, label: 'Inscripción casi borrada' },
    ],
    directionHint: 'Gira hacia Compañía y sigue al oriente',
    audio: {
      A: 'Entraste a Pasaje Phillips. Mira arriba: el cielo se estrecha entre dos fachadas.',
      B: 'Los pasajes del centro eran atajos de comercio. Aquí se vendía de todo y aún se siente ese ritmo de vitrina y paso apurado.',
      C: 'Busca las marcas en el muro izquierdo. No son grafitis: son capas de avisos, fuego y reparación.',
      D: 'Al salir, toma Compañía hacia el oriente. Lastarria queda más adelante si eliges ese ramal.',
    },
  },
  {
    id: 'catedral',
    title: 'Catedral Metropolitana',
    subtitle: 'La torre que ordena el cielo del centro.',
    neighborhood: 'Plaza de Armas',
    lat: -33.4375,
    lng: -70.651,
    kind: 'micro',
    mediaLevel: 1,
    thematicVector: vectorFromTopics({ T1: 0.7, T3: 1, T4: 0.8 }),
    dwellMinutes: 10,
    stairs: false,
    imageKey: 'cathedral',
    archiveTranscript:
      'Plano de la Catedral, siglo XVIII. La nave principal se alinea con la plaza. Las torres actuales son posteriores al terremoto de 1647.',
    directionHint: 'Bordea la plaza hacia Merced',
    audio: {
      A: 'La catedral ocupa el costado oriente de la plaza desde el siglo XVI, reconstruida una y otra vez.',
      B: 'Santiago se cayó y se volvió a levantar. Esta fachada es un palimpsesto de terremotos y ambición eclesiástica.',
      C: 'Si te detienes, mira el grabado de la torre: el perfil que ves impreso en mapas antiguos todavía coincide.',
      D: 'Sigue por Merced. La basílica queda a pocos minutos.',
    },
  },
  {
    id: 'merced',
    title: 'Basílica de la Merced',
    subtitle: 'Una iglesia que guarda siglos de ciudad.',
    neighborhood: 'Merced',
    lat: -33.4372,
    lng: -70.6478,
    kind: 'micro',
    mediaLevel: 4,
    thematicVector: vectorFromTopics({ T1: 0.9, T3: 0.7, T5: 0.4 }),
    dwellMinutes: 10,
    stairs: false,
    imageKey: 'cathedral',
    quote: {
      persona: 'Fray Antonio de San Miguel',
      text: 'Esta casa se levantó para los que llegan de lejos y no tienen otra sombra.',
    },
    directionHint: 'Sigue Merced hacia Santa Lucía',
    audio: {
      A: 'La Merced es de las iglesias más antiguas que siguen en pie en el centro.',
      B: 'Los mercedarios llegaron con la conquista. El templo cambió de piel, pero el predio es el mismo gesto de hospitalidad colonial.',
      C: 'Hay un Cristo de marfil en el interior que cruzó el Pacífico. Si el templo está abierto, búscalo a la izquierda.',
      D: 'Merced te lleva al cerro. En dos cuadras aparece la decisión: subir a Santa Lucía o seguir a Lastarria.',
    },
  },
  {
    id: 'santa-lucia',
    title: 'Cerro Santa Lucía',
    subtitle: 'El Huelén convertido en paseo de piedra.',
    neighborhood: 'Santa Lucía',
    lat: -33.4406,
    lng: -70.643,
    kind: 'anchor',
    mediaLevel: 3,
    thematicVector: vectorFromTopics({ T3: 0.6, T7: 1, T8: 0.5, T1: 0.4 }),
    dwellMinutes: 18,
    stairs: true,
    daylightLock: true,
    daylight_only: true,
    stepFree: false,
    step_free_certified: false,
    canonical_anchor: true,
    imageKey: 'naturaleza',
    soundscapeLabel: 'Viento, cascada y banda municipal',
    directionHint: 'Baja por la ladera oriente hacia Lastarria',
    audio: {
      A: 'Este cerro se llamó Huelén. Vicuña Mackenna lo convirtió en paseo público en 1872.',
      B: 'Fuentes, terrazas y miradores: un cerro-teatro para una ciudad que quería verse europea sin dejar de ser andina.',
      C: 'Si te quedas, escucha el agua de la cascada. Es un lujo hidráulico del siglo XIX en pleno centro.',
      D: 'La bajada oriente te deja en Lastarria. Cuidado con los peldaños si prefieres el ramal plano.',
    },
  },
  {
    id: 'lastarria',
    title: 'Barrio Lastarria',
    subtitle: 'Arte, cafés y una ciudad que todavía cambia.',
    neighborhood: 'Lastarria',
    lat: -33.4374,
    lng: -70.6408,
    kind: 'pocket',
    mediaLevel: 1,
    thematicVector: vectorFromTopics({ T5: 1, T6: 0.8, T8: 0.9, T9: 0.6 }),
    dwellMinutes: 14,
    stairs: false,
    imageKey: 'lastarria',
    archiveTranscript:
      'Barrio Lastarria, plano de manzana. Cines, librerías y casonas convertidas en galerías. El barrio se consolidó como polo cultural a fines del siglo XX.',
    directionHint: 'Cruza hacia Parque Forestal',
    audio: {
      A: 'Lastarria es un barrio de cuadra corta y vitrina larga.',
      B: 'Aquí el centro se volvió escena: cine, librería, café. Un bolsillo cultural entre el cerro y el parque.',
      C: 'Lee las placas de las casonas. Varias fueron residencias de diplomáticos antes de ser galerías.',
      D: 'Si sigues hacia el parque, el GAM queda a cinco minutos al norte.',
    },
  },
  {
    id: 'parque-forestal',
    title: 'Parque Forestal',
    subtitle: 'Un pulmón lineal junto al Mapocho.',
    neighborhood: 'Forestal',
    lat: -33.4358,
    lng: -70.6418,
    kind: 'micro',
    mediaLevel: 3,
    thematicVector: vectorFromTopics({ T7: 1, T5: 0.5, T8: 0.4 }),
    dwellMinutes: 10,
    stairs: false,
    imageKey: 'naturaleza',
    soundscapeLabel: 'Hojas, río y transeúntes',
    directionHint: 'Sigue el parque hacia el GAM',
    audio: {
      A: 'El Parque Forestal nace cuando Santiago decide domesticar la ribera del Mapocho.',
      B: 'Plátanos orientales, el Bellas Artes, el ritmo de siesta y jogging. Un parque europeo plantado sobre un río andino.',
      C: 'Si te detienes bajo los árboles, el ruido de la Alameda baja dos octavas.',
      D: 'Camina hacia el poniente del parque. El GAM aparece como una caja de hormigón y vidrio.',
    },
  },
  {
    id: 'gam',
    title: 'Centro Gabriela Mistral',
    subtitle: 'Cultura contemporánea sobre una herida urbana.',
    neighborhood: 'Lastarria',
    lat: -33.439,
    lng: -70.64,
    kind: 'pocket',
    mediaLevel: 5,
    thematicVector: vectorFromTopics({ T5: 1, T1: 0.5, T8: 0.4 }),
    dwellMinutes: 12,
    stairs: false,
    imageKey: 'arte',
    thenImageKey: 'mural',
    directionHint: 'Vuelve hacia Merced o sube a Bellavista',
    audio: {
      A: 'El GAM ocupa el predio de la UNCTAD III, un edificio de 1972 pensado para el mundo.',
      B: 'Después del golpe fue Diego Portales, sede de poder. Hoy es centro cultural: la misma planta, otra vocación.',
      C: 'Busca los restos de murales y hormigón original. El edificio nunca se disfrazó del todo.',
      D: 'Desde aquí puedes cruzar el río hacia Bellavista o volver al centro por Merced.',
    },
  },
  {
    id: 'bellavista',
    title: 'Barrio Bellavista',
    subtitle: 'Bohemia al pie del cerro.',
    neighborhood: 'Bellavista',
    lat: -33.4318,
    lng: -70.6358,
    kind: 'pocket',
    mediaLevel: 4,
    thematicVector: vectorFromTopics({ T5: 0.8, T6: 0.9, T8: 1, T9: 0.7 }),
    dwellMinutes: 14,
    stairs: false,
    imageKey: 'chascona',
    quote: {
      persona: 'Pablo Neruda',
      text: 'Me gusta la gente que vibra, que no hay que empujarla, que no hay que decirle que haga las cosas.',
    },
    directionHint: 'Sube hacia La Chascona o el funicular',
    audio: {
      A: 'Bellavista es el barrio que se enciende cuando el centro se apaga.',
      B: 'Murales, restaurantes, casas-museo. Un borde entre Providencia y Recoleta donde la noche tiene oficio.',
      C: 'Mira los murales de Pío Nono. Cada capa tapa otra: el barrio se reescribe todas las semanas.',
      D: 'La Chascona queda una cuadra arriba. El funicular, si quieres cerro, está al fondo de Pío Nono.',
    },
  },
  {
    id: 'la-chascona',
    title: 'La Chascona',
    subtitle: 'La casa secreta de Neruda en el cerro.',
    neighborhood: 'Bellavista',
    lat: -33.4312,
    lng: -70.6342,
    kind: 'micro',
    mediaLevel: 4,
    thematicVector: vectorFromTopics({ T5: 1, T1: 0.4, T8: 0.6 }),
    dwellMinutes: 16,
    stairs: true,
    daylightLock: true,
    daylight_only: true,
    stepFree: false,
    step_free_certified: false,
    imageKey: 'chascona',
    quote: {
      persona: 'Pablo Neruda',
      text: 'Podrán cortar todas las flores, pero no podrán detener la primavera.',
    },
    directionHint: 'Baja a Pío Nono o sigue al funicular',
    audio: {
      A: 'La Chascona se esconde entre árboles. Neruda la nombró por el pelo de Matilde Urrutia.',
      B: 'La casa es un barco encallado en la ladera: pasillos estrechos, colecciones, vistas robadas al valle.',
      C: 'Si el museo está cerrado, quédate en la reja. El color y el desnivel ya cuentan la biografía.',
      D: 'Baja con calma. Las escaleras son parte del relato, no un atajo.',
    },
  },
  {
    id: 'san-cristobal',
    title: 'Cerro San Cristóbal',
    subtitle: 'La virgen, el funicular y el valle entero.',
    neighborhood: 'Parque Metropolitano',
    lat: -33.4253,
    lng: -70.6318,
    kind: 'anchor',
    mediaLevel: 3,
    thematicVector: vectorFromTopics({ T7: 1, T8: 0.4, T3: 0.3 }),
    dwellMinutes: 20,
    stairs: true,
    daylightLock: true,
    daylight_only: true,
    stepFree: false,
    step_free_certified: false,
    canonical_anchor: true,
    imageKey: 'funicular',
    soundscapeLabel: 'Funicular, viento y ciudad lejana',
    directionHint: 'Desciende en funicular hacia Bellavista',
    audio: {
      A: 'El San Cristóbal es el pulmón más alto que ves desde el centro.',
      B: 'Funicular de 1925, piscina, zoológico, virgen. Un cerro convertido en parque metropolitano para una ciudad que crecía sin sombra.',
      C: 'Si te quedas en la terraza, Santiago se lee de poniente a cordillera como un mapa desplegado.',
      D: 'Baja en el funicular. El cuerpo agradece no hacer la ladera dos veces.',
    },
  },
  {
    id: 'mercado-central',
    title: 'Mercado Central',
    subtitle: 'El hierro, el pescado y el pregón.',
    neighborhood: 'Mercado',
    lat: -33.4336,
    lng: -70.6509,
    kind: 'micro',
    mediaLevel: 3,
    thematicVector: vectorFromTopics({ T6: 1, T3: 0.5, T8: 0.4 }),
    dwellMinutes: 12,
    stairs: false,
    imageKey: 'mercado',
    soundscapeLabel: 'Pregones, hielo y cubiertos',
    directionHint: 'Cruza hacia la Plaza de Armas',
    audio: {
      A: 'El Mercado Central es una nave de hierro de 1872.',
      B: 'Arquitectura industrial inglesa para un país que comía del Pacífico. Todavía se grita el precio del congrio.',
      C: 'Quédate junto a un puesto. El pregón es el archivo sonoro más vivo del centro.',
      D: 'Sal hacia San Pablo y en cinco minutos estás otra vez en la plaza.',
    },
  },
  {
    id: 'museo-memoria',
    title: 'Museo de la Memoria',
    subtitle: 'El archivo de lo que el país no quiso olvidar.',
    neighborhood: 'Matucana',
    lat: -33.4462,
    lng: -70.6792,
    kind: 'pocket',
    mediaLevel: 1,
    thematicVector: vectorFromTopics({ T1: 1, T2: 1, T5: 0.4 }),
    dwellMinutes: 22,
    stairs: false,
    sensitiveMemory: true,
    is_sensitive_memory_site: true,
    imageKey: 'museo',
    archiveTranscript:
      'Ficha de archivo. Testimonios, expedientes y objetos de la dictadura. El edificio de Matucana 501 abre el recinto hacia el cielo como una grieta.',
    directionHint: 'Conecta por metro Quinta Normal si usas red',
    audio: {
      A: 'El Museo de la Memoria mira al cielo con una grieta de cobre y vidrio.',
      B: 'No es un palacio: es un archivo. Cartas, fichas, voces. La historia reciente organizada para no volverse rumor.',
      C: 'Si te detienes en el acceso, lee una ficha. Cada hoja es una persona, no un dato.',
      D: 'Vuelve al centro en metro si el tramo a pie supera tu ritmo. Quinta Normal conecta de nuevo con La Moneda.',
    },
  },
  {
    id: 'yungay',
    title: 'Barrio Yungay',
    subtitle: 'Casonas, murales y orgullo de barrio.',
    neighborhood: 'Yungay',
    lat: -33.44,
    lng: -70.6755,
    kind: 'micro',
    mediaLevel: 2,
    thematicVector: vectorFromTopics({ T8: 1, T9: 0.9, T5: 0.5, T6: 0.6 }),
    dwellMinutes: 12,
    stairs: false,
    imageKey: 'yungay',
    forensicHotspots: [
      { x: 0.35, y: 0.48, label: 'Guardapolvo original de la casona' },
      { x: 0.7, y: 0.32, label: 'Mural de memoria vecinal' },
    ],
    directionHint: 'Camina hacia Brasil o Matucana',
    audio: {
      A: 'Yungay se declara barrio y lo defiende.',
      B: 'Casonas republicanas, toma cultural, murales. Un oeste de Santiago que no se dejó borrar por la renovación dura.',
      C: 'Acércate a un muro. Las capas de pintura son actas de asamblea más que decoración.',
      D: 'Si sigues al oriente llegas a Barrio Brasil. Al poniente, Matucana y el museo.',
    },
  },
  {
    id: 'barrio-brasil',
    title: 'Barrio Brasil',
    subtitle: 'Universidades, bares y casonas de adobe.',
    neighborhood: 'Brasil',
    lat: -33.4412,
    lng: -70.6682,
    kind: 'micro',
    mediaLevel: 2,
    thematicVector: vectorFromTopics({ T8: 0.9, T9: 0.7, T6: 0.8, T5: 0.4 }),
    dwellMinutes: 11,
    stairs: false,
    imageKey: 'archivoCalle',
    forensicHotspots: [
      { x: 0.4, y: 0.5, label: 'Adobe visto bajo el estuco' },
      { x: 0.66, y: 0.38, label: 'Balcón de madera restaurado' },
    ],
    directionHint: 'Toma Compañía hacia el centro',
    audio: {
      A: 'Barrio Brasil es el oeste estudiantil del casco.',
      B: 'Plazas, bares, casonas. Un tejido de adobe y republica que sobrevive entre facultades.',
      C: 'Toca con la vista el estuco descascarado: debajo aparece el adobe original.',
      D: 'Compañía te devuelve al eje de La Moneda en quince minutos calmos.',
    },
  },
  {
    id: 'barrio-italia',
    title: 'Barrio Italia',
    subtitle: 'Talleres, diseño y casas reconvertidas.',
    neighborhood: 'Italia',
    lat: -33.4476,
    lng: -70.6234,
    kind: 'pocket',
    mediaLevel: 5,
    thematicVector: vectorFromTopics({ T5: 0.8, T6: 0.9, T8: 0.7, T9: 0.6 }),
    dwellMinutes: 16,
    stairs: false,
    imageKey: 'lastarria',
    thenImageKey: 'mural',
    directionHint: 'Conecta por Irarrázaval o metro Santa Isabel',
    audio: {
      A: 'Italia era un barrio de talleres y ahora es vitrina de oficio.',
      B: 'Casas reconvertidas, patio interior, diseño. Un bolsillo oriente que se visita sin prisa.',
      C: 'Entra a un patio si está abierto. El barrio se entiende desde el interior de manzana, no desde la calle.',
      D: 'Vuelve al centro en metro si tu tiempo es corto. El ramal oriente es un extra, no una obligación.',
    },
  },
  {
    id: 'san-francisco',
    title: 'Iglesia San Francisco',
    subtitle: 'La más antigua en pie sobre la Alameda.',
    neighborhood: 'Alameda',
    lat: -33.4438,
    lng: -70.6476,
    kind: 'micro',
    mediaLevel: 1,
    thematicVector: vectorFromTopics({ T1: 0.8, T3: 1, T4: 0.6 }),
    dwellMinutes: 10,
    stairs: false,
    imageKey: 'fichaArchivo',
    archiveTranscript:
      'La iglesia de San Francisco conserva muros coloniales sobre la Alameda. Es el templo más antiguo de Santiago que sigue en culto.',
    directionHint: 'Sigue la Alameda hacia La Moneda o Santa Lucía',
    audio: {
      A: 'San Francisco se queda cuando todo lo demás se reconstruye.',
      B: 'Muros coloniales sobre la Alameda. Un ancla de adobe en la avenida que quiso ser bulevar.',
      C: 'El claustro guarda un museo. Si está abierto, el patio interior corta el ruido de los buses.',
      D: 'La Alameda te lleva a La Moneda hacia el poniente o a Santa Lucía hacia el oriente.',
    },
  },
  {
    id: 'palacio-pereira',
    title: 'Palacio Pereira',
    subtitle: 'Belle Époque rescatada para la ciudad.',
    neighborhood: 'Barrio Cívico',
    lat: -33.4416,
    lng: -70.6558,
    kind: 'micro',
    mediaLevel: 5,
    thematicVector: vectorFromTopics({ T3: 1, T4: 0.9, T5: 0.5, T1: 0.4 }),
    dwellMinutes: 12,
    stairs: false,
    imageKey: 'arquitectura',
    thenImageKey: 'moneda1973',
    directionHint: 'Camina hacia La Moneda por Teatinos',
    audio: {
      A: 'El Palacio Pereira estuvo a punto de desaparecer. Hoy es archivo y espacio cultural.',
      B: 'Una familia quiso París en Santiago. El palacio quedó vacío, se ruina, y la ciudad lo recuperó como bien común.',
      C: 'Mira el segundo piso. Los balcones todavía cuentan el lujo de una élite que se mudó al oriente.',
      D: 'Teatinos te deja otra vez en La Moneda. El circuito cívico se cierra en cinco minutos.',
    },
  },
];

export function poiImage(poi: Pick<POIStop, 'imageKey'>): ImageSourcePropType {
  return LocalImages[poi.imageKey];
}

function imageFromRef(ref: string): ImageSourcePropType {
  if (ref in LocalImages) return LocalImages[ref as LocalImageKey];
  return { uri: ref };
}

const LAYER_TYPES: InteractiveLayerType[] = [
  'flagship_reveal',
  'persona_card',
  'spatial_soundscape',
  'forensic_look_close',
  'archive_document',
];

export function parseInteractiveLayer(raw: unknown): InteractiveLayer | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const type = (raw as { type?: string }).type;
  if (!type || !LAYER_TYPES.includes(type as InteractiveLayerType)) return undefined;
  return raw as InteractiveLayer;
}

export function resolveInteractiveLayer(poi: POIStop): InteractiveLayer {
  const stored = poi.interactive_layer;
  const type = stored?.type ?? LAYER_TYPE_BY_LEVEL[poi.mediaLevel] ?? 'archive_document';
  return {
    type,
    level: stored?.level ?? poi.mediaLevel,
    asset_then: stored?.asset_then ?? poi.img_before,
    asset_now: stored?.asset_now ?? poi.img_after,
    persona: stored?.persona ?? poi.quote?.persona,
    quote: stored?.quote ?? poi.quote?.text,
    place: stored?.place ?? poi.neighborhood,
    soundscape_label: stored?.soundscape_label ?? poi.soundscapeLabel,
    soundscape_script: stored?.soundscape_script ?? poi.audio.C,
    hotspots: stored?.hotspots?.length ? stored.hotspots : poi.forensicHotspots,
    archive_image: stored?.archive_image,
    transcript: stored?.transcript ?? poi.archiveTranscript ?? poi.audio.B,
    caption: stored?.caption ?? poi.title,
  };
}

export function resolveThenNowSources(poi: POIStop): {
  then: ImageSourcePropType;
  now: ImageSourcePropType;
} | null {
  const layer = resolveInteractiveLayer(poi);
  const thenRef = layer.asset_then ?? poi.img_before;
  const nowRef = layer.asset_now ?? poi.img_after;
  const thenRemote = thenRef ? imageFromRef(thenRef) : undefined;
  const nowRemote = nowRef ? imageFromRef(nowRef) : undefined;
  if (thenRemote && nowRemote) return { then: thenRemote, now: nowRemote };
  if (poi.thenImageKey) {
    return { then: LocalImages[poi.thenImageKey], now: poiImage(poi) };
  }
  return null;
}

export function poiToRouteStop(poi: POIStop, index: number, walkMin = 8, meters = 600): RouteStop {
  return {
    id: poi.id,
    number: String(index + 1).padStart(2, '0'),
    title: poi.title,
    subtitle: poi.subtitle,
    image: poiImage(poi),
    walkMin,
    meters,
    experienceMin: poi.dwellMinutes,
    badge: poi.kind === 'micro' ? 'DESCUBRIMIENTO' : poi.id === 'morande-80' ? 'MEMORIA VIVA' : undefined,
  };
}

export function getPoiById(id: string): POIStop | undefined {
  return SANTIAGO_POIS.find((p) => p.id === id);
}

export function narrativeScript(poi: POIStop): { A: string; B: string; C: string; D: string } {
  return {
    A: poi.modules?.module_a || poi.audio.A,
    B: poi.modules?.module_b || poi.audio.B,
    C: poi.modules?.module_c || poi.audio.C,
    D: poi.modules?.module_d || poi.audio.D,
  };
}

export const CENTRO_TOUR_IDS = [
  'plaza-de-armas',
  'catedral',
  'pasaje-phillips',
  'la-moneda',
  'morande-80',
] as const;
