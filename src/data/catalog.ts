import type { ImageSourcePropType } from 'react-native';
import type { PillarId } from '@/src/data/algorithm';
import { LocalImages } from '@/src/data/localImages';

export const MEDIA = {
  walker:
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=900&q=70',
  skyline:
    'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=70',
  clockTower:
    'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=70',
  cathedral:
    'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=1000&q=70',
  plaza:
    'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?auto=format&fit=crop&w=1200&q=70',
  moneda:
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=70',
  palaceFacade:
    'https://images.unsplash.com/photo-1549147538-86e3d546e326?auto=format&fit=crop&w=1200&q=70',
  palaceInterior:
    'https://images.unsplash.com/photo-1564078516393-cf04bd966897?auto=format&fit=crop&w=1400&q=70',
  museum:
    'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?auto=format&fit=crop&w=1000&q=70',
  cafe:
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1000&q=70',
  park:
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1000&q=70',
  barrio:
    'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1000&q=70',
  mapHands:
    'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1000&q=70',
  alley:
    'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1000&q=70',
  plazaCafe:
    'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?auto=format&fit=crop&w=1000&q=70',
  door:
    'https://images.unsplash.com/photo-1516450363810-039a45d4250e?auto=format&fit=crop&w=800&q=70',
  arcade:
    'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1000&q=70',
  churchAndes:
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=70',
  crucifix:
    'https://images.unsplash.com/photo-1431274172761-fca41d930114?auto=format&fit=crop&w=1000&q=70',
  statues:
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=1000&q=70',
  ruralRoad:
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=70',
  modernStreet:
    'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1000&q=70',
  walkingLegs:
    'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=800&q=70',
};

export const INTERESTS: {
  id: PillarId;
  title: string;
  image: ImageSourcePropType;
  swatch: ImageSourcePropType;
}[] = [
  { id: 'historia', title: 'Historia', image: LocalImages.historia, swatch: LocalImages.swatchRed },
  { id: 'arquitectura', title: 'Arquitectura', image: LocalImages.arquitectura, swatch: LocalImages.swatchTeal },
  { id: 'arte', title: 'Arte y Cultura', image: LocalImages.arte, swatch: LocalImages.swatchMustard },
  { id: 'vida_local', title: 'Vida Local', image: LocalImages.mercado, swatch: LocalImages.swatchPurple },
  { id: 'naturaleza', title: 'Naturaleza', image: LocalImages.naturaleza, swatch: LocalImages.swatchTeal },
  { id: 'barrios', title: 'Barrios', image: LocalImages.yungay, swatch: LocalImages.swatchMustard },
];

export const RHYTHMS = [
  {
    id: 'estructurado' as const,
    title: 'Estructurado',
    subtitle: 'Quiero un plan claro.',
    image: LocalImages.mapaDibujado,
  },
  {
    id: 'equilibrado' as const,
    title: 'Equilibrado',
    subtitle: 'Un plan con espacio para improvisar.',
    image: LocalImages.lastarria,
  },
  {
    id: 'espontaneo' as const,
    title: 'Espontáneo',
    subtitle: 'Prefiero dejarme llevar.',
    image: LocalImages.centro,
  },
];

export type StopStatus = 'done' | 'current' | 'upcoming' | 'final';

export type RouteStop = {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  image: ImageSourcePropType;
  walkMin: number;
  meters: number;
  experienceMin: number;
  badge?: string;
};

export const DEMO_ROUTE = {
  id: 'poder-memoria-arte',
  title: 'Santiago: Poder, Memoria y Arte',
  durationHours: 2,
  distanceKm: 2.8,
  finishBy: '17:30',
  stops: [
    {
      id: 'la-moneda',
      number: '01',
      title: 'La Moneda',
      subtitle: 'El poder, la historia y lo que hoy se vive.',
      image: LocalImages.monedaToday,
      walkMin: 8,
      meters: 600,
      experienceMin: 15,
    },
    {
      id: 'morande-80',
      number: '02',
      title: 'Morandé 80',
      subtitle: 'Una puerta que Chile decidió no olvidar.',
      image: LocalImages.morande,
      walkMin: 7,
      meters: 480,
      experienceMin: 15,
      badge: 'MEMORIA VIVA',
    },
    {
      id: 'lastarria',
      number: '03',
      title: 'Barrio Lastarria',
      subtitle: 'Arte, cafés y una ciudad que todavía cambia.',
      image: LocalImages.lastarria,
      walkMin: 10,
      meters: 750,
      experienceMin: 12,
    },
    {
      id: 'plaza-de-armas',
      number: '04',
      title: 'Plaza de Armas',
      subtitle: 'El corazón cívico de Santiago.',
      image: LocalImages.plaza,
      walkMin: 6,
      meters: 600,
      experienceMin: 15,
    },
  ] satisfies RouteStop[],
};

export const WALK_STOPS: RouteStop[] = [
  {
    id: 'plaza-de-armas',
    number: '01',
    title: 'Plaza de Armas',
    subtitle: 'El corazón cívico de Santiago.',
    image: LocalImages.plaza,
    walkMin: 6,
    meters: 600,
    experienceMin: 15,
  },
  {
    id: 'merced',
    number: '02',
    title: 'Basílica de la Merced',
    subtitle: 'Una iglesia que guarda siglos de ciudad.',
    image: LocalImages.cathedral,
    walkMin: 8,
    meters: 650,
    experienceMin: 12,
  },
  {
    id: 'phillips',
    number: '03',
    title: 'Pasaje Phillips',
    subtitle: 'Un pasaje que todavía huele a centro.',
    image: LocalImages.centro,
    walkMin: 10,
    meters: 720,
    experienceMin: 12,
  },
  {
    id: 'morande-80',
    number: '04',
    title: 'Morandé 80',
    subtitle: 'Una puerta que Chile decidió no olvidar.',
    image: LocalImages.morande,
    walkMin: 7,
    meters: 480,
    experienceMin: 15,
    badge: 'MEMORIA VIVA',
  },
];

export const AUDIO_CHAPTERS = [
  { id: 'c1', title: 'La fachada que quería ser París', duration: '04:10' },
  { id: 'c2', title: 'Una familia, un palacio', duration: '05:02' },
  { id: 'c3', title: 'La vida social y el esplendor', duration: '06:18' },
  { id: 'c4', title: 'El palacio que quedó vacío', duration: '05:44' },
  { id: 'c5', title: 'Lo que todavía se oye', duration: '04:36' },
];
