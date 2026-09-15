import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { createExperience } from '../api/experiences';
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
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const experience = await createExperience(session, {
        type,
        title: title.trim(),
        description: description.trim() || undefined,
        startsAt: new Date(startsAt).toISOString(),
        capacity: Number.parseInt(capacity, 10) || undefined,
        entryMode,
        verifiedOnly,
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
    setVerifiedOnly(false);
  }

  return (
    <ScrollView contentContainerStyle={styles.listContent}>
      <Text style={styles.screenTitle}>Crear experiencia</Text>
      <Text style={styles.meta}>Publicamos una version inicial para probar discovery de punta a punta.</Text>

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
      <Field
        label="Fecha y hora"
        value={startsAt}
        onChangeText={setStartsAt}
        placeholder="2030-01-20T22:00:00"
      />
      <Field label="Capacidad" value={capacity} onChangeText={setCapacity} keyboardType="number-pad" />

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
        style={[styles.primaryButton, (!title || submitting) && styles.disabled]}
        onPress={submit}
        disabled={!title || submitting}
      >
        <Text style={styles.primaryButtonText}>{submitting ? 'Creando...' : 'Crear y publicar'}</Text>
      </Pressable>
    </ScrollView>
  );
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
  return date.toISOString().slice(0, 16);
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
  meta: {
    color: colors.muted,
    fontWeight: '800',
    lineHeight: 20,
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
