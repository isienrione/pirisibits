export type CuratedTour = {
  id: string;
  title: string;
  kicker: string;
  subtitle: string;
  durationLabel: string;
  stopIds: string[];
};

export const CURATED_TOURS: CuratedTour[] = [
  {
    id: 'clandestino-1973',
    title: 'Santiago Clandestino: La Ruta de los Archivos Ocultos (1973)',
    kicker: 'MEMORIA VIVA',
    subtitle: 'Morandé 80, Londres 38 y el archivo de Matucana. Una tarde de ausencia y nombres.',
    durationLabel: '90–120 min',
    stopIds: ['la-moneda', 'morande-80', 'londres-38', 'museo-memoria'],
  },
  {
    id: 'eje-poder',
    title: 'El Eje del Poder: De la Colonia al Palacio',
    kicker: 'CÍVICO',
    subtitle: 'Plaza de Armas, Catedral, La Moneda y Pereira. El relato institucional de Santiago.',
    durationLabel: '90–120 min',
    stopIds: ['plaza-de-armas', 'catedral', 'la-moneda', 'palacio-pereira'],
  },
  {
    id: 'lastarria-bohemia',
    title: 'Arquitectura y Café de Bohemia en Lastarria',
    kicker: 'BARRIO',
    subtitle: 'Santa Lucía, Lastarria, Forestal y el GAM. Piedra, cine y una copa al final.',
    durationLabel: '90–120 min',
    stopIds: ['santa-lucia', 'lastarria', 'parque-forestal', 'gam'],
  },
  {
    id: 'bohemia-cerro',
    title: 'Bellavista secreto: Neruda, murales y el cerro',
    kicker: 'ARTE VIVO',
    subtitle: 'Pío Nono, La Chascona y el funicular. Para quien quiere noche y ladera.',
    durationLabel: '180+ min',
    stopIds: ['bellavista', 'la-chascona', 'san-cristobal', 'lastarria'],
  },
];
