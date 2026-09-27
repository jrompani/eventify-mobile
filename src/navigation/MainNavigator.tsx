import { useCallback, useEffect, useMemo, useState } from 'react';
import * as ExpoLocation from 'expo-location';
import { StyleSheet, View } from 'react-native';

import { listExperiences } from '../api/experiences';
import { listMyNotifications } from '../api/notifications';
import { AppHeader } from '../components/AppHeader';
import { BottomTabs } from '../components/BottomTabs';
import { Coordinate, enrichExperiencesWithDistance } from '../location/distance';
import { CreateExperienceScreen } from '../screens/CreateExperienceScreen';
import { ExperienceDetailScreen } from '../screens/ExperienceDetailScreen';
import { ExploreScreen } from '../screens/ExploreScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { OrganizerProfileScreen } from '../screens/OrganizerProfileScreen';
import { OrganizerScreen } from '../screens/OrganizerScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SocialScreen } from '../screens/SocialScreen';
import { WalletScreen } from '../screens/WalletScreen';
import { AuthSession } from '../types/auth';
import { Experience } from '../types/experience';
import { TabKey } from '../types/navigation';

type MainNavigatorProps = {
  session: AuthSession;
  onLogout: () => void;
  onSessionUpdated: (session: AuthSession) => void;
};

export function MainNavigator({ session, onLogout, onSessionUpdated }: MainNavigatorProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [selectedOrganizerUserId, setSelectedOrganizerUserId] = useState<string | null>(null);
  const [selectedOrganizerExperienceId, setSelectedOrganizerExperienceId] = useState<string | null>(null);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loadingExperiences, setLoadingExperiences] = useState(false);
  const [experienceError, setExperienceError] = useState<string | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [userCoordinate, setUserCoordinate] = useState<Coordinate | null>(null);
  const visibleExperiences = useMemo(
    () => enrichExperiencesWithDistance(experiences, userCoordinate),
    [experiences, userCoordinate]
  );
  const handleUnreadCountChange = useCallback((count: number) => {
    setUnreadNotifications(count);
  }, []);

  function handleCreatedExperience(experience: Experience) {
    setExperiences((currentExperiences) => [
      experience,
      ...currentExperiences.filter((currentExperience) => currentExperience.id !== experience.id),
    ]);
    setSelectedOrganizerExperienceId(experience.id);
    setSelectedExperience(experience);
  }

  async function refreshExperiences() {
    setLoadingExperiences(true);
    setExperienceError(null);
    try {
      const nextExperiences = await listExperiences(session);
      setExperiences(nextExperiences);
    } catch (error) {
      setExperienceError(error instanceof Error ? error.message : 'No se pudo cargar experiencias');
    } finally {
      setLoadingExperiences(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    async function fetchExperiences() {
      if (mounted) {
        await refreshExperiences();
      }
    }
    fetchExperiences();
    return () => {
      mounted = false;
    };
  }, [session]);

  useEffect(() => {
    let mounted = true;

    async function loadUserLocation() {
      try {
        const permission = await ExpoLocation.requestForegroundPermissionsAsync();
        if (permission.status !== 'granted') {
          return;
        }
        const position = await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.Balanced });
        if (mounted) {
          setUserCoordinate({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        }
      } catch {
        if (mounted) {
          setUserCoordinate(null);
        }
      }
    }

    void loadUserLocation();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function fetchNotificationCount() {
      try {
        const notifications = await listMyNotifications(session);
        if (mounted) {
          setUnreadNotifications(notifications.filter((notification) => !notification.readAt).length);
        }
      } catch {
        if (mounted) {
          setUnreadNotifications(0);
        }
      }
    }

    void fetchNotificationCount();
    return () => {
      mounted = false;
    };
  }, [session]);

  if (selectedExperience) {
    return (
      <ExperienceDetailScreen
        experience={selectedExperience}
        session={session}
        onBack={() => {
          setSelectedExperience(null);
          void refreshExperiences();
        }}
        onOpenOrganizerProfile={(userId) => {
          setSelectedExperience(null);
          setSelectedOrganizerUserId(userId);
        }}
        onOpenOrganizer={() => {
          setSelectedOrganizerExperienceId(selectedExperience.id);
          setSelectedExperience(null);
          setActiveTab('organizer');
        }}
        onOpenWallet={() => {
          setSelectedExperience(null);
          void refreshExperiences();
          setActiveTab('wallet');
        }}
      />
    );
  }

  if (selectedOrganizerUserId) {
    return (
      <OrganizerProfileScreen
        session={session}
        organizerUserId={selectedOrganizerUserId}
        onBack={() => setSelectedOrganizerUserId(null)}
        onOpenExperience={(experience) => {
          setSelectedOrganizerUserId(null);
          setSelectedExperience(experience);
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader user={session.user} />
      <View style={styles.content}>
        {renderTab(
          activeTab,
          setSelectedExperience,
          visibleExperiences,
          loadingExperiences,
          experienceError,
          session,
          onLogout,
          onSessionUpdated,
          handleCreatedExperience,
          handleUnreadCountChange,
          setActiveTab,
          userCoordinate,
          selectedOrganizerExperienceId,
          refreshExperiences
        )}
      </View>
      <BottomTabs activeTab={activeTab} onChange={setActiveTab} badges={{ notifications: unreadNotifications }} />
    </View>
  );
}

function renderTab(
  activeTab: TabKey,
  onOpenExperience: (experience: Experience) => void,
  experiences: Experience[],
  loadingExperiences: boolean,
  experienceError: string | null,
  session: AuthSession,
  onLogout: () => void,
  onSessionUpdated: (session: AuthSession) => void,
  onCreatedExperience: (experience: Experience) => void,
  onUnreadCountChange: (count: number) => void,
  onChangeTab: (tab: TabKey) => void,
  userCoordinate: Coordinate | null,
  selectedOrganizerExperienceId: string | null,
  onRefreshExperiences: () => void
) {
  switch (activeTab) {
    case 'home':
      return (
        <HomeScreen
          experiences={experiences}
          loading={loadingExperiences}
          error={experienceError}
          onOpenExperience={onOpenExperience}
          onGoCreate={() => onChangeTab('create')}
          onGoOrganizer={() => onChangeTab('organizer')}
          onGoWallet={() => onChangeTab('wallet')}
          onRefresh={onRefreshExperiences}
          activeUserLabel={session.user.profile.displayName || session.email}
        />
      );
    case 'explore':
      return <ExploreScreen session={session} experiences={experiences} userCoordinate={userCoordinate} onOpenExperience={onOpenExperience} />;
    case 'create':
      return (
        <CreateExperienceScreen
          session={session}
          onCreated={onCreatedExperience}
        />
      );
    case 'wallet':
      return <WalletScreen session={session} experiences={experiences} onOpenExperience={onOpenExperience} />;
    case 'notifications':
      return <NotificationsScreen session={session} onUnreadCountChange={onUnreadCountChange} />;
    case 'social':
      return <SocialScreen session={session} experiences={experiences} />;
    case 'organizer':
      return <OrganizerScreen session={session} preferredExperienceId={selectedOrganizerExperienceId} />;
    case 'profile':
      return <ProfileScreen session={session} onLogout={onLogout} onSessionUpdated={onSessionUpdated} />;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});


