import { ComponentProps } from 'react';

import { Ionicons } from '@expo/vector-icons';

export type TabKey = 'home' | 'explore' | 'create' | 'wallet' | 'notifications' | 'social' | 'organizer' | 'profile';
export type IconName = ComponentProps<typeof Ionicons>['name'];
