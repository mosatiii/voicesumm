import { useEffect } from 'react';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import Constants from 'expo-constants';
import { auth } from '../config/firebase';
import { AuthSessionResult } from 'expo-auth-session';



// ✅ Web Client ID from Google Cloud Console (linked to Firebase project)
const WEB_CLIENT_ID = '622917397371-iupqoqu3oqf8oto3rc4va5o4e3rs3p5l.apps.googleusercontent.com';

// ✅ Correct redirect URI for Expo Go (no trailing slash!)
const redirectUri = 'https://auth.expo.io/@mosatiii/voice-summarizer';

// ✅ Random nonce for extra security
const nonce = Math.random().toString(36).substring(2);
makeRedirectUri({ scheme: 'voice-summarizer' })

interface GoogleAuthHook {
  signIn: () => Promise<AuthSessionResult | null>;
  isLoading: boolean;
}

export function useGoogleAuth(): GoogleAuthHook {
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: WEB_CLIENT_ID,
    redirectUri,
    responseType: 'id_token',
    selectAccount: true,
    scopes: ['openid', 'email', 'profile'],
    extraParams: {
      access_type: 'offline',
      prompt: 'select_account',
      nonce,
    },
  });

  // Handle the auth response
  useEffect(() => {
    if (!response) return;
    

    const handleAuthResponse = async () => {
      try {
        console.log('📦 [Sign In] Auth response received:', {
          type: response.type,
          hasParams: 'params' in response,
          hasError: 'error' in response
        });

        if (response.type === 'success' && 'params' in response) {
          const { id_token, state } = response.params;
          console.log('🔍 [Sign In] Response params:', { hasIdToken: !!id_token, hasState: !!state });

          if (!id_token) {
            throw new Error('No ID token in response');
          }

          try {
            const credential = GoogleAuthProvider.credential(id_token);
            await signInWithCredential(auth, credential);
          } catch (error: any) {
            console.error('🔥 [Sign In] Firebase error:', {
              code: error.code,
              message: error.message,
              name: error.name
            });
            throw error;
          }
        } else if (response.type === 'error') {
          console.error('❌ [Sign In] Auth error:', response.error);
          throw new Error(response.error?.message || 'Authentication failed');
        }
      } catch (error) {
        console.error('❌ [Sign In] Error in auth response:', error);
        throw error;
      }
    };

    handleAuthResponse().catch(error => {
      console.error('❌ [Sign In] Unhandled error:', error);
    });
  }, [response]);

  const signIn = async (): Promise<AuthSessionResult | null> => {
    try {
      if (!request) {
        throw new Error('Auth request not ready');
      }

      const result = await promptAsync();
      console.log('🔄 [Sign In] Prompt result:', {
        type: result?.type,
        hasParams: result && 'params' in result
      });

      return result;
    } catch (error) {
      console.error('🔥 [Sign In] Error during sign in:', error);
      throw error;
    }
  };

  return {
    signIn,
    isLoading: !request,
  };
}
