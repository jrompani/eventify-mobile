import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

type LabeledValueProps = {
  label: string;
  value: string;
};

export function LabeledValue({ label, value }: LabeledValueProps) {
  return (
    <View style={styles.labeledValue}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  labeledValue: {
    padding: 16,
    borderBottomColor: colors.borderLight,
    borderBottomWidth: 1,
  },
  label: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  value: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginTop: 4,
  },
});
