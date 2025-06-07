import { NavigationContainer } from '@react-navigation/native';
import DrawerNavigator from './navigation/DrawerNavigator';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SignInScreen from './screens/SignInScreen';

const RootStack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <RootStack.Navigator id={undefined}>
        <RootStack.Screen
          name="MainDrawer"
          component={DrawerNavigator}
          options={{ headerShown: false }}
        />
        <RootStack.Screen
          name="SignInModal"
          component={SignInScreen}
          options={{ presentation: 'modal', headerShown: false }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}