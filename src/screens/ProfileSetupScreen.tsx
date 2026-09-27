import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { updateProfile } from '../api/auth';
import { PlaceResult, searchPlaces } from '../api/places';
import { AuthButton } from '../components/AuthButton';
import { AuthField } from '../components/AuthField';
import { colors } from '../theme/colors';
import { AuthSession } from '../types/auth';

type ProfileGender = 'FEMALE' | 'MALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';

type ProfileSetupScreenProps = {
  session: AuthSession;
  onDone: (session: AuthSession) => void;
};

export function ProfileSetupScreen({ session, onDone }: ProfileSetupScreenProps) {
  const [displayName, setDisplayName] = useState(session.user.profile.displayName ?? '');
  const [username, setUsername] = useState(session.user.profile.username ?? '');
  const [publicZone, setPublicZone] = useState(session.user.profile.publicZone ?? '');
  const [avatarUrl, setAvatarUrl] = useState(session.user.profile.avatarUrl ?? '');
  const [birthYear, setBirthYear] = useState(session.user.profile.birthYear ? `${session.user.profile.birthYear}` : '');
  const [gender, setGender] = useState<ProfileGender | null>(session.user.profile.gender);
  const [interests, setInterests] = useState<string[]>(session.user.profile.interests ?? []);
  const [bio, setBio] = useState(session.user.profile.bio ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoneSuggestions, setZoneSuggestions] = useState<PlaceResult[]>([]);
  const [zoneSearching, setZoneSearching] = useState(false);
  const [interestPickerVisible, setInterestPickerVisible] = useState(false);

  useEffect(() => {
    const query = publicZone.trim();
    if (query.length < 3) {
      setZoneSuggestions([]);
      return;
    }

    let cancelled = false;
    const timeout = setTimeout(async () => {
      setZoneSearching(true);
      try {
        const results = await searchPlaces(session, query, null);
        if (!cancelled) {
          setZoneSuggestions(results.slice(0, 5));
        }
      } catch {
        if (!cancelled) {
          setZoneSuggestions([]);
        }
      } finally {
        if (!cancelled) {
          setZoneSearching(false);
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [publicZone, session]);

  function applyZoneSuggestion(place: PlaceResult) {
    setPublicZone(place.address || place.name);
    setZoneSuggestions([]);
  }

  function addInterest(interest: string) {
    setInterests((current) => current.includes(interest) ? current : [...current, interest]);
    setInterestPickerVisible(false);
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const user = await updateProfile(
        session,
        {
          displayName: displayName.trim(),
          username: username.trim(),
          publicZone: publicZone.trim(),
          avatarUrl: avatarUrl.trim() || undefined,
          birthYear: parseBirthYear(birthYear),
          gender: gender ?? undefined,
          interests,
          bio: bio.trim(),
        }
      );
      onDone({ ...session, user });
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudo actualizar el perfil');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.kicker}>Paso 2 de 2</Text>
      <Text style={styles.title}>Preferencias iniciales</Text>
      <Text style={styles.copy}>Esto ayuda a mostrar experiencias compatibles sin exponer ubicacion precisa.</Text>
      <AuthField label="Nombre visible" value={displayName} onChangeText={setDisplayName} autoCapitalize="words" />
      <AuthField label="Username" value={username} onChangeText={setUsername} />
      <AuthField label="Foto de perfil URL" value={avatarUrl} onChangeText={setAvatarUrl} placeholder="https://..." />
      <AuthField label="Anio de nacimiento" value={birthYear} onChangeText={setBirthYear} placeholder="1998" keyboardType="number-pad" />
      <View style={styles.genderBlock}>
        <Text style={styles.interestsTitle}>Genero</Text>
        <View style={styles.interestsGrid}>
          {genderOptions.map((option) => (
            <Pressable
              key={option.value}
              style={[styles.interestChip, gender === option.value && styles.interestChipActive]}
              onPress={() => setGender(option.value)}
            >
              <Text style={[styles.interestText, gender === option.value && styles.interestTextActive]}>{option.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <AuthField label="Zona publica" value={publicZone} onChangeText={setPublicZone} placeholder="Tu barrio o ciudad" />
      {zoneSearching ? <Text style={styles.metaText}>Buscando zonas...</Text> : null}
      {zoneSuggestions.length > 0 ? (
        <View style={styles.suggestionList}>
          {zoneSuggestions.map((place) => (
            <Pressable key={place.placeId} style={styles.suggestionRow} onPress={() => applyZoneSuggestion(place)}>
              <Text style={styles.suggestionTitle}>{place.name}</Text>
              <Text style={styles.suggestionMeta}>{place.address}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      <View style={styles.interestsBlock}>
        <Text style={styles.interestsTitle}>Intereses</Text>
        <View style={styles.interestsGrid}>
          {interests.map((interest) => (
              <Pressable
                key={interest}
                style={[styles.interestChip, styles.interestChipActive]}
                onPress={() => setInterests((current) => current.filter((item) => item !== interest))}
              >
                <Text style={[styles.interestText, styles.interestTextActive]}>{interest} x</Text>
              </Pressable>
          ))}
          <Pressable style={styles.addInterestButton} onPress={() => setInterestPickerVisible(true)}>
            <Text style={styles.addInterestText}>+</Text>
          </Pressable>
        </View>
      </View>
      <AuthField label="Bio" value={bio} onChangeText={setBio} multiline placeholder="Musica, rooftops, planes tranquilos..." />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <AuthButton label={submitting ? 'Guardando...' : 'Continuar al home'} onPress={submit} disabled={submitting || !displayName} />
      <AuthButton label="Completar despues" onPress={() => onDone(session)} variant="secondary" />
      <Modal visible={interestPickerVisible} animationType="slide" transparent onRequestClose={() => setInterestPickerVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Agregar interes</Text>
            {interestOptions.filter((interest) => !interests.includes(interest)).map((interest) => (
              <Pressable key={interest} style={styles.selectOption} onPress={() => addInterest(interest)}>
                <Text style={styles.selectOptionText}>{interest}</Text>
                <Text style={styles.selectOptionIcon}>+</Text>
              </Pressable>
            ))}
            <Pressable style={styles.closeOption} onPress={() => setInterestPickerVisible(false)}>
              <Text style={styles.closeOptionText}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const interestOptions = ['Electronica', 'Rooftops', 'After office', 'Arte', 'Food', 'Networking', 'Outdoor', 'Tranquilo', 'Fiesta'];
const genderOptions: Array<{ value: ProfileGender; label: string }> = [
  { value: 'FEMALE', label: 'Mujer' },
  { value: 'MALE', label: 'Hombre' },
  { value: 'OTHER', label: 'Otro' },
  { value: 'PREFER_NOT_TO_SAY', label: 'Prefiero no decir' },
];

function parseBirthYear(value: string) {
  const year = Number.parseInt(value, 10);
  return Number.isFinite(year) ? year : undefined;
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: 20,
    justifyContent: 'center',
    gap: 14,
  },
  kicker: {
    color: colors.primary,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
  },
  copy: {
    color: colors.muted,
    fontWeight: '800',
    lineHeight: 21,
  },
  error: {
    color: colors.danger,
    fontWeight: '800',
  },
  metaText: {
    color: colors.muted,
    fontWeight: '800',
  },
  suggestionList: {
    gap: 8,
  },
  suggestionRow: {
    minHeight: 52,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.surface,
    padding: 10,
    justifyContent: 'center',
  },
  suggestionTitle: {
    color: colors.text,
    fontWeight: '900',
  },
  suggestionMeta: {
    color: colors.muted,
    marginTop: 3,
    fontWeight: '700',
    fontSize: 12,
  },
  interestsBlock: {
    gap: 8,
  },
  genderBlock: {
    gap: 8,
  },
  interestsTitle: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestChip: {
    minHeight: 34,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  interestChipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  addInterestButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addInterestText: {
    color: colors.black,
    fontSize: 20,
    fontWeight: '900',
  },
  interestText: {
    color: colors.muted,
    fontWeight: '900',
    fontSize: 12,
  },
  interestTextActive: {
    color: colors.primary,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.68)',
  },
  modalSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '900',
  },
  selectOption: {
    minHeight: 46,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectOptionText: {
    color: colors.text,
    fontWeight: '900',
  },
  selectOptionIcon: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '900',
  },
  closeOption: {
    minHeight: 44,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeOptionText: {
    color: colors.muted,
    fontWeight: '900',
  },
});
