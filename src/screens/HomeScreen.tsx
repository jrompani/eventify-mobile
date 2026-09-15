import { Ionicons } from '@expo/vector-icons';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ExperienceCard } from '../components/ExperienceCard';
import { colors } from '../theme/colors';
import { Experience } from '../types/experience';

type HomeScreenProps = {
  experiences: Experience[];
  loading: boolean;
  error: string | null;
  onOpenExperience: (experience: Experience) => void;
};

export function HomeScreen({ experiences, loading, error, onOpenExperience }: HomeScreenProps) {
  return (
    <FlatList
      data={experiences}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={<HomeHeader loading={loading} error={error} />}
      contentContainerStyle={styles.listContent}
      renderItem={({ item, index }) => (
        <View style={styles.cardSection}>
          {index === 0 ? <SectionTitle title="Experiencias destacadas" action="Ordenar" /> : null}
          {index === 1 ? <SectionTitle title="Planes sociales espontaneos" action="Ver todos" /> : null}
          <ExperienceCard experience={item} onPress={onOpenExperience} />
        </View>
      )}
      ListFooterComponent={<CommunityPreview />}
    />
  );
}

function HomeHeader({ loading, error }: { loading: boolean; error: string | null }) {
  return (
    <View style={styles.headerStack}>
      <View style={styles.locationRow}>
        <View style={styles.locationPill}>
          <Ionicons name="location-outline" size={15} color={colors.primary} />
          <Text style={styles.locationText}>Palermo, BA</Text>
        </View>
        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>SafePass activo</Text>
        </View>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={21} color={colors.primary} />
        <TextInput
          placeholder="Que queres hacer hoy?"
          placeholderTextColor={colors.subtle}
          style={styles.searchInput}
        />
        <Ionicons name="options-outline" size={21} color={colors.primary} />
      </View>

      <View style={styles.quickRow}>
        {['Radar & lista', 'Electronica', 'Rooftops', 'Con grupo'].map((item) => (
          <Pressable key={item} style={styles.quickChip}>
            <Text style={styles.quickText}>{item}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.safeCard}>
        <View style={styles.safeIcon}>
          <Ionicons name="shield-checkmark-outline" size={22} color={colors.success} />
        </View>
        <View style={styles.safeCopy}>
          <Text style={styles.safeTitle}>Compatibilidad social verificada</Text>
          <Text style={styles.safeMeta}>
            {loading
              ? 'Cargando experiencias reales...'
              : error
                ? 'Mostrando datos demo hasta reconectar con la API.'
                : 'Experiencias reales sincronizadas con la API.'}
          </Text>
        </View>
      </View>
    </View>
  );
}

function SectionTitle({ title, action }: { title: string; action: string }) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionAction}>{action}</Text>
    </View>
  );
}

function CommunityPreview() {
  return (
    <View style={styles.communityCard}>
      <View style={styles.communityTop}>
        <Ionicons name="people-circle-outline" size={26} color={colors.success} />
        <View style={styles.communityCopy}>
          <Text style={styles.communityTitle}>Comunidad activa cerca tuyo</Text>
          <Text style={styles.communityMeta}>Techno Buenos Aires - 420 miembros</Text>
        </View>
      </View>
      <Pressable style={styles.communityButton}>
        <Text style={styles.communityButtonText}>Ver comunidad</Text>
      </Pressable>
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
  headerStack: {
    gap: 12,
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    minHeight: 34,
  },
  locationText: {
    color: colors.text,
    fontWeight: '800',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: colors.successSoft,
    borderColor: '#16533F',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    minHeight: 34,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  statusText: {
    color: colors.success,
    fontWeight: '900',
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
    fontWeight: '700',
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickChip: {
    minHeight: 32,
    borderRadius: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    borderColor: colors.borderLight,
    borderWidth: 1,
  },
  quickText: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 12,
  },
  safeCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
  },
  safeIcon: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: colors.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  safeCopy: {
    flex: 1,
  },
  safeTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  safeMeta: {
    color: colors.muted,
    marginTop: 4,
    fontWeight: '700',
  },
  cardSection: {
    gap: 10,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  sectionAction: {
    color: colors.primary,
    fontWeight: '900',
  },
  communityCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    gap: 12,
  },
  communityTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  communityCopy: {
    flex: 1,
  },
  communityTitle: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 16,
  },
  communityMeta: {
    color: colors.muted,
    marginTop: 3,
    fontWeight: '700',
  },
  communityButton: {
    minHeight: 42,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  communityButtonText: {
    color: colors.black,
    fontWeight: '900',
  },
});
