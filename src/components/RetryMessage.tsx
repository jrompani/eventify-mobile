import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

type RetryMessageProps = {
  message: string;
  onRetry: () => void;
};

export function RetryMessage({ message, onRetry }: RetryMessageProps) {
  return (
    <View style={styles.retryBox}>
      <Text style={styles.errorText}>{message}</Text>
      <Pressable style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryText}>Reintentar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  retryBox: {
    borderRadius: 8,
    borderColor: colors.danger,
    borderWidth: 1,
    backgroundColor: colors.surface,
    padding: 12,
    gap: 10,
  },
  retryButton: {
    alignSelf: 'flex-start',
    minHeight: 36,
    borderRadius: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: {
    color: colors.black,
    fontWeight: '900',
  },
  errorText: {
    color: colors.danger,
    fontWeight: '800',
    lineHeight: 20,
  },
});
