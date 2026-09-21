import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import * as ExpoLocation from 'expo-location';
import { useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { createExperience } from '../api/experiences';
import { geocodeAddress, PlaceResult, reverseGeocodeCoordinate, searchPlaces } from '../api/places';
import { Coordinate } from '../location/distance';
import { colors } from '../theme/colors';
import { AuthSession } from '../types/auth';
import { Experience } from '../types/experience';

type CreateExperienceScreenProps = {
  session: AuthSession;
  onCreated: (experience: Experience) => void;
};

export function CreateExperienceScreen({ session, onCreated }: CreateExperienceScreenProps) {
  const [type, setType] = useState<'PLAN' | 'EVENT'>('PLAN');
  const [entryMode, setEntryMode] = useState<'OPEN' | 'REQUEST'>('OPEN');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState('20');
  const [startsAt, setStartsAt] = useState(defaultStartsAt());
  const [locationQuery, setLocationQuery] = useState('Palermo Soho, Buenos Aires');
  const [locationLabel, setLocationLabel] = useState('Palermo Soho');
  const [locationAddress, setLocationAddress] = useState('Palermo Soho, Buenos Aires');
  const [locationCoordinate, setLocationCoordinate] = useState<Coordinate | null>({
    latitude: -34.5889,
    longitude: -58.4306,
  });
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('Palermo Soho, Buenos Aires');
  const [placeResults, setPlaceResults] = useState<PlaceResult[]>([]);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [searchBusy, setSearchBusy] = useState(false);
  const [locationBusy, setLocationBusy] = useState(false);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (startsAt.getTime() < Date.now() - 60_000) {
      setError('La fecha debe ser de ahora en adelante.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const experience = await createExperience(session, {
        type,
        title: title.trim(),
        description: description.trim() || undefined,
        startsAt: startsAt.toISOString(),
        capacity: Number.parseInt(capacity, 10) || undefined,
        entryMode,
        verifiedOnly,
        publicLocation: {
          label: locationLabel.trim() || undefined,
          addressPublic: locationAddress.trim() || locationQuery.trim() || undefined,
          latPublic: locationCoordinate?.latitude,
          lngPublic: locationCoordinate?.longitude,
        },
      });
      onCreated(experience);
      resetForm();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudo crear la experiencia');
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setType('PLAN');
    setEntryMode('OPEN');
    setTitle('');
    setDescription('');
    setCapacity('20');
    setStartsAt(defaultStartsAt());
    setLocationQuery('Palermo Soho, Buenos Aires');
    setSearchQuery('Palermo Soho, Buenos Aires');
    setLocationLabel('Palermo Soho');
    setLocationAddress('Palermo Soho, Buenos Aires');
    setLocationCoordinate({ latitude: -34.5889, longitude: -58.4306 });
    setPlaceResults([]);
    setSearchMessage(null);
    setLocationMessage(null);
    setVerifiedOnly(false);
  }

  function openDatePicker() {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: startsAt,
        mode: 'date',
        minimumDate: new Date(),
        onChange: (_, selectedDate) => {
          if (selectedDate) {
            setStartsAt(mergeDateAndTime(selectedDate, startsAt));
          }
        },
      });
    }
  }

  function openTimePicker() {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: startsAt,
        mode: 'time',
        is24Hour: true,
        onChange: (_, selectedDate) => {
          if (selectedDate) {
            setStartsAt(mergeDateAndTime(startsAt, selectedDate));
          }
        },
      });
    }
  }

  async function useCurrentLocation() {
    setLocationBusy(true);
    setLocationMessage(null);
    setError(null);
    try {
      const permission = await ExpoLocation.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setLocationMessage('Permiso de ubicacion denegado.');
        return;
      }

      const position = await getBestAvailablePosition();
      if (!position) {
        setLocationMessage('No pude leer la ubicacion del dispositivo. Verifica que el GPS este activo y vuelve a intentar.');
        return;
      }

      const coordinate = {
        latitude: roundCoordinate(position.coords.latitude),
        longitude: roundCoordinate(position.coords.longitude),
      };
      setLocationCoordinate(coordinate);

      const reverseResult = await reverseGeocodeCoordinate(session, coordinate).catch(() => null);
      if (reverseResult) {
        applyPlace(reverseResult, 'Ubicacion del dispositivo cargada.');
      } else {
        setLocationLabel('Mi ubicacion actual');
        setLocationAddress('Ubicacion actual');
        setLocationQuery('Ubicacion actual');
        setLocationMessage('Coordenadas cargadas. No pude resolver la direccion.');
      }
    } catch (exception) {
      setLocationMessage(exception instanceof Error ? exception.message : 'No se pudo obtener tu ubicacion.');
    } finally {
      setLocationBusy(false);
    }
  }

  function openLocationSearch() {
    setSearchQuery(locationAddress || locationQuery);
    setSearchMessage(null);
    setPlaceResults([]);
    setSearchModalVisible(true);
  }

  async function searchAddress() {
    const query = searchQuery.trim();
    if (query.length < 4) {
      setSearchMessage('Escribi una direccion, negocio o lugar mas especifico.');
      return;
    }

    setSearchBusy(true);
    setSearchMessage(null);
    setError(null);
    try {
      const results = await searchPlaces(session, query, null);
      if (results.length > 0) {
        setPlaceResults(results);
        setSearchMessage(`${results.length} lugares encontrados.`);
        return;
      }

      const geocoded = await geocodeAddress(session, query);
      if (geocoded) {
        setPlaceResults([geocoded]);
        setSearchMessage('Direccion encontrada.');
        return;
      }

      setPlaceResults([]);
      setSearchMessage('No encontre esa direccion. Proba con calle, numero, barrio y ciudad.');
    } catch (exception) {
      setPlaceResults([]);
      setSearchMessage(exception instanceof Error ? exception.message : 'No se pudo buscar la direccion.');
    } finally {
      setSearchBusy(false);
    }
  }

  function applyPlace(place: PlaceResult, message?: string, closeSearch = false) {
    setLocationLabel(place.name || firstAddressPart(place.address));
    setLocationAddress(place.address || place.name);
    setLocationQuery(place.address || place.name);
    setSearchQuery(place.address || place.name);
    setLocationCoordinate({
      latitude: roundCoordinate(place.latitude),
      longitude: roundCoordinate(place.longitude),
    });
    if (message) {
      setLocationMessage(message);
    }
    if (closeSearch) {
      setSearchModalVisible(false);
      setPlaceResults([]);
      setSearchMessage(null);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.listContent}>
      <Text style={styles.screenTitle}>Crear experiencia</Text>

      <View style={styles.segmentRow}>
        <Segment label="Plan social" active={type === 'PLAN'} onPress={() => setType('PLAN')} />
        <Segment label="Evento" active={type === 'EVENT'} onPress={() => setType('EVENT')} />
      </View>

      <Field label="Titulo" value={title} onChangeText={setTitle} placeholder="Previa techno en Palermo" />
      <Field
        label="Descripcion"
        value={description}
        onChangeText={setDescription}
        placeholder="Detalles utiles, punto de encuentro y vibra del plan"
        multiline
      />

      <View style={styles.dateBlock}>
        <Text style={styles.blockTitle}>Fecha y hora</Text>
        <View style={styles.dateRow}>
          <Pressable style={styles.dateButton} onPress={openDatePicker}>
            <Ionicons name="calendar-outline" size={18} color={colors.primary} />
            <Text style={styles.dateText}>{formatDate(startsAt)}</Text>
          </Pressable>
          <Pressable style={styles.dateButton} onPress={openTimePicker}>
            <Ionicons name="time-outline" size={18} color={colors.primary} />
            <Text style={styles.dateText}>{formatTime(startsAt)}</Text>
          </Pressable>
        </View>
        {Platform.OS !== 'android' ? (
          <DateTimePicker
            value={startsAt}
            mode="datetime"
            minimumDate={new Date()}
            onChange={(_, selectedDate) => selectedDate && setStartsAt(selectedDate)}
          />
        ) : null}
      </View>

      <Field label="Capacidad" value={capacity} onChangeText={setCapacity} keyboardType="number-pad" />

      <View style={styles.locationBlock}>
        <Text style={styles.blockTitle}>Ubicacion publica</Text>
        <View style={styles.locationActions}>
          <Pressable style={[styles.locationActionPrimary, locationBusy && styles.disabled]} onPress={useCurrentLocation} disabled={locationBusy}>
            <Ionicons name="navigate-outline" size={18} color={colors.black} />
            <Text style={styles.locationActionPrimaryText}>{locationBusy ? 'Buscando...' : 'Usar mi ubicacion'}</Text>
          </Pressable>
          <Pressable style={[styles.locationActionSecondary, locationBusy && styles.disabled]} onPress={openLocationSearch} disabled={locationBusy}>
            <Ionicons name="search-outline" size={18} color={colors.primary} />
            <Text style={styles.locationActionSecondaryText}>Buscar</Text>
          </Pressable>
        </View>
        <View style={styles.selectedPlace}>
          <Ionicons name="location-outline" size={18} color={colors.success} />
          <View style={styles.selectedPlaceCopy}>
            <Text style={styles.selectedPlaceTitle}>{locationLabel}</Text>
            <Text style={styles.selectedPlaceMeta}>{locationAddress}</Text>
            {locationCoordinate ? (
              <Text style={styles.selectedPlaceMeta}>
                {locationCoordinate.latitude}, {locationCoordinate.longitude}
              </Text>
            ) : null}
          </View>
        </View>
        {locationMessage ? <Text style={styles.locationMessage}>{locationMessage}</Text> : null}
      </View>

      <View style={styles.segmentRow}>
        <Segment label="Abierto" active={entryMode === 'OPEN'} onPress={() => setEntryMode('OPEN')} />
        <Segment label="Con solicitud" active={entryMode === 'REQUEST'} onPress={() => setEntryMode('REQUEST')} />
      </View>

      <Pressable style={styles.toggleRow} onPress={() => setVerifiedOnly((current) => !current)}>
        <View>
          <Text style={styles.toggleTitle}>Solo usuarios verificados</Text>
          <Text style={styles.toggleMeta}>Aumenta confianza para planes sensibles</Text>
        </View>
        <View style={[styles.toggle, verifiedOnly && styles.toggleActive]}>
          <View style={[styles.toggleKnob, verifiedOnly && styles.toggleKnobActive]} />
        </View>
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={[styles.primaryButton, (!title.trim() || submitting) && styles.disabled]}
        onPress={submit}
        disabled={!title.trim() || submitting}
      >
        <Text style={styles.primaryButtonText}>{submitting ? 'Creando...' : 'Crear y publicar'}</Text>
      </Pressable>

      <Modal visible={searchModalVisible} animationType="slide" transparent onRequestClose={() => setSearchModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.searchSheet}>
            <View style={styles.searchHeader}>
              <Text style={styles.searchTitle}>Buscar ubicacion</Text>
              <Pressable style={styles.closeButton} onPress={() => setSearchModalVisible(false)}>
                <Ionicons name="close" size={20} color={colors.text} />
              </Pressable>
            </View>
            <View style={styles.searchInputRow}>
              <Ionicons name="search-outline" size={19} color={colors.primary} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Direccion, negocio o lugar"
                placeholderTextColor={colors.subtle}
                style={styles.searchInput}
                autoFocus
                returnKeyType="search"
                onSubmitEditing={searchAddress}
              />
            </View>
            <Pressable style={[styles.searchButton, searchBusy && styles.disabled]} onPress={searchAddress} disabled={searchBusy}>
              <Text style={styles.searchButtonText}>{searchBusy ? 'Buscando...' : 'Buscar direccion'}</Text>
            </Pressable>
            {searchMessage ? <Text style={styles.locationMessage}>{searchMessage}</Text> : null}
            <ScrollView contentContainerStyle={styles.searchResults}>
              {placeResults.map((place) => (
                <Pressable
                  key={place.placeId}
                  style={styles.placeResultRow}
                  onPress={() => applyPlace(place, 'Ubicacion seleccionada.', true)}
                >
                  <Ionicons name="location-outline" size={18} color={colors.warning} />
                  <View style={styles.placeResultCopy}>
                    <Text style={styles.placeResultTitle}>{place.name}</Text>
                    <Text style={styles.placeResultMeta}>{place.address}</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

async function getBestAvailablePosition() {
  if (Platform.OS === 'android') {
    try {
      const servicesEnabled = await ExpoLocation.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        await ExpoLocation.enableNetworkProviderAsync();
      }
    } catch {
      // Some devices do not show the provider dialog; continue with the direct GPS read.
    }
  }

  try {
    return await ExpoLocation.getCurrentPositionAsync({
      accuracy: ExpoLocation.Accuracy.High,
      mayShowUserSettingsDialog: true,
      timeInterval: 1000,
    });
  } catch {
    return ExpoLocation.getLastKnownPositionAsync({
      maxAge: 10 * 60 * 1000,
      requiredAccuracy: 2000,
    });
  }
}

function Segment({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.segment, active && styles.segmentActive]} onPress={onPress}>
      <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text>
    </Pressable>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'number-pad';
};

function Field({ label, value, onChangeText, placeholder, multiline, keyboardType = 'default' }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.subtle}
        multiline={multiline}
        keyboardType={keyboardType}
        style={[styles.input, multiline && styles.textArea]}
      />
    </View>
  );
}

function defaultStartsAt() {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
  date.setMinutes(0, 0, 0);
  return date;
}

function mergeDateAndTime(datePart: Date, timePart: Date) {
  const date = new Date(datePart);
  date.setHours(timePart.getHours(), timePart.getMinutes(), 0, 0);
  return date < new Date() ? new Date(Date.now() + 60 * 60 * 1000) : date;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function roundCoordinate(value: number) {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function firstAddressPart(address: string) {
  return address.split(',')[0]?.trim() || 'Ubicacion';
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    paddingBottom: 96,
    gap: 12,
    backgroundColor: colors.background,
  },
  screenTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 8,
  },
  segment: {
    flex: 1,
    minHeight: 44,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  segmentText: {
    color: colors.muted,
    fontWeight: '900',
  },
  segmentTextActive: {
    color: colors.primary,
  },
  field: {
    gap: 7,
  },
  dateBlock: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    gap: 10,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dateButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 8,
  },
  dateText: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 12,
  },
  locationBlock: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    gap: 10,
  },
  blockTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  locationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  locationActionPrimary: {
    flex: 1,
    minHeight: 44,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 8,
  },
  locationActionPrimaryText: {
    color: colors.black,
    fontWeight: '900',
    fontSize: 12,
  },
  locationActionSecondary: {
    flex: 1,
    minHeight: 44,
    borderRadius: 8,
    borderColor: colors.primary,
    borderWidth: 1,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 8,
  },
  locationActionSecondaryText: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 12,
  },
  selectedPlace: {
    minHeight: 66,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.black,
    padding: 10,
    flexDirection: 'row',
    gap: 9,
  },
  selectedPlaceCopy: {
    flex: 1,
  },
  selectedPlaceTitle: {
    color: colors.text,
    fontWeight: '900',
  },
  selectedPlaceMeta: {
    color: colors.muted,
    marginTop: 3,
    fontWeight: '700',
    fontSize: 12,
  },
  placeResults: {
    gap: 7,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.68)',
  },
  searchSheet: {
    maxHeight: '88%',
    minHeight: '58%',
    backgroundColor: colors.background,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  searchHeader: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  searchTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '900',
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInputRow: {
    minHeight: 50,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  searchInput: {
    flex: 1,
    minHeight: 48,
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  searchButton: {
    minHeight: 46,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: {
    color: colors.black,
    fontWeight: '900',
  },
  searchResults: {
    gap: 8,
    paddingBottom: 24,
  },
  placeResultRow: {
    minHeight: 50,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.black,
    padding: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  placeResultCopy: {
    flex: 1,
  },
  placeResultTitle: {
    color: colors.text,
    fontWeight: '900',
  },
  placeResultMeta: {
    color: colors.muted,
    marginTop: 3,
    fontWeight: '700',
    fontSize: 12,
  },
  locationMessage: {
    color: colors.muted,
    fontWeight: '800',
    lineHeight: 19,
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  input: {
    minHeight: 48,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  textArea: {
    minHeight: 92,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  toggleRow: {
    minHeight: 70,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.surface,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  toggleTitle: {
    color: colors.text,
    fontWeight: '900',
  },
  toggleMeta: {
    color: colors.muted,
    marginTop: 3,
    fontWeight: '700',
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border,
    padding: 3,
  },
  toggleActive: {
    backgroundColor: colors.primary,
  },
  toggleKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surface,
  },
  toggleKnobActive: {
    transform: [{ translateX: 20 }],
    backgroundColor: colors.black,
  },
  error: {
    color: colors.danger,
    fontWeight: '800',
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.55,
  },
  primaryButtonText: {
    color: colors.black,
    fontWeight: '900',
    fontSize: 16,
  },
});
