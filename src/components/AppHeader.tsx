import { Image, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import { User } from '../types/auth';
import { initialsFor } from '../utils/format';

type AppHeaderProps = {
  user: User;
};

export function AppHeader({ user }: AppHeaderProps) {
  const initials = initialsFor(user.profile.displayName || user.email);

  return (
    <View style={styles.header}>
      <View style={styles.brandRow}>
        <View style={styles.logoMark}>
          <View style={styles.logoSpark} />
          <Text style={styles.logoText}>E</Text>
        </View>
        <Text style={styles.brand}>Eventify</Text>
      </View>
      {user.profile.avatarUrl ? (
        <Image source={{ uri: user.profile.avatarUrl }} style={styles.avatarImage} />
      ) : (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 66,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: colors.black,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoMark: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoSpark: {
    position: 'absolute',
    right: -8,
    top: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.warning,
  },
  logoText: {
    color: colors.black,
    fontSize: 22,
    fontWeight: '900',
  },
  brand: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.primary,
    fontWeight: '900',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderColor: colors.primary,
    borderWidth: 1,
    backgroundColor: colors.primarySoft,
  },
});
