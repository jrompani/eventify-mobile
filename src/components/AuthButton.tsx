import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '../theme/colors';

type AuthButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
};

export function AuthButton({ label, onPress, disabled, variant = 'primary' }: AuthButtonProps) {
  return (
    <Pressable
      style={[
        styles.button,
        variant === 'secondary' && styles.secondary,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.label, variant === 'secondary' && styles.secondaryLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  disabled: {
    opacity: 0.55,
  },
  label: {
    color: colors.black,
    fontWeight: '900',
    fontSize: 15,
  },
  secondaryLabel: {
    color: colors.text,
  },
});
