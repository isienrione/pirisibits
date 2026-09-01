import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HandwrittenNote } from '@/src/components/HandwrittenNote';
import { ArchiveDocumentViewer } from '@/src/components/media/ArchiveDocumentViewer';
import { ForensicLookClose } from '@/src/components/media/ForensicLookClose';
import { HistoricalSoundscape } from '@/src/components/media/HistoricalSoundscape';
import { PersonaCard } from '@/src/components/media/PersonaCard';
import { ThenNowSlider, VintagePostcard } from '@/src/components/media/ThenNowSlider';
import { LocalImages } from '@/src/data/localImages';
import {
  LAYER_META,
  poiImage,
  resolveInteractiveLayer,
  resolveThenNowSources,
  type InteractiveLayerType,
  type POIStop,
} from '@/src/data/pois';
import { ChronoTokens } from '@/src/theme/tokens';

const DEFAULT_FORENSIC = [
  { x: 0.3, y: 0.42, label: 'Marca de metralla en el paramento' },
  { x: 0.68, y: 0.55, label: 'Cicatriz de cornisa' },
  { x: 0.52, y: 0.28, label: 'Detalle arquitectónico' },
];

function LayerChrome({
  type,
  children,
}: {
  type: InteractiveLayerType;
  children: React.ReactNode;
}) {
  const meta = LAYER_META[type];
  return (
    <View>
      <Text style={styles.kicker}>{meta.kicker} · {meta.title}</Text>
      <HandwrittenNote size={20} rotate={-2} style={styles.note}>
        {meta.note}
      </HandwrittenNote>
      {children}
    </View>
  );
}

function FlagshipReveal({ poi }: { poi: POIStop }) {
  const layer = resolveInteractiveLayer(poi);
  const pair = resolveThenNowSources(poi);
  if (pair) {
    return (
      <ThenNowSlider
        thenImage={pair.then}
        nowImage={pair.now}
        asset_then={layer.asset_then}
        asset_now={layer.asset_now}
      />
    );
  }
  return <VintagePostcard source={poiImage(poi)} caption={layer.caption} stamp="THEN / NOW" />;
}

export function MediaLayer({ poi }: { poi: POIStop }) {
  const layer = resolveInteractiveLayer(poi);
  const type = layer.type;

  let body: React.ReactNode = <VintagePostcard source={poiImage(poi)} caption={poi.title} />;

  if (type === 'flagship_reveal') {
    body = <FlagshipReveal poi={poi} />;
  } else if (type === 'persona_card') {
    body = (
      <PersonaCard
        persona={layer.persona ?? poi.quote?.persona ?? poi.title}
        quote={layer.quote ?? poi.quote?.text ?? poi.subtitle}
        place={layer.place ?? poi.neighborhood}
      />
    );
  } else if (type === 'spatial_soundscape') {
    body = (
      <HistoricalSoundscape
        label={layer.soundscape_label ?? poi.soundscapeLabel ?? poi.title}
        script={layer.soundscape_script ?? poi.audio.C}
      />
    );
  } else if (type === 'forensic_look_close') {
    body = (
      <ForensicLookClose
        image={poiImage(poi)}
        hotspots={layer.hotspots?.length ? layer.hotspots : DEFAULT_FORENSIC}
      />
    );
  } else if (type === 'archive_document') {
    const archiveSrc = layer.archive_image
      ? layer.archive_image in LocalImages
        ? LocalImages[layer.archive_image as keyof typeof LocalImages]
        : { uri: layer.archive_image }
      : poiImage(poi) ?? LocalImages.fichaArchivo;
    body = (
      <ArchiveDocumentViewer
        image={archiveSrc}
        transcript={layer.transcript ?? poi.archiveTranscript ?? poi.audio.B}
      />
    );
  }

  return <LayerChrome type={type}>{body}</LayerChrome>;
}

export function StopHeroMedia({ poi }: { poi: POIStop }) {
  return <MediaLayer poi={poi} />;
}

export function StopMediaExtras({ poi }: { poi: POIStop }) {
  const type = resolveInteractiveLayer(poi).type;
  if (type !== 'persona_card' && poi.quote) {
    return (
      <PersonaCard
        persona={poi.quote.persona}
        quote={poi.quote.text}
        place={poi.neighborhood}
      />
    );
  }
  if (type !== 'forensic_look_close' && poi.forensicHotspots?.length) {
    return <ForensicLookClose image={poiImage(poi)} hotspots={poi.forensicHotspots} />;
  }
  return null;
}

const styles = StyleSheet.create({
  kicker: {
    fontFamily: ChronoTokens.fonts.titleHeavy,
    fontSize: 14,
    letterSpacing: 1.4,
    color: ChronoTokens.colors.accentTeal,
    marginBottom: 2,
  },
  note: {
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
});
