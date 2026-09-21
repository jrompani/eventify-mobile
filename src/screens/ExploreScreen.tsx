import { Ionicons } from '@expo/vector-icons';
import * as ExpoLocation from 'expo-location';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';

import { searchPlaces, PlaceResult } from '../api/places';
import { EmptyState } from '../components/EmptyState';
import { ExperienceCard } from '../components/ExperienceCard';
import { Coordinate, experienceCoordinate, hasExperienceCoordinates } from '../location/distance';
import { colors } from '../theme/colors';
import { AuthSession } from '../types/auth';
import { Experience } from '../types/experience';

type ExploreScreenProps = {
  session: AuthSession;
  experiences: Experience[];
  userCoordinate: Coordinate | null;
  onOpenExperience: (experience: Experience) => void;
};

export function ExploreScreen({ session, experiences, userCoordinate: initialUserCoordinate, onOpenExperience }: ExploreScreenProps) {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'Radar & lista' | 'Lista pura' | 'Mapa radar'>('Radar & lista');
  const [userCoordinate, setUserCoordinate] = useState<Coordinate | null>(initialUserCoordinate);
  const [places, setPlaces] = useState<PlaceResult[]>([]);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [placesError, setPlacesError] = useState<string | null>(null);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const mapRef = useRef<MapView | null>(null);
  const filteredExperiences = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return experiences;
    }

    return experiences.filter((experience) => {
      const searchable = [
        experience.title,
        experience.kind,
        experience.place,
        experience.price,
        experience.trustLabel,
        ...experience.tags,
      ].join(' ').toLowerCase();
      return searchable.includes(normalizedQuery);
    });
  }, [experiences, query]);
  const showRadar = mode !== 'Lista pura';
  const showList = mode !== 'Mapa radar';
  const mappedExperiences = useMemo(() => filteredExperiences.filter(hasExperienceCoordinates), [filteredExperiences]);
  const region = useMemo(() => buildRegion(mappedExperiences, places, userCoordinate), [mappedExperiences, places, userCoordinate]);

  useEffect(() => {
    setUserCoordinate(initialUserCoordinate);
  }, [initialUserCoordinate]);

  useEffect(() => {
    const normalizedQuery = query.trim();
    if (normalizedQuery.length < 2) {
      setPlaces([]);
      setPlacesError(null);
      setPlacesLoading(false);
      return;
    }

    let mounted = true;
    setPlacesLoading(true);
    const timeout = setTimeout(() => {
      searchPlaces(session, normalizedQuery, userCoordinate)
        .then((results) => {
          if (mounted) {
            setPlaces(results);
            setPlacesError(null);
          }
        })
        .catch((exception) => {
          if (mounted) {
            setPlaces([]);
            setPlacesError(exception instanceof Error ? exception.message : 'No se pudo buscar lugares');
          }
        })
        .finally(() => {
          if (mounted) {
            setPlacesLoading(false);
          }
        });
    }, 350);

    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, [query, session, userCoordinate]);

  useEffect(() => {
    let mounted = true;

    async function loadLocation() {
      try {
        const permission = await ExpoLocation.requestForegroundPermissionsAsync();
        if (permission.status !== 'granted') {
          return;
        }
        const position = await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.Balanced });
        if (mounted) {
          setUserCoordinate({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        }
      } catch {
        if (mounted) {
          setUserCoordinate(null);
        }
      }
    }

    void loadLocation();
    return () => {
      mounted = false;
    };
  }, []);

  function recenterMap() {
    mapRef.current?.animateToRegion(region, 350);
  }

  return (
    <ScrollView contentContainerStyle={styles.listContent} scrollEnabled={scrollEnabled}>
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={22} color={colors.primary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Techno Palermo"
          placeholderTextColor={colors.subtle}
          style={styles.searchInput}
        />
        <Ionicons name="options-outline" size={22} color={colors.primary} />
      </View>

      <View style={styles.modeRow}>
        {(['Radar & lista', 'Lista pura', 'Mapa radar'] as const).map((nextMode) => (
          <Pressable
            key={nextMode}
            style={[styles.modeChip, mode === nextMode && styles.modeChipActive]}
            onPress={() => setMode(nextMode)}
          >
            <Text style={[styles.modeText, mode === nextMode && styles.modeTextActive]}>{nextMode}</Text>
          </Pressable>
        ))}
      </View>

      {showRadar ? (
        <View style={styles.radarCard}>
          <View style={styles.radarHeader}>
            <View>
              <Text style={styles.radarTitle}>{userCoordinate ? 'GPS activo' : 'Mapa publico'}</Text>
              <Text style={styles.radarMeta}>
                {placesLoading ? 'Buscando lugares...' : userCoordinate ? 'Ordenado por cercania' : 'Activa GPS para distancias reales'}
              </Text>
            </View>
            <View style={styles.radarHeaderActions}>
              <Text style={styles.radarBadge}>{mappedExperiences.length} eventos · {places.length} lugares</Text>
              {Platform.OS !== 'web' ? (
                <Pressable style={styles.recenterButton} onPress={recenterMap}>
                  <Ionicons name="locate-outline" size={18} color={colors.primary} />
                </Pressable>
              ) : null}
            </View>
          </View>
          <View style={styles.legendRow}>
            <LegendDot color={colors.primary} label="Eventos" />
            <LegendDot color={colors.warning} label="Negocios y lugares" />
          </View>
          {placesError ? <Text style={styles.warningText}>{placesError}</Text> : null}
          {Platform.OS === 'web' ? (
            <MapFallback experiences={mappedExperiences} places={places} />
          ) : (
            <View
              style={styles.mapFrame}
              onTouchStart={() => setScrollEnabled(false)}
              onTouchEnd={() => setScrollEnabled(true)}
              onTouchCancel={() => setScrollEnabled(true)}
            >
              <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={region}
                showsUserLocation={Boolean(userCoordinate)}
                showsMyLocationButton
                zoomEnabled
                scrollEnabled
                rotateEnabled
                pitchEnabled
              >
                {userCoordinate ? (
                  <Marker coordinate={userCoordinate} title="Vos" pinColor={colors.primary} />
                ) : null}
                {mappedExperiences.map((experience) => (
                  <Marker
                    key={experience.id}
                    coordinate={{
                      latitude: experienceCoordinate(experience)!.latitude,
                      longitude: experienceCoordinate(experience)!.longitude,
                    }}
                    title={experience.title}
                    description={experience.location?.addressPublic ?? experience.place}
                    pinColor={colors.primary}
                    onPress={() => onOpenExperience(experience)}
                    onCalloutPress={() => onOpenExperience(experience)}
                  />
                ))}
                {places.map((place) => (
                  <Marker
                    key={place.placeId}
                    coordinate={{ latitude: place.latitude, longitude: place.longitude }}
                    title={place.name}
                    description={place.address}
                    pinColor={colors.warning}
                  />
                ))}
              </MapView>
              {mappedExperiences.length === 0 && places.length === 0 ? (
                <View style={styles.mapEmptyOverlay}>
                  <EmptyState
                    icon="location-outline"
                    title="Sin puntos en el mapa"
                    message="Las experiencias con direccion o coordenadas aparecen ubicadas en el radar."
                    compact
                  />
                </View>
              ) : null}
            </View>
          )}
        </View>
      ) : null}

      {showList ? (
        <>
          <View style={styles.titleRow}>
            <Text style={styles.screenTitle}>Experiencias destacadas</Text>
            <Text style={styles.sortText}>{filteredExperiences.length} resultados</Text>
          </View>

          {filteredExperiences.length > 0 ? (
            filteredExperiences.map((experience) => (
              <ExperienceCard key={experience.id} experience={experience} onPress={onOpenExperience} />
            ))
          ) : (
            <EmptyState
              icon="search-outline"
              title="Sin resultados"
              message="Proba con otro barrio, estilo, evento o plan social."
            />
          )}
          {places.length > 0 ? (
            <View style={styles.placesPanel}>
              <Text style={styles.placesTitle}>Lugares encontrados</Text>
              {places.slice(0, 5).map((place) => (
                <View key={place.placeId} style={styles.placeRow}>
                  <Ionicons name="business-outline" size={18} color={colors.warning} />
                  <View style={styles.placeCopy}>
                    <Text style={styles.placeTitle}>{place.name}</Text>
                    <Text style={styles.placeMeta}>{place.address}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : null}
        </>
      ) : null}
    </ScrollView>
  );
}

function buildRegion(experiences: Experience[], places: PlaceResult[], userCoordinate: Coordinate | null): Region {
  const firstExperience = experiences.find(hasExperienceCoordinates);
  const firstCoordinate = firstExperience ? experienceCoordinate(firstExperience) : null;
  const firstPlace = places[0] ? { latitude: places[0].latitude, longitude: places[0].longitude } : null;
  const center = userCoordinate
    ?? firstCoordinate
    ?? firstPlace
    ?? { latitude: -34.5889, longitude: -58.4306 };

  return {
    ...center,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  };
}

function MapFallback({ experiences, places }: { experiences: Experience[]; places: PlaceResult[] }) {
  const rows = [
    ...experiences.slice(0, 4).map((experience) => ({
      id: experience.id,
      title: experience.title,
      meta: experience.location?.addressPublic ?? experience.place,
      icon: 'location-outline' as const,
      color: colors.primary,
    })),
    ...places.slice(0, 4).map((place) => ({
      id: place.placeId,
      title: place.name,
      meta: place.address,
      icon: 'business-outline' as const,
      color: colors.warning,
    })),
  ];

  return (
    <View style={styles.mapFallback}>
      {rows.length > 0 ? (
        rows.map((row) => (
          <View key={row.id} style={styles.mapFallbackRow}>
            <Ionicons name={row.icon} size={18} color={row.color} />
            <View style={styles.mapFallbackCopy}>
              <Text style={styles.mapFallbackTitle}>{row.title}</Text>
              <Text style={styles.mapFallbackMeta}>{row.meta}</Text>
            </View>
          </View>
        ))
      ) : (
        <EmptyState
          icon="map-outline"
          title="Sin ubicaciones"
          message="Cuando haya experiencias con coordenadas, se muestran aca."
          compact
        />
      )}
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 14,
    paddingBottom: 96,
    gap: 12,
    backgroundColor: colors.background,
  },
  searchBox: {
    minHeight: 50,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modeChip: {
    flex: 1,
    minHeight: 36,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeChipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  modeText: {
    color: colors.muted,
    fontWeight: '900',
    fontSize: 12,
  },
  modeTextActive: {
    color: colors.primary,
  },
  radarCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    gap: 10,
  },
  radarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  radarTitle: {
    color: colors.success,
    fontWeight: '900',
  },
  radarMeta: {
    color: colors.muted,
    marginTop: 3,
    fontWeight: '800',
    fontSize: 12,
  },
  radarHeaderActions: {
    alignItems: 'flex-end',
    gap: 7,
  },
  radarBadge: {
    color: colors.primary,
    fontWeight: '900',
  },
  recenterButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapFrame: {
    height: 220,
    borderRadius: 8,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    color: colors.muted,
    fontWeight: '800',
    fontSize: 12,
  },
  warningText: {
    color: colors.warning,
    fontWeight: '800',
    lineHeight: 18,
  },
  mapEmptyOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 42,
  },
  mapFallback: {
    minHeight: 180,
    borderRadius: 8,
    backgroundColor: colors.black,
    borderColor: colors.border,
    borderWidth: 1,
    padding: 10,
    gap: 8,
  },
  mapFallbackRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  mapFallbackCopy: {
    flex: 1,
  },
  mapFallbackTitle: {
    color: colors.text,
    fontWeight: '900',
  },
  mapFallbackMeta: {
    color: colors.muted,
    marginTop: 3,
    fontWeight: '700',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  screenTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  sortText: {
    color: colors.primary,
    fontWeight: '900',
  },
  placesPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  placesTitle: {
    color: colors.text,
    fontWeight: '900',
  },
  placeRow: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingTop: 8,
  },
  placeCopy: {
    flex: 1,
  },
  placeTitle: {
    color: colors.text,
    fontWeight: '900',
  },
  placeMeta: {
    color: colors.muted,
    marginTop: 3,
    fontWeight: '700',
    fontSize: 12,
  },
});
