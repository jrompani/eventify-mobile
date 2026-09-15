import { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '../theme/colors';

export function FormBlock({ children }: PropsWithChildren) {
  return <View style={styles.formBlock}>{children}</View>;
}

const styles = StyleSheet.create({
  formBlock: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
  },
});
