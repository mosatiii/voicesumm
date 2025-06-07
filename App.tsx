import { NavigationContainer } from '@react-navigation/native';
import DrawerNavigator from './navigation/DrawerNavigator';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SignInScreen from './screens/SignInScreen';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { View, ActivityIndicator } from 'react-native';

const RootStack = createNativeStackNavigator();

function AppContent() {
  const { loading, user } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator id={undefined}>
        {user ? (
          <RootStack.Screen
            name="MainDrawer"
            component={DrawerNavigator}
            options={{ headerShown: false }}
          />
        ) : (
          <RootStack.Screen
            name="SignInModal"
            component={SignInScreen}
            options={{ presentation: 'modal', headerShown: false }}
          />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}