import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import { Experience } from '../types/experience';

type ExperienceCardProps = {
  experience: Experience;
  onPress?: (experience: Experience) => void;
};

export function ExperienceCard({ experience, onPress }: ExperienceCardProps) {
  return (
    <Pressable style={styles.card} onPress={() => onPress?.(experience)}>
      <ImageBackground source={{ uri: experience.imageUrl }} style={styles.image} imageStyle={styles.imageStyle}>
        <View style={styles.imageOverlay}>
          <Text style={styles.kind}>{experience.kind}</Text>
          <Text style={styles.trust}>{experience.trustLabel}</Text>
        </View>
      </ImageBackground>

      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{experience.title}</Text>
        <Text style={styles.cardMeta}>
          {experience.time} - {experience.place} - {experience.distance}
        </Text>

        <View style={styles.tags}>
          {experience.tags.map((tag) => (
            <Text key={tag} style={styles.tag}>
              {tag}
            </Text>
          ))}
        </View>

        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.price}>{experience.price}</Text>
            <Text style={styles.attendees}>{experience.attendees} cupos o asistentes</Text>
          </View>
          <Pressable style={styles.ctaButton} onPress={() => onPress?.(experience)}>
            <Text style={styles.ctaText}>{experience.status}</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    height: 154,
  },
  imageStyle: {
    resizeMode: 'cover',
  },
  imageOverlay: {
    flex: 1,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(5, 6, 10, 0.34)',
  },
  kind: {
    color: colors.inverse,
    fontWeight: '900',
    backgroundColor: 'rgba(143, 70, 255, 0.86)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  trust: {
    color: colors.success,
    fontWeight: '900',
    backgroundColor: 'rgba(5, 6, 10, 0.76)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  cardBody: {
    padding: 14,
    gap: 10,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0,
  },
  cardMeta: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: colors.primarySoft,
    color: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    fontWeight: '800',
    fontSize: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  price: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 16,
  },
  attendees: {
    color: colors.muted,
    fontWeight: '700',
    marginTop: 3,
    fontSize: 12,
  },
  ctaButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    minHeight: 40,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: colors.black,
    fontWeight: '900',
  },
});
