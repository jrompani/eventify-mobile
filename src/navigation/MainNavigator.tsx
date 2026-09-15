import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { listExperiences } from '../api/experiences';
import { AppHeader } from '../components/AppHeader';
import { BottomTabs, tabs } from '../components/BottomTabs';
import { experiences as fallbackExperiences } from '../data/mockExperiences';
import { CreateExperienceScreen } from '../screens/CreateExperienceScreen';
import { ExperienceDetailScreen } from '../screens/ExperienceDetailScreen';
import { ExploreScreen } from '../screens/ExploreScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SocialScreen } from '../screens/SocialScreen';
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
  const [experiences, setExperiences] = useState<Experience[]>(fallbackExperiences);
  const [loadingExperiences, setLoadingExperiences] = useState(false);
  const [experienceError, setExperienceError] = useState<string | null>(null);
  const title = useMemo(() => tabs.find((tab) => tab.key === activeTab)?.label ?? 'Eventify', [activeTab]);

  function handleCreatedExperience(experience: Experience) {
    setExperiences((currentExperiences) => [
      experience,
      ...currentExperiences.filter((currentExperience) => currentExperience.id !== experience.id),
    ]);
    setSelectedExperience(experience);
  }

  useEffect(() => {
    let mounted = true;
    async function fetchExperiences() {
      setLoadingExperiences(true);
      setExperienceError(null);
      try {
        const nextExperiences = await listExperiences();
        if (mounted && nextExperiences.length > 0) {
          setExperiences(nextExperiences);
        }
      } catch (error) {
        if (mounted) {
          setExperienceError(error instanceof Error ? error.message : 'No se pudo cargar experiencias');
        }
      } finally {
        if (mounted) {
          setLoadingExperiences(false);
        }
      }
    }
    fetchExperiences();
    return () => {
      mounted = false;
    };
  }, []);

  if (selectedExperience) {
    return (
      <ExperienceDetailScreen
        experience={selectedExperience}
        session={session}
        onBack={() => setSelectedExperience(null)}
      />
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title={title} />
      <View style={styles.content}>
        {renderTab(
          activeTab,
          setSelectedExperience,
          experiences,
          loadingExperiences,
          experienceError,
          session,
          onLogout,
          onSessionUpdated,
          handleCreatedExperience
        )}
      </View>
      <BottomTabs activeTab={activeTab} onChange={setActiveTab} />
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
  onCreatedExperience: (experience: Experience) => void
) {
  switch (activeTab) {
    case 'home':
      return (
        <HomeScreen
          experiences={experiences}
          loading={loadingExperiences}
          error={experienceError}
          onOpenExperience={onOpenExperience}
        />
      );
    case 'explore':
      return <ExploreScreen experiences={experiences} onOpenExperience={onOpenExperience} />;
    case 'create':
      return (
        <CreateExperienceScreen
          session={session}
          onCreated={onCreatedExperience}
        />
      );
    case 'social':
      return <SocialScreen session={session} experiences={experiences} />;
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
