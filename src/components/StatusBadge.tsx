import { StyleSheet, Text } from 'react-native';

import { colors } from '../theme/colors';

type StatusBadgeProps = {
  label: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'primary';
};

export function StatusBadge({ label, tone = 'neutral' }: StatusBadgeProps) {
  return <Text style={[styles.badge, styles[tone]]}>{label}</Text>;
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 5,
    fontWeight: '900',
    fontSize: 11,
  },
  neutral: {
    color: colors.muted,
    backgroundColor: colors.black,
    borderColor: colors.border,
  },
  success: {
    color: colors.success,
    backgroundColor: colors.successSoft,
    borderColor: '#16533F',
  },
  warning: {
    color: colors.warning,
    backgroundColor: '#30240D',
    borderColor: '#6A4B14',
  },
  danger: {
    color: colors.danger,
    backgroundColor: '#31101B',
    borderColor: colors.danger,
  },
  primary: {
    color: colors.primary,
    backgroundColor: colors.primarySoft,
    borderColor: colors.borderLight,
  },
});
