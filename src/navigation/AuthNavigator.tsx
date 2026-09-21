import { useState } from 'react';

import { openDevAccount, DevAccountKind } from '../api/devAccounts';
import { AuthWelcomeScreen } from '../screens/AuthWelcomeScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { ProfileSetupScreen } from '../screens/ProfileSetupScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { AuthSession } from '../types/auth';

type AuthStep = 'welcome' | 'login' | 'register' | 'profileSetup';

type AuthNavigatorProps = {
  onAuthenticated: (session: AuthSession) => void;
};

export function AuthNavigator({ onAuthenticated }: AuthNavigatorProps) {
  const [step, setStep] = useState<AuthStep>('welcome');
  const [pendingSession, setPendingSession] = useState<AuthSession | null>(null);
  const [devLoading, setDevLoading] = useState<DevAccountKind | null>(null);
  const [devError, setDevError] = useState<string | null>(null);

  function handleCredentials(session: AuthSession) {
    const needsProfileSetup = !session.user.profile.username || !session.user.profile.publicZone;
    if (needsProfileSetup) {
      setPendingSession(session);
      setStep('profileSetup');
      return;
    }
    onAuthenticated(session);
  }

  async function handleDevAccount(kind: DevAccountKind) {
    setDevLoading(kind);
    setDevError(null);
    try {
      const session = await openDevAccount(kind);
      onAuthenticated(session);
    } catch (exception) {
      setDevError(exception instanceof Error ? exception.message : 'No se pudo abrir usuario de prueba');
    } finally {
      setDevLoading(null);
    }
  }

  if (step === 'login') {
    return <LoginScreen onBack={() => setStep('welcome')} onAuthenticated={handleCredentials} />;
  }

  if (step === 'register') {
    return <RegisterScreen onBack={() => setStep('welcome')} onAuthenticated={handleCredentials} />;
  }

  if (step === 'profileSetup' && pendingSession) {
    return <ProfileSetupScreen session={pendingSession} onDone={onAuthenticated} />;
  }

  return (
    <AuthWelcomeScreen
      onLogin={() => setStep('login')}
      onRegister={() => setStep('register')}
      onDevAccount={handleDevAccount}
      devLoading={devLoading}
      devError={devError}
    />
  );
}
