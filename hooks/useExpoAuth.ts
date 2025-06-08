import * as WebBrowser from 'expo-web-browser';
import { useAuthRequest } from 'expo-auth-session';
import { useEffect, useState } from 'react';
import { makeRedirectUri } from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

export function useExpoAuth() {
  const [userInfo, setUserInfo] = useState<{
    email: string;
    name: string;
    picture: string;
  } | null>(null);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    // For testing in Expo Go:
    redirectUri: makeRedirectUri({
      scheme: 'exp',
      path: 'redirect'
    }),
  });

  useEffect(() => {
    handleSignInResponse();
  }, [response]);

  async function handleSignInResponse() {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      
      try {
        const userInfoResponse = await fetch(
          'https://www.googleapis.com/userinfo/v2/me',
          {
            headers: { Authorization: `Bearer ${id_token}` },
          }
        );

        const user = await userInfoResponse.json();
        setUserInfo(user);
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    }
  }

  const signIn = () => {
    promptAsync();
  };

  const signOut = () => {
    setUserInfo(null);
  };

  return {
    userInfo,
    signIn,
    signOut,
    isLoading: !request,
  };
} 