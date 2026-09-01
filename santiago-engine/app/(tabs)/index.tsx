import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandMark } from '@/src/components/Chrome';
import { ChronoActionButton } from '@/src/components/ChronoActionButton';
import { ChronoScreen } from '@/src/components/ChronoScreen';
import { TornBadge, TornPatch } from '@/src/components/Collage';
import { RouteStopRow } from '@/src/components/RouteStopRow';
import { timeBandFor } from '@/src/data/algorithm';
import { LocalImages } from '@/src/data/localImages';
import { poiImage, poiToRouteStop, SANTIAGO_POIS } from '@/src/data/pois';
import { rankPoisForProfile, routeLengthMeters } from '@/src/services/knapsackEngine';
import { fetchSpatialCatalog } from '@/src/services/tourService';
import { useWalk } from '@/src/store/WalkContext';
import { fillParent } from '@/src/theme/layout';

export default function HomeScreen() {
  const {
    setStatus,
    startTour,
    startFromStop,
    generateTour,
    hydrateCatalog,
    status,
    activeTour,
    currentPoi,
    remainingMinutes,
    currentStopIndex,
    tourStops,
    timeBudgetMinutes,
    interests,
    finishLabel,
    avoidStairs,
    memorySitesOptIn,
    catalogPois,
    rhythm,
    mobilityArchetype,
    userProfile,
    addPoiToTour,
    itinerarySource,
  } = useWalk();
  const [loadingTour, setLoadingTour] = useState(false);
  const budget = timeBudgetMinutes || 105;
  const band = timeBandFor(budget);

  useEffect(() => {
    let cancelled = false;
    setLoadingTour(true);
    fetchSpatialCatalog()
      .then((pois) => {
        if (cancelled) return;
        hydrateCatalog(pois);
      })
      .finally(() => {
        if (!cancelled) setLoadingTour(false);
      });
    return () => {
      cancelled = true;
    };
  }, [hydrateCatalog]);

  useEffect(() => {
    if (status === 'active' || status === 'paused') return;
    if (itinerarySource === 'curated' || itinerarySource === 'manual') return;
    generateTour();
  }, [
    avoidStairs,
    budget,
    catalogPois,
    generateTour,
    interests,
    itinerarySource,
    memorySitesOptIn,
    mobilityArchetype,
    rhythm,
    status,
  ]);

  const resume =
    status === 'paused' ||
    ((status === 'active' || status === 'completed') && (currentStopIndex > 0 || (activeTour?.completedStops.length ?? 0) > 0));
  const stops = tourStops.length ? tourStops.map((s, i) => poiToRouteStop(s, i)) : [];
  const heroStop = currentPoi ?? tourStops[0];
  const rankedOffRoute = useMemo(() => {
    const catalog = catalogPois.length ? catalogPois : SANTIAGO_POIS;
    return rankPoisForProfile(catalog, userProfile, tourStops.map((s) => s.id));
  }, [catalogPois, tourStops, userProfile]);
  const suggested = rankedOffRoute.slice(0, 3);
  const jewels = rankedOffRoute.slice(3, 8);
  const totalMeters = useMemo(() => {
    if (tourStops.length > 1) {
      return routeLengthMeters(
        tourStops.map((s) => ({ latitude: s.lat, longitude: s.lng })),
      );
    }
    return Math.round((activeTour?.distanceKm ?? 0) * 1000);
  }, [activeTour?.distanceKm, tourStops]);

  return (
    <ChronoScreen>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.top}>
          <BrandMark compact />
          <View style={styles.topRight}>
            <Pressable
              onPress={() => router.push('/(tabs)/profile')}
              style={styles.avatar}
              hitSlop={8}
            >
              <View style={styles.avatarHead} />
              <View style={styles.avatarBody} />
            </Pressable>
            <Pressable onPress={() => router.push('/(tabs)/profile')} hitSlop={12} style={styles.menuBtn}>
              <View style={styles.menuLine} />
              <View style={styles.menuLine} />
              <View style={styles.menuLine} />
            </Pressable>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {resume && heroStop ? (
            <>
              <TornBadge color="#5D3A8E">RETOMA DONDE LO DEJASTE</TornBadge>
              <Text style={styles.h1}>Tu ruta sigue abierta.</Text>
              <View style={styles.resumeCard}>
                <Image source={poiImage(heroStop)} style={styles.resumeImg} />
                <View style={styles.resumeWash} />
                <View style={styles.resumeMeta}>
                  <Text style={styles.resumeK}>ESTABAS EN</Text>
                  <Text style={styles.resumeTitle}>{heroStop.title}</Text>
                  <Text style={styles.resumeSub}>
                    {activeTour?.completedStops.length ?? currentStopIndex}/{tourStops.length} paradas · {remainingMinutes} min restantes
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <>
              <TornBadge color="#2E8B9A">DESDE TU UBICACIÓN</TornBadge>
              <Text style={styles.h1}>Tengo una gran tarde para ti.</Text>
            </>
          )}

          <View style={styles.pillRow}>
            <View style={styles.pill}>
              <Text style={styles.pillTxt}>{band.range.toUpperCase()} • {band.label.toUpperCase()}</Text>
            </View>
            <Pressable onPress={() => router.push('/onboarding/interests')} hitSlop={8}>
              <Text style={styles.adjust}>AJUSTAR →</Text>
            </Pressable>
          </View>

          <View style={styles.hero}>
            <View style={styles.heroPhoto}>
              <Image
                source={heroStop ? poiImage(heroStop) : LocalImages.monedaToday}
                style={styles.heroImg}
                resizeMode="cover"
              />
              <View style={styles.heroWash} />
              <View style={styles.heroBanner}>
                <Text style={styles.heroBannerTxt}>
                  {(activeTour?.title ?? 'SANTIAGO: PODER, MEMORIA Y ARTE').toUpperCase()}
                </Text>
              </View>
            </View>
            <View style={styles.mapSnippet} pointerEvents="none">
              <Image source={LocalImages.mapaImpreso} style={styles.mapImg} resizeMode="cover" />
              <TornPatch color="#F4EFE6" width={54} height={32} rotate={-24} style={styles.mapBite} />
            </View>
            <View style={styles.sun} pointerEvents="none">
              <Image source={LocalImages.stampRedSun} style={styles.sunImg} resizeMode="contain" />
            </View>
          </View>

          <View style={styles.secHead}>
            <Text style={styles.sec}>TU RUTA</Text>
            <Pressable onPress={() => router.push('/(tabs)/map')} hitSlop={8}>
              <Text style={styles.link}>VER EN MAPA →</Text>
            </Pressable>
          </View>
          <View style={styles.secRule} />

          {stops.map((s, i, arr) => (
            <RouteStopRow
              key={s.id}
              stopNumber={s.number}
              title={s.title}
              subtitle={s.subtitle}
              image={s.image}
              isLast={i === arr.length - 1}
              onPress={() => {
                startFromStop(i);
                router.push('/walk/stop');
              }}
            />
          ))}

          {loadingTour && !stops.length ? (
            <Text style={styles.meta}>Cargando itinerario…</Text>
          ) : null}

          <View style={styles.discWrap}>
            <TornBadge color="#5D3A8E" rotate={-1.5}>
              {`+ ${Math.max(1, stops.filter((s) => s.badge === 'DESCUBRIMIENTO').length || 1)} DESCUBRIMIENTO EN EL CAMINO`}
            </TornBadge>
          </View>
          <Text style={styles.meta}>
            {stops.length || 0} lugares • {totalMeters.toLocaleString('es-CL')} m • termina {finishLabel}
            {activeTour?.harmonic
              ? `  ·  ${activeTour.harmonic.anchors}A / ${activeTour.harmonic.pockets}P / ${activeTour.harmonic.micros}M`
              : ''}
          </Text>
          {suggested.length ? (
            <>
              <View style={styles.secHead}>
                <Text style={styles.sec}>SUGERIDOS PARA TI</Text>
                <Text style={styles.link}>TOP 3 DEL TENSOR</Text>
              </View>
              <View style={styles.secRule} />
              {suggested.map((item) => (
                <View key={item.poi.id} style={styles.suggestRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.suggestTitle}>{item.poi.title.toUpperCase()}</Text>
                    <Text style={styles.suggestMeta}>Match {item.matchPct}% · ChronoWorth {item.chronoWorth}</Text>
                  </View>
                  <Pressable onPress={() => addPoiToTour(item.poi.id)} style={styles.addBtn}>
                    <Text style={styles.addTxt}>AÑADIR</Text>
                  </Pressable>
                </View>
              ))}
            </>
          ) : null}

          {jewels.length ? (
            <>
              <View style={[styles.secHead, { marginTop: 16 }]}>
                <Text style={styles.sec}>OTRAS JOYAS QUE PODRÍAN GUSTARTE</Text>
              </View>
              <View style={styles.secRule} />
              {jewels.map((item) => (
                <Pressable
                  key={item.poi.id}
                  onPress={() => router.push(`/place/${item.poi.id}`)}
                  style={styles.jewelRow}
                >
                  <Text style={styles.jewelTitle}>{item.poi.title}</Text>
                  <Text style={styles.jewelMeta}>{item.matchPct}%</Text>
                </Pressable>
              ))}
            </>
          ) : null}

          <Pressable onPress={() => router.push('/why-route')} hitSlop={8}>
            <Text style={styles.why}>¿Por qué esta ruta?</Text>
          </Pressable>
        </ScrollView>

        <View style={styles.ctaWrap}>
          <ChronoActionButton
            title={resume ? 'SEGUIR RUTA' : 'COMENZAR MI CAMINATA'}
            onPress={() => {
              if (resume) {
                startTour();
                setStatus('active');
                router.push('/walk/active');
                return;
              }
              startFromStop(0);
              router.push('/walk/active');
            }}
          />
        </View>
      </SafeAreaView>
    </ChronoScreen>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    paddingHorizontal: 20,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.4,
    borderColor: '#121212',
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
    paddingBottom: 3,
  },
  avatarHead: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#121212',
    marginBottom: 2,
  },
  avatarBody: {
    width: 16,
    height: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: '#121212',
  },
  menuBtn: {
    width: 26,
    height: 18,
    justifyContent: 'space-between',
    paddingVertical: 1,
  },
  menuLine: {
    height: 1.6,
    backgroundColor: '#121212',
    borderRadius: 1,
  },
  scroll: {
    paddingBottom: 16,
  },
  h1: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 46,
    lineHeight: 44,
    color: '#121212',
    marginTop: 10,
    marginRight: 8,
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 14,
  },
  pill: {
    backgroundColor: '#E5A93C',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillTxt: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 13,
    letterSpacing: 0.8,
    color: '#121212',
  },
  adjust: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 14,
    letterSpacing: 0.8,
    color: '#121212',
  },
  hero: {
    height: 188,
    marginBottom: 22,
  },
  heroPhoto: {
    ...fillParent,
    overflow: 'hidden',
    backgroundColor: '#DCD6CB',
  },
  heroImg: {
    width: '100%',
    height: '100%',
  },
  heroWash: {
    ...fillParent,
    backgroundColor: 'rgba(62, 44, 26, 0.18)',
  },
  mapSnippet: {
    position: 'absolute',
    left: -10,
    top: -8,
    width: 108,
    height: 78,
    overflow: 'hidden',
    transform: [{ rotate: '-9deg' }],
    zIndex: 3,
    borderWidth: 3,
    borderColor: '#F4EFE6',
  },
  mapBite: {
    position: 'absolute',
    right: -8,
    bottom: -6,
  },
  mapImg: {
    width: '100%',
    height: '100%',
  },
  sun: {
    position: 'absolute',
    right: 8,
    top: 2,
    width: 96,
    height: 96,
    zIndex: 4,
  },
  sunImg: {
    width: 96,
    height: 96,
  },
  heroBanner: {
    position: 'absolute',
    left: 0,
    right: 36,
    bottom: 14,
    backgroundColor: '#121212',
    paddingHorizontal: 12,
    paddingVertical: 7,
    zIndex: 2,
  },
  heroBannerTxt: {
    color: '#FFF',
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 13,
    letterSpacing: 0.9,
  },
  secHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sec: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 22,
    color: '#121212',
    letterSpacing: 1,
  },
  link: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 14,
    letterSpacing: 0.8,
    color: '#121212',
  },
  secRule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#DDD5C7',
    marginTop: 8,
    marginBottom: 14,
  },
  discWrap: {
    marginTop: 4,
    marginBottom: 10,
  },
  meta: {
    fontFamily: 'Inter_400Regular',
    color: '#5C564F',
    fontSize: 13,
  },
  why: {
    fontFamily: 'Caveat_700Bold',
    fontSize: 24,
    color: '#E54B2D',
    marginTop: 6,
    marginBottom: 4,
  },
  suggestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.2,
    borderColor: '#121212',
    backgroundColor: '#FFFCF6',
    padding: 10,
    marginBottom: 8,
  },
  suggestTitle: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 18,
    lineHeight: 20,
    color: '#121212',
  },
  suggestMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#5C564F',
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: '#121212',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  addTxt: {
    color: '#FFF',
    fontFamily: 'BebasNeue_400Regular',
    letterSpacing: 0.8,
    fontSize: 13,
  },
  jewelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#DDD5C7',
  },
  jewelTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#121212',
    flex: 1,
    marginRight: 8,
  },
  jewelMeta: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 16,
    color: '#2E8B9A',
  },
  ctaWrap: {
    paddingTop: 8,
    paddingBottom: 10,
  },
  resumeCard: {
    height: 140,
    marginTop: 12,
    marginBottom: 4,
    borderWidth: 1.5,
    borderColor: '#121212',
    overflow: 'hidden',
  },
  resumeImg: { width: '100%', height: '100%' },
  resumeWash: {
    ...fillParent,
    backgroundColor: 'rgba(18,18,18,0.28)',
  },
  resumeMeta: { position: 'absolute', left: 12, bottom: 12, right: 12 },
  resumeK: { color: '#E5A93C', fontFamily: 'BebasNeue_400Regular', letterSpacing: 1.4, fontSize: 12 },
  resumeTitle: { color: '#FFF', fontFamily: 'BebasNeue_400Regular', fontSize: 28, lineHeight: 28 },
  resumeSub: { color: '#F4EFE6', fontFamily: 'Inter_400Regular', marginTop: 2 },
});
