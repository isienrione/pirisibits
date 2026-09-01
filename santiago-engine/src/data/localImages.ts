import type { ImageSourcePropType } from 'react-native';

export const LocalImages = {
  monedaToday: require('../../assets/images/la_moneda_today.jpg') as ImageSourcePropType,
  moneda1973: require('../../assets/images/la_moneda_1973.jpg') as ImageSourcePropType,
  morande: require('../../assets/images/morande_door.jpg') as ImageSourcePropType,
  lastarria: require('../../assets/images/lastarria.jpeg') as ImageSourcePropType,
  plaza: require('../../assets/images/plaza-de-armas.jpeg') as ImageSourcePropType,
  plazaBn: require('../../assets/images/plaza-de-armas-bn.jpeg') as ImageSourcePropType,
  stampRedSun: require('../../assets/images/stamp_red_sun.png') as ImageSourcePropType,
  mapaImpreso: require('../../assets/images/mapa-impreso.jpeg') as ImageSourcePropType,
  mapaDibujado: require('../../assets/images/mapa-dibujado.jpeg') as ImageSourcePropType,
  historia: require('../../assets/images/diario-1973.jpeg') as ImageSourcePropType,
  arquitectura: require('../../assets/images/a05-arquitectura.jpg') as ImageSourcePropType,
  arte: require('../../assets/images/arte-abstracto.jpeg') as ImageSourcePropType,
  mercado: require('../../assets/images/mercado.jpeg') as ImageSourcePropType,
  naturaleza: require('../../assets/images/cerro-san-cristobal.jpeg') as ImageSourcePropType,
  yungay: require('../../assets/images/yungay.jpeg') as ImageSourcePropType,
  centro: require('../../assets/images/stgocentro.jpeg') as ImageSourcePropType,
  cathedral: require('../../assets/images/stgo_cathedral_etch.png') as ImageSourcePropType,
  walker: require('../../assets/images/walker_cutout.png') as ImageSourcePropType,
  andes: require('../../assets/images/andes_engraving.png') as ImageSourcePropType,
  andesBw: require('../../assets/images/andes_mountains_bw.png') as ImageSourcePropType,
  swatchTeal: require('../../assets/images/swatch_teal.png') as ImageSourcePropType,
  swatchMustard: require('../../assets/images/swatch_mustard.png') as ImageSourcePropType,
  swatchRed: require('../../assets/images/swatch_red.png') as ImageSourcePropType,
  swatchPurple: require('../../assets/images/swatch_purple.png') as ImageSourcePropType,
  insolito: require('../../assets/images/insolito.jpeg') as ImageSourcePropType,
  archivoCalle: require('../../assets/images/archivo-calle-blanco-y-negro.jpeg') as ImageSourcePropType,
  museo: require('../../assets/images/museo-de-la-memoria.jpeg') as ImageSourcePropType,
  mural: require('../../assets/images/mural.jpeg') as ImageSourcePropType,
  chascona: require('../../assets/images/la-chascona.jpeg') as ImageSourcePropType,
  funicular: require('../../assets/images/funicular.jpeg') as ImageSourcePropType,
  fichaArchivo: require('../../assets/images/ficha-archivo.jpeg') as ImageSourcePropType,
} as const;

export type LocalImageKey = keyof typeof LocalImages;

export function localImage(key: LocalImageKey): ImageSourcePropType {
  return LocalImages[key];
}
