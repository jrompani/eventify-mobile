import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import { IconName, TabKey } from '../types/navigation';

export const tabs: Array<{ key: TabKey; label: string; icon: IconName }> = [
  { key: 'home', label: 'Inicio', icon: 'home-outline' },
  { key: 'explore', label: 'Explorar', icon: 'search-outline' },
  { key: 'create', label: 'Crear', icon: 'add-circle-outline' },
  { key: 'wallet', label: 'Wallet', icon: 'ticket-outline' },
  { key: 'social', label: 'Social', icon: 'chatbubbles-outline' },
  { key: 'organizer', label: 'Org', icon: 'briefcase-outline' },
  { key: 'profile', label: 'Perfil', icon: 'person-circle-outline' },
];

type BottomTabsProps = {
  activeTab: TabKey;
  onChange: (tab: TabKey) => void;
};

export function BottomTabs({ activeTab, onChange }: BottomTabsProps) {
  return (
    <View style={styles.bottomNav}>
      {tabs.map((tab) => {
        const selected = activeTab === tab.key;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={[styles.navItem, selected && styles.navItemActive]}
            accessibilityRole="button"
            accessibilityLabel={tab.label}
          >
            <Ionicons name={tab.icon} size={22} color={selected ? colors.primary : colors.muted} />
            <Text style={[styles.navLabel, selected && styles.navLabelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 72,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: colors.black,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  navItem: {
    flex: 1,
    minHeight: 52,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  navItemActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.borderLight,
    borderWidth: 1,
  },
  navLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
  },
  navLabelActive: {
    color: colors.primary,
  },
});
