import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { colors } from '../theme/colors';

type AuthFieldProps = TextInputProps & {
  label: string;
};

export function AuthField({ label, ...props }: AuthFieldProps) {
  const multiline = Boolean(props.multiline);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.subtle}
        style={[styles.input, multiline && styles.textArea, props.style]}
        autoCapitalize="none"
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
    minHeight: 118,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
});
