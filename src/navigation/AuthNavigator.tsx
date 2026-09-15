import { useState } from 'react';

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

  function handleCredentials(session: AuthSession) {
    const needsProfileSetup = !session.user.profile.username || !session.user.profile.publicZone;
    if (needsProfileSetup) {
      setPendingSession(session);
      setStep('profileSetup');
      return;
    }
    onAuthenticated(session);
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

  return <AuthWelcomeScreen onLogin={() => setStep('login')} onRegister={() => setStep('register')} />;
}
