import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { AuthNavigator } from './src/navigation/AuthNavigator';
import { MainNavigator } from './src/navigation/MainNavigator';
import { logout } from './src/api/auth';
import { LoadingScreen } from './src/screens/LoadingScreen';
import { clearSession, loadSession, saveSession } from './src/storage/sessionStorage';
import { colors } from './src/theme/colors';
import { AuthSession } from './src/types/auth';

export default function App() {
  const [booting, setBooting] = useState(true);
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    let mounted = true;
    async function bootstrap() {
      const storedSession = await loadSession();
      if (mounted) {
        setSession(storedSession);
        setBooting(false);
      }
    }
    bootstrap();
    return () => {
      mounted = false;
    };
  }, []);

  async function handleAuthenticated(nextSession: AuthSession) {
    await saveSession(nextSession);
    setSession(nextSession);
  }

  async function handleSessionUpdated(nextSession: AuthSession) {
    await saveSession(nextSession);
    setSession(nextSession);
  }

  async function handleLogout() {
    if (session?.accessToken) {
      try {
        await logout(session);
      } catch {
        // Local logout should still work if the session is already expired or the network is down.
      }
    }
    await clearSession();
    setSession(null);
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.shell}>
        <StatusBar style="light" />
        {booting ? (
          <LoadingScreen />
        ) : session ? (
          <MainNavigator session={session} onLogout={handleLogout} onSessionUpdated={handleSessionUpdated} />
        ) : (
          <AuthNavigator onAuthenticated={handleAuthenticated} />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
