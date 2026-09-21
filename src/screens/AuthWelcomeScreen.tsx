import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '../components/AuthButton';
import { API_BASE_URL } from '../config/env';
import { colors } from '../theme/colors';
import { DevAccountKind } from '../api/devAccounts';

type AuthWelcomeScreenProps = {
  onLogin: () => void;
  onRegister: () => void;
  onDevAccount: (kind: DevAccountKind) => void;
  devLoading: DevAccountKind | null;
  devError: string | null;
};

export function AuthWelcomeScreen({ onLogin, onRegister, onDevAccount, devLoading, devError }: AuthWelcomeScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.logoMark}>
        <Ionicons name="ticket-outline" size={32} color={colors.primary} />
      </View>
      <Text style={styles.brand}>Eventify</Text>
      <Text style={styles.copy}>Donde las experiencias presenciales cobran vida en la noche urbana.</Text>

      <View style={styles.trustRow}>
        <Text style={styles.trustChip}>100% nocturnidad</Text>
        <Text style={styles.trustChip}>Comunidad verificada</Text>
        <Text style={styles.trustChip}>Matching contextual</Text>
      </View>

      <View style={styles.actions}>
        <AuthButton label="Crear cuenta" onPress={onRegister} />
        <AuthButton label="Iniciar sesion" onPress={onLogin} variant="secondary" />
      </View>

      <View style={styles.devPanel}>
        <Text style={styles.devTitle}>MVP local</Text>
        <View style={styles.devActions}>
          <Pressable
            style={[styles.devButton, devLoading !== null && styles.disabled]}
            onPress={() => onDevAccount('owner')}
            disabled={devLoading !== null}
          >
            <Text style={styles.devButtonText}>{devLoading === 'owner' ? 'Abriendo...' : 'Entrar owner'}</Text>
          </Pressable>
          <Pressable
            style={[styles.devButton, devLoading !== null && styles.disabled]}
            onPress={() => onDevAccount('attendee')}
            disabled={devLoading !== null}
          >
            <Text style={styles.devButtonText}>{devLoading === 'attendee' ? 'Abriendo...' : 'Entrar attendee'}</Text>
          </Pressable>
        </View>
        {devError ? <Text style={styles.devError}>{devError}</Text> : null}
      </View>

      <Text style={styles.debugUrl}>API: {API_BASE_URL}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
    padding: 22,
    justifyContent: 'center',
    gap: 16,
  },
  logoMark: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  brand: {
    color: colors.text,
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 0,
    textAlign: 'center',
  },
  copy: {
    color: colors.muted,
    textAlign: 'center',
    fontWeight: '800',
    lineHeight: 21,
  },
  trustRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 8,
  },
  trustChip: {
    color: colors.success,
    backgroundColor: colors.successSoft,
    borderColor: '#16533F',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: '900',
  },
  actions: {
    gap: 10,
    marginTop: 12,
  },
  devPanel: {
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.surface,
    padding: 12,
    gap: 9,
  },
  devTitle: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  devActions: {
    flexDirection: 'row',
    gap: 8,
  },
  devButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 8,
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  devButtonText: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 12,
  },
  devError: {
    color: colors.danger,
    fontWeight: '800',
    lineHeight: 18,
  },
  disabled: {
    opacity: 0.55,
  },
  debugUrl: {
    color: colors.subtle,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 10,
  },
});
