import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

export type SocialProvider = 'google' | 'facebook';

type SocialAuthButtonsProps = {
  disabled?: boolean;
  onPressProvider: (provider: SocialProvider) => void;
};

const providers: Array<{
  key: SocialProvider;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  { key: 'google', label: 'Continuar con Google', icon: 'logo-google' },
  { key: 'facebook', label: 'Continuar con Facebook', icon: 'logo-facebook' },
];

export function SocialAuthButtons({ disabled, onPressProvider }: SocialAuthButtonsProps) {
  return (
    <View style={styles.stack}>
      <View style={styles.dividerRow}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>o usa una red social</Text>
        <View style={styles.divider} />
      </View>
      {providers.map((provider) => (
        <Pressable
          key={provider.key}
          style={[styles.button, disabled && styles.disabled]}
          onPress={() => onPressProvider(provider.key)}
          disabled={disabled}
        >
          <Ionicons name={provider.icon} size={18} color={provider.key === 'facebook' ? '#5D8CFF' : colors.text} />
          <Text style={styles.buttonText}>{provider.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 10,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.subtle,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  button: {
    minHeight: 48,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 9,
  },
  buttonText: {
    color: colors.text,
    fontWeight: '900',
  },
  disabled: {
    opacity: 0.55,
  },
});
