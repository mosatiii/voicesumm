import { StyleSheet, View } from 'react-native';
import { Button, ActivityIndicator, Text, Avatar } from 'react-native-paper';
import { useExpoAuth } from '../hooks/useExpoAuth';

export default function SignInScreen() {
  const { signIn, signOut, userInfo, isLoading } = useExpoAuth();

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator size="large" />
      ) : userInfo ? (
        <View style={styles.userInfo}>
          {userInfo.picture && (
            <Avatar.Image 
              size={80} 
              source={{ uri: userInfo.picture }} 
              style={styles.avatar}
            />
          )}
          <Text style={styles.name}>{userInfo.name}</Text>
          <Text style={styles.email}>{userInfo.email}</Text>
          <Button
            mode="outlined"
            onPress={signOut}
            style={[styles.button, { marginTop: 20 }]}
          >
            Sign Out
          </Button>
        </View>
      ) : (
        <Button
          mode="contained"
          onPress={signIn}
          style={styles.button}
        >
          Sign in with Google
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  userInfo: {
    alignItems: 'center',
  },
  avatar: {
    marginBottom: 10,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#666',
  },
  button: {
    width: '100%',
    maxWidth: 300,
  },
}); 