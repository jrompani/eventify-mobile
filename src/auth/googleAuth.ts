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
    offlineAccess: false,
  });
  configured = true;
}

export async function getGoogleIdToken() {
  if (Platform.OS === 'web') {
    throw new Error('Google nativo no esta disponible en web.');
  }
  if (!GOOGLE_WEB_CLIENT_ID) {
    throw new Error('Para activar Google nativo falta EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.');
  }

  configureGoogleSignIn();

  try {
    if (Platform.OS === 'android') {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    }

    const signInResult = await GoogleSignin.signIn();
    const directIdToken = extractIdToken(signInResult);
    if (directIdToken) {
      return directIdToken;
    }

    const tokens = await GoogleSignin.getTokens();
    if (tokens.idToken) {
      return tokens.idToken;
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

function extractIdToken(result: unknown) {
  const value = result as {
    idToken?: string | null;
    data?: { idToken?: string | null } | null;
  };

  return value.idToken ?? value.data?.idToken ?? null;
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
