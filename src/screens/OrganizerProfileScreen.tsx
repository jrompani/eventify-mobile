import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  followOrganizer,
  getOrganizerProfile,
  OrganizerProfile,
  unfollowOrganizer,
} from '../api/organizerProfile';
import { ExperienceCard } from '../components/ExperienceCard';
import { EmptyState } from '../components/EmptyState';
import { RetryMessage } from '../components/RetryMessage';
import { colors } from '../theme/colors';
import { AuthSession } from '../types/auth';
import { Experience } from '../types/experience';
import { initialsFor } from '../utils/format';

type OrganizerProfileScreenProps = {
  session: AuthSession;
  organizerUserId: string;
  onBack: () => void;
  onOpenExperience: (experience: Experience) => void;
};

export function OrganizerProfileScreen({ session, organizerUserId, onBack, onOpenExperience }: OrganizerProfileScreenProps) {
  const [profile, setProfile] = useState<OrganizerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMe = organizerUserId === session.user.id;

  useEffect(() => {
    void loadProfile();
  }, [organizerUserId]);

  async function loadProfile() {
    setLoading(true);
    setError(null);
    try {
      setProfile(await getOrganizerProfile(session, organizerUserId));
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudo cargar el organizador');
    } finally {
      setLoading(false);
    }
  }

  async function toggleFollow() {
    if (!profile || isMe) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const nextProfile = profile.followedByMe
        ? await unfollowOrganizer(session, organizerUserId)
        : await followOrganizer(session, organizerUserId, true);
      setProfile(nextProfile);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudo actualizar el seguimiento');
    } finally {
      setSaving(false);
    }
  }

  async function toggleNotifications() {
    if (!profile || !profile.followedByMe) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      setProfile(await followOrganizer(session, organizerUserId, !profile.notifyOnNewEvents));
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudo actualizar avisos');
    } finally {
      setSaving(false);
    }
  }

  const title = profile?.displayName ?? 'Organizador';
  const initials = initialsFor(title);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Pressable style={styles.iconButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={21} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Organizador</Text>
      </View>

      {loading ? <Text style={styles.metaText}>Cargando perfil...</Text> : null}
      {error ? <RetryMessage message={error} onRetry={loadProfile} /> : null}

      {profile ? (
        <>
          <View style={styles.profileCard}>
            {profile.avatarUrl ? (
              <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
            <View style={styles.profileCopy}>
              <Text style={styles.title}>{profile.displayName}</Text>
              <Text style={styles.metaText}>{profile.username ? `@${profile.username}` : profile.publicZone ?? 'Sin zona publica'}</Text>
              {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{profile.followersCount}</Text>
              <Text style={styles.statLabel}>seguidores</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{profile.upcomingExperiences.length}</Text>
              <Text style={styles.statLabel}>proximos</Text>
            </View>
          </View>

          {!isMe ? (
            <View style={styles.actions}>
              <Pressable style={[styles.primaryButton, saving && styles.disabled]} onPress={toggleFollow} disabled={saving}>
                <Ionicons name={profile.followedByMe ? 'checkmark' : 'add'} size={18} color={colors.black} />
                <Text style={styles.primaryText}>{profile.followedByMe ? 'Siguiendo' : 'Seguir'}</Text>
              </Pressable>
              <Pressable
                style={[styles.secondaryButton, (!profile.followedByMe || saving) && styles.disabled]}
                onPress={toggleNotifications}
                disabled={!profile.followedByMe || saving}
              >
                <Ionicons name={profile.notifyOnNewEvents ? 'notifications' : 'notifications-outline'} size={18} color={colors.primary} />
                <Text style={styles.secondaryText}>{profile.notifyOnNewEvents ? 'Avisos activos' : 'Avisarme eventos'}</Text>
              </Pressable>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Eventos y planes</Text>
            {profile.upcomingExperiences.length > 0 ? (
              profile.upcomingExperiences.map((experience) => (
                <ExperienceCard key={experience.id} experience={experience} onPress={() => onOpenExperience(experience)} />
              ))
            ) : (
              <EmptyState icon="calendar-outline" title="Sin publicaciones activas" message="Cuando publique eventos o planes van a aparecer aca." compact />
            )}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: 16,
    paddingBottom: 96,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  profileCard: {
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.surface,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primarySoft,
  },
  avatarText: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '900',
  },
  profileCopy: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  metaText: {
    color: colors.muted,
    fontWeight: '800',
    lineHeight: 20,
  },
  bio: {
    color: colors.text,
    marginTop: 8,
    fontWeight: '700',
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statBox: {
    flex: 1,
    minHeight: 70,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '900',
  },
  statLabel: {
    color: colors.muted,
    fontWeight: '900',
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  primaryButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryText: {
    color: colors.black,
    fontWeight: '900',
  },
  secondaryButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 8,
    borderColor: colors.primary,
    borderWidth: 1,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  secondaryText: {
    color: colors.primary,
    fontWeight: '900',
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  disabled: {
    opacity: 0.6,
  },
});
