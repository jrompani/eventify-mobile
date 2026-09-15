import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { ExperienceCard } from '../components/ExperienceCard';
import { colors } from '../theme/colors';
import { Experience } from '../types/experience';

type ExploreScreenProps = {
  experiences: Experience[];
  onOpenExperience: (experience: Experience) => void;
};

export function ExploreScreen({ experiences, onOpenExperience }: ExploreScreenProps) {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'Radar & lista' | 'Lista pura' | 'Mapa radar'>('Radar & lista');
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

  return (
    <ScrollView contentContainerStyle={styles.listContent}>
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
            <Text style={styles.radarTitle}>GPS activo - Palermo Soho</Text>
            <Text style={styles.radarBadge}>{filteredExperiences.length} en vivo</Text>
          </View>
          <View style={styles.radarMap}>
            <View style={[styles.radarDot, styles.dotA]} />
            <View style={[styles.radarDot, styles.dotB]} />
            <View style={[styles.radarDot, styles.dotC]} />
            <View style={styles.radarRing} />
            <Text style={styles.radarCenter}>Vos</Text>
          </View>
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
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={24} color={colors.muted} />
              <Text style={styles.emptyTitle}>Sin resultados</Text>
              <Text style={styles.emptyMeta}>Probá con barrio, estilo, evento o plan social.</Text>
            </View>
          )}
        </>
      ) : null}
    </ScrollView>
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
  },
  radarTitle: {
    color: colors.success,
    fontWeight: '900',
  },
  radarBadge: {
    color: colors.primary,
    fontWeight: '900',
  },
  radarMap: {
    height: 128,
    borderRadius: 8,
    backgroundColor: colors.black,
    borderColor: colors.border,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarRing: {
    position: 'absolute',
    width: 92,
    height: 92,
    borderRadius: 46,
    borderColor: '#35264E',
    borderWidth: 2,
  },
  radarDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  dotA: {
    left: 52,
    top: 32,
  },
  dotB: {
    right: 58,
    top: 48,
    backgroundColor: colors.success,
  },
  dotC: {
    right: 88,
    bottom: 28,
    backgroundColor: colors.danger,
  },
  radarCenter: {
    color: colors.text,
    fontWeight: '900',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
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
  emptyState: {
    minHeight: 130,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    marginTop: 8,
  },
  emptyMeta: {
    color: colors.muted,
    marginTop: 4,
    fontWeight: '700',
    textAlign: 'center',
  },
});
