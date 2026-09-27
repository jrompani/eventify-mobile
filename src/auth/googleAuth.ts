import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';

import { GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from '../config/env';

let configured = false;

function configureGoogleSignIn() {
  if (configured) {
    return;
  }

  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID ?? undefined,
    iosClientId: GOOGLE_IOS_CLIENT_ID ?? undefined,
    scopes: ['profile', 'email'],
    offlineAccess: false,
  });
  configured = true;
}

export type GoogleAuthTokens = {
  idToken: string;
  accessToken?: string;
};

type GoogleAuthOptions = {
  forceAccountPicker?: boolean;
};

export async function getGoogleAuthTokens(options: GoogleAuthOptions = {}): Promise<GoogleAuthTokens> {
  if (Platform.OS === 'web') {
    throw new Error('Google nativo no esta disponible en web.');
  }
  if (!GOOGLE_WEB_CLIENT_ID) {
    throw new Error('Para activar Google nativo falta EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.');
  }

  configureGoogleSignIn();

  try {
    if (options.forceAccountPicker) {
      await signOutGoogle();
    }

    if (Platform.OS === 'android') {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    }

    const signInResult = await GoogleSignin.signIn();
    const directIdToken = extractIdToken(signInResult);
    const directAccessToken = extractAccessToken(signInResult);
    const tokens = await GoogleSignin.getTokens();
    const idToken = directIdToken ?? tokens.idToken;
    const accessToken = directAccessToken ?? tokens.accessToken;

    if (idToken) {
      return {
        idToken,
        accessToken: accessToken ?? undefined,
      };
    }

    throw new Error('Google no devolvio un id_token valido.');
  } catch (exception) {
    if (isGoogleSignInCancelled(exception)) {
      throw new Error('Inicio con Google cancelado.');
    }
    if (isGoogleDeveloperError(exception)) {
      throw new Error('Google nativo no esta bien configurado. Revisa EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, package com.eventify.mobile y SHA-1 en Google Cloud.');
    }
    throw exception;
  }
}

export async function getGoogleIdToken() {
  const tokens = await getGoogleAuthTokens();
  return tokens.idToken;
}

export async function signOutGoogle() {
  if (Platform.OS === 'web') {
    return;
  }

  configureGoogleSignIn();

  try {
    await GoogleSignin.signOut();
  } catch {
    // Eventify logout must not be blocked if Google has no active native session.
  }
}

function extractIdToken(result: unknown) {
  const value = result as {
    idToken?: string | null;
    data?: { idToken?: string | null; accessToken?: string | null } | null;
  };

  return value.idToken ?? value.data?.idToken ?? null;
}

function extractAccessToken(result: unknown) {
  const value = result as {
    accessToken?: string | null;
    data?: { accessToken?: string | null } | null;
  };

  return value.accessToken ?? value.data?.accessToken ?? null;
}

function isGoogleSignInCancelled(exception: unknown) {
  return isGoogleSignInError(exception, statusCodes.SIGN_IN_CANCELLED);
}

function isGoogleDeveloperError(exception: unknown) {
  return isGoogleSignInError(exception, 'DEVELOPER_ERROR') || isGoogleSignInError(exception, '10');
}

function isGoogleSignInError(exception: unknown, code: string) {
  return (
    typeof exception === 'object'
    && exception !== null
    && 'code' in exception
    && (exception as { code?: string }).code === code
  );
}
