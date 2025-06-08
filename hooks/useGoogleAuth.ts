import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import * as Google from 'expo-auth-session/providers/google';
import { AUTH_CONFIG } from '../config/config';
import { auth } from '../components/FirebaseProvider';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: AUTH_CONFIG.googleClientId,
    iosClientId: AUTH_CONFIG.iosClientId,
  });

  const signIn = async () => {
    try {
      const result = await promptAsync();
      
      if (result?.type === 'success') {
        const { id_token } = result.params;
        const credential = GoogleAuthProvider.credential(id_token);
        const userCredential = await signInWithCredential(auth, credential);
        return userCredential.user;
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
    
    return null;
  };

  return {
    signIn,
    request,
    response,
  };
} 