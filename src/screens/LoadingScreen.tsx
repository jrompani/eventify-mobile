import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

export function LoadingScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.logoMark}>
        <Ionicons name="ticket-outline" size={34} color={colors.primary} />
      </View>
      <Text style={styles.brand}>Eventify</Text>
      <Text style={styles.meta}>Sincronizando experiencias seguras</Text>
      <View style={styles.progressTrack}>
        <View style={styles.progressFill} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logoMark: {
    width: 82,
    height: 82,
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  brand: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 0,
  },
  meta: {
    color: colors.muted,
    marginTop: 8,
    fontWeight: '800',
    textAlign: 'center',
  },
  progressTrack: {
    width: 220,
    height: 8,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    marginTop: 24,
    overflow: 'hidden',
  },
  progressFill: {
    width: '72%',
    height: '100%',
    backgroundColor: colors.primary,
  },
});
